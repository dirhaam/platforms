-- Script untuk membuat super admin di tabel super_admins
-- Ganti nilai-nilai berikut dengan data yang sesuai:

INSERT INTO super_admins (
  id,
  email,
  name,
  is_active,
  password_hash,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(), -- UUID otomatis
  'dirhamrozi@gmail.com', -- Ganti dengan email admin Anda
  'Dirham SP', -- Ganti dengan nama admin
  true, -- Aktif
  'password hash', -- Ganti dengan password hash yang valid
  NOW(),
  NOW()
);

-- Catatan: password_hash di atas adalah hash dari kata "password" (harus diganti)
-- Untuk generate bcrypt hash di Node.js:
-- const bcrypt = require('bcryptjs');
-- const hash = await bcrypt.hash('password_anda', 10);