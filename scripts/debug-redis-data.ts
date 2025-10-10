#!/usr/bin/env tsx

/**
 * Debug Redis Data
 */

import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: "https://precise-mite-9437.upstash.io",
  token: "ASTdAAImcDJlMzU2YzViYjYwMmI0N2NiYTE2MTM5ZmY1Y2UxMWNjNnAyOTQzNw",
});

async function debugRedisData() {
  console.log('🔍 Debugging Redis data...');
  
  try {
    const email = 'dirhamrozi@gmail.com';
    const emailKey = `superadmin:email:${email}`;
    
    console.log('📧 Email key:', emailKey);
    
    // Get SuperAdmin ID
    const superAdminId = await redis.get(emailKey);
    console.log('🆔 SuperAdmin ID:', superAdminId);
    console.log('🆔 SuperAdmin ID type:', typeof superAdminId);
    
    if (superAdminId) {
      const dataKey = `superadmin:${superAdminId}`;
      console.log('📊 Data key:', dataKey);
      
      // Get raw data
      const rawData = await redis.get(dataKey);
      console.log('📦 Raw data:', rawData);
      console.log('📦 Raw data type:', typeof rawData);
      console.log('📦 Raw data constructor:', rawData?.constructor?.name);
      
      // Try to stringify it
      try {
        const stringified = JSON.stringify(rawData);
        console.log('📝 Stringified:', stringified);
      } catch (e) {
        console.log('❌ Cannot stringify:', e);
      }
      
      // Check if it's already a string
      if (typeof rawData === 'string') {
        console.log('✅ Data is already a string, trying to parse...');
        try {
          const parsed = JSON.parse(rawData);
          console.log('✅ Parsed successfully:', parsed);
        } catch (e) {
          console.log('❌ Cannot parse string:', e);
        }
      }
    }
    
    // List all superadmin keys
    console.log('\n🔍 All superadmin keys:');
    const keys = await redis.keys('superadmin:*');
    console.log('Keys:', keys);
    
    for (const key of keys) {
      const value = await redis.get(key);
      console.log(`${key}:`, typeof value, value);
    }
    
  } catch (error) {
    console.error('💥 Debug failed:', error);
  }
}

debugRedisData();