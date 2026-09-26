"""Gemini semantic layer + the anti-hallucination evidence gate.

* ``build_chunks``    - logical chunks (never the whole FIR) with page/chunk ids + context.
* ``GeminiBackend``   - google-genai client with rate limiting, timeouts, retry/backoff.
* ``GeminiExtractor`` - prompt building, JSON parsing/repair, Pydantic validation
                        (invalid items are dropped one by one, never crash the run).
* ``EvidenceIndex``   - locates evidence quotes in the FIR (used to verify every claim).
* ``verify_extraction`` - the gate itself: every item Gemini returns is checked against
                        the FIR text before it is allowed to reach a CSV row. Items that
                        fail are dropped (and counted) - never "fixed" with invented data.

The API key is read from the GEMINI_API_KEY environment variable only.
"""
from __future__ import annotations

import json
import logging
import os
import random
import re
import time
from collections import Counter
from difflib import SequenceMatcher
from typing import Callable, Optional, Protocol

from pydantic import ValidationError

from pdf_extractor import collapse_ws, name_key, tokenize
from regex_extractor import amounts_in_text, normalize_account, normalize_phone, normalize_vehicle_reg, parse_amount
from schemas import (FIELD_MODELS, RELATIONSHIP_TYPES, ROLES, Chunk, ChunkExtraction, Document, PairJudgement,
                     Sentence)

log = logging.getLogger(__name__)
DEFAULT_MODEL = "gemini-2.5-flash"


class ExtractionError(RuntimeError):
    """A chunk could not be processed (after retries / repair)."""


class FatalGeminiError(ExtractionError):
    """Non-retryable error (bad key, unknown model, ...): stop calling the API."""


# --------------------------------------------------------------------------- #
# Chunking
# --------------------------------------------------------------------------- #
def build_chunks(doc: Document, max_chars: int = 3000, context_sentences: int = 2) -> list[Chunk]:
    """Split each page into paragraph-aligned chunks of <= ``max_chars`` characters.

    Every chunk keeps: doc id, page number, chunk id and surrounding sentences
    (read-only context for pronoun / reference resolution).
    """
    all_sents = doc.sentences
    index = {s.sentence_id: i for i, s in enumerate(all_sents)}
    groups: list[list[Sentence]] = []
    for page in doc.pages:
        cur: list[Sentence] = []
        size = 0
        last_par = None
        for s in page.sentences:
            new_par = last_par is not None and s.paragraph_index != last_par
            if cur and size + len(s.text) > max_chars and (new_par or size > max_chars * 1.2):
                groups.append(cur)
                cur, size = [], 0
            cur.append(s)
            size += len(s.text) + 1
            last_par = s.paragraph_index
        if cur:
            groups.append(cur)
    chunks = []
    for n, g in enumerate(groups, start=1):
        i0, i1 = index[g[0].sentence_id], index[g[-1].sentence_id]
        chunks.append(Chunk(
            chunk_id=f"C{n:03d}", doc_id=doc.doc_id, page_number=g[0].page_number, sentences=g,
            context_before=[s.text for s in all_sents[max(0, i0 - context_sentences):i0]],
            context_after=[s.text for s in all_sents[i1 + 1:i1 + 1 + context_sentences]]))
    return chunks


# --------------------------------------------------------------------------- #
# Prompt
# --------------------------------------------------------------------------- #
SYSTEM_INSTRUCTION = (
    "You are a precise information-extraction engine for Indian police First Information "
    "Reports (FIRs). You never guess. You only report what the text explicitly supports. "
    "You answer with a single JSON object and nothing else.")

