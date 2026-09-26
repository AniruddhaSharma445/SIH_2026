import os
import pandas as pd

from graph_analysis import GraphAnalyzer
from evidence_engine import build_alerts_from_detection_results
from resolution import run_resolution


class ValidationError(Exception):
    pass


def validate_fir_upload(file_path):
    if not os.path.exists(file_path):
        raise ValidationError(f"FIR file not found: {file_path}")
    if not file_path.lower().endswith(".txt"):
        raise ValidationError("FIR file must be a .txt file.")
    if os.path.getsize(file_path) == 0:
        raise ValidationError("FIR file is empty.")
    return True


def validate_csv_upload(file_path, required_columns):
    if not os.path.exists(file_path):
        raise ValidationError(f"CSV file not found: {file_path}")
    try:
        df = pd.read_csv(file_path)
    except Exception as e:
        raise ValidationError(f"Could not read CSV file: {e}")

    if df.empty:
        raise ValidationError(f"CSV file is empty: {file_path}")

    missing = set(required_columns) - set(df.columns)
    if missing:
        raise ValidationError(f"CSV is missing required columns {missing}: {file_path}")

    return df


def run_extraction(extraction_output_path):
    df = pd.read_csv(extraction_output_path)
    required = {"Name A", "Name B", "Relation", "Source ID", "Context", "Confidence"}
    missing = required - set(df.columns)
    if missing:
        raise ValidationError(f"Extraction output missing expected columns: {missing}")
    return df


def store_to_database(resolved_df, entity_name_lookup, db_config):
    """
    Store entity-resolved persons and relationships in PostgreSQL.

    db_config may be either a DATABASE_URL string or a psycopg2
    connection-kwargs dictionary.
    Exact duplicate relationship rows are skipped.
    """
    try:
        import psycopg2
    except ImportError:
        raise ImportError(
            "psycopg2 is not installed. Run: pip install psycopg2-binary"
        )

    if isinstance(db_config, str):
        conn = psycopg2.connect(db_config)
    else:
        conn = psycopg2.connect(**db_config)

    cur = conn.cursor()

    try:
        for entity_id, display_name in entity_name_lookup.items():
            cur.execute(
                """
                INSERT INTO persons (id, name)
                VALUES (%s, %s)
                ON CONFLICT (id)
                DO UPDATE SET name = EXCLUDED.name;
                """,
                (entity_id, display_name)
            )

        inserted_relationships = 0

        for _, row in resolved_df.iterrows():
            cur.execute(
                """
                INSERT INTO relationships
                    (source_entity_id, target_entity_id, relationship_type,
                     confidence, source_document_id, context)
                SELECT %s, %s, %s, %s, %s, %s
                WHERE NOT EXISTS (
                    SELECT 1
                    FROM relationships
                    WHERE source_entity_id = %s
                      AND target_entity_id = %s
                      AND relationship_type = %s
                      AND source_document_id = %s
                      AND context = %s
                );
                """,
                (
                    row["source_entity_id"],
                    row["target_entity_id"],
                    row["type"],
                    row["confidence"],
                    row["source_document_id"],
                    row["context"],
                    row["source_entity_id"],
                    row["target_entity_id"],
                    row["type"],
                    row["source_document_id"],
                    row["context"],
                )
            )
            inserted_relationships += cur.rowcount

        conn.commit()

        print(
            f"Stored/updated {len(entity_name_lookup)} entities; "
            f"inserted {inserted_relationships} new relationships."
        )

    except Exception as e:
        conn.rollback()
        raise RuntimeError(f"Database write failed, rolled back: {e}")

    finally:
        cur.close()
        conn.close()


def run_graph_and_detection(db_config=None, csv_path=None, resolved_df=None, entity_name_lookup=None):
    analyzer = GraphAnalyzer(db_config=db_config, csv_path=csv_path)
    if resolved_df is not None:
        analyzer.load_from_dataframe(resolved_df)
    else:
        analyzer.build_graph()
    detection_results = analyzer.run_all_detections()
    alerts = build_alerts_from_detection_results(detection_results, entity_name_lookup)
    return alerts, analyzer