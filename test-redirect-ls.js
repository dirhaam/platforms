#!/usr/bin/env node

// Test Supabase Redirect URLs
// Usage: node test-redirect-ls.js

console.log('🔍 Testing Supabase Redirect URLs');
console.log('============================\n');

// Test API access before fixing
async function testAPIAccess() {
  try {
    const response = await fetch('https://booqing.my.id/api/tenants');
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ API access successful');
      console.log('   Response:', data);
    } else {
      console.log('❌ API access failed');
      console.log('   Status:', response.status);
      console.log('   URL:', response.url);
      
      // Check for redirect
      if (response.url !== response.url) {
        console.log('🔄 Redirected to:', response.url);
        
        const url = new URL(response.url);
        console.log('   Query params:');
        for (const [key, value] of url.searchParams) {
          console.log(`     ${key}: ${value}`);
        }
      }
    }
  } catch (error) {
    console.log('❌ Network error:', error.message);
  }
}

// Test main domain access
async function testMainDomain() {
  try {
    const response = await fetch('https://booqing.my.id/');
    
    if (response.ok) {
      console.log('✅ Main domain accessible');
    } else {
      console.log('❌ Main domain failed:', response.status);
      console.log('   URL:', response.url);
    }
  } catch (error) {
    console.log('❌ Network error (main domain):', error.message);
  }
}

// Test subdomain access
async function testSubdomain() {
  try {
    const response = await fetch('https://six-sigma.booqing.my.id/');
    
    if (response.ok) {
      console.log('✅ Subdomain accessible');
    } else {
      console.log('❌ Subdomain failed:', response.status);
      console.log('   URL:', response.url);
    }
  } catch (error) {
    console.log('❌ Network error (subdomain):', error.message);
  }
}

console.log('🔗 Testing API Routes:');
testAPIAccess();

console.log('\n🌐 Testing Domain Access:');
testMainDomain();

console.log('\n🏠 Testing Subdomain:');
testSubdomain();

console.log('\n📋 Expected Results (after fix):');
console.log('✅ API access: 200 OK');
console.log('✅ API response: {"tenants": []}');
console.log('❌ No redirects for API calls');
console.log('✅ Main domain: 200 OK');
console.log('✅ Subdomain: 200 OK');
console.log('\n🚀 Next Steps:');
console.log('1. Configure redirect URLs in Supabase Dashboard');
console.log('2. Deploy changes');
console.log('3. Test login functionality');
console.log('4. Create first tenant');
