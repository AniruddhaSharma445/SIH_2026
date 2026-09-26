# FIR NLP Extraction Module

Takes **one FIR (PDF or TXT)** and produces 8 structured CSV files for criminal
network analysis. This module only does extraction — no database, no graph
visualization, no frontend, no API server, no auth.

## Pipeline

```
FIR (.pdf / .txt)
   │
   ▼
pdf_extractor.py     text extraction (PyMuPDF for PDF) + cleaning + sentence/paragraph segmentation
   │
   ▼
spacy_extractor.py   spaCy NER + EntityRuler → candidate PERSON / ORG / GPE / vehicle mentions
   │
   ▼
regex_extractor.py   deterministic extraction: phones, accounts, IFSC, vehicle regs, dates,
                     times, money, emails, FIR/case numbers — with format-based validation
                     (e.g. vehicle state codes checked against real RTO codes)
   │
   ▼
gemini_extractor.py  chunks the FIR, prompts Gemini for persons/roles/aliases/relationships/
                     transactions/vehicles/calls, validates the JSON with Pydantic, then
                     verifies every single claim against the FIR's own text (the
                     anti-hallucination gate) before it can reach a CSV row
   │
   ▼
entity_resolver.py   conservative alias/entity merging (never guesses identity), then links
                     phones/accounts/transactions/vehicles/calls to resolved persons via
                     stable person_id — never a name — as the foreign key
   │
   ▼
main.py              final referential-integrity validation, then...
   │
   ▼
csv_writer.py        writes the 8 CSV files (pandas)
```

## Files

| File | Purpose |
|---|---|
| `main.py` | CLI entry point + pipeline orchestration + final validation |
| `pdf_extractor.py` | PDF/TXT loading, text cleaning, paragraph/sentence segmentation, name normalisation |
| `spacy_extractor.py` | spaCy NER + custom EntityRuler patterns for Indian FIR terms |
| `regex_extractor.py` | Deterministic regex extraction & normalisation (phones, money, dates, vehicle regs, IDs, ...) |
| `gemini_extractor.py` | Gemini prompt/chunking/parsing, plus the evidence index & anti-hallucination verifier |
| `entity_resolver.py` | Alias/entity resolution + linking records (phones/accounts/vehicles/calls) to person IDs |
| `schemas.py` | All Pydantic models: Gemini output contracts, CSV row schemas, controlled vocabularies |
| `csv_writer.py` | Writes the final CSVs with pandas |
| `requirements.txt` | Python dependencies |
| `.env.example` | Template for your `.env` file (GEMINI_API_KEY) |

## Setup

```bash
pip install -r requirements.txt
python -m spacy download en_core_web_sm
cp .env.example .env
# edit .env and paste your Gemini API key (https://aistudio.google.com/apikey)
```

`GEMINI_API_KEY` is read **only** from the environment (via `.env` through
`python-dotenv`, or an already-exported env var) — never hardcoded.

## Usage

```bash
python main.py FIR_001.pdf -o output/
python main.py FIR_001.txt -o output/ --no-gemini      # regex + spaCy only, no API calls
```

Options:

| Flag | Meaning |
|---|---|
| `-o, --output-dir` | Where to write the CSVs (default `output/`) |
| `--no-gemini` | Skip Gemini entirely (see "Running without Gemini" below) |
| `--model` | Override the Gemini model (default `gemini-2.5-flash`) |
| `--max-chunk-chars` | Max characters per chunk sent to Gemini (default 3000) |
| `--min-confidence` | Drop relationships below this confidence (default 0.0 = keep all, low-confidence ones are marked `UNCERTAIN`) |
| `--strict` | Exit with an error code if final validation finds any issue |
| `-v, --verbose` | Debug logging |

Each run also writes `extraction_report.json` next to the CSVs, with document
stats, which chunks used Gemini vs. fell back, items dropped by verification
(and why), entity-resolution ambiguity flags, and any validation errors.

## Output CSVs

| File | Key columns |
|---|---|
| `persons.csv` | `person_id` (P001...), name, gender, age, address, occupation, role |
| `person_aliases.csv` | `alias_id`, `person_id`, alias, alias_type |
| `phones.csv` | `phone_id` (PH001...), `person_id` (nullable), phone_number |
| `accounts.csv` | `account_id` (ACC001...), account_number, `owner_id` (nullable) |
| `transactions.csv` | `transaction_id` (TX001...), `sender_account_id`, `receiver_account_id`, amount_inr, timestamp |
| `relationships.csv` | `relationship_id` (R001...), `source_person_id`, `target_person_id`, relationship_type, evidence_text, confidence |
| `vehicles.csv` | `vehicle_id` (V001...), `person_id` (nullable), registration_number |
| `call_records.csv` | `call_id` (CL001...), caller_phone, receiver_phone, timestamp, duration_seconds |

IDs are stable and sequential; **names are never used as foreign keys** — every
cross-table reference is by ID, and `main.py`'s final validation step checks
every foreign key resolves before the CSVs are written.

## Anti-hallucination guarantees

- Every person, phone, account, transaction, relationship, vehicle and call
  that Gemini reports is re-checked against the FIR's own text before it can
  become a CSV row (`gemini_extractor.verify_extraction`). Unverifiable claims
  are **dropped**, not "fixed" with invented data.
- `evidence_text` on every relationship is re-anchored to the FIR's exact
  wording (never Gemini's paraphrase), with the page number it was found on.
- Roles (suspect/accused/victim/complainant/witness/informant/associate) are
  only assigned when the text explicitly supports it — otherwise `unknown`.
  Merely appearing in the same sentence as another person never creates a role
  or a relationship.
- Aliases are only merged into one person on strong evidence (identical name,
  an explicit "also known as" style claim, or an unambiguous short form).
  Ambiguous cases (e.g. two different people who could both be "Rahul") are
  kept as **separate** persons and flagged in `extraction_report.json`, never
  silently guessed.
- Missing values are always `NULL` in the CSVs (configurable via `--na-rep`),
  never a placeholder guess.
- Relationships below 0.6 confidence are marked `UNCERTAIN` in their
  description rather than presented as fact.

## Running without Gemini

`--no-gemini` (or simply not setting `GEMINI_API_KEY`) still runs the full
pipeline and still writes all 8 CSVs, but only with what regex + spaCy can
establish deterministically on their own:

- **Persons** are still found (spaCy NER), but with `role = unknown` — roles,
  aliases and relationships are semantic judgements reserved for Gemini and are
  never guessed.
- **Phones, account numbers and vehicle registrations** found by regex still
  appear in their CSVs, just unlinked to a person (`person_id = NULL`).
- **Relationships, transactions and call records** need Gemini to tie two
  people (or a person and an amount/phone number) together, so those tables
  will be empty in this mode.

This is intentional — the module never fabricates a link it can't verify.

## Notes

- `GEMINI_API_KEY` must be set in the environment for the Gemini-powered path;
  the module raises a clear (non-fatal) warning and degrades to the mode above
  if it isn't.
- Scanned PDFs with no text layer are flagged in `extraction_report.json`
  (OCR is out of scope for this module).
- The `entity_resolver`'s optional 4th resolution rule (LLM judgement for
  genuinely ambiguous name pairs) only runs when Gemini is enabled and
  `--no-llm-resolution` is not passed.