_SCHEMA_TEXT = f"""
Return ONE JSON object with exactly these keys (use [] when nothing is found, null for unknown values):
{{
 "persons": [{{"name": str, "aliases": [{{"alias": str, "alias_type": "nickname|short_name|honorific_form|spelling_variant|other", "confidence": 0-1}}],
              "age": int|null, "gender": "male|female|other"|null, "address": str|null, "occupation": str|null,
              "roles": [{{"role": one of {ROLES}, "evidence_text": str, "confidence": 0-1}}], "confidence": 0-1}}],
 "phones": [{{"phone_number": str, "person_name": str|null, "phone_type": "mobile|landline"|null, "evidence_text": str, "confidence": 0-1}}],
 "accounts": [{{"account_number": str|null, "owner_name": str|null, "evidence_text": str, "confidence": 0-1}}],
 "transactions": [{{"sender_name": str|null, "receiver_name": str|null, "sender_account_number": str|null, "receiver_account_number": str|null,
                   "sender_account_owner": str|null, "receiver_account_owner": str|null, "amount_text": str, "date_text": str|null,
                   "time_text": str|null, "reference": str|null, "evidence_text": str, "confidence": 0-1}}],
 "relationships": [{{"source_name": str, "target_name": str, "relationship_type": one of {RELATIONSHIP_TYPES},
                    "description": str, "evidence_text": str, "confidence": 0-1, "uncertain": bool}}],
 "vehicles": [{{"registration_number": str|null, "vehicle_type": "car|suv|motorcycle|scooter|truck|bus|van|auto_rickshaw|tempo|tractor|bicycle|other"|null,
               "make_model": str|null, "owner_name": str|null, "driver_name": str|null, "evidence_text": str, "confidence": 0-1}}],
 "calls": [{{"caller_name": str|null, "receiver_name": str|null, "caller_phone": str|null, "receiver_phone": str|null, "date_text": str|null,
            "time_text": str|null, "duration_text": str|null, "communication_type": "call|sms|whatsapp|other", "evidence_text": str, "confidence": 0-1}}]
}}
"""

_RULES = """
RULES (all mandatory)
1. Extract ONLY from CHUNK TEXT. CONTEXT_BEFORE / CONTEXT_AFTER are read-only help for resolving
   pronouns ("he", "the accused") and references; do not extract facts that appear only there.
2. NEVER invent people, relationships, phone numbers, accounts, transactions, addresses, vehicle numbers,
   dates, roles or crimes. Unknown => null. Do not fill gaps from world knowledge.
3. evidence_text MUST be copied character-for-character from the text (one to three consecutive sentences).
   Never paraphrase it. If you cannot quote supporting text, omit the item.
4. PERSONS: "name" = the fullest form used in this chunk, without honorifics (Mr., Shri, Smt.) and without "bhai"/"ji".
   One entry per real individual. Put other forms used for the same individual (Rahul, Raju, Rahul Bhai) in "aliases".
   Only merge forms when the text makes clear they are the same individual; if unsure, output them as SEPARATE persons.
   Do not create persons for police officers/court staff who only record or investigate, nor for parents named only
   in parentage phrases ("S/o Ram Prasad") unless they take part in the events.
   age/gender/address/occupation only if stated (gender may come from S/o, D/o, W/o, Mr./Smt. or a clear pronoun).
5. ROLES only when the text supports it: suspect, accused, victim, complainant, witness, informant, associate.
   "Rahul met Amit" does NOT make anyone a suspect or accused. Use "unknown" when unsure.
6. RELATIONSHIPS between two DIFFERENT persons, using exactly one type from the list, chosen by what the text says:
   directed: called, messaged, transaction, financial_link (source paid/owes target), transported (source transported target),
   employee (source works for target), employer (source employs target), supplier (source supplies target),
   customer (source buys from target), victim (source is victim of target's act), accused (source accuses / names target),
   witness (source witnessed target's act). symmetric: friend, associate, relative, business_partner, met, accompanied,
   co_accused, unknown. Do NOT force a type: use "unknown" only when a link is clearly stated but its nature is not.
   Do not create relationships from mere co-occurrence in a list or paragraph.
7. confidence: 0.98 explicitly stated; 0.90 strong contextual evidence; 0.75 reasonable inference; 0.50 uncertain.
   Set "uncertain": true for anything below 0.6. Never present uncertain items as confirmed.
8. PHONES: link to a person only when the text ties the number to that person ("X uses/has mobile 98...", "X's number is ...").
   Number merely near a name => person_name null.
9. TRANSACTIONS: only when amount AND (sender or receiver) are stated. Copy the amount as written in amount_text.
   Give account numbers only if written. *_account_owner only if the text says whose account it is.
10. CALLS/messages: communication_type "call" for phone calls, "sms"/"whatsapp" for messages. Copy date/time/duration as written.
11. Use the same person name spelling in every section so items can be linked.
"""


