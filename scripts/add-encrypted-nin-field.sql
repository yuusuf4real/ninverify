-- Add encrypted NIN field to verification_sessions table
-- This field will temporarily store the encrypted actual NIN for verification

ALTER TABLE verification_sessions 
ADD COLUMN encrypted_nin TEXT;

-- Add comment for documentation
COMMENT ON COLUMN verification_sessions.encrypted_nin IS 'Temporarily encrypted actual NIN for verification - cleared after use';

-- Update session status enum to include verification_in_progress
ALTER TYPE session_status ADD VALUE 'verification_in_progress';

-- Create index for better performance on encrypted_nin lookups (if needed)
-- CREATE INDEX CONCURRENTLY idx_verification_sessions_encrypted_nin ON verification_sessions(encrypted_nin) WHERE encrypted_nin IS NOT NULL;