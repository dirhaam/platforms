-- Migration untuk menambahkan tabel tenant_subdomains
CREATE TABLE IF NOT EXISTS tenant_subdomains (
  id TEXT PRIMARY KEY NOT NULL,
  subdomain VARCHAR(255) NOT NULL UNIQUE,
  tenant_data TEXT NOT NULL, -- JSON string with tenant data
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Index untuk pencarian cepat berdasarkan subdomain
CREATE INDEX IF NOT EXISTS idx_tenant_subdomains_subdomain ON tenant_subdomains (subdomain);