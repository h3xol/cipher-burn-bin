-- SecurePaste PostgreSQL Schema
-- Run this to set up your PostgreSQL database

CREATE DATABASE securepaste;
\c securepaste;

-- Create pastes table
CREATE TABLE IF NOT EXISTS pastes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content TEXT NOT NULL,
    language TEXT NOT NULL DEFAULT 'text',
    expiration TEXT NOT NULL DEFAULT '1h',
    burn_after_reading BOOLEAN NOT NULL DEFAULT false,
    viewed BOOLEAN NOT NULL DEFAULT false,
    view_count INTEGER NOT NULL DEFAULT 0,
    password_hash TEXT,
    is_file BOOLEAN DEFAULT false,
    file_name TEXT,
    file_type TEXT,
    file_size BIGINT,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create function to update updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_pastes_updated_at
    BEFORE UPDATE ON pastes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_pastes_expires_at ON pastes(expires_at);
CREATE INDEX idx_pastes_burn_viewed ON pastes(burn_after_reading, viewed);
CREATE INDEX idx_pastes_created_at ON pastes(created_at);

-- Create cleanup function (optional - can be called by cron job)
CREATE OR REPLACE FUNCTION cleanup_expired_pastes()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM pastes 
    WHERE (expires_at IS NOT NULL AND expires_at < NOW())
       OR (burn_after_reading = true AND viewed = true);
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;