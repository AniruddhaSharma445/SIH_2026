import json
import os
import shutil
import tempfile
import uuid
from pathlib import Path

from dotenv import load_dotenv
from fastapi import Depends, FastAPI, File, HTTPException, UploadFile, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# --- Pipeline imports (your actual FIR extraction module, sih_6_2 removed) ---
from main import run_pipeline
from pdf_extractor import name_key
from schemas import ResolvedData

# --- Other modules (unchanged, only used by the graph/chat endpoints) ---
import db
from resolution import run_resolution
from graph_analysis import GraphAnalyzer
from evidence_engine import build_alerts_from_detection_results
from lyzr_chat import call_lyzr_agent

app = FastAPI(title="UNRAVEL Criminal Network Router")
app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r"http://(localhost|127\.0\.0\.1|192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+|172\.(1[6-9]|2\d|3[01])\.\d+\.\d+)(:\d+)?",
    allow_methods=["*"],
    allow_headers=["*"],
)

load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL")

JOBS_DIR = Path(tempfile.gettempdir()) / "fir_jobs"
JOBS_DIR.mkdir(exist_ok=True)


# --- Database Connection Dependency ---
def get_db():
    conn = db.get_connection()
    try:
        yield conn
    finally:
        conn.close()


# --- Database Startup Initialization ---
@app.on_event("startup")
def init_db():
    if not DATABASE_URL:
        print("WARNING: DATABASE_URL is not set in .env")
        return
    try:
        conn = db.get_connection()
        conn.close()  # Just verify we can connect
        print("Successfully connected to Neon database.")
    except Exception as e:
        print(f"Error connecting to Neon database: {e}")


def write_logbook(db_conn, filename: str, status_msg: str, error_msg: str = None):
    with db_conn.cursor() as cursor:
        db.log_ingestion(cursor, filename, status_msg, error_msg)
    db_conn.commit()


# --- Pydantic Schema for Chat ---
class ChatRequest(BaseModel):
    message: str
    user_id: str = "aniruddhasharma141104@gmail.com"
    session_id: str = "6aabf939be73873d04ecd627-950i7xmw"


# --- API Routes ---
@app.get("/")
def health():
    return {"status": "ok"}


@app.post("/api/chat")
async def chat_endpoint(request: ChatRequest):
    try:
        response_data = await call_lyzr_agent(
            message=request.message,
            user_id=request.user_id,
            session_id=request.session_id
        )
        return response_data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# --------------------------------------------------------------------------- #
# FIR upload -> main.run_pipeline() -> ResolvedData -> Postgres (via db.py)
# --------------------------------------------------------------------------- #
def _save_resolved_data(cur, document_id: str, file_name: str, data: ResolvedData) -> dict:
    """Writes one pipeline result into Postgres using db.py's real functions.

    The pipeline's own ids (P001, ACC001, PH001...) only exist inside the CSVs;
    they are never written to the DB directly. Instead, for every row we call
    the matching get_or_create_* function and remember pipeline_id -> db_id,
    so later rows (e.g. a relationship referencing P001/P002) can be translated
    to the real database ids.
    """
    db.insert_document(cur, document_id, doc_type="FIR", file_name=file_name)
    db.set_document_status(cur, document_id, "processing")

    person_id_map: dict[str, int] = {}     # pipeline "P001" -> db person_id
    account_id_map: dict[str, int] = {}    # pipeline "ACC001" -> db account_id
    phone_number_to_db_id: dict[str, int] = {}  # phone_number -> db phone_id

    # 1. persons
    for p in data.persons:
        db_id = db.get_or_create_person(cur, canonical_name=p.name, normalized_name=name_key(p.name))
        person_id_map[p.person_id] = db_id
        db.log_extraction(cur, document_id, "PERSON", raw_text=p.name, normalized_text=name_key(p.name),
                          matched_person_id=db_id, confidence=1.0, method="pipeline")

    # 2. aliases
    for a in data.aliases:
        db_person_id = person_id_map.get(a.person_id)
        if db_person_id is None:
            continue
        db.add_alias(cur, db_person_id, alias_text=a.alias, normalized_alias=name_key(a.alias),
                     confidence=0.8, source_document_id=document_id)

    # 3. phones (person_id is nullable — unlinked numbers are still kept)
    for ph in data.phones:
        db_person_id = person_id_map.get(ph.person_id) if ph.person_id else None
        db_id = db.get_or_create_phone(cur, phone_id=ph.phone_id, phone_number=ph.phone_number,
                                       person_id=db_person_id, source_id=document_id)
        phone_number_to_db_id[ph.phone_number] = db_id

    # 4. vehicles
    for v in data.vehicles:
        db_person_id = person_id_map.get(v.person_id) if v.person_id else None
        db.get_or_create_vehicle(cur, vehicle_id=v.vehicle_id, registration_number=v.registration_number,
                                 owner_id=db_person_id)

    # 5. accounts
    for acc in data.accounts:
        db_owner_id = person_id_map.get(acc.owner_id) if acc.owner_id else None
        db_id = db.get_or_create_account(cur, account_id=acc.account_id, account_number=acc.account_number,
                                         owner_id=db_owner_id)
        account_id_map[acc.account_id] = db_id

    # 6. transactions (need both accounts already mapped, above)
    for t in data.transactions:
        db.insert_transaction(cur, transaction_id=t.transaction_id, timestamp=t.timestamp,
                              sender_account_id=account_id_map.get(t.sender_account_id),
                              receiver_account_id=account_id_map.get(t.receiver_account_id),
                              amount_inr=t.amount_inr, reference=t.reference, source_id=document_id)

    # 7. relationships (graph edges — every mention kept, no dedup)
    for r in data.relationships:
        src, tgt = person_id_map.get(r.source_person_id), person_id_map.get(r.target_person_id)
        if src is None or tgt is None:
            continue
        db.insert_relationship(cur, source_person_id=src, target_person_id=tgt, rel_type=r.relationship_type,
                               confidence=r.confidence, source_document_id=document_id,
                               context=r.evidence_text)

    # 8. call records (db.py stores phone ids + duration in minutes, not seconds)
    for c in data.calls:
        caller_id = phone_number_to_db_id.get(c.caller_phone) if c.caller_phone else None
        receiver_id = phone_number_to_db_id.get(c.receiver_phone) if c.receiver_phone else None
        duration_minutes = c.duration_seconds / 60 if c.duration_seconds is not None else None
        db.insert_call_record(cur, cdr_id=c.call_id, timestamp=c.timestamp, caller_phone_id=caller_id,
                              receiver_phone_id=receiver_id, duration_minutes=duration_minutes,
                              location=None, source_id=document_id)

    db.set_document_status(cur, document_id, "done")
    return {"persons": len(person_id_map), "accounts": len(account_id_map)}


@app.post("/api/upload", status_code=status.HTTP_200_OK)
async def route_raw_files(
    file: UploadFile = File(...),
    use_gemini: bool = True,
    db_conn=Depends(get_db),
):
    """Upload ONE FIR file (.pdf or .txt) and run it through the real pipeline:
    pdf_extractor -> spacy_extractor -> regex_extractor -> gemini_extractor ->
    entity_resolver -> csv_writer (all orchestrated by main.run_pipeline).
    """
    filename = file.filename
    ext = os.path.splitext(filename)[1].lower()
    if ext not in (".pdf", ".txt"):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Unsupported file type {ext!r}; upload a .pdf or .txt FIR",
        )

    job_id = uuid.uuid4().hex[:12]
    job_dir = JOBS_DIR / job_id
    in_dir, out_dir = job_dir / "input", job_dir / "output"
    in_dir.mkdir(parents=True)

    input_path = in_dir / filename
    with open(input_path, "wb") as f:
        f.write(await file.read())

    document_id = Path(filename).stem  # e.g. "FIR_001" — used as the document_id in the DB

    try:
        result = run_pipeline(input_path, out_dir, use_gemini=use_gemini)

        with db_conn.cursor() as cur:
            db_summary = _save_resolved_data(cur, document_id, filename, result.data)
        db_conn.commit()

        write_logbook(db_conn, filename, "PROCESSED_SUCCESSFULLY")

        return {
            "status": "SUCCESS",
            "message": f"Extracted {filename} and saved to database (document_id={document_id})",
            "document_id": document_id,
            "db_summary": db_summary,
            "output_dir": str(out_dir),
            "csv_files": {name: str(p) for name, p in result.csv_paths.items()},
            "row_counts": result.report["row_counts"],
            "validation_ok": result.validation.ok,
            "validation_errors": result.validation.errors,
            "warnings": result.report["warnings"],
        }

    except Exception as err:
        db_conn.rollback()
        write_logbook(db_conn, filename, "FAILED", str(err))
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Pipeline execution error: {str(err)}",
        )
    finally:
        shutil.rmtree(in_dir, ignore_errors=True)


@app.post("/api/analyze-graph", status_code=status.HTTP_200_OK)
async def run_graph_analysis():
    """
    Fetches raw relationships from PostgreSQL, applies entity resolution
    for name deduplication, builds NetworkX graph, executes detections,
    and returns structured alerts with evidence snippets.
    """
    if not DATABASE_URL:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="DATABASE_URL is not configured in environment."
        )

    try:
        # 1. Fetch raw relationship rows from DB
        analyzer = GraphAnalyzer(db_config=DATABASE_URL)
        raw_df = analyzer._fetch_relationships_from_db()

        # 2. Map DB column headers to match Entity Resolution input expectations
        mapped_df = raw_df.rename(columns={
            "source_entity_id": "Name A",
            "target_entity_id": "Name B",
            "type": "Relation",
            "source_document_id": "Source ID",
            "context": "Context",
            "confidence": "Confidence"
        })

        # 3. Run Entity Resolution to canonicalize entity IDs & display names
        resolved_df, name_lookup = run_resolution(mapped_df)

        # 4. Map back to NetworkX schema before graph construction
        graph_df = resolved_df.rename(columns={
            "Name A": "source_entity_id",
            "Name B": "target_entity_id",
            "Relation": "type",
            "Source ID": "source_document_id",
            "Context": "context",
            "Confidence": "confidence"
        })

        # 5. Load resolved data into NetworkX & perform detections
        analyzer.load_from_dataframe(graph_df)
        detection_results = analyzer.run_all_detections()

        # 6. Generate structured alert cards using evidence engine
        alerts = build_alerts_from_detection_results(
            detection_results,
            entity_name_lookup=name_lookup
        )

        return {
            "status": "SUCCESS",
            "nodes_count": analyzer.G.number_of_nodes(),
            "edges_count": analyzer.G.number_of_edges(),
            "alerts_count": len(alerts),
            "alerts": alerts,
            "raw_analysis": detection_results
        }

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Graph analysis failed: {str(e)}",
        )


def only_simple_values(attributes: dict) -> dict:
    """Keep only values that can safely be sent as JSON."""
    return {
        key: value
        for key, value in attributes.items()
        if isinstance(value, (str, int, float, bool)) or value is None
    }


@app.get("/api/graph", status_code=status.HTTP_200_OK)
def get_graph():
    """Returns the resolved network as nodes and edges for the frontend graph."""
    if not DATABASE_URL:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="DATABASE_URL is not configured in environment."
        )

    try:
        analyzer = GraphAnalyzer(db_config=DATABASE_URL)
        raw_df = analyzer._fetch_relationships_from_db()

        mapped_df = raw_df.rename(columns={
            "source_entity_id": "Name A",
            "target_entity_id": "Name B",
            "type": "Relation",
            "source_document_id": "Source ID",
            "context": "Context",
            "confidence": "Confidence"
        })

        resolved_df, name_lookup = run_resolution(mapped_df)

        graph_df = resolved_df.rename(columns={
            "Name A": "source_entity_id",
            "Name B": "target_entity_id",
            "Relation": "type",
            "Source ID": "source_document_id",
            "Context": "context",
            "Confidence": "confidence"
        })

        analyzer.load_from_dataframe(graph_df)
        graph = analyzer.G

        nodes = []
        for node_id, attributes in graph.nodes(data=True):
            node = only_simple_values(attributes)
            node["id"] = str(node_id)
            if isinstance(name_lookup, dict):
                node["label"] = str(name_lookup.get(node_id, node_id))
            else:
                node["label"] = str(node_id)
            nodes.append(node)

        edges = []
        for source, target, attributes in graph.edges(data=True):
            edge = only_simple_values(attributes)
            edge["source"] = str(source)
            edge["target"] = str(target)
            edges.append(edge)

        return {"nodes": nodes, "edges": edges}

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Graph fetch failed: {str(e)}",
        )