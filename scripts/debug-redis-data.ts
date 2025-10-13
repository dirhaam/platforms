#!/usr/bin/env tsx

/**
 * Debug tenant/cache data through the D1-backed Redis compatibility layer.
 */

import { redis } from '@/lib/redis';

async function debugRedisData() {
  console.log('🔍 Debugging Redis data...');
  
  try {
    const patterns = ['superadmin:*', 'subdomain:*', 'cache:*'];

    for (const pattern of patterns) {
      console.log(`\n🔍 Keys for pattern ${pattern}:`);
      const keys = await redis.keys(pattern);
      if (!keys.length) {
        console.log('  (no keys)');
        continue;
      }

      for (const key of keys) {
        const value = await redis.get(key);
        console.log(`${key}:`, typeof value, value);
      }
    }
    
  } catch (error) {
    console.error('💥 Debug failed:', error);
  }
}

debugRedisData();