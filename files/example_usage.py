"""
example_usage.py — Worked example of how to use db.py.

This processes ONE sentence by hand, the way your real extraction
pipeline eventually will automatically. Run this after setting
DATABASE_URL, to confirm everything is wired correctly end to end.

    export DATABASE_URL="postgresql://...your neon connection string..."
    python example_usage.py
"""

import db

conn = db.get_connection()
cur = conn.cursor()

# Step 1: register the document (normally done at upload time)
db.insert_document(
    cur,
    document_id="FIR_001",
    doc_type="FIR",
    file_name="fir_records.txt",
    raw_text="On 01 August 2026, the report records that Rahul K Sharma met Amit Verma...",
    case_ref=None,
)

# Step 2: NLP found "Rahul K Sharma" and, after fuzzy-matching, decided
# it refers to the canonical person "Rahul Sharma"
rahul_id = db.get_or_create_person(cur, "Rahul Sharma", "rahulsharma")

# Since the raw text said "Rahul K Sharma" but we canonicalized to
# "Rahul Sharma", record that as an alias
db.add_alias(
    cur,
    person_id=rahul_id,
    alias_text="Rahul K Sharma",
    normalized_alias="rahulksharma",
    confidence=0.93,
    source_document_id="FIR_001",
)

# Step 3: NLP also found "Amit Verma" in the same sentence
amit_id = db.get_or_create_person(cur, "Amit Verma", "amitverma")

# Step 4: log both extractions for the audit trail
db.log_extraction(cur, "FIR_001", "PERSON", "Rahul K Sharma", "rahulksharma",
                   rahul_id, 0.93, "spacy_ner")
db.log_extraction(cur, "FIR_001", "PERSON", "Amit Verma", "amitverma",
                   amit_id, 0.98, "spacy_ner")

# Step 5: the phone number mentioned in the same document
phone_id = db.get_or_create_phone(cur, "PH-001", "9000010000", rahul_id, "FIR_001")

# Step 6: the vehicle mentioned
vehicle_id = db.get_or_create_vehicle(cur, "VH-001", "MP04AB1234", rahul_id)

# Step 7: they "met" -> create a relationship edge
db.insert_relationship(
    cur,
    source_person_id=rahul_id,
    target_person_id=amit_id,
    rel_type="ASSOCIATED_WITH",
    confidence=0.96,
    source_document_id="FIR_001",
    context="Rahul K Sharma met Amit Verma near New Market, Bhopal.",
)

# Step 8: mark the document as fully processed
db.set_document_status(cur, "FIR_001", "done")

conn.commit()
print("Done. Check your database — persons, phones, vehicles, "
      "relationships, and extraction_log should now have rows.")

cur.close()
conn.close()
