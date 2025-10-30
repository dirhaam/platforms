#!/usr/bin/env node
const postgres = require('postgres');
require('dotenv').config();

const sql = postgres(process.env.DATABASE_URL);

async function runMigration() {
  try {
    console.log('Starting migration to fix multi-service transactions...');
    
    // Make service_id nullable
    console.log('1. Making service_id nullable...');
    await sql`ALTER TABLE "public"."sales_transactions" ALTER COLUMN "service_id" DROP NOT NULL`;
    console.log('✓ service_id is now nullable');
    
    // Drop and recreate the foreign key
    console.log('2. Updating foreign key constraint...');
    await sql`ALTER TABLE "public"."sales_transactions" 
              DROP CONSTRAINT "sales_transactions_service_id_services_id_fk"`;
    console.log('✓ Old constraint dropped');
    
    await sql`ALTER TABLE "public"."sales_transactions" 
              ADD CONSTRAINT "sales_transactions_service_id_services_id_fk" 
              FOREIGN KEY ("service_id") REFERENCES "public"."services"("id") ON DELETE set null ON UPDATE no action`;
    console.log('✓ New constraint created');
    
    // Verify the change
    console.log('3. Verifying changes...');
    const result = await sql`SELECT column_name, is_nullable, data_type 
                             FROM information_schema.columns 
                             WHERE table_name = 'sales_transactions' AND column_name = 'service_id'`;
    console.log('✓ Column info:', result[0]);
    
    console.log('\n✅ Migration completed successfully!');
    console.log('Multi-service transactions are now supported.');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error(error);
    process.exit(1);
  }
}

runMigration();
