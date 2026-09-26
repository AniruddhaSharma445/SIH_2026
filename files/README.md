# Database layer — handoff notes

## Files
- `db.py` — import this. Every database operation your extraction pipeline
  needs is a function in here. Don't write raw SQL elsewhere in the project.
- `example_usage.py` — a worked example processing one FIR sentence by hand.
  Run this first to confirm your connection works before wiring up real NLP.

## Setup
1. `pip install psycopg2-binary`
2. Set the `DATABASE_URL` environment variable to the Neon connection string
   (ask for it separately — don't commit it to git).
3. Run `python example_usage.py` — if it finishes without errors, you're
   connected and the schema is working.

## The pattern to follow in your real pipeline
For every document you process:

1. `db.insert_document(...)` — register it
2. Run your NLP extraction (regex / spaCy / RapidFuzz) on `raw_text`
3. For every entity found, decide (using RapidFuzz against existing
   `normalized_name`s) whether it's a new person or an existing one
4. Call `db.get_or_create_person(...)` with your decision
5. Call `db.log_extraction(...)` to record what was found and how confident
   you were — this is required, not optional, for the "why flagged"
   explainability feature
6. Call the relevant linking function (`get_or_create_phone`,
   `get_or_create_vehicle`, `insert_relationship`, etc.)
7. `db.set_document_status(cur, doc_id, "done")`
8. `conn.commit()` once per document (or once per batch — your call)

## Things NOT to do
- Don't write `INSERT`/`UPDATE`/`SELECT` outside of `db.py`. If you need a
  new operation, add a function to `db.py` so it stays the single source of
  truth for how data enters the database.
- Don't forget `conn.commit()` — uncommitted changes silently disappear
  when the connection closes.
- Don't hardcode the connection string anywhere. Always read it from
  `DATABASE_URL`.
