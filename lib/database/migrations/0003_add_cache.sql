-- Migration untuk menambahkan tabel cache
CREATE TABLE IF NOT EXISTS cache (
  key TEXT PRIMARY KEY NOT NULL,
  value TEXT NOT NULL, -- JSON string with cached data
  expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Index untuk pencarian cepat berdasarkan expires_at
CREATE INDEX IF NOT EXISTS idx_cache_expires_at ON cache (expires_at);