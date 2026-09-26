"""FIR (PDF/TXT) -> structured CSV files.

Pipeline: text extraction (pdf_extractor) -> spaCy NER (spacy_extractor) -> regex
extraction (regex_extractor) -> Gemini relationship extraction / entity resolution
(gemini_extractor, entity_resolver) -> validation -> CSVs (csv_writer).

Usage:
    python main.py FIR_001.pdf -o output/
    python main.py FIR_001.txt -o output/ --no-gemini      # regex + spaCy only, no API calls

Without a GEMINI_API_KEY (or with --no-gemini), the pipeline still runs and still
produces every CSV file, but only with what regex + spaCy can establish on their own:
persons are still found (role "unknown", since roles/aliases/relationships are
semantic judgements reserved for Gemini), and phone/account/vehicle numbers found by
regex still appear (unlinked to a person). Relationships, transactions and call
records need Gemini to tie two people together, so those tables will be empty in
this mode. This is intentional: never guess what only Gemini's semantic reading can
tell you.
"""
from __future__ import annotations

import argparse
import json
import logging
import re
import sys
from collections import Counter
from dataclasses import dataclass, field
from pathlib import Path
from typing import Optional

from csv_writer import write_csvs
from entity_resolver import EntityResolver, PersonRecord, RecordBuilder, build_relationships, referenced_names
from gemini_extractor import (DEFAULT_MODEL, EvidenceIndex, ExtractionError, FatalGeminiError, GeminiBackend,
                              GeminiExtractor, LLMBackend, build_chunks, verify_extraction)
from pdf_extractor import collapse_ws, load_document, name_key
from regex_extractor import extract_hits
from schemas import RELATIONSHIP_TYPES, ROLES, ChunkExtraction, PersonOut, ResolvedData, TABLES
from spacy_extractor import SpacyProcessor, person_candidates

log = logging.getLogger(__name__)
_OTHER_IDS = {"FIR_NUMBER", "CASE_NUMBER", "EMAIL", "IFSC", "PAN", "AADHAAR", "VOTER_ID"}


# --------------------------------------------------------------------------- #
# Final validation: referential integrity + format checks on the assembled tables
# --------------------------------------------------------------------------- #
@dataclass
class ValidationReport:
    errors: list[str] = field(default_factory=list)
    warnings: list[str] = field(default_factory=list)

    @property
    def ok(self) -> bool:
        return not self.errors


def validate(data: ResolvedData, index: EvidenceIndex) -> ValidationReport:
    rep = ValidationReport()
    err, warn = rep.errors.append, rep.warnings.append

    def unique(name: str, ids: list[str]) -> None:
        dup = {i for i in ids if ids.count(i) > 1}
        if dup:
            err(f"{name}: duplicate ids {sorted(dup)}")

    unique("persons", [p.person_id for p in data.persons])
    unique("aliases", [a.alias_id for a in data.aliases])
    unique("phones", [p.phone_id for p in data.phones])
    unique("accounts", [a.account_id for a in data.accounts])
    unique("transactions", [t.transaction_id for t in data.transactions])
    unique("relationships", [r.relationship_id for r in data.relationships])
    unique("calls", [c.call_id for c in data.calls])

    pids = {p.person_id for p in data.persons}
    aids = {a.account_id for a in data.accounts}
    for a in data.aliases:
        if a.person_id not in pids:
            err(f"{a.alias_id}: unknown person_id {a.person_id}")
    for p in data.phones:
        if p.person_id and p.person_id not in pids:
            err(f"{p.phone_id}: unknown person_id {p.person_id}")
        if not re.fullmatch(r"[6-9]\d{9}", p.phone_number):
            err(f"{p.phone_id}: malformed phone {p.phone_number!r}")
    for a in data.accounts:
        if a.owner_id and a.owner_id not in pids:
            err(f"{a.account_id}: unknown owner_id {a.owner_id}")
    for t in data.transactions:
        for f in ("sender_account_id", "receiver_account_id"):
            if getattr(t, f) not in aids:
                err(f"{t.transaction_id}: unknown {f}")
        if t.sender_account_id == t.receiver_account_id:
            err(f"{t.transaction_id}: sender == receiver account")
        if not t.amount_inr or t.amount_inr <= 0:
            err(f"{t.transaction_id}: invalid amount")
    for v in data.vehicles:
        if v.person_id and v.person_id not in pids:
            err(f"{v.vehicle_id}: unknown person_id {v.person_id}")
    for r in data.relationships:
        for f in ("source_person_id", "target_person_id"):
            if getattr(r, f) not in pids:
                err(f"{r.relationship_id}: unknown {f}")
        if r.source_person_id == r.target_person_id:
            err(f"{r.relationship_id}: self relationship")
        if r.relationship_type not in RELATIONSHIP_TYPES:
            err(f"{r.relationship_id}: invalid type {r.relationship_type}")
        if not 0 <= r.confidence <= 1:
            err(f"{r.relationship_id}: confidence out of range")
        if not r.evidence_text.strip():
            err(f"{r.relationship_id}: missing evidence")
        elif collapse_ws(r.evidence_text).lower() not in index.full_lower:
            err(f"{r.relationship_id}: evidence text is not present in the FIR")
        if r.confidence < 0.6 and not (r.description or "").startswith("UNCERTAIN"):
            err(f"{r.relationship_id}: low-confidence relationship not marked UNCERTAIN")
    for p in data.persons:
        for role in (p.role or "unknown").split("|"):
            if role not in ROLES:
                err(f"{p.person_id}: invalid role {role}")
        if not index.has_name(p.name):
            err(f"{p.person_id}: name {p.name!r} not found in FIR")
    if not data.persons:
        warn("no persons extracted")
    if data.persons and not data.relationships:
        warn("persons found but no relationships extracted (expected in --no-gemini mode)")
    return rep


