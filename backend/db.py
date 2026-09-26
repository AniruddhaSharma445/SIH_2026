"""
db.py — Database access layer for the Criminal Network Analysis pipeline.

WHAT THIS FILE IS FOR
----------------------
This is the ONLY file that should contain raw SQL. Your extraction pipeline
(regex / spaCy / RapidFuzz code) should never write SQL directly — it should
import functions from here instead. This keeps all database logic in one
place, makes it testable, and means nobody accidentally creates duplicate
person records by forgetting a check.

SETUP
-----
1. pip install psycopg2-binary --break-system-packages   (or without that flag,
   depending on your OS)
2. Set an environment variable called DATABASE_URL to your Neon connection
   string. Do NOT hardcode it in this file. e.g. in a .env file:

       DATABASE_URL=postgresql://user:pass@host/db?sslmode=require

   and load it with python-dotenv, or just set it in your shell:
       export DATABASE_URL="postgresql://...neon connection string..."

USAGE PATTERN
-------------
    import db

    conn = db.get_connection()
    cur = conn.cursor()

    person_id = db.get_or_create_person(cur, "Rahul Sharma", "rahulsharma")
    db.link_phone(cur, "PH-001", "9000010000", person_id, source_document_id="FIR_001")

    conn.commit()   # <-- IMPORTANT: nothing saves until you commit
    cur.close()
    conn.close()

Every function below takes a `cur` (cursor) as its first argument. This
means your pipeline controls when to commit (e.g. once per document, or once
per whole batch) rather than this file deciding for you.
"""

import os
import psycopg2


def get_connection():
    """
    Opens a new connection to the database using the DATABASE_URL
    environment variable. Call this once per script run (or once per
    worker, if you parallelize later) — not once per row.
    """
    db_url = os.environ.get("DATABASE_URL")
    if not db_url:
        raise RuntimeError(
            "DATABASE_URL environment variable is not set. "
            "Set it to your Neon connection string before running."
        )
    return psycopg2.connect(db_url)

# ---------------------------------------------------------------------------
# AUDIT LOG — records one row per file upload attempt (success or failure).
# This is the only table that isn't part of the entity/relationship graph;
# it's operational logging for the API layer, kept here so main.py never
# has to write raw SQL either.
# ---------------------------------------------------------------------------

def log_ingestion(cur, file_name, status, error_message=None):
    """
    Records one ingestion attempt. status is a free-text label such as
    'PROCESSED_SUCCESSFULLY' or 'FAILED'. Call conn.commit() afterwards,
    same as every other write in this module.
    """
    cur.execute("""
        INSERT INTO audit_ingestion_logs (file_name, status, error_message, ingested_at)
        VALUES (%s, %s, %s, NOW());
    """, (file_name, status, error_message))


# ---------------------------------------------------------------------------
# DOCUMENTS — every uploaded file becomes one row here first, before any
# extraction happens. This is your audit trail: every other row in the
# database should be traceable back to a document_id.
# ---------------------------------------------------------------------------

def insert_document(cur, document_id, doc_type, file_name=None,
                     raw_text=None, case_ref=None):
    """
    Registers a newly uploaded file. Call this FIRST, before running any
    extraction on it. Returns the document_id you passed in (Postgres
    doesn't generate this one — it comes from the uploaded file itself,
    e.g. 'FIR_001').
    """
    cur.execute("""
        INSERT INTO documents (document_id, doc_type, file_name, raw_text, case_ref)
        VALUES (%s, %s, %s, %s, %s)
        ON CONFLICT (document_id) DO NOTHING;
    """, (document_id, doc_type, file_name, raw_text, case_ref))
    return document_id


def set_document_status(cur, document_id, status):
    """
    Updates a document's processing status.
    status should be one of: 'pending', 'processing', 'done', 'failed'.
    Call this as your pipeline works through a file, so the frontend can
    show upload progress instead of guessing.
    """
    cur.execute("""
        UPDATE documents SET status = %s WHERE document_id = %s;
    """, (status, document_id))


