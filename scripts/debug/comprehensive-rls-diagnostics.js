const { Pool } = require('pg');

async function runComprehensiveDiagnostics() {
  console.log('🔎 COMPREHENSIVE RLS & LOGIN DIAGNOSTICS');
  console.log('=========================================');
  
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

  console.log('\n📋 Environment Check:');
  console.log('DATABASE_URL:', process.env.DATABASE_URL ? '✅ SET' : '❌ MISSING');
  console.log('NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ SET' : '❌ MISSING');
  console.log('SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? '✅ SET' : '❌ MISSING');
  console.log('NEXT_PUBLIC_ROOT_DOMAIN:', process.env.NEXT_PUBLIC_ROOT_DOMAIN);
  console.log('NODE_ENV:', process.env.NODE_ENV);

  const pool = new Pool({ connectionString: process.env.DATABASE_URL });

  try {
    // Test 1: Basic Database Connection
    console.log('\n🔌 Database Connection Test:');
    const connectionTest = await pool.query('SELECT NOW() as current_time, version() as version');
    console.log('✅ Connection successful');
    console.log('   Time:', connectionTest.rows[0].current_time);
    console.log('   Version:', connectionTest.rows[0].version.split(' ')[1]);

    // Test 2: Check RLS Status
    console.log('\n🛡️  Row Level Security (RLS) Status:');
    
    // Check which tables have RLS enabled
    const rlsTables = await pool.query(`
      SELECT schemaname, tablename, rowsecurity 
      FROM pg_tables 
      WHERE schemaname IN ('public', 'auth') AND rowsecurity = true
    `);
    
    if (rlsTables.rows.length > 0) {
      console.log('Tables with RLS enabled:');
      rlsTables.rows.forEach(table => {
        console.log(`  - ${table.schemaname}.${table.tablename}`);
      });
    } else {
      console.log('❌ No tables with RLS enabled');
    }

    // Test 3: Check RLS Policies
    console.log('\n📜 RLS Policies:');
    const policies = await pool.query(`
      SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
      FROM pg_policies 
      WHERE schemaname IN ('public', 'auth')
      ORDER BY tablename, policyname
    `);
    
    if (policies.rows.length > 0) {
      console.log(`Found ${policies.rows.length} RLS policies:`);
      policies.rows.forEach(policy => {
        console.log(`  📋 ${policy.tablename}.${policy.policyname}`);
        console.log(`     Command: ${policy.cmd}`);
        console.log(`     Roles: ${policy.roles}`);
        console.log(`     Permissive: ${policy.permissive ? 'Yes' : 'No'}`);
      });
    } else {
      console.log('❌ No RLS policies found');
    }

    // Test 4: Check Schema Permissions
    console.log('\n🔐 Schema Permissions:');
    const schemaPerms = await pool.query(`
      SELECT table_schema, table_name, grantee, privilege_type 
      FROM information_schema.role_table_grants 
      WHERE table_schema IN ('public', 'auth')
      ORDER BY table_schema, table_name, grantee
    `);
    
    const permsBySchema = {};
    schemaPerms.rows.forEach(perm => {
      const key = `${perm.table_schema}.${perm.table_name}`;
      if (!permsBySchema[key]) permsBySchema[key] = [];
      permsBySchema[key].push(`${perm.grantee}:${perm.privilege_type}`);
    });
    
    Object.entries(permsBySchema).forEach(([table, perms]) => {
      console.log(`  🗃️  ${table}:`);
      perms.forEach(perm => console.log(`    ${perm}`));
    });

    // Test 5: Test Table Access
    console.log('\n🧪 Table Access Tests:');
    
    const tablesToTest = [
      'tenants',
      'staff',
      'sessions',
      'auth.users'
    ];
    
    for (const table of tablesToTest) {
      try {
        const testQuery = await pool.query(`SELECT COUNT(*) as count FROM ${table} LIMIT 1`);
        console.log(`✅ ${table}: Accessible (${testQuery.rows[0].count} rows)`);
      } catch (error) {
        console.log(`❌ ${table}: ${error.message}`);
      }
    }

    // Test 6: Test Service Role Access
    console.log('\n👑 Service Role Test:');
    try {
      // simulate service role access
      await pool.query('SET ROLE postgres');
      const serviceTest = await pool.query('SELECT COUNT(*) as count FROM tenants');
      console.log(`✅ Service Role: Tenants accessible (${serviceTest.rows[0].count} rows)`);
      await pool.query('RESET ROLE');
    } catch (error) {
      console.log(`❌ Service Role error: ${error.message}`);
    }

    // Test 7: Check Critical Data
    console.log('\n📊 Critical Data Check:');
    
    try {
      const tenantCount = await pool.query('SELECT COUNT(*) as count FROM tenants');
      console.log(`Tenants: ${tenantCount.rows[0].count} records`);
      
      if (tenantCount.rows[0].count > 0) {
        const tenantDetails = await pool.query('SELECT subdomain, email, owner_name, created_at FROM tenants LIMIT 3');
        console.log('Recent tenants:');
        tenantDetails.rows.forEach(tenant => {
          console.log(`  🏢 ${tenant.subdomain}: ${tenant.email} (${tenant.owner_name})`);
        });
      }
    } catch (error) {
      console.log(`❌ Tenants check failed: ${error.message}`);
    }

    try {
      const staffCount = await pool.query('SELECT COUNT(*) as count FROM staff');
      console.log(`Staff: ${staffCount.rows[0].count} records`);
    } catch (error) {
      console.log(`❌ Staff check failed: ${error.message}`);
    }

    try {
      const sessionCount = await pool.query('SELECT COUNT(*) as count FROM sessions');
      console.log(`Sessions: ${sessionCount.rows[0].count} records`);
      
      if (sessionCount.rows[0].count > 0) {
        const recentSessions = await pool.query(`
          SELECT id, user_id, tenant_id, created_at, expires_at 
          FROM sessions 
          ORDER BY created_at DESC 
          LIMIT 3
        `);
        console.log('Recent sessions:');
        recentSessions.rows.forEach(session => {
          console.log(`  🎟️  ${session.id.substring(0, 8)}...: User ${session.user_id}`);
        });
      }
    } catch (error) {
      console.log(`❌ Sessions check failed: ${error.message}`);
    }

    // Test 8: API Endpoint Simulation
    console.log('\n🌐 API Endpoint Simulation:');
    
    // Test subdomain extraction logic
    console.log('Subdomain extraction test:');
    const testCases = [
      { host: 'www.booqing.my.id', expected: 'www' },
      { host: 'demo.booqing.my.id', expected: 'demo' },
      { host: 'api.booqing.my.id', expected: 'api' },
      { host: 'booqing.my.id', expected: null },
      { host: 'localhost:3000', expected: null }
    ];
    
    const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'booqing.my.id';
    const rootDomainFormatted = rootDomain.split(':')[0];
    
    testCases.forEach(testCase => {
      const hostname = testCase.host.split(':')[0];
      const isSubdomain = 
        hostname !== rootDomainFormatted && 
        hostname.endsWith(`.${rootDomainFormatted}`);
      
      const extractedSubdomain = isSubdomain ? 
        hostname.replace(`.${rootDomainFormatted}`, '') : null;
      
      console.log(`  ${testCase.host} => ${extractedSubdomain} ${testCase.expected === extractedSubdomain ? '✅' : '❌ (expected: '+testCase.expected+')'}`);
    });

  } catch (error) {
    console.error('❌ Database error:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await pool.end();
  }

  // Test Supabase Client
  console.log('\n🟢 Supabase Client Test:');
  try {
    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );
    
    const { data, error } = await supabase.from('tenant_subdomains').select('subdomain').limit(1);
    if (error) {
      console.log('❌ Supabase client error:', error.message);
    } else {
      console.log('✅ Supabase client working');
    }
  } catch (error) {
    console.log('❌ Supabase client test failed:', error.message);
  }

  console.log('\n🎯 RECOMMENDATIONS:');
  console.log('==================');
  console.log('1. If RLS policies are blocking access, consider:');
  console.log('   - Adding service_role bypass policies');
  console.log('   - Temporarily disabling problematic policies');
  console.log('2. Ensure all environment variables are set in production');
  console.log('3. Verify Supabase redirect URLs include your domain');
  console.log('4. Check that tenant subdomain matches your URL structure');
}

runComprehensiveDiagnostics().catch(console.error);
