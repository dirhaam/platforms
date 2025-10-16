// Debug SuperAdmin service in detail
async function debugSuperAdminService() {
  console.log('🔍 Debugging SuperAdmin Service in Detail');
  console.log('===========================================');
  
  // Read environment variables
  try {
    const fs = require('fs');
    const envContent = fs.readFileSync('.env', 'utf8');
    envContent.split('\n').forEach(line => {
      const [key, ...valueParts] = line.split('=');
      if (key && valueParts.length > 0) {
        process.env[key.trim()] = valueParts.join('=').trim();
      }
    });
  } catch (err) {
    console.warn('Could not read .env file:', err.message);
  }

  console.log('\n🌍 Environment Variables:');
  console.log(`   DEFAULT_SUPERADMIN_EMAIL: ${process.env.DEFAULT_SUPERADMIN_EMAIL}`);
  console.log(`   DEFAULT_SUPERADMIN_PASSWORD: ${process.env.DEFAULT_SUPERADMIN_PASSWORD ? 'SET' : 'NOT SET'}`);
  console.log(`   DATABASE_URL: ${process.env.DATABASE_URL ? 'SET' : 'NOT SET'}`);

  // Hash to compare with database
  if (process.env.DEFAULT_SUPERADMIN_PASSWORD) {
    const crypto = require('crypto');
    const envHash = crypto.createHash('sha256').update(process.env.DEFAULT_SUPERADMIN_PASSWORD).digest('hex');
    console.log(`   Env Password Hash: ${envHash}`);
  }

  // Test database connection directly
  console.log('\n🔌 Testing Database Connection:');
  const { Pool } = require('pg');
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });

  try {
    const connTest = await pool.query('SELECT NOW()');
    console.log(`   ✅ Database connected: ${connTest.rows[0].now}`);
    
    // Test password hash comparison
    console.log('\n🔐 Testing Password Verification:');
    const saQuery = await pool.query(`
      SELECT id, email, name, password_hash FROM super_admins 
      WHERE email = $1 LIMIT 1
    `, ['dirhamrozi@gmail.com']);
    
    if (saQuery.rows.length === 0) {
      console.log('   ❌ SuperAdmin not found');
    } else {
      const sa = saQuery.rows[0];
      console.log(`   ✅ SuperAdmin found: ${sa.name}`);
      
      // Test both password hashes
      const envPassword = 'Dirham123!!!';
      const envHash = crypto.createHash('sha256').update(envPassword).digest('hex');
      
      console.log(`   Env Password: ${envPassword}`);
      console.log(`   Env Hash: ${envHash}`);
      console.log(`   DB Hash: ${sa.password_hash}`);
      console.log(`   Match: ${sa.password_hash === envHash ? '✅' : '❌'}`);
      
      if (sa.password_hash !== envHash) {
        console.log('   🔄 Updating hash in database...');
        await pool.query(`
          UPDATE super_admins 
          SET password_hash = $1, updated_at = NOW()
          WHERE id = $2
        `, [envHash, sa.id]);
        console.log('   ✅ Hash updated');
        
        // Test comparison again
        const testHash = crypto.createHash('sha256').update(envPassword).digest('hex');
        const reverifyQuery = await pool.query('SELECT password_hash FROM super_admins WHERE id = $1', [sa.id]);
        const newHash = reverifyQuery.rows[0].password_hash;
        console.log(`   Verification: ${newHash === testHash ? '✅' : '❌'}`);
      }
    }
    
    // Test the actual authentication method
    console.log('\n🧪 Testing Auth Process:');
    const simulatedRequest = {
      headers: {
        get: (key) => {
          if (key === 'x-forwarded-for') return '127.0.0.1';
          if (key === 'user-agent') return 'Debug Script';
          return null;
        }
      }
    };
    
    // Simulate the authentication
    try {
      // This is the same logic from SuperAdminService.authenticate
      const email = 'dirhamrozi@gmail.com';
      const password = 'Dirham123!!!';
      
      console.log(`   📧 Email: ${email}`);
      console.log(`   🔑 Password: ${password}`);
      
      // Look up SuperAdmin
      const authQuery = await pool.query(`
        SELECT id, email, name, password_hash, is_active, login_attempts, locked_until
        FROM super_admins 
        WHERE email = $1 AND is_active = true
      `, [email]);
      
      if (authQuery.rows.length === 0) {
        console.log('   ❌ SuperAdmin not found or inactive');
      } else {
        const superadmin = authQuery.rows[0];
        crypto.createHash('sha256').update(password).digest('hex');
        const inputHash = crypto.createHash('sha256').update(password).digest('hex');
        
        console.log(`   🔍 Found SuperAdmin: ${superadmin.name}`);
        console.log(`   🔐 Input Hash: ${inputHash}`);
        console.log(`   💾 Stored Hash: ${superadmin.password_hash}`);
        console.log(`   ✅ Hash Match: ${inputHash === superadmin.password_hash}`);
        
        if (inputHash === superadmin.password_hash) {
          console.log('   🎉 Authentication would SUCCESS!');
        } else {
          console.log('   ❌ Authentication would FAIL!');
        }
      }
      
    } catch (authError) {
      console.log('   💥 Auth simulation error:', authError.message);
    }
    
  } catch (dbError) {
    console.error('❌ Database error:', dbError.message);
  } finally {
    await pool.end();
  }
}

debugSuperAdminService().catch(console.error);
