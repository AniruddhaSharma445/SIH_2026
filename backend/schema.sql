-- Create database (run this command separately if database doesn't exist yet)
-- CREATE DATABASE ncrb_db;

-- Table to store execution receipts and audit logs for Module 3
CREATE TABLE IF NOT EXISTS audit_ingestion_logs (
    log_id SERIAL PRIMARY KEY,
    file_name VARCHAR(255) NOT NULL,
    status VARCHAR(50) NOT NULL,
    error_message TEXT,
    ingested_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);