def build_prompt(chunk: Chunk) -> str:
    hits, cands = [], []
    for s in chunk.sentences:
        hits += [f"{h.kind}: {h.raw!r} -> {h.value}" for h in s.hits
                 if h.kind in {"PHONE", "ACCOUNT", "VEHICLE_REG", "MONEY", "DATE", "TIME", "DURATION",
                               "IFSC", "FIR_NUMBER", "ADDRESS_HINT"}]
        cands += [f"{e.label}: {e.normalized or e.text}" for e in s.entities
                  if e.label in {"PERSON", "ORG", "GPE", "LOC", "VEHICLE_MAKE", "VEHICLE_TYPE"}]
    lines = [f"[{s.sentence_id}] {s.text}" for s in chunk.sentences]
    return (f"{_SCHEMA_TEXT}\n{_RULES}\n"
            f"DETERMINISTIC HINTS (regex/spaCy; may contain errors - verify against the text):\n"
            f"regex: {sorted(set(hits))}\nspacy candidates: {sorted(set(cands))}\n\n"
            f"DOCUMENT: {chunk.doc_id} | PAGE: {chunk.page_number} | CHUNK: {chunk.chunk_id}\n"
            f"CONTEXT_BEFORE (read-only):\n{chr(10).join(chunk.context_before) or '(none)'}\n\n"
            f"CHUNK TEXT:\n{chr(10).join(lines)}\n\n"
            f"CONTEXT_AFTER (read-only):\n{chr(10).join(chunk.context_after) or '(none)'}\n\n"
            f"Return the JSON object now.")


# --------------------------------------------------------------------------- #
# JSON parsing / validation
# --------------------------------------------------------------------------- #
def parse_json_loose(text: str):
    """Parse JSON that may be wrapped in fences / prose. Raises ValueError if hopeless."""
    if text is None:
        raise ValueError("empty response")
    t = text.strip()
    t = re.sub(r"^```(?:json)?\s*|\s*```$", "", t, flags=re.I).strip()
    try:
        return json.loads(t)
    except json.JSONDecodeError:
        pass
    a, b = t.find("{"), t.rfind("}")
    if a >= 0 and b > a:
        cand = t[a:b + 1]
        for fixer in (lambda x: x, lambda x: re.sub(r",\s*([}\]])", r"\1", x)):   # trailing commas
            try:
                return json.loads(fixer(cand))
            except json.JSONDecodeError:
                continue
    raise ValueError("response is not valid JSON")


def parse_chunk_result(data, dropped: Optional[list[str]] = None) -> ChunkExtraction:
    """Validate item-by-item so one bad item never discards the rest."""
    if isinstance(data, list) and len(data) == 1 and isinstance(data[0], dict):
        data = data[0]
    if not isinstance(data, dict):
        raise ValueError("top-level JSON is not an object")
    out: dict[str, list] = {}
    for key, model in FIELD_MODELS.items():
        items = data.get(key) or []
        if not isinstance(items, list):
            items = []
        ok = []
        for it in items:
            try:
                ok.append(model.model_validate(it))
            except (ValidationError, TypeError) as exc:
                if dropped is not None:
                    dropped.append(f"{key}: {str(exc).splitlines()[0]}")
        out[key] = ok
    return ChunkExtraction(**out)


# --------------------------------------------------------------------------- #
# Backend
# --------------------------------------------------------------------------- #
class LLMBackend(Protocol):
    def generate(self, prompt: str) -> str: ...


_TRANSIENT_CODES = {408, 429, 500, 502, 503, 504}
_TRANSIENT_WORDS = ("timeout", "timed out", "unavailable", "resource_exhausted", "rate limit",
                    "overloaded", "deadline", "connection", "temporarily", "try again", "empty response")