# ---------------------------------------------------------------------------
# PERSONS — the central entity. get_or_create_person is the single most
# important function in this file: every name your NLP layer finds should
# go through this before anything else touches it.
# ---------------------------------------------------------------------------

def get_or_create_person(cur, canonical_name, normalized_name):
    """
    Looks up a person by normalized_name (e.g. 'rahulsharma'). If they
    already exist, returns their existing person_id. If not, creates a
    new person and returns the new person_id.

    IMPORTANT: this only catches EXACT normalized-name matches. It will
    NOT catch "Rahul Sharma" vs "Rahul K Sharma" — that fuzzy judgment
    call must happen in your Python code (using RapidFuzz) BEFORE calling
    this function. By the time you call this, you should already have
    decided which canonical person this text refers to.
    """
    cur.execute("""
        INSERT INTO persons (canonical_name, normalized_name)
        VALUES (%s, %s)
        ON CONFLICT (normalized_name) DO NOTHING
        RETURNING person_id;
    """, (canonical_name, normalized_name))
    result = cur.fetchone()
    if result:
        return result[0]
    cur.execute(
        "SELECT person_id FROM persons WHERE normalized_name = %s;",
        (normalized_name,)
    )
    return cur.fetchone()[0]


def add_alias(cur, person_id, alias_text, normalized_alias,
              confidence, source_document_id):
    """
    Records an alternate name for a person (e.g. 'R. Sharma' as an alias
    of the canonical 'Rahul Sharma'). Use this when RapidFuzz decides two
    names refer to the same person but the text differs — this preserves
    the evidence of *why* they were linked, which you need for the
    'WHY FLAGGED' explainability feature.
    """
    cur.execute("""
        INSERT INTO person_aliases
            (person_id, alias_text, normalized_alias, confidence, source_document_id)
        VALUES (%s, %s, %s, %s, %s);
    """, (person_id, alias_text, normalized_alias, confidence, source_document_id))


def mark_needs_review(cur, person_id, needs_review=True):
    """
    Flags a person record as needing human review — e.g. when the fuzzy
    match confidence was too low to auto-link, but too high to ignore.
    Matches the 'needs review' state shown in your team's prototype UI.
    """
    cur.execute("""
        UPDATE persons SET needs_review = %s WHERE person_id = %s;
    """, (needs_review, person_id))


# ---------------------------------------------------------------------------
# PHONES / VEHICLES / ACCOUNTS — same get-or-create pattern as persons,
# because the same phone number or account can legitimately appear in
# multiple documents and should not become multiple rows.
# ---------------------------------------------------------------------------

def get_or_create_phone(cur, phone_id, phone_number, person_id=None, source_id=None):
    """
    person_id can be None if the phone number was found but not yet
    linked to an identified person (common in raw CDR data — you often
    see numbers before you know who owns them).
    """
    cur.execute("""
        INSERT INTO phones (phone_id, phone_number, person_id, source_id)
        VALUES (%s, %s, %s, %s)
        ON CONFLICT (phone_number) DO NOTHING
        RETURNING phone_id;
    """, (phone_id, phone_number, person_id, source_id))
    result = cur.fetchone()
    if result:
        return result[0]
    cur.execute(
        "SELECT phone_id FROM phones WHERE phone_number = %s;", (phone_number,)
    )
    existing_id = cur.fetchone()[0]
    # if we now know the owner and the existing row doesn't, fill it in
    if person_id is not None:
        cur.execute("""
            UPDATE phones SET person_id = %s
            WHERE phone_id = %s AND person_id IS NULL;
        """, (person_id, existing_id))
    return existing_id


def get_or_create_vehicle(cur, vehicle_id, registration_number, owner_id=None):
    cur.execute("""
        INSERT INTO vehicles (vehicle_id, registration_number, owner_id)
        VALUES (%s, %s, %s)
        ON CONFLICT (registration_number) DO NOTHING
        RETURNING vehicle_id;
    """, (vehicle_id, registration_number, owner_id))
    result = cur.fetchone()
    if result:
        return result[0]
    cur.execute(
        "SELECT vehicle_id FROM vehicles WHERE registration_number = %s;",
        (registration_number,)
    )
    return cur.fetchone()[0]


