const { createClient } = require('@supabase/supabase-js');

// Test database connection and tenant data
async function testLoginIssues() {
  console.log('=== Production Login Debug ===');
  // Read environment variables manually
  const fs = require('fs');
  let envContent = '';
  try {
    envContent = fs.readFileSync('.env', 'utf8');
    envContent.split('\n').forEach(line => {
      const [key, ...valueParts] = line.split('=');
      if (key && valueParts.length > 0) {
        process.env[key.trim()] = valueParts.join('=').trim();
      }
    });
  } catch (err) {
    console.warn('Could not read .env file:', err.message);
  }
  
  console.log('Environment variables:');
  console.log('- DATABASE_URL:', process.env.DATABASE_URL ? '✅ SET' : '❌ MISSING');
  console.log('- NEXT_PUBLIC_ROOT_DOMAIN:', process.env.NEXT_PUBLIC_ROOT_DOMAIN);
  console.log('- NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ SET' : '❌ MISSING');
  
  // Test database connection
  const { Pool } = require('pg');
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  
  try {
    console.log('\n=== Testing Database Connection ===');
    const result = await pool.query('SELECT NOW()');
    console.log('✅ Database connection successful:', result.rows[0].now);
    
    // Check if tenants table exists and has data
    const tenantsResult = await pool.query('SELECT COUNT(*) FROM tenants');
    console.log(`✅ Tenants table exists with ${tenantsResult.rows[0].count} records`);
    
    // Show tenant data (without sensitive info)
    const tenantData = await pool.query(`
      SELECT subdomain, email, owner_name, created_at, login_attempts, locked_until 
      FROM tenants 
      LIMIT 5
    `);
    console.log('\n--- Tenant Data ---');
    tenantData.rows.forEach(t => {
      console.log(`Subdomain: ${t.subdomain}, Email: ${t.email}, Locked: ${t.locked_until || 'No'}`);
    });
    
    // Test specific login scenario
    console.log('\n=== Testing Login Scenario ===');
    const testSubdomain = 'www'; // or your actual subdomain
    const testEmail = 'test@example.com'; // replace with actual email
    
    const tenantCheck = await pool.query(`
      SELECT id, email, password_hash, login_attempts, locked_until
      FROM tenants 
      WHERE subdomain = $1 AND email = $2
    `, [testSubdomain, testEmail]);
    
    if (tenantCheck.rows.length === 0) {
      console.log('❌ No tenant found with given subdomain and email');
      
      // Show available subdomains
      const subs = await pool.query('SELECT DISTINCT subdomain FROM tenants');
      console.log('Available subdomains:', subs.rows.map(r => r.subdomain));
      
      // Option: Update demo tenant to www subdomain
      console.log('\n=== Fixing Demo Tenant ===');
      const updateQuery = await pool.query(`
        UPDATE tenants 
        SET subdomain = 'www' 
        WHERE subdomain = 'demo'
        RETURNING subdomain, email
      `);
      console.log('✅ Updated tenant to www subdomain:', updateQuery.rows[0]);
      
    } else {
      console.log('✅ Tenant found');
      const tenant = tenantCheck.rows[0];
      console.log(`- Email: ${tenant.email}`);
      console.log(`- Has password: ${tenant.password_hash ? 'Yes' : 'No'}`);
      console.log(`- Login attempts: ${tenant.login_attempts || 0}`);
      console.log(`- Locked until: ${tenant.locked_until || 'No'}`);
    }
    
  } catch (error) {
    console.error('❌ Database error:', error.message);
  } finally {
    await pool.end();
  }
}

testLoginIssues();