def _error_code(exc: Exception) -> Optional[int]:
    for attr in ("code", "status_code"):
        v = getattr(exc, attr, None)
        if isinstance(v, int):
            return v
    m = re.match(r"\s*(\d{3})\b", str(exc))
    return int(m.group(1)) if m else None


class GeminiBackend:
    """Thin wrapper over ``google-genai`` with client-side rate limiting and retry."""

    def __init__(self, api_key: Optional[str] = None, model: Optional[str] = None,
                 timeout_s: float = 90.0, max_retries: int = 5, min_interval_s: float = 1.0,
                 max_backoff_s: float = 60.0, sleep: Callable[[float], None] = time.sleep) -> None:
        self.api_key = api_key or os.environ.get("GEMINI_API_KEY") or os.environ.get("GOOGLE_API_KEY")
        if not self.api_key:
            raise FatalGeminiError("GEMINI_API_KEY environment variable is not set")
        self.model = model or os.environ.get("GEMINI_MODEL", DEFAULT_MODEL)
        self.max_retries, self.min_interval_s, self.max_backoff_s = max_retries, min_interval_s, max_backoff_s
        self._sleep, self._last_call = sleep, 0.0
        from google import genai
        from google.genai import types

        self._types = types
        self._client = genai.Client(api_key=self.api_key,
                                    http_options=types.HttpOptions(timeout=int(timeout_s * 1000)))
        safety = [types.SafetySetting(category=c, threshold="BLOCK_ONLY_HIGH") for c in (
            "HARM_CATEGORY_HARASSMENT", "HARM_CATEGORY_HATE_SPEECH",
            "HARM_CATEGORY_SEXUALLY_EXPLICIT", "HARM_CATEGORY_DANGEROUS_CONTENT")]  # FIRs describe crimes
        self._config = types.GenerateContentConfig(
            system_instruction=SYSTEM_INSTRUCTION, temperature=0.0,
            response_mime_type="application/json", safety_settings=safety)

    def generate(self, prompt: str) -> str:
        last: Optional[Exception] = None
        for attempt in range(self.max_retries + 1):
            wait = self.min_interval_s - (time.monotonic() - self._last_call)     # rate limit
            if wait > 0:
                self._sleep(wait)
            self._last_call = time.monotonic()
            try:
                resp = self._client.models.generate_content(model=self.model, contents=prompt,
                                                            config=self._config)
                text = getattr(resp, "text", None)
                if not text:
                    raise RuntimeError("empty response (possibly blocked by safety filters)")
                return text
            except Exception as exc:                                             # noqa: BLE001
                last = exc
                code, msg = _error_code(exc), str(exc).lower()
                transient = code in _TRANSIENT_CODES or any(w in msg for w in _TRANSIENT_WORDS)
                if not transient:
                    raise FatalGeminiError(f"Gemini error (not retryable): {exc}") from exc
                if attempt == self.max_retries:
                    break
                delay = min(self.max_backoff_s, 2.0 * (2 ** attempt)) + random.uniform(0, 1.0)
                log.warning("Gemini transient error (%s) - retry %d/%d in %.1fs",
                            str(exc)[:120], attempt + 1, self.max_retries, delay)
                self._sleep(delay)
        raise ExtractionError(f"Gemini failed after {self.max_retries} retries: {last}")


