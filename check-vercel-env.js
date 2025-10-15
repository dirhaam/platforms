#!/usr/bin/env node

// Check Vercel Environment Variables
// Usage: node check-vercel-env.js

const { execSync } = require('child_process');

console.log('🔍 Checking Vercel Environment...');
console.log('======================\n');

try {
  // Check current environment variables
  const envVars = execSync('vercel env ls', { encoding: 'utf8' });
  console.log('Current Vercel Environment Variables:');
  console.log(envVars);
  
  // Check for required variables
  const required = [
    'DATABASE_URL',
    'NEXT_PUBLIC_SUPABASE_URL', 
    'SUPABASE_SERVICE_ROLE_KEY'
  ];
  
  console.log('\n🔍 Required Variables Status:');
  required.forEach(varName => {
    if (envVars.includes(varName + '=')) {
      console.log(`   ✅ ${varName}`);
    } else {
      console.log(`   ❌ ${varName} - MISSING`);
    }
  });
  
  // Database connection test
  if (envVars.includes('DATABASE_URL=')) {
    const dbUrlMatch = envVars.match(/DATABASE_URL=([^\s]+)/);
    if (dbUrlMatch) {
      console.log(`\n🗄️ Database URL found: ${dbUrlMatch[1]}`);
      
      // Check if it's connecting to the right database
      if (dbUrlMatch[1].includes('postgresql://')) {
        console.log('   ✅ PostgreSQL format detected');
      } else {
        console.log('   ❌ Invalid database format - must be PostgreSQL');
      }
    } else {
      console.log('\n   ❌ Database URL format unclear');
    }
  } else {
    console.log('\n❌ DATABASE_URL not found in environment');
  }
  
  // Supabase URLs
  if (envVars.includes('NEXT_PUBLIC_SUPABASE_URL=')) {
    const supabaseUrlMatch = envVars.match(/NEXT_PUBLIC_SUPABASE_URL=([^\s]+)/);
    if (supabaseUrlMatch) {
      console.log(`\n🔐 Supabase URL: ${supabaseUrlMatch[1]}`);
    }
  } else {
    console.log('\n❌ NEXT_PUBLIC_SUPABASE_URL not found');
  }
  
  if (envVars.includes('SUPABASE_SERVICE_ROLE_KEY=')) {
    console.log('✅ SUPABASE_SERVICE_ROLE_KEY found');
    // Hide actual key for security
  } else {
    console.log('❌ SUPABASE_SERVICE_ROLE_KEY not found');
  }
  
} catch (error) {
  console.error('❌ Failed to check Vercel environment:', error.message);
}

console.log('\n📋 Next Steps:');
console.log('1. If DATABASE_URL is missing, add it via:');
console.log('   vercel env add DATABASE_URL="postgresql://user:pass@host:port/dbname"');
console.log('2. After adding variables, redeploy: vercel --prod');
console.log('3. Test login functionality');
