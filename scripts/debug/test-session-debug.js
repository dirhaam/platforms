const fs = require('fs');

async function debugSessionFlow() {
  console.log('=== Debugging Session Flow ===');
  
  // Read environment variables
  try {
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

  console.log('Environment:');
  console.log('- DATABASE_URL:', process.env.DATABASE_URL ? 'SET' : 'NOT SET');
  console.log('- NEXT_PUBLIC_ROOT_DOMAIN:', process.env.NEXT_PUBLIC_ROOT_DOMAIN);
  console.log('- NODE_ENV:', process.env.NODE_ENV);

  const { Pool } = require('pg');
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });

  try {
    // Check if sessions table exists
    console.log('\n=== Checking Sessions Table ===');
    const tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'sessions'
      );
    `);
    console.log('Sessions table exists:', tableCheck.rows[0].exists);

    if (tableCheck.rows[0].exists) {
      // Check sessions table structure
      const structure = await pool.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'sessions'
        ORDER BY ordinal_position;
      `);
      console.log('Sessions table structure:');
      structure.rows.forEach(col => {
        console.log(`  - ${col.column_name}: ${col.data_type}`);
      });

      // Check existing sessions
      const sessions = await pool.query('SELECT * FROM sessions LIMIT 5');
      console.log(`\nExisting sessions (${sessions.rows.length}):`);
      sessions.rows.forEach(session => {
        console.log(`  - ID: ${session.id}`);
        console.log(`    User: ${session.user_id}`);
        console.log(`    Tenant: ${session.tenant_id}`);
        console.log(`    Expires: ${session.expires_at}`);
        console.log(`    Created: ${session.created_at}`);
        console.log(`    Data:`, session.session_data);
      });
    }

    // Test session creation
    console.log('\n=== Testing Session Creation ===');
    const testSession = {
      userId: 'test-user-id',
      tenantId: 'test-tenant-id',
      role: 'owner',
      email: 'test@example.com',
      name: 'Test User'
    };

    const sessionId = `test-session-${Date.now()}`;
    const expiresAt = new Date(Date.now() + 86400000).toISOString(); // 24 hours

    const insertResult = await pool.query(`
      INSERT INTO sessions (id, user_id, tenant_id, session_data, expires_at)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `, [sessionId, testSession.userId, testSession.tenantId, testSession, expiresAt]);

    console.log('Session created successfully:');
    console.log(insertResult.rows[0]);

    // Test session retrieval
    console.log('\n=== Testing Session Retrieval ===');
    const retrievedSession = await pool.query('SELECT * FROM sessions WHERE id = $1', [sessionId]);
    
    if (retrievedSession.rows.length > 0) {
      console.log('Session retrieved successfully:');
      console.log(retrievedSession.rows[0]);
    } else {
      console.log('Session not found');
    }

  } catch (error) {
    console.error('Database error:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await pool.end();
  }
}

debugSessionFlow().catch(console.error);
