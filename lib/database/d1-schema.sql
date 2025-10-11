// Konfigurasi untuk Cloudflare D1
// File ini akan digunakan untuk menangani operasi-operasi yang sebelumnya menggunakan Redis

// Di Cloudflare D1, kita tidak bisa secara langsung mereplikasi semua fitur Redis
// Kita perlu membuat tabel-tabel untuk menyimpan data yang sebelumnya disimpan di Redis

// Tabel untuk menyimpan informasi subdomain dan tenant
CREATE TABLE IF NOT EXISTS tenant_subdomains (
  id INTEGER PRIMARY KEY,
  subdomain TEXT NOT NULL UNIQUE,
  tenant_data TEXT, -- JSON string
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

// Tabel untuk menyimpan session data
CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  tenant_id TEXT NOT NULL,
  session_data TEXT, -- JSON string
  expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

// Tabel untuk menyimpan cache data sederhana
CREATE TABLE IF NOT EXISTS cache (
  key TEXT PRIMARY KEY,
  value TEXT,
  expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);