def get_or_create_account(cur, account_id, account_number, owner_id=None):
    cur.execute("""
        INSERT INTO accounts (account_id, account_number, owner_id)
        VALUES (%s, %s, %s)
        ON CONFLICT (account_number) DO NOTHING
        RETURNING account_id;
    """, (account_id, account_number, owner_id))
    result = cur.fetchone()
    if result:
        return result[0]
    cur.execute(
        "SELECT account_id FROM accounts WHERE account_number = %s;",
        (account_number,)
    )
    return cur.fetchone()[0]


# ---------------------------------------------------------------------------
# EXTRACTION LOG — the audit trail. Every time the NLP layer pulls
# something out of raw text (a name, a phone, a vehicle...), log it here
# BEFORE or alongside creating/linking the canonical record. This table
# is what lets you show a judge "here's exactly what text produced this
# entity, with what confidence."
# ---------------------------------------------------------------------------

def log_extraction(cur, document_id, entity_type, raw_text, normalized_text,
                    matched_person_id, confidence, method):
    """
    entity_type: 'PERSON', 'PHONE', 'VEHICLE', 'ACCOUNT', 'LOCATION', etc.
    method: 'regex', 'spacy_ner', or 'rapidfuzz' — however this was found.
    matched_person_id can be None if this extraction isn't person-related
    (e.g. a location or case reference).
    """
    cur.execute("""
        INSERT INTO extraction_log
            (document_id, entity_type, raw_text, normalized_text,
             matched_person_id, confidence, method)
        VALUES (%s, %s, %s, %s, %s, %s, %s);
    """, (document_id, entity_type, raw_text, normalized_text,
          matched_person_id, confidence, method))


# ---------------------------------------------------------------------------
# RELATIONSHIPS — the graph edges. This is what NetworkX will read to
# build the graph. No get-or-create here on purpose: the same two people
# can legitimately have multiple separate relationship records from
# different documents (each one is its own piece of evidence), so we
# don't deduplicate these — we want every mention preserved.
# ---------------------------------------------------------------------------

def insert_relationship(cur, source_person_id, target_person_id, rel_type,
                         confidence, source_document_id, context):
    cur.execute("""
        INSERT INTO relationships
            (source_person_id, target_person_id, rel_type,
             confidence, source_document_id, context)
        VALUES (%s, %s, %s, %s, %s, %s)
        RETURNING relationship_id;
    """, (source_person_id, target_person_id, rel_type,
          confidence, source_document_id, context))
    return cur.fetchone()[0]


# ---------------------------------------------------------------------------
# CALL RECORDS / TRANSACTIONS — structured events, once phone/account
# rows already exist. These feed the comm-spike and circular-flow
# detection rules downstream.
# ---------------------------------------------------------------------------

def insert_call_record(cur, cdr_id, timestamp, caller_phone_id,
                        receiver_phone_id, duration_minutes, location,
                        source_id):
    cur.execute("""
        INSERT INTO call_records
            (cdr_id, "timestamp", caller_phone_id, receiver_phone_id,
             duration_minutes, location, source_id)
        VALUES (%s, %s, %s, %s, %s, %s, %s)
        ON CONFLICT (cdr_id) DO NOTHING;
    """, (cdr_id, timestamp, caller_phone_id, receiver_phone_id,
          duration_minutes, location, source_id))


def insert_transaction(cur, transaction_id, timestamp, sender_account_id,
                        receiver_account_id, amount_inr, reference,
                        source_id):
    cur.execute("""
        INSERT INTO transactions
            (transaction_id, "timestamp", sender_account_id,
             receiver_account_id, amount_inr, reference, source_id)
        VALUES (%s, %s, %s, %s, %s, %s, %s)
        ON CONFLICT (transaction_id) DO NOTHING;
    """, (transaction_id, timestamp, sender_account_id, receiver_account_id,
          amount_inr, reference, source_id))