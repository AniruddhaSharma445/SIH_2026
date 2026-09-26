import db
from dotenv import load_dotenv

load_dotenv()

conn = db.get_connection()
cur = conn.cursor()

try:
    print("✓ Connected to database")
    from sih_6_2 import run_pipeline

    result = run_pipeline(cur, data_dir=".")
    conn.commit()

    print("✓ Pipeline finished. Summary:")
    for key, value in result.items():
        print(f"   {key}: {value}")

except Exception as e:
    conn.rollback()
    print(f"❌ Pipeline failed and transaction rolled back: {e}")
finally:
    cur.close()
    conn.close()