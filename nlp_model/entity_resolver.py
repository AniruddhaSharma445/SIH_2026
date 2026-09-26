"""Alias / entity resolution, plus linking phones/accounts/transactions/vehicles/calls
to the resolved persons via stable person IDs (never names) as foreign keys.

Entity resolution is conservative by design - *two people are merged only on clear evidence*:

A. identical normalised names ("Mr. Rahul Sharma" == "Rahul Sharma")
B. explicit alias claims from the semantic layer ("Rahul Sharma alias Raju")
C. a short form ("Rahul", "Rahul Bhai") that matches exactly ONE fuller name
D. optional LLM judgement for pairs the rules cannot decide

Never merged: names with conflicting full forms (Rahul Sharma vs Rahul Verma), records
that the LLM listed as *separate* people inside the same chunk, and short forms that fit
several people ("Rahul" when both Rahul Sharma and Rahul Verma exist). Those cases are
kept separate and reported as ``uncertain`` in the run report.

Record-linking rules that keep this honest:
* a phone is linked to a person only if the semantic layer tied them together with
  confidence >= LINK_MIN_CONF and the tie was evidenced; otherwise ``person_id`` is NULL
* a transaction needs an amount found in the FIR plus an identifiable sender AND receiver
* timestamps come from *our* regex normalisers, never from the LLM's own formatting
* an account without a number is only created as "the account of <person>" when the FIR
  says a transfer went from / to that person
"""
from __future__ import annotations

import logging
from collections import Counter
from dataclasses import dataclass, field
from difflib import SequenceMatcher
from typing import Callable, Optional

from gemini_extractor import EvidenceIndex
from pdf_extractor import NAME_SUFFIXES, collapse_ws, name_key, normalize_person_name
from regex_extractor import extract_hits, parse_duration_seconds
from schemas import (ROLE_PRIORITY, AccountRow, AliasClaim, AliasRow, CallRow, Chunk, ChunkExtraction,
                     PairJudgement, PersonRow, PhoneRow, RelationshipOut, RelationshipRow, RoleClaim,
                     TransactionRow, VehicleRow)

log = logging.getLogger(__name__)
ALIAS_TYPES = {"nickname", "short_name", "honorific_form", "spelling_variant", "name_variant", "other"}
ROLE_MIN_CONF = 0.6
LINK_MIN_CONF = 0.7
SYMMETRIC_TYPES = {
    "friend", "associate", "relative", "business_partner", "met", "accompanied",
    "co_accused", "unknown",
}
JudgeFn = Callable[[list[dict]], list[PairJudgement]]


@dataclass
class PersonRecord:
    name: str
    chunk_id: str
    page: int
    aliases: list[AliasClaim] = field(default_factory=list)
    age: Optional[int] = None
    gender: Optional[str] = None
    address: Optional[str] = None
    occupation: Optional[str] = None
    roles: list[RoleClaim] = field(default_factory=list)
    confidence: float = 0.5
    idx: int = -1
    key: str = ""
    alias_keys: set[str] = field(default_factory=set)
    scope: Optional[str] = None      # chunk id when the semantic layer judged persons *within* that chunk


@dataclass
class Resolution:
    person_id: str
    confidence_cap: float = 1.0     # <1 when identity relied on inference
    ambiguous: bool = False         # identity itself is flagged uncertain


@dataclass
class ResolutionResult:
    persons: list[PersonRow]
    aliases: list[AliasRow]
    flags: list[dict]
    lookup: Callable[[str, str], Optional[Resolution]]
    roles_by_pid: dict[str, list[str]]


def _tokens(key: str) -> set[str]:
    return set(key.split())


class EntityResolver:
    def __init__(self, index: EvidenceIndex, source_id: str, judge: Optional[JudgeFn] = None) -> None:
        self.index, self.source_id, self.judge = index, source_id, judge
        self.records: list[PersonRecord] = []

    def add(self, rec: PersonRecord) -> None:
        rec.name = normalize_person_name(rec.name)
        rec.key = name_key(rec.name)
        rec.alias_keys = {name_key(a.alias) for a in rec.aliases if a.confidence >= 0.6} - {rec.key, ""}
        if rec.key:
            rec.idx = len(self.records)
            self.records.append(rec)

    # ------------------------------------------------------------------ #
    def resolve(self) -> ResolutionResult:
        R = self.records
        n = len(R)
        parent = list(range(n))
        cap: dict[int, float] = {i: 1.0 for i in range(n)}          # per root
        flags: list[dict] = []
        uncertain_roots: set[int] = set()

        def find(i: int) -> int:
            while parent[i] != i:
                parent[i] = parent[parent[i]]
                i = parent[i]
            return i

        def members(root: int) -> list[int]:
            return [i for i in range(n) if find(i) == root]

        def full_names(root: int) -> list[set[str]]:
            out = []
            for i in members(root):
                for k in [R[i].key, *R[i].alias_keys]:
                    if len(k.split()) >= 2:
                        out.append(_tokens(k))
            return out

        def chunks_of(root: int) -> set[str]:
            return {R[i].scope for i in members(root) if R[i].scope}

        def compatible(a: int, b: int) -> bool:
            return all(x <= y or y <= x for x in full_names(a) for y in full_names(b))

        def union(a: int, b: int, cap_val: float, why: str) -> bool:
            ra, rb = find(a), find(b)
            if ra == rb:
                return True
            if not compatible(ra, rb):
                flags.append({"type": "incompatible_names", "names": [self._label(ra, members), self._label(rb, members)],
                              "decision": "kept_separate", "reason": "conflicting full names"})
                return False
            parent[rb] = ra
            cap[ra] = min(cap[ra], cap[rb], cap_val)
            log.debug("merged %s + %s (%s)", R[a].name, R[b].name, why)
            return True

        # A. exact normalised name
        by_key: dict[str, list[int]] = {}
        for r in R:
            by_key.setdefault(r.key, []).append(r.idx)
        for idxs in by_key.values():
            for j in idxs[1:]:
                union(idxs[0], j, 1.0, "same name")

        # B. multi-token alias == another record's name / alias (explicit claim)
        for r in R:
            for k in r.alias_keys:
                if len(k.split()) < 2:
                    continue
                for j in by_key.get(k, []):
                    if not (R[j].scope and R[j].scope == r.scope):
                        union(r.idx, j, 0.9, "alias claim")

        # C. short forms / nicknames: merge only when exactly one candidate exists
        alias_claimers: dict[str, set[int]] = {}
        for r in R:
            for k in r.alias_keys:
                alias_claimers.setdefault(k, set()).add(r.idx)
        decided_flags: set[tuple[int, ...]] = set()
        pending: list[dict] = []
        for _ in range(4):                                        # until stable
            changed = False
            roots = sorted({find(i) for i in range(n)}, key=lambda x: x)
            for s in roots:
                if find(s) != s or full_names(s):
                    continue                                       # only clusters with no full name
                keys = {R[i].key for i in members(s)}
                toks = set().union(*[_tokens(k) for k in keys])
                cand: set[int] = set()
                for d in roots:
                    if d == find(s) or find(d) != d or chunks_of(d) & chunks_of(s):
                        continue
                    if any(toks <= t for t in full_names(d)) or any(
                            alias_claimers.get(k, set()) & set(members(d)) for k in keys):
                        cand.add(d)
                if len(cand) == 1:
                    d = next(iter(cand))
                    if union(d, s, 0.9, "short form"):
                        changed = True
                elif len(cand) > 1:
                    tag = tuple(sorted({s, *cand}))
                    if tag not in decided_flags:
                        decided_flags.add(tag)
                        pending.append({"kind": "ambiguous_short_name", "s": s, "cands": sorted(cand)})
            if not changed:
                break

        # fuzzy look-alikes (possible spelling variants) -> uncertain unless the judge says "same"
        roots = sorted({find(i) for i in range(n)})
        for i, a in enumerate(roots):
            for b in roots[i + 1:]:
                ka = max((R[m].key for m in members(a)), key=len)
                kb = max((R[m].key for m in members(b)), key=len)
                if (len(ka.split()) >= 2 and len(ka.split()) == len(kb.split()) and ka != kb
                        and SequenceMatcher(None, ka, kb).ratio() >= 0.88 and not (chunks_of(a) & chunks_of(b))):
                    pending.append({"kind": "similar_names", "s": a, "cands": [b]})

        # D. optional LLM judgement for the undecided pairs
        judgements: dict[int, PairJudgement] = {}
        pairs: list[dict] = []
        pair_meta: dict[int, tuple[dict, int]] = {}
        if self.judge and pending:
            for item in pending[:30]:
                for d in item["cands"]:
                    pid = len(pairs) + 1
                    pairs.append({"pair_id": pid, "a": self._label(item["s"], members), "b": self._label(d, members),
                                  "evidence": self._evidence_for(members(item["s"]) + members(d))})
                    pair_meta[pid] = (item, d)
            try:
                for j in self.judge(pairs):
                    judgements[j.pair_id] = j
            except Exception as exc:                                  # noqa: BLE001 - judge is optional
                log.warning("entity-resolution judge failed (%s); leaving pairs separate", exc)
        same_votes: dict[int, list[int]] = {}
        for pid, j in judgements.items():
            if pid in pair_meta and j.verdict == "same" and j.confidence >= 0.85:
                same_votes.setdefault(id(pair_meta[pid][0]), []).append(pid)
        for item in pending:
            names = [self._label(item["s"], members)] + [self._label(d, members) for d in item["cands"]]
            votes = same_votes.get(id(item), [])
            if len(votes) == 1 and (item["kind"] == "similar_names" or len(item["cands"]) >= 1):
                d = pair_meta[votes[0]][1]
                if find(item["s"]) != find(d) and union(d, item["s"], 0.85, "llm judgement"):
                    flags.append({"type": item["kind"], "names": names, "decision": "merged_by_llm",
                                  "reason": judgements[votes[0]].reason})
                    continue
            if find(item["s"]) in {find(x) for x in item["cands"]}:
                continue
            flags.append({"type": item["kind"], "names": names, "decision": "kept_separate",
                          "reason": "several possible individuals; evidence insufficient - resolution uncertain"})
            uncertain_roots.add(find(item["s"]))
            if item["kind"] == "similar_names":
                uncertain_roots.update(find(x) for x in item["cands"])

        return self._materialise(find, members, cap, uncertain_roots, flags)

    # ------------------------------------------------------------------ #
    def _label(self, root: int, members) -> str:
        return max((self.records[i].name for i in members(root)), key=lambda s: (len(s.split()), len(s)))

    def _evidence_for(self, idxs: list[int]) -> list[str]:
        out: list[str] = []
        keys = {self.records[i].key for i in idxs}
        for _, sent in self.index._sentences:
            if any(all(t in sent.lower() for t in k.split()) for k in keys) and sent not in out:
                out.append(sent)
            if len(out) >= 4:
                break
        return out

    # ------------------------------------------------------------------ #
    def _materialise(self, find, members, cap, uncertain_roots, flags) -> ResolutionResult:
        R = self.records
        roots = sorted({find(i) for i in range(len(R))},
                       key=lambda r: (min(self.index.first_offset(R[i].name) for i in members(r)), r))
        persons, aliases = [], []
        pid_of_root: dict[int, str] = {}
        roles_by_pid: dict[str, list[str]] = {}
        cap_of_pid: dict[str, float] = {}
        ambiguous_pids: set[str] = set()
        a_no = 0
        for n_, root in enumerate(roots, start=1):
            pid = f"P{n_:03d}"
            pid_of_root[root] = pid
            recs = [R[i] for i in members(root)]
            canon = max(recs, key=lambda r: (len(r.key.split()), len(r.name), -r.idx))
            first = min(recs, key=lambda r: r.page)

            def pick(attr: str):
                vals = [(getattr(r, attr), r) for r in recs if getattr(r, attr) not in (None, "")]
                if not vals:
                    return None
                best = max(vals, key=lambda t: (t[1].confidence, -t[1].idx))[0]
                if len({str(v).lower() for v, _ in vals}) > 1:
                    flags.append({"type": "attribute_conflict", "person_id": pid, "attribute": attr,
                                  "values": sorted({str(v) for v, _ in vals}), "decision": f"kept {best!r}"})
                return best

            role_conf: dict[str, float] = {}
            for r in recs:
                for rc in r.roles:
                    if rc.role != "unknown" and rc.confidence >= ROLE_MIN_CONF:
                        role_conf[rc.role] = max(role_conf.get(rc.role, 0), rc.confidence)
            roles = sorted(role_conf, key=ROLE_PRIORITY.index) or ["unknown"]
            roles_by_pid[pid] = roles
            persons.append(PersonRow(person_id=pid, name=canon.name, gender=pick("gender"), age=pick("age"),
                                     address=pick("address"), occupation=pick("occupation"),
                                     role="|".join(roles), source_id=self.source_id, page_number=first.page))
            cap_of_pid[pid] = cap[root]
            if root in uncertain_roots:
                ambiguous_pids.add(pid)

            seen = {canon.key}
            surface: list[tuple[str, str, int]] = []
            for r in recs:
                if r.key != canon.key:
                    kind = "short_name" if _tokens(r.key) < _tokens(canon.key) else "name_variant"
                    surface.append((r.name, kind, r.page))
                for a in r.aliases:
                    if a.confidence < 0.6 or not self.index.has_name(a.alias):
                        continue
                    text = collapse_ws(a.alias)
                    tail = text.split()[-1].strip(".").lower() if text.split() else ""
                    kind = a.alias_type if a.alias_type in ALIAS_TYPES else "other"
                    if tail in NAME_SUFFIXES:
                        kind = "honorific_form"
                    surface.append((text, kind, r.page))
            for text, kind, page in surface:
                k = name_key(text) if kind != "honorific_form" else " ".join(text.casefold().replace(".", "").split())
                if not k or k in seen:
                    continue
                seen.add(k)
                a_no += 1
                aliases.append(AliasRow(alias_id=f"AL{a_no:03d}", person_id=pid, alias=text, alias_type=kind,
                                        source_id=self.source_id, page_number=page))

        # fast lookup structures ------------------------------------------------
        def lookup(name: str, chunk_id: str) -> Optional[Resolution]:
            key = name_key(name)
            if not key:
                return None

            def mk(root: int, extra_cap: float = 1.0) -> Resolution:
                pid = pid_of_root[find(root)]
                return Resolution(pid, min(cap_of_pid[pid], extra_cap), pid in ambiguous_pids)

            for r in R:                                              # same chunk first
                if r.chunk_id == chunk_id and (r.key == key or key in r.alias_keys):
                    return mk(r.idx)
            roots_hit = {find(r.idx) for r in R if r.key == key or key in r.alias_keys}
            if len(roots_hit) == 1:
                return mk(next(iter(roots_hit)))
            if len(roots_hit) > 1:
                return None                                          # ambiguous reference
            toks = _tokens(key)
            sub = {find(r.idx) for r in R if len(r.key.split()) > len(toks) and toks <= _tokens(r.key)}
            return mk(next(iter(sub)), 0.85) if len(sub) == 1 else None

        return ResolutionResult(persons, aliases, flags, lookup, roles_by_pid)


# --------------------------------------------------------------------------- #
# Record linking: phones / accounts / transactions / vehicles / call_records,
# all keyed by stable person_id (never a name) via the resolver's ``lookup``.
# --------------------------------------------------------------------------- #
Lookup = Callable[[str, str], Optional[Resolution]]


def make_timestamp(date_text: Optional[str], time_text: Optional[str], evidence: Optional[str]) -> Optional[str]:
    """Normalised 'YYYY-MM-DDTHH:MM' / 'YYYY-MM-DD' / 'HH:MM' (or '--MM-DD' when the FIR omits the year)."""
    def pick(text: Optional[str], kind: str, fallback: Optional[str]) -> Optional[str]:
        vals = [h.value for h in extract_hits(text or "") if h.kind == kind]
        if vals:
            return vals[0]
        vals = {h.value for h in extract_hits(fallback or "") if h.kind == kind}
        return next(iter(vals)) if len(vals) == 1 else None      # ambiguous => NULL, never guess

    d, t = pick(date_text, "DATE", evidence), pick(time_text, "TIME", evidence)
    return f"{d}T{t}" if d and t else d or t


def referenced_names(ext: ChunkExtraction) -> set[str]:
    names: set[str] = set()
    for p in ext.phones:
        names.add(p.person_name or "")
    for a in ext.accounts:
        names.add(a.owner_name or "")
    for t in ext.transactions:
        names |= {t.sender_name or "", t.receiver_name or "", t.sender_account_owner or "", t.receiver_account_owner or ""}
    for r in ext.relationships:
        names |= {r.source_name, r.target_name}
    for v in ext.vehicles:
        names |= {v.owner_name or "", v.driver_name or ""}
    for c in ext.calls:
        names |= {c.caller_name or "", c.receiver_name or ""}
    return {n for n in names if n}


class RecordBuilder:
    def __init__(self, index: EvidenceIndex, lookup: Lookup, source_id: str, stats: Counter, flags: list[dict]):
        self.index, self.lookup, self.source_id, self.stats, self.flags = index, lookup, source_id, stats, flags
        self.derived: list[RelationshipOut] = []
        self._phones: dict[tuple, dict] = {}
        self._accounts: dict[tuple, dict] = {}
        self._vehicles: dict[str, dict] = {}
        self._txns: dict[tuple, dict] = {}
        self._calls: dict[tuple, dict] = {}
        self._seq = 0

    # -- helpers -------------------------------------------------------- #
    def _pid(self, name: Optional[str], chunk_id: str, conf: float = 1.0) -> Optional[str]:
        if not name or conf < LINK_MIN_CONF:
            return None
        r = self.lookup(name, chunk_id)
        return r.person_id if r else None

    def _n(self) -> int:
        self._seq += 1
        return self._seq

    # -- phones ----------------------------------------------------------- #
    def add_phones(self, chunk: Chunk, ext: ChunkExtraction) -> None:
        for ph in ext.phones:
            pid = self._pid(ph.person_name, chunk.chunk_id, ph.confidence)
            key = (ph.phone_number, pid)
            self._phones.setdefault(key, dict(n=self._n(), number=ph.phone_number, pid=pid,
                                              type=ph.phone_type if ph.phone_type in ("mobile", "landline") else "mobile",
                                              page=ph.evidence_page or chunk.page_number))

    def finish_phones(self, doc_sentences) -> list[PhoneRow]:
        for s in doc_sentences:                       # numbers the FIR mentions but nobody linked
            for h in s.hits:
                if h.kind == "PHONE" and not any(k[0] == h.value for k in self._phones):
                    self._phones[(h.value, None)] = dict(n=self._n(), number=h.value, pid=None, type="mobile",
                                                         page=s.page_number)
        linked = {k[0] for k in self._phones if k[1]}
        rows = sorted((v for k, v in self._phones.items() if not (k[1] is None and k[0] in linked)),
                      key=lambda v: (v["page"], v["n"]))
        return [PhoneRow(phone_id=f"PH{i:03d}", person_id=r["pid"], phone_number=r["number"], phone_type=r["type"],
                         source_id=self.source_id, page_number=r["page"]) for i, r in enumerate(rows, 1)]

    # -- accounts / transactions ------------------------------------------ #
    def _account(self, number: Optional[str], owner_pid: Optional[str], page: int) -> Optional[tuple]:
        if number:
            key = ("num", number)
        elif owner_pid:
            key = ("owner", owner_pid)
        else:
            return None
        acc = self._accounts.setdefault(key, dict(n=self._n(), number=number, owner=None, page=page))
        if owner_pid:
            if acc["owner"] is None:
                acc["owner"] = owner_pid
            elif acc["owner"] != owner_pid:
                self.flags.append({"type": "account_owner_conflict", "account_number": number,
                                   "owners": [acc["owner"], owner_pid], "decision": f"kept {acc['owner']}"})
        return key

    def add_accounts_and_transactions(self, chunk: Chunk, ext: ChunkExtraction) -> None:
        for a in ext.accounts:
            self._account(a.account_number, self._pid(a.owner_name, chunk.chunk_id, a.confidence),
                          a.evidence_page or chunk.page_number)
        for t in ext.transactions:
            page = t.evidence_page or chunk.page_number
            cid = chunk.chunk_id
            s_pid = self._pid(t.sender_name, cid)
            r_pid = self._pid(t.receiver_name, cid)
            s_owner = self._pid(t.sender_account_owner, cid) or (None if t.sender_account_number else s_pid)
            r_owner = self._pid(t.receiver_account_owner, cid) or (None if t.receiver_account_number else r_pid)
            s_key = self._account(t.sender_account_number, s_owner, page)
            r_key = self._account(t.receiver_account_number, r_owner, page)
            if not s_key or not r_key or s_key == r_key:
                self.stats["transaction: dropped - accounts could not be established"] += 1
                continue
            ts = make_timestamp(t.date_text, t.time_text, t.evidence_text)
            amt = float(t.amount_text)
            key = (s_key, r_key, amt, ts, collapse_ws(t.evidence_text or "").lower())
            self._txns.setdefault(key, dict(n=self._n(), s=s_key, r=r_key, amt=amt, ts=ts, ref=t.reference, page=page))
            if t.sender_name and t.receiver_name:
                self.derived.append(RelationshipOut(
                    source_name=t.sender_name, target_name=t.receiver_name, relationship_type="transaction",
                    description=f"Transfer of INR {amt:,.0f}" if amt.is_integer() else f"Transfer of INR {amt:,.2f}",
                    evidence_text=t.evidence_text, confidence=t.confidence, chunk_id=cid, evidence_page=page))

    def finish_accounts(self, doc_sentences) -> tuple[list[AccountRow], list[TransactionRow]]:
        for s in doc_sentences:
            for h in s.hits:
                if h.kind == "ACCOUNT" and ("num", h.value) not in self._accounts:
                    self._accounts[("num", h.value)] = dict(n=self._n(), number=h.value, owner=None, page=s.page_number)
        ordered = sorted(self._accounts.items(), key=lambda kv: (kv[1]["page"], kv[1]["n"]))
        ids = {k: f"ACC{i:03d}" for i, (k, _) in enumerate(ordered, 1)}
        acc_rows = [AccountRow(account_id=ids[k], account_number=v["number"], owner_id=v["owner"],
                               source_id=self.source_id, page_number=v["page"]) for k, v in ordered]
        tx = sorted(self._txns.values(), key=lambda v: (v["page"], v["n"]))
        tx_rows = [TransactionRow(transaction_id=f"TX{i:03d}", timestamp=v["ts"], sender_account_id=ids[v["s"]],
                                  receiver_account_id=ids[v["r"]], amount_inr=v["amt"], reference=v["ref"],
                                  source_id=self.source_id, page_number=v["page"]) for i, v in enumerate(tx, 1)]
        return acc_rows, tx_rows

    # -- vehicles ---------------------------------------------------------- #
    def add_vehicles(self, chunk: Chunk, ext: ChunkExtraction) -> None:
        for v in ext.vehicles:
            key = v.registration_number or f"model:{(v.make_model or '').lower()}|{chunk.chunk_id}"
            rec = self._vehicles.setdefault(key, dict(n=self._n(), reg=v.registration_number, type=None, make=None,
                                                       persons={}, page=v.evidence_page or chunk.page_number))
            rec["type"] = rec["type"] or v.vehicle_type
            rec["make"] = rec["make"] or v.make_model
            for nm in (v.owner_name, v.driver_name):
                pid = self._pid(nm, chunk.chunk_id, v.confidence)
                if pid:
                    rec["persons"][pid] = None

    def finish_vehicles(self, doc_sentences) -> list[VehicleRow]:
        for s in doc_sentences:
            for h in s.hits:
                if h.kind == "VEHICLE_REG" and h.value not in self._vehicles:
                    self._vehicles[h.value] = dict(n=self._n(), reg=h.value, type=None, make=None, persons={},
                                                   page=s.page_number)
        rows: list[VehicleRow] = []
        for i, v in enumerate(sorted(self._vehicles.values(), key=lambda v: (v["page"], v["n"])), 1):
            for pid in (list(v["persons"]) or [None]):
                rows.append(VehicleRow(vehicle_id=f"V{i:03d}", person_id=pid, registration_number=v["reg"],
                                       vehicle_type=v["type"], make_model=v["make"], source_id=self.source_id,
                                       page_number=v["page"]))
        return rows

    # -- calls -------------------------------------------------------------- #
    def add_calls(self, chunk: Chunk, ext: ChunkExtraction) -> None:
        for c in ext.calls:
            page = c.evidence_page or chunk.page_number
            if c.caller_name and c.receiver_name and c.communication_type in ("call", "sms", "whatsapp"):
                self.derived.append(RelationshipOut(
                    source_name=c.caller_name, target_name=c.receiver_name,
                    relationship_type="called" if c.communication_type == "call" else "messaged",
                    evidence_text=c.evidence_text, confidence=c.confidence, chunk_id=chunk.chunk_id,
                    evidence_page=page))
            if c.communication_type != "call":
                continue
            if not (c.caller_phone or c.receiver_phone):
                continue                     # no phone number in the FIR -> relationship only, no call record
            ts = make_timestamp(c.date_text, c.time_text, c.evidence_text)
            dur = parse_duration_seconds(c.duration_text) or parse_duration_seconds(c.evidence_text)
            key = (c.caller_phone, c.receiver_phone, ts, dur)
            self._calls.setdefault(key, dict(n=self._n(), a=c.caller_phone, b=c.receiver_phone, ts=ts, dur=dur, page=page))

    def finish_calls(self) -> list[CallRow]:
        rows = sorted(self._calls.values(), key=lambda v: (v["page"], v["n"]))
        return [CallRow(call_id=f"CL{i:03d}", caller_phone=r["a"], receiver_phone=r["b"], timestamp=r["ts"],
                        duration_seconds=r["dur"], source_id=self.source_id, page_number=r["page"])
                for i, r in enumerate(rows, 1)]


# --------------------------------------------------------------------------- #
# Building relationships.csv rows
# --------------------------------------------------------------------------- #
def build_relationships(items: list[RelationshipOut], lookup: Lookup, source_id: str, min_confidence: float,
                        stats: Counter, flags: list[dict]) -> list[RelationshipRow]:
    best: dict[tuple, dict] = {}
    for rel in items:
        a, b = lookup(rel.source_name, rel.chunk_id or ""), lookup(rel.target_name, rel.chunk_id or "")
        if not a or not b:
            stats["relationship: dropped - person could not be resolved unambiguously"] += 1
            flags.append({"type": "unresolved_relationship_endpoint", "names": [rel.source_name, rel.target_name],
                          "decision": "dropped"})
            continue
        if a.person_id == b.person_id:
            continue
        conf = min(rel.confidence, a.confidence_cap, b.confidence_cap)
        if a.ambiguous or b.ambiguous:
            conf = min(conf, 0.6)
        if conf < min_confidence:
            stats["relationship: dropped - below min-confidence threshold"] += 1
            continue
        s_pid, t_pid = a.person_id, b.person_id
        typ = rel.relationship_type
        if typ in SYMMETRIC_TYPES and s_pid > t_pid:
            s_pid, t_pid = t_pid, s_pid
        desc = rel.description
        if (rel.uncertain or conf < 0.6) and desc and not desc.upper().startswith("UNCERTAIN"):
            desc = f"UNCERTAIN: {desc}"
        elif (rel.uncertain or conf < 0.6) and not desc:
            desc = "UNCERTAIN"
        key = (s_pid, t_pid, typ)
        prev = best.get(key)
        if not prev or conf > prev["confidence"]:
            best[key] = dict(source_person_id=s_pid, target_person_id=t_pid, relationship_type=typ,
                             description=desc, evidence_text=rel.evidence_text, confidence=conf,
                             page_number=rel.evidence_page or 1)
    rows = sorted(best.values(), key=lambda v: (v["page_number"], v["source_person_id"], v["target_person_id"]))
    return [RelationshipRow(relationship_id=f"R{i:03d}", source_id=source_id, **v) for i, v in enumerate(rows, 1)]
