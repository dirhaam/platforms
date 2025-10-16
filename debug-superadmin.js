// Debug SuperAdmin authentication
const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');

require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testAuth() {
  console.log('🔍 Testing SuperAdmin Authentication...');
  
  const email = 'newadmin@booqing.my.id';
  const password = 'password123';
  
  // Step 1: Check if user exists
  console.log('\n1️⃣ Checking if user exists...');
  const { data: admin, error: findError } = await supabase
    .from('super_admins')
    .select('*')
    .eq('email', email)
    .single();
    
  if (findError) {
    console.log('❌ Error finding user:', findError.message);
    console.log('🔧 This might be an RLS issue');
    return;
  }
  
  if (!admin) {
    console.log('❌ User not found in database');
    return;
  }
  
  console.log('✅ User found:', {
    id: admin.id,
    email: admin.email,
    name: admin.name,
    is_active: admin.is_active
  });
  
  // Step 2: Test password verification
  console.log('\n2️⃣ Testing password verification...');
  
  try {
    const isValid = await bcrypt.compare(password, admin.password_hash);
    console.log('✅ Password verification result:', isValid);
    
    if (!isValid) {
      console.log('❌ Password does not match');
      console.log('🔍 Stored hash starts with:', admin.password_hash.substring(0, 10));
      console.log('🔍 Hash length:', admin.password_hash.length);
    }
  } catch (error) {
    console.log('❌ Error comparing password:', error.message);
  }
  
  // Step 3: Test direct query
  console.log('\n3️⃣ Testing direct database access...');
  const { data: allAdmins, error: listError } = await supabase
    .from('super_admins')
    .select('email, created_at');
    
  if (listError) {
    console.log('❌ Error listing admins:', listError.message);
  } else {
    console.log('✅ Found admins count:', allAdmins?.length);
    allAdmins?.forEach((admin, index) => {
      console.log(`  ${index + 1}. ${admin.email} (${admin.created_at})`);
    });
  }
  
  console.log('\n🎯 Test complete!');
}

testAuth().catch(console.error);
