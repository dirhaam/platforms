import { db } from '@/lib/database/server';
import { superAdmins } from '@/lib/database/schema';
import bcrypt from 'bcryptjs';

const DEFAULT_SUPERADMIN_EMAIL = 'superadmin@booqing.my.id';
const DEFAULT_SUPERADMIN_PASSWORD = 'ChangeThisPassword123!';

async function createProductionSuperAdmin() {
  try {
    // Hash password
    const passwordHash = await bcrypt.hash(DEFAULT_SUPERADMIN_PASSWORD, 10);
    
    // Create superadmin
    const newSuperAdmin = await db.insert(superAdmins).values({
      id: `sa_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`,
      email: DEFAULT_SUPERADMIN_EMAIL,
      name: 'Super Admin',
      passwordHash,
      isActive: true,
      loginAttempts: 0,
      permissions: ['*'],
      canAccessAllTenants: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    }).returning();
    
    console.log('✅ SuperAdmin created successfully:', newSuperAdmin[0].email);
    console.log('Email:', DEFAULT_SUPERADMIN_EMAIL);
    console.log('Password:', DEFAULT_SUPERADMIN_PASSWORD);
    console.log('⚠️  IMPORTANT: Change this password after first login!');
    
  } catch (error: any) {
    if (error?.code === '23505') {
      console.log('ℹ️  SuperAdmin already exists with email:', DEFAULT_SUPERADMIN_EMAIL);
    } else {
      console.error('❌ Error creating superadmin:', error);
    }
  }
  
  process.exit(0);
}

createProductionSuperAdmin();
