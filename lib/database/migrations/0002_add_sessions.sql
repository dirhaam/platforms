-- Migration untuk menambahkan tabel sessions
CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY NOT NULL,
  user_id TEXT NOT NULL,
  tenant_id TEXT NOT NULL,
  session_data TEXT, -- JSON string with session data
  expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Index untuk pencarian cepat berdasarkan user_id dan tenant_id
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions (user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_tenant_id ON sessions (tenant_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions (expires_at);