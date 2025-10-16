#!/usr/bin/env node

// Production Environment Setup Helper
// This script helps configure Vercel environment variables

const fs = require('fs');
const { execSync } = require('child_process');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function getProjectInfo() {
  console.log('🔍 Setting up Production Environment');
  console.log('=================================\n');
  
  const projectUrl = await question('🌐 Vercel Project URL (dari dashboard): ');
  const dbPassword = await question('🗄️ Database password: ');
  const repoUrl = await question('📝 GitHub repo URL (opsional): ');
  
  return { projectUrl, dbPassword, repoUrl };
}

function extractProjectRef(projectUrl) {
  const match = projectUrl.match(/vercel\.com\/([a-z0-9-]+)/);
  return match ? match[1] : 'unknown';
}

function generateDatabaseUrl(projectRef, password) {
  return `postgresql://postgres.${projectRef}:${password}@${projectRef}.supabase.co:5432/postgres`;
}

async function setupEnvironment() {
  const { projectUrl, dbPassword, repoUrl } = await getProjectInfo();
  
  if (!projectUrl) {
    console.log('❌ Project URL is required');
    process.exit(1);
  }
  
  const projectRef = extractProjectRef(projectUrl);
  if (!projectRef || projectRef === 'unknown') {
    console.log('❌ Could not extract project reference from URL');
    console.log('   Expected format: https://vercel.com/your-project-name');
    process.exit(1);
  }
  
  const databaseUrl = generateDatabaseUrl(projectRef, dbPassword);
  
  const supabaseUrl = `https://${projectRef}.supabase.co`;
  
  console.log('\n📄 Generated Configuration:');
  console.log(`   Project Ref: ${projectRef}`);
  console.log(`   Database URL: ${databaseUrl}`);
  console.log(`   Supabase URL: ${supabaseUrl}`);
  console.log(`   Database PW: ${'⭐'.repeat(dbPassword.length)}`);
  
  console.log('\n📝 Vercel Commands to run:');
  console.log(`vercel link`);
  console.log(`vercel env add DATABASE_URL="${databaseUrl}"`);
  console.log(`vercel env add NEXT_PUBLIC_SUPABASE_URL="${supabaseUrl}"`);
  console.log(`vercel env add SUPABASE_SERVICE_ROLE_KEY="your-service-role-key-here"`);
  console.log(`vercel env add NODE_ENV="production"`);
  console.log(``);
  console.log(`# If you have a Supabase project:`);
  console.log(`# Get service role key from:`);
  console.log(`# Supabase Dashboard → Project Settings → API → service_role (secret)`);
  
  if (repoUrl) {
    console.log(`\n🔗 Repository: ${repoUrl}`);
    console.log(`git add .`);
    console.log(`git commit -m "Configure production environment"`);
    console.log(`git push origin main`);
  }
  
  console.log('\n🚀 After running the commands:');
  console.log('1. Wait for deployment to complete');
  console.log('2. Test login with your superadmin credentials');
  console.log('3. Create your first tenant');
  console.log('\n⚠️ IMPORTANT: Test in a staging environment first!');

  rl.close();
}

setupEnvironment().catch(error => {
  console.error('\n❌ Setup failed:', error.message);
  rl.close();
  process.exit(1);
});
