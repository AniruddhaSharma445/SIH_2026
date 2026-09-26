import os
import psycopg2
from dotenv import load_dotenv

load_dotenv()

# Retrieve database URL from .env file
DATABASE_URL = os.getenv("DATABASE_URL")

def inspect_database():
    if not DATABASE_URL:
        print("ERROR: DATABASE_URL not found in .env file.")
        return

    try:
        # Establish connection
        conn = psycopg2.connect(DATABASE_URL)
        cursor = conn.cursor()

        # 1. Fetch all table names in the database
        cursor.execute("""
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public';
        """)
        tables = cursor.fetchall()
        print("=== TABLES IN DATABASE ===")
        for t in tables:
            print(f"- {t[0]}")
        print()

        # 2. Check rows in 'relationships' table if it exists
        cursor.execute("""
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name = 'relationships'
            );
        """)
        has_relationships = cursor.fetchone()[0]

        if has_relationships:
            cursor.execute("SELECT COUNT(*) FROM relationships;")
            count = cursor.fetchone()[0]
            print(f"Total rows in 'relationships' table: {count}")

            cursor.execute("SELECT * FROM relationships LIMIT 5;")
            rows = cursor.fetchall()
            print("\nFirst 5 rows from 'relationships':")
            for r in rows:
                print(r)
        else:
            print("Table 'relationships' does not exist yet.")

        cursor.close()
        conn.close()

    except Exception as e:
        print(f"Connection error: {e}")

if __name__ == "__main__":
    inspect_database()