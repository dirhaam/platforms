// Debug login to see what's happening
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testLogin() {
  console.log('Testing superadmin login...');
  
  // Check if superadmin exists
  const { data: admin, error } = await supabase
    .from('super_admins')
    .select('*')
    .eq('email', 'superadmin@booqing.my.id')
    .single();
    
  if (error) {
    console.error('Error finding superadmin:', error);
    return;
  }
  
  if (!admin) {
    console.log('❌ Superadmin not found!');
    return;
  }
  
  console.log('✅ Superadmin found:', {
    id: admin.id,
    email: admin.email,
    is_active: admin.is_active
  });
  
  // Test password verification (simple check)
  console.log('Password hash length:', admin.password_hash?.length);
  console.log('Password hash starts with:', admin.password_hash?.substring(0, 10));
  
  // Check if RLS is preventing access
  const { data: allAdmins, error: listError } = await supabase
    .from('super_admins')
    .select('email, created_at');
    
  if (listError) {
    console.log('⚠️ RLS might be blocking access:', listError.message);
  } else {
    console.log('✅ Can access super_admins table:', allAdmins?.length, 'records');
  }
}

testLogin();