# --------------------------------------------------------------------------- #
# Pipeline
# --------------------------------------------------------------------------- #
@dataclass
class PipelineResult:
    data: ResolvedData
    report: dict
    validation: ValidationReport
    csv_paths: dict[str, Path] = field(default_factory=dict)


def run_pipeline(input_path: str | Path, output_dir: str | Path, *, use_gemini: bool = True,
                 backend: Optional[LLMBackend] = None, spacy_model: str = "en_core_web_sm",
                 max_chunk_chars: int = 3000, min_confidence: float = 0.0, na_rep: str = "NULL",
                 llm_entity_resolution: bool = True, strict: bool = False) -> PipelineResult:
    warnings: list[str] = []
    stats: Counter = Counter()
    flags: list[dict] = []

    # 1. text extraction (pdf_extractor) -------------------------------------
    doc = load_document(input_path)
    warnings += doc.warnings
    source_id = doc.doc_id

    # 2. spaCy NER + 3. regex extraction ------------------------------------
    SpacyProcessor(spacy_model).process_document(doc)
    for s in doc.sentences:
        s.hits = extract_hits(s.text)
    index = EvidenceIndex(doc)
    chunks = build_chunks(doc, max_chars=max_chunk_chars)

    # 4. Gemini: relationship extraction + difficult entity resolution ------
    gem: Optional[GeminiExtractor] = None
    model_name = None
    if use_gemini:
        try:
            backend = backend or GeminiBackend()
            gem = GeminiExtractor(backend)
            model_name = getattr(backend, "model", type(backend).__name__)
        except FatalGeminiError as exc:
            warnings.append(f"Gemini disabled ({exc}); running in regex+spaCy-only mode "
                            f"(persons will have role 'unknown'; no relationships/transactions/calls)")
    extracted: list[tuple] = []
    methods: dict[str, str] = {}
    for chunk in chunks:
        ext: Optional[ChunkExtraction] = None
        if gem:
            try:
                ext = gem.extract_chunk(chunk)
                methods[chunk.chunk_id] = "gemini"
            except FatalGeminiError as exc:
                warnings.append(f"Gemini disabled after fatal error: {exc}")
                gem = None
            except ExtractionError as exc:
                warnings.append(f"{chunk.chunk_id}: Gemini failed ({exc}); no semantic extraction for this chunk")
        if ext is None:
            # degraded mode: only what spaCy can say without any semantic judgement -
            # names, with role "unknown" (never fabricate a role/alias/relationship)
            ext = ChunkExtraction(persons=[PersonOut(name=e.normalized, confidence=0.5)
                                           for s in chunk.sentences for e in person_candidates(s)])
            methods[chunk.chunk_id] = "regex_spacy_only"
        extracted.append((chunk, ext))
    if gem and gem.dropped_items:
        warnings.append(f"{len(gem.dropped_items)} malformed Gemini items dropped by schema validation")

    # 5. anti-hallucination verification (every claim checked against the FIR) --
    verified = [(c, verify_extraction(c, e, index, stats)) for c, e in extracted]

    # 6. entity resolution (conservative alias/name merging) --------------------
    for chunk, ext in verified:                       # persons only referenced elsewhere become records too
        known = {name_key(p.name) for p in ext.persons} | {name_key(a.alias) for p in ext.persons for a in p.aliases}
        for nm in sorted(referenced_names(ext)):
            if name_key(nm) not in known and index.has_name(nm):
                ext.persons.append(PersonOut(name=nm, confidence=0.6, chunk_id=chunk.chunk_id))
                known.add(name_key(nm))
    resolver = EntityResolver(index, source_id, judge=(gem.judge_pairs if gem and llm_entity_resolution else None))
    for chunk, ext in verified:
        for p in ext.persons:
            resolver.add(PersonRecord(name=p.name, chunk_id=chunk.chunk_id, page=chunk.page_number, aliases=p.aliases,
                                      age=p.age, gender=p.gender, address=p.address, occupation=p.occupation,
                                      roles=p.roles, confidence=p.confidence,
                                      scope=chunk.chunk_id if methods.get(chunk.chunk_id) == "gemini" else None))
    res = resolver.resolve()
    flags += res.flags

    # 7. link phones/accounts/transactions/vehicles/calls to resolved persons ---
    rb = RecordBuilder(index, res.lookup, source_id, stats, flags)
    for chunk, ext in verified:
        rb.add_phones(chunk, ext)
        rb.add_accounts_and_transactions(chunk, ext)
        rb.add_vehicles(chunk, ext)
        rb.add_calls(chunk, ext)
    sents = doc.sentences
    accounts, transactions = rb.finish_accounts(sents)
    rel_items = [r for _, ext in verified for r in ext.relationships] + rb.derived
    relationships = build_relationships(rel_items, res.lookup, source_id, min_confidence, stats, flags)
    data = ResolvedData(persons=res.persons, aliases=res.aliases, phones=rb.finish_phones(sents), accounts=accounts,
                        transactions=transactions, relationships=relationships, vehicles=rb.finish_vehicles(sents),
                        calls=rb.finish_calls())

    # 8. validation + CSV generation ---------------------------------------------
    validation = validate(data, index)
    if strict and not validation.ok:
        raise ValueError("validation failed:\n" + "\n".join(validation.errors))
    paths = write_csvs(data, output_dir, na_rep=na_rep)

    other_ids = [{"kind": h.kind, "value": h.value, "page": s.page_number, "text": h.raw}
                 for s in sents for h in s.hits if h.kind in _OTHER_IDS]
    report = {
        "document": {"doc_id": doc.doc_id, "source_file": doc.source_file, "pages": len(doc.pages),
                     "sentences": len(sents), "chunks": len(chunks)},
        "extraction": {"gemini_model": model_name if use_gemini else None, "method_per_chunk": methods},
        "row_counts": {f: len(getattr(data, a)) for f, (a, _) in TABLES.items()},
        "other_identifiers_found": other_ids,
        "dropped_or_adjusted_by_verification": dict(stats),
        "entity_resolution_flags": flags,
        "warnings": warnings + validation.warnings,
        "validation_errors": validation.errors,
    }
    Path(output_dir).mkdir(parents=True, exist_ok=True)
    (Path(output_dir) / "extraction_report.json").write_text(json.dumps(report, indent=2, ensure_ascii=False),
                                                              encoding="utf-8")
    return PipelineResult(data, report, validation, paths)


