-- Konfigurasi untuk Cloudflare D1 menggantikan penyimpanan Redis

-- Tabel subdomain tenant
CREATE TABLE IF NOT EXISTS tenant_subdomains (
  id TEXT PRIMARY KEY,
  subdomain TEXT NOT NULL UNIQUE,
  tenant_data TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabel session
CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  tenant_id TEXT NOT NULL,
  session_data TEXT,
  expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabel cache sederhana
CREATE TABLE IF NOT EXISTS cache (
  key TEXT PRIMARY KEY,
  value TEXT,
  expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index yang sering digunakan untuk query pembersihan dan lookup
CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions (expires_at);
CREATE INDEX IF NOT EXISTS idx_sessions_tenant_id ON sessions (tenant_id);
CREATE INDEX IF NOT EXISTS idx_cache_expires_at ON cache (expires_at);