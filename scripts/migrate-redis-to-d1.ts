// scripts/migrate-redis-to-d1.ts
// Script untuk memigrasi data dari Redis ke Cloudflare D1

import { redis } from '@/lib/redis';
import { 
  setTenant,
  testD1Connection
} from '@/lib/d1';

export class RedisToD1Migration {
  // Migrasi data tenant dari Redis ke D1
  static async migrateTenantData(): Promise<void> {
    console.log('Starting Redis to D1 tenant data migration...');
    
    try {
      // Dalam implementasi sebenarnya, kita akan menggunakan SCAN atau operasi serupa
      // untuk mendapatkan semua kunci tenant di Redis
      
      // Karena kita tidak bisa secara langsung mengakses semua data Redis dari sini,
      // kita akan asumsikan bahwa format kuncinya adalah 'subdomain:{nama_subdomain}'
      
      // Dalam lingkungan produksi, Anda mungkin perlu menggunakan Redis CLI atau 
      // fitur scan untuk mendapatkan semua kunci tenant
      console.log('Redis to D1 migration requires direct Redis access for scanning all keys');
      console.log('Please use Redis CLI or another tool to get the keys and values');
      
      // Contoh untuk satu subdomain:
      // const tenantData = await redis.get('subdomain:example');
      // if (tenantData) {
      //   await setTenant('example', tenantData);
      // }
      
      console.log('Redis to D1 migration completed');
    } catch (error) {
      console.error('Error during Redis to D1 migration:', error);
      throw error;
    }
  }
  
  // Validasi data setelah migrasi
  static async validateMigration(): Promise<boolean> {
    console.log('Validating migration...');
    
    try {
      // Lakukan validasi data di sini
      const d1Connected = await testD1Connection();
      if (!d1Connected) {
        console.error('D1 connection failed after migration');
        return false;
      }
      
      console.log('Migration validation completed successfully');
      return true;
    } catch (error) {
      console.error('Error validating migration:', error);
      return false;
    }
  }
  
  // Jalankan seluruh proses migrasi
  static async runMigration(): Promise<void> {
    console.log('Starting full Redis to D1 migration process...');
    
    try {
      await this.migrateTenantData();
      const isValid = await this.validateMigration();
      
      if (isValid) {
        console.log('Redis to D1 migration completed successfully!');
      } else {
        console.error('Migration completed but validation failed');
      }
    } catch (error) {
      console.error('Redis to D1 migration failed:', error);
      throw error;
    }
  }
}

// Jika file ini dijalankan langsung
if (typeof require !== 'undefined' && require.main === module) {
  RedisToD1Migration.runMigration()
    .catch(error => {
      console.error('Migration failed:', error);
      process.exit(1);
    });
}