# --------------------------------------------------------------------------- #
# CLI
# --------------------------------------------------------------------------- #
def main(argv: list[str] | None = None) -> int:
    ap = argparse.ArgumentParser(description="FIR (PDF/TXT) -> structured CSV files (spaCy + regex + Gemini)")
    ap.add_argument("input", help="FIR .pdf or .txt")
    ap.add_argument("-o", "--output-dir", default="output")
    ap.add_argument("--no-gemini", action="store_true", help="regex + spaCy only, no API calls")
    ap.add_argument("--model", default=None, help=f"Gemini model (default: $GEMINI_MODEL or {DEFAULT_MODEL})")
    ap.add_argument("--spacy-model", default="en_core_web_sm")
    ap.add_argument("--max-chunk-chars", type=int, default=3000)
    ap.add_argument("--min-confidence", type=float, default=0.0, help="drop relationships below this confidence")
    ap.add_argument("--na-rep", default="NULL", help="text written for missing values (default NULL)")
    ap.add_argument("--no-llm-resolution", action="store_true", help="skip the optional Gemini alias-judging call")
    ap.add_argument("--strict", action="store_true", help="exit with error if final validation fails")
    ap.add_argument("-v", "--verbose", action="store_true")
    a = ap.parse_args(argv)
    logging.basicConfig(level=logging.DEBUG if a.verbose else logging.INFO, format="%(levelname)s %(name)s: %(message)s")
    try:
        from dotenv import load_dotenv
        load_dotenv()
    except ImportError:
        pass
    if a.model:
        import os
        os.environ["GEMINI_MODEL"] = a.model

    res = run_pipeline(a.input, a.output_dir, use_gemini=not a.no_gemini, spacy_model=a.spacy_model,
                       max_chunk_chars=a.max_chunk_chars, min_confidence=a.min_confidence, na_rep=a.na_rep,
                       llm_entity_resolution=not a.no_llm_resolution, strict=a.strict)
    print(f"\nWrote {len(res.csv_paths)} CSV files + extraction_report.json to {Path(a.output_dir).resolve()}")
    for f, n in res.report["row_counts"].items():
        print(f"  {f:<20} {n:>4} rows")
    for w in res.report["warnings"]:
        print("  warning:", w)
    for e in res.validation.errors:
        print("  VALIDATION ERROR:", e)
    return 0 if res.validation.ok else 2


if __name__ == "__main__":
    sys.exit(main())
