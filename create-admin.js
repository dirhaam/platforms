// Untuk membuat super admin pertama kali - simpan sebagai create-admin.js
// Jalankan: node create-admin.js

const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

// Ganti dengan connection string dari .env Anda
const connectionString = process.env.DATABASE_URL || 'postgresql://user:pass@host:port/dbname';

const pool = new Pool({
  connectionString: connectionString,
});

async function createSuperAdmin() {
  const client = await pool.connect();
  
  try {
    // Informasi admin
    const email = 'admin@yourdomain.com'; // Ganti dengan email Anda
    const name = 'Super Admin'; // Ganti dengan nama Anda
    const password = 'your_secure_password'; // Ganti dengan password Anda
    
    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);
    
    // Insert ke tabel super_admins
    const query = `
      INSERT INTO super_admins (
        id, email, name, is_active, password_hash, created_at, updated_at
      ) VALUES (
        gen_random_uuid(), $1, $2, true, $3, NOW(), NOW()
      )
      ON CONFLICT (email) DO UPDATE SET
        name = EXCLUDED.name,
        is_active = EXCLUDED.is_active,
        password_hash = EXCLUDED.password_hash,
        updated_at = EXCLUDED.updated_at
      RETURNING id, email, name;
    `;
    
    const result = await client.query(query, [email, name, passwordHash]);
    
    console.log('✅ Super admin berhasil dibuat/diperbarui:');
    console.log('ID:', result.rows[0].id);
    console.log('Email:', result.rows[0].email);
    console.log('Name:', result.rows[0].name);
    
  } catch (err) {
    console.error('❌ Error membuat super admin:', err);
  } finally {
    client.release();
    await pool.end();
  }
}

// Jalankan fungsi
createSuperAdmin();