# --------------------------------------------------------------------------- #
# Extractor
# --------------------------------------------------------------------------- #
class GeminiExtractor:
    def __init__(self, backend: LLMBackend, max_repairs: int = 2) -> None:
        self.backend, self.max_repairs = backend, max_repairs
        self.dropped_items: list[str] = []

    def extract_chunk(self, chunk: Chunk) -> ChunkExtraction:
        prompt = build_prompt(chunk)
        text = self.backend.generate(prompt)
        for attempt in range(self.max_repairs + 1):
            try:
                dropped: list[str] = []
                result = parse_chunk_result(parse_json_loose(text), dropped)
                self.dropped_items += [f"{chunk.chunk_id} {d}" for d in dropped]
                return result
            except ValueError as exc:
                if attempt == self.max_repairs:
                    raise ExtractionError(f"chunk {chunk.chunk_id}: unusable JSON ({exc})") from exc
                log.warning("chunk %s: malformed JSON, asking for a repair (%d)", chunk.chunk_id, attempt + 1)
                text = self.backend.generate(
                    "The following was supposed to be ONE valid JSON object following the schema below, "
                    "but is malformed or incomplete. Return ONLY the corrected JSON object. Do not add any "
                    f"information that is not already present.\n{_SCHEMA_TEXT}\n\nMALFORMED OUTPUT:\n{text[:12000]}")
        raise ExtractionError("unreachable")

    def judge_pairs(self, pairs: list[dict]) -> list[PairJudgement]:
        """Optional 2nd stage: are these two name-clusters the same individual?

        ``pairs``: [{"pair_id", "a", "b", "evidence": [sentences]}]. Only used for the few
        pairs the deterministic resolver could not decide.
        """
        if not pairs:
            return []
        prompt = (
            "For each pair decide whether name A and name B refer to the SAME individual in this FIR. "
            "Answer 'same' only when the sentences give clear evidence (e.g. explicit alias, same context, "
            "same phone/vehicle/role). Different individuals may share a first name. If evidence is "
            "insufficient answer 'uncertain'. Return JSON: "
            '{"judgements": [{"pair_id": int, "verdict": "same|different|uncertain", "confidence": 0-1, "reason": str}]}\n\n'
            + json.dumps(pairs, ensure_ascii=False, indent=1))
        text = self.backend.generate(prompt)
        try:
            data = parse_json_loose(text)
            items = data.get("judgements", []) if isinstance(data, dict) else data
            out = []
            for it in items:
                try:
                    out.append(PairJudgement.model_validate(it))
                except ValidationError:
                    continue
            return out
        except ValueError:
            log.warning("pair-judgement response unusable; treating all pairs as uncertain")
            return []


# --------------------------------------------------------------------------- #
# Evidence index - the anti-hallucination gate's data structure
# --------------------------------------------------------------------------- #
class EvidenceIndex:
    """Locates evidence quotes in the FIR (whitespace/case-insensitive, near-verbatim OK)."""

    def __init__(self, doc: Document) -> None:
        self.doc = doc
        self.pages = [(p.page_number, collapse_ws(p.clean_text)) for p in doc.pages]
        self.full = " ".join(t for _, t in self.pages)
        self.full_lower = self.full.lower()
        self.tokens = set(tokenize(self.full))
        self._sentences = [(s.page_number, collapse_ws(s.text)) for s in doc.sentences]
        hits = [h for s in doc.sentences for h in s.hits]
        self.phones = {h.value for h in hits if h.kind == "PHONE"}
        self.accounts = {h.value for h in hits if h.kind == "ACCOUNT"}
        self.vehicles = {h.value for h in hits if h.kind == "VEHICLE_REG"}
        self.amounts = amounts_in_text(self.full)
        self.digits_only = re.sub(r"\D", "", self.full)

    def locate(self, evidence: Optional[str], prefer_page: Optional[int] = None) -> Optional[tuple[str, int]]:
        """Return (verbatim_text, page_number) or None when the quote is not in the FIR."""
        if not evidence:
            return None
        ev = collapse_ws(evidence).strip("\"“”' ")
        ev = re.sub(r"^\.{3}|\.{3}$|^…|…$", "", ev).strip()
        if len(ev) < 5:
            return None
        ordered = sorted(self.pages, key=lambda p: (p[0] != prefer_page, p[0]))
        needle = ev.lower()
        for page_no, text in ordered:
            low = text.lower()
            i = low.find(needle)
            if i >= 0 and len(low) == len(text):
                return text[i:i + len(ev)], page_no
            if i >= 0:
                return ev, page_no
        # near-verbatim: pick the best sentence (>= 0.85 similarity)
        best, best_r = None, 0.0
        for page_no, s in self._sentences:
            if abs(len(s) - len(ev)) > max(len(ev), len(s)) * 0.5 and needle not in s.lower():
                continue
            r = SequenceMatcher(None, needle, s.lower()).ratio()
            if r > best_r:
                best, best_r = (s, page_no), r
        return best if best and best_r >= 0.85 else None

    def has_name(self, name: Optional[str]) -> bool:
        toks = [t for t in tokenize(name_key(name or "")) if len(t) > 1]
        return bool(toks) and all(t in self.tokens for t in toks)

    def first_offset(self, name: str) -> int:
        """Position of first mention (used for deterministic ID ordering)."""
        key = " ".join(tokenize(name_key(name)))
        i = self.full_lower.find(key)
        if i >= 0:
            return i
        toks = tokenize(key)
        pos = [self.full_lower.find(t) for t in toks if self.full_lower.find(t) >= 0]
        return min(pos) if pos else len(self.full_lower) + 1

    def supports_text(self, value: Optional[str], frac: float = 0.8) -> bool:
        """Free-text attribute (address, occupation) is grounded in the FIR."""
        toks = [t for t in tokenize(value or "") if len(t) > 2]
        if not toks:
            return False
        return sum(t in self.tokens for t in toks) / len(toks) >= frac

    def has_text(self, value: Optional[str]) -> bool:
        return bool(value) and collapse_ws(value).lower() in self.full_lower

    def has_number(self, n: int) -> bool:
        return re.search(rf"(?<!\d){n}(?!\d)", self.full) is not None


# --------------------------------------------------------------------------- #
# Anti-hallucination gate
# --------------------------------------------------------------------------- #
def _first_token(name: Optional[str]) -> str:
    k = name_key(name or "").split()
    return k[0] if k else ""


def _repair_evidence(names: list[str], chunk: Chunk) -> Optional[str]:
    """Find THE sentence of the chunk that mentions all given names (else None)."""
    firsts = [_first_token(n) for n in names if n]
    if not firsts:
        return None
    hits = [collapse_ws(s.text) for s in chunk.sentences if all(f in tokenize(s.text) for f in firsts)]
    return hits[0] if len(hits) == 1 else None


def _anchor(item, index: EvidenceIndex, chunk: Chunk, names: list[str], stats: Counter, kind: str,
            required: bool = True) -> bool:
    """Replace item.evidence_text by the verbatim FIR text. Returns False if unusable."""
    loc = index.locate(item.evidence_text, chunk.page_number)
    if loc:
        item.evidence_text, item.evidence_page = loc
        return True
    rep = _repair_evidence(names, chunk)
    if rep and (loc := index.locate(rep, chunk.page_number)):
        item.evidence_text, item.evidence_page = loc
        item.confidence = min(item.confidence, 0.75)      # quote had to be re-anchored
        stats[f"{kind}: evidence re-anchored"] += 1
        return True
    item.evidence_text, item.evidence_page = None, None
    if required:
        stats[f"{kind}: dropped - evidence not found in FIR"] += 1
    return not required


def verify_extraction(chunk: Chunk, ext: ChunkExtraction, index: EvidenceIndex, stats: Counter) -> ChunkExtraction:
    """Re-check every claim against the FIR text before it is allowed into a CSV row."""
    out = ChunkExtraction()
    tag = lambda it: setattr(it, "chunk_id", chunk.chunk_id)  # noqa: E731

    for p in ext.persons:
        if not index.has_name(p.name):
            stats["person: dropped - name not in FIR"] += 1
            continue
        tag(p)
        p.aliases = [a for a in p.aliases if index.has_name(a.alias)]
        if p.age is not None and not index.has_number(p.age):
            p.age = None
        if p.address and not index.supports_text(p.address):
            p.address = None
        if p.occupation and not index.supports_text(p.occupation):
            p.occupation = None
        good_roles = []
        for r in p.roles:
            if _anchor(r, index, chunk, [p.name], stats, "role"):
                good_roles.append(r)
        p.roles = good_roles
        out.persons.append(p)

    for ph in ext.phones:
        num = normalize_phone(ph.phone_number)
        if not num or num not in index.phones:
            stats["phone: dropped - number not in FIR"] += 1
            continue
        ph.phone_number = num
        tag(ph)
        ok = _anchor(ph, index, chunk, [ph.person_name] if ph.person_name else [], stats, "phone", required=False)
        if ph.person_name and (not index.has_name(ph.person_name) or not ok):
            ph.person_name = None                         # cannot prove the link
        out.phones.append(ph)

    for a in ext.accounts:
        num = normalize_account(a.account_number)
        if a.account_number and (not num or (num not in index.accounts and num not in index.digits_only)):
            stats["account: dropped - number not in FIR"] += 1
            continue
        if not num and not a.owner_name:
            continue
        a.account_number = num
        tag(a)
        if a.owner_name and not index.has_name(a.owner_name):
            a.owner_name = None
        if not _anchor(a, index, chunk, [a.owner_name] if a.owner_name else [], stats, "account"):
            continue
        out.accounts.append(a)

    for t in ext.transactions:
        amt = parse_amount(t.amount_text)
        if amt is None or amt <= 0 or amt not in index.amounts:
            stats["transaction: dropped - amount not in FIR"] += 1
            continue
        for f in ("sender_name", "receiver_name", "sender_account_owner", "receiver_account_owner"):
            v = getattr(t, f)
            if v and not index.has_name(v):
                setattr(t, f, None)
        for f in ("sender_account_number", "receiver_account_number"):
            v = getattr(t, f)
            n = normalize_account(v)
            setattr(t, f, n if n and (n in index.accounts or n in index.digits_only) else None)
        if t.reference and not index.has_text(t.reference):
            t.reference = None
        if not ((t.sender_name or t.sender_account_number) and (t.receiver_name or t.receiver_account_number)):
            stats["transaction: dropped - sender/receiver not established"] += 1
            continue
        tag(t)
        t.amount_text = str(amt)
        if not _anchor(t, index, chunk, [t.sender_name or "", t.receiver_name or ""], stats, "transaction"):
            continue
        if not all(x in amounts_in_text(t.evidence_text) for x in [amt]):
            stats["transaction: amount not inside evidence sentence"] += 1
            t.confidence = min(t.confidence, 0.75)
        out.transactions.append(t)

    for r in ext.relationships:
        if not (index.has_name(r.source_name) and index.has_name(r.target_name)):
            stats["relationship: dropped - person not in FIR"] += 1
            continue
        if name_key(r.source_name) == name_key(r.target_name):
            continue
        tag(r)
        if not _anchor(r, index, chunk, [r.source_name, r.target_name], stats, "relationship"):
            continue
        toks = set(tokenize(r.evidence_text))
        if _first_token(r.source_name) not in toks or _first_token(r.target_name) not in toks:
            r.confidence = min(r.confidence, 0.9)         # one endpoint only via pronoun/context
        out.relationships.append(r)

    for v in ext.vehicles:
        reg = normalize_vehicle_reg(v.registration_number)
        if v.registration_number and (not reg or reg not in index.vehicles):
            v.registration_number = None
            reg = None
        if v.make_model and not index.supports_text(v.make_model):
            v.make_model = None
        if not (reg or v.make_model):
            stats["vehicle: dropped - no verifiable number/model"] += 1
            continue
        v.registration_number = reg
        for f in ("owner_name", "driver_name"):
            if getattr(v, f) and not index.has_name(getattr(v, f)):
                setattr(v, f, None)
        tag(v)
        if not _anchor(v, index, chunk, [v.owner_name or "", v.driver_name or ""], stats, "vehicle"):
            continue
        out.vehicles.append(v)

    for c in ext.calls:
        c.caller_phone, c.receiver_phone = normalize_phone(c.caller_phone), normalize_phone(c.receiver_phone)
        for f in ("caller_phone", "receiver_phone"):
            if getattr(c, f) and getattr(c, f) not in index.phones:
                setattr(c, f, None)
        for f in ("caller_name", "receiver_name"):
            if getattr(c, f) and not index.has_name(getattr(c, f)):
                setattr(c, f, None)
        if not ((c.caller_name or c.caller_phone) and (c.receiver_name or c.receiver_phone)):
            stats["call: dropped - caller/receiver not established"] += 1
            continue
        tag(c)
        if not _anchor(c, index, chunk, [c.caller_name or "", c.receiver_name or ""], stats, "call"):
            continue
        out.calls.append(c)
    return out
