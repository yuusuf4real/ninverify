-- Migration script to add session-based verification tables
-- Run this script to add the new tables alongside existing ones

-- Create enums for the new system
CREATE TYPE otp_status AS ENUM ('pending', 'verified', 'expired', 'failed');
CREATE TYPE data_layer AS ENUM ('demographic', 'biometric', 'full');
CREATE TYPE session_status AS ENUM (
  'otp_pending',
  'otp_verified', 
  'nin_entered',
  'payment_pending',
  'payment_completed',
  'verification_completed',
  'expired',
  'failed'
);
CREATE TYPE payment_status AS ENUM ('pending', 'completed', 'failed', 'cancelled');

-- OTP Verification Sessions
CREATE TABLE otp_sessions (
  id TEXT PRIMARY KEY,
  phone_number TEXT NOT NULL,
  otp_code TEXT NOT NULL, -- hashed
  status otp_status DEFAULT 'pending' NOT NULL,
  attempts INTEGER DEFAULT 0 NOT NULL,
  max_attempts INTEGER DEFAULT 3 NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  verified_at TIMESTAMPTZ,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create indexes for OTP sessions
CREATE INDEX idx_otp_phone ON otp_sessions(phone_number);
CREATE INDEX idx_otp_status ON otp_sessions(status);
CREATE INDEX idx_otp_expires ON otp_sessions(expires_at);

-- Verification Sessions (main workflow tracking)
CREATE TABLE verification_sessions (
  id TEXT PRIMARY KEY,
  session_token TEXT NOT NULL UNIQUE,
  
  -- Identity (from OTP)
  phone_number TEXT NOT NULL,
  otp_session_id TEXT NOT NULL REFERENCES otp_sessions(id),
  
  -- NIN & Data Selection
  nin_masked TEXT,
  data_layer_selected data_layer,
  
  -- Payment
  payment_reference TEXT,
  payment_status payment_status DEFAULT 'pending',
  payment_amount INTEGER, -- in kobo
  payment_provider TEXT DEFAULT 'paystack',
  payment_completed_at TIMESTAMPTZ,
  
  -- NIMC API
  provider_reference TEXT,
  api_call_made_at TIMESTAMPTZ,
  api_response_status TEXT,
  
  -- Session Management
  status session_status DEFAULT 'otp_pending' NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  completed_at TIMESTAMPTZ,
  
  -- Audit Trail
  ip_address TEXT,
  user_agent TEXT,
  metadata JSONB,
  
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create indexes for verification sessions
CREATE INDEX idx_session_token ON verification_sessions(session_token);
CREATE INDEX idx_session_phone ON verification_sessions(phone_number);
CREATE INDEX idx_session_status ON verification_sessions(status);
CREATE INDEX idx_session_payment ON verification_sessions(payment_reference);
CREATE INDEX idx_session_created ON verification_sessions(created_at);
CREATE INDEX idx_session_expires ON verification_sessions(expires_at);

-- Verification Results (filtered data based on selected layer)
CREATE TABLE verification_results (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL REFERENCES verification_sessions(id) ON DELETE CASCADE,
  
  -- Demographic Data (always included if found)
  full_name TEXT,
  date_of_birth TEXT,
  phone_from_nimc TEXT,
  gender TEXT,
  
  -- Biometric Data (only if biometric or full layer selected)
  photo_url TEXT,
  signature_url TEXT,
  
  -- Address Data (only if full layer selected)
  address_line TEXT,
  town TEXT,
  lga TEXT,
  state TEXT,
  
  -- Raw API Response (for admin debugging)
  raw_api_response JSONB,
  
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create index for verification results
CREATE INDEX idx_results_session ON verification_results(session_id);

-- Admin Users (simplified - only for admin access)
CREATE TABLE admin_users (
  id TEXT PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT DEFAULT 'admin' NOT NULL,
  is_active BOOLEAN DEFAULT true NOT NULL,
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create indexes for admin users
CREATE INDEX idx_admin_username ON admin_users(username);
CREATE INDEX idx_admin_role ON admin_users(role);

-- Admin Audit Logs
CREATE TABLE admin_audit_logs (
  id TEXT PRIMARY KEY,
  admin_id TEXT NOT NULL REFERENCES admin_users(id),
  action TEXT NOT NULL,
  resource TEXT,
  details TEXT,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create indexes for audit logs
CREATE INDEX idx_audit_admin ON admin_audit_logs(admin_id);
CREATE INDEX idx_audit_action ON admin_audit_logs(action);
CREATE INDEX idx_audit_created ON admin_audit_logs(created_at);

-- System Configuration
CREATE TABLE system_config (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  description TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Insert default system configuration
INSERT INTO system_config (key, value, description) VALUES
  ('session_duration_minutes', '30', 'How long verification sessions last'),
  ('otp_expiry_minutes', '10', 'How long OTP codes are valid'),
  ('max_otp_attempts', '3', 'Maximum OTP verification attempts'),
  ('max_daily_verifications_per_phone', '5', 'Maximum verifications per phone per day'),
  ('demographic_price_kobo', '50000', 'Price for demographic data in kobo (₦500)'),
  ('biometric_price_kobo', '75000', 'Price for biometric data in kobo (₦750)'),
  ('full_price_kobo', '100000', 'Price for full profile in kobo (₦1000)');

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for verification_sessions
CREATE TRIGGER update_verification_sessions_updated_at 
  BEFORE UPDATE ON verification_sessions 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create trigger for system_config
CREATE TRIGGER update_system_config_updated_at 
  BEFORE UPDATE ON system_config 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create a view for admin dashboard statistics
CREATE VIEW session_statistics AS
SELECT 
  COUNT(*) as total_sessions,
  COUNT(*) FILTER (WHERE status = 'verification_completed') as completed_sessions,
  COUNT(*) FILTER (WHERE status = 'failed') as failed_sessions,
  COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE) as today_sessions,
  COUNT(*) FILTER (WHERE status = 'verification_completed' AND created_at >= CURRENT_DATE) as today_completed,
  COALESCE(SUM(payment_amount) FILTER (WHERE payment_status = 'completed' AND created_at >= CURRENT_DATE), 0) as today_revenue,
  ROUND(
    COUNT(*) FILTER (WHERE status = 'verification_completed')::numeric / 
    NULLIF(COUNT(*) FILTER (WHERE status IN ('verification_completed', 'failed')), 0) * 100, 
    2
  ) as success_rate_percent
FROM verification_sessions
WHERE created_at >= CURRENT_DATE - INTERVAL '30 days';

COMMENT ON VIEW session_statistics IS 'Real-time statistics for admin dashboard';

-- Grant permissions (adjust as needed for your setup)
-- GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO your_app_user;
-- GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO your_app_user;