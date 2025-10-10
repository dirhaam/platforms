#!/usr/bin/env tsx

/**
 * Create SuperAdmin Script
 * 
 * This script creates a superadmin user with platform-wide access
 */

import { SuperAdminService } from '@/lib/auth/superadmin-service';

interface CreateSuperAdminOptions {
  email: string;
  password: string;
  name: string;
  force?: boolean; // Force creation even if user exists
}

async function createSuperAdmin(options: CreateSuperAdminOptions) {
  const { email, password, name, force = false } = options;

  console.log('🚀 Creating SuperAdmin...');
  console.log(`📧 Email: ${email}`);
  console.log(`👤 Name: ${name}`);

  try {
    // Check if superadmin already exists
    const existingSuperAdmin = await SuperAdminService.findByEmail(email);

    if (existingSuperAdmin && !force) {
      console.log('❌ SuperAdmin with this email already exists!');
      console.log('💡 Use --force flag to update existing superadmin');
      return;
    }

    if (existingSuperAdmin && force) {
      // Update existing superadmin
      await SuperAdminService.setPassword(existingSuperAdmin.id, password);
      const updatedSuperAdmin = await SuperAdminService.update(existingSuperAdmin.id, {
        name,
        isActive: true,
        permissions: ['*'],
        canAccessAllTenants: true,
      });

      console.log('✅ SuperAdmin updated successfully!');
      console.log(`🆔 ID: ${updatedSuperAdmin.id}`);
      console.log(`📧 Email: ${updatedSuperAdmin.email}`);
      console.log(`👤 Name: ${updatedSuperAdmin.name}`);
      console.log(`🔑 Permissions: Platform-wide access (*)`);
      console.log(`🏢 Tenant Access: All tenants`);
    } else {
      // Create new superadmin
      const superAdmin = await SuperAdminService.create({
        email,
        name,
        password,
      });

      console.log('✅ SuperAdmin created successfully!');
      console.log(`🆔 ID: ${superAdmin.id}`);
      console.log(`📧 Email: ${superAdmin.email}`);
      console.log(`👤 Name: ${superAdmin.name}`);
      console.log(`🔑 Permissions: Platform-wide access (*)`);
      console.log(`🏢 Tenant Access: All tenants`);
    }

    console.log('\n🎉 SuperAdmin setup complete!');
    console.log('\n📝 Login Instructions:');
    console.log('1. Go to the main website (not a tenant subdomain)');
    console.log('2. Use the login form with the email and password above');
    console.log('3. You will have access to all tenants and platform features');

  } catch (error) {
    console.error('💥 Failed to create SuperAdmin:', error);
    throw error;
  }
}

async function listSuperAdmins() {
  console.log('📋 Listing all SuperAdmins...');
  
  try {
    const superAdmins = await SuperAdminService.list();

    if (superAdmins.length === 0) {
      console.log('📭 No SuperAdmins found');
      return;
    }

    console.log(`\n👥 Found ${superAdmins.length} SuperAdmin(s):`);
    console.log('═'.repeat(80));

    superAdmins.forEach((admin, index) => {
      console.log(`\n${index + 1}. ${admin.name}`);
      console.log(`   📧 Email: ${admin.email}`);
      console.log(`   🆔 ID: ${admin.id}`);
      console.log(`   ✅ Active: ${admin.isActive ? 'Yes' : 'No'}`);
      console.log(`   🏢 All Tenants: ${admin.canAccessAllTenants ? 'Yes' : 'No'}`);
      console.log(`   🔑 Permissions: ${admin.permissions.join(', ')}`);
      console.log(`   🕐 Last Login: ${admin.lastLoginAt ? admin.lastLoginAt.toLocaleString() : 'Never'}`);
      console.log(`   📅 Created: ${admin.createdAt.toLocaleString()}`);
    });

  } catch (error) {
    console.error('💥 Failed to list SuperAdmins:', error);
    throw error;
  }
}

async function deactivateSuperAdmin(email: string) {
  console.log(`🔒 Deactivating SuperAdmin: ${email}`);
  
  try {
    const superAdmin = await SuperAdminService.findByEmail(email);

    if (!superAdmin) {
      console.log('❌ SuperAdmin not found');
      return;
    }

    await SuperAdminService.setActive(superAdmin.id, false);

    console.log('✅ SuperAdmin deactivated successfully');
  } catch (error) {
    console.error('💥 Failed to deactivate SuperAdmin:', error);
    throw error;
  }
}

async function activateSuperAdmin(email: string) {
  console.log(`🔓 Activating SuperAdmin: ${email}`);
  
  try {
    const superAdmin = await SuperAdminService.findByEmail(email);

    if (!superAdmin) {
      console.log('❌ SuperAdmin not found');
      return;
    }

    await SuperAdminService.setActive(superAdmin.id, true);

    console.log('✅ SuperAdmin activated successfully');
  } catch (error) {
    console.error('💥 Failed to activate SuperAdmin:', error);
    throw error;
  }
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'create';

  switch (command) {
    case 'create':
      const email = args[1] || 'dirhamrozi@gmail.com';
      const password = args[2] || '12345nabila';
      const name = args[3] || 'Super Administrator';
      const force = args.includes('--force');

      await createSuperAdmin({ email, password, name, force });
      break;
    
    case 'list':
      await listSuperAdmins();
      break;
    
    case 'deactivate':
      const deactivateEmail = args[1];
      if (!deactivateEmail) {
        console.error('❌ Please provide email address');
        process.exit(1);
      }
      await deactivateSuperAdmin(deactivateEmail);
      break;
    
    case 'activate':
      const activateEmail = args[1];
      if (!activateEmail) {
        console.error('❌ Please provide email address');
        process.exit(1);
      }
      await activateSuperAdmin(activateEmail);
      break;
    
    case 'help':
      console.log('SuperAdmin Management Script');
      console.log('============================');
      console.log('');
      console.log('Commands:');
      console.log('  create [email] [password] [name] [--force]  Create or update SuperAdmin');
      console.log('  list                                        List all SuperAdmins');
      console.log('  deactivate <email>                         Deactivate SuperAdmin');
      console.log('  activate <email>                           Activate SuperAdmin');
      console.log('  help                                       Show this help message');
      console.log('');
      console.log('Examples:');
      console.log('  npm run superadmin:create');
      console.log('  npm run superadmin:create admin@example.com mypassword "Admin Name"');
      console.log('  npm run superadmin:create admin@example.com mypassword "Admin Name" --force');
      console.log('  npm run superadmin:list');
      console.log('  npm run superadmin:deactivate admin@example.com');
      break;
    
    default:
      console.error(`❌ Unknown command: ${command}`);
      console.log('Run "npm run superadmin:help" for available commands');
      process.exit(1);
  }
}

// Handle script execution
if (require.main === module) {
  main().catch((error) => {
    console.error('💥 Script execution failed:', error);
    process.exit(1);
  });
}

export {
  createSuperAdmin,
  listSuperAdmins,
  deactivateSuperAdmin,
  activateSuperAdmin
};