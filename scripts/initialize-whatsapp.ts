#!/usr/bin/env tsx

/**
 * WhatsApp Integration Initialization Script
 * 
 * This script initializes WhatsApp integration for existing tenants
 * and sets up the necessary infrastructure.
 */

import { whatsappService } from '@/lib/whatsapp/whatsapp-service';
import { getAllSubdomains } from '@/lib/subdomains';

async function initializeWhatsAppForAllTenants() {
  console.log('🚀 Starting WhatsApp integration initialization...');

  try {
    // Get all existing tenants
    const tenants = await getAllSubdomains();
    console.log(`📊 Found ${tenants.length} existing tenants`);

    let successCount = 0;
    let errorCount = 0;

    for (const tenant of tenants) {
      try {
        console.log(`🔧 Initializing WhatsApp for tenant: ${tenant.subdomain}`);
        
        // Initialize WhatsApp configuration for tenant
        await whatsappService.initializeTenant(tenant.subdomain);
        
        console.log(`✅ Successfully initialized WhatsApp for: ${tenant.subdomain}`);
        successCount++;
      } catch (error) {
        console.error(`❌ Failed to initialize WhatsApp for ${tenant.subdomain}:`, error);
        errorCount++;
      }
    }

    console.log('\n📈 Initialization Summary:');
    console.log(`✅ Successful: ${successCount}`);
    console.log(`❌ Failed: ${errorCount}`);
    console.log(`📊 Total: ${tenants.length}`);

    if (errorCount === 0) {
      console.log('\n🎉 All tenants successfully initialized with WhatsApp integration!');
    } else {
      console.log('\n⚠️  Some tenants failed to initialize. Please check the errors above.');
    }

  } catch (error) {
    console.error('💥 Fatal error during initialization:', error);
    process.exit(1);
  }
}

async function testWhatsAppInfrastructure() {
  console.log('🧪 Testing WhatsApp infrastructure...');

  try {
    // Test creating a sample configuration
    const testTenantId = 'test-tenant';
    
    console.log('📝 Creating test configuration...');
    await whatsappService.initializeTenant(testTenantId);
    
    console.log('🔗 Adding test endpoint...');
    const endpoint = await whatsappService.addEndpoint(testTenantId, {
      tenantId: testTenantId,
      name: 'Test Endpoint',
      apiUrl: 'https://api.example.com',
      webhookUrl: 'https://example.com/webhook',
      webhookSecret: 'test-secret',
      isActive: true,
      isPrimary: true,
      healthStatus: 'unknown',
      lastHealthCheck: new Date()
    });
    
    console.log('📱 Creating test device...');
    const device = await whatsappService.createDevice(
      testTenantId,
      endpoint.id,
      'Test Device'
    );
    
    console.log('🏥 Testing health monitoring...');
    const healthStatus = await whatsappService.getTenantHealthStatus(testTenantId);
    
    console.log('🧹 Cleaning up test data...');
    await whatsappService.deleteDevice(device.id);
    await whatsappService.removeEndpoint(testTenantId, endpoint.id);
    
    console.log('✅ WhatsApp infrastructure test completed successfully!');
    console.log('📊 Test Results:');
    console.log(`   - Endpoint created: ${endpoint.id}`);
    console.log(`   - Device created: ${device.id}`);
    console.log(`   - Health status: ${healthStatus.overallHealth}`);
    
  } catch (error) {
    console.error('❌ WhatsApp infrastructure test failed:', error);
    throw error;
  }
}

async function displayWhatsAppStatus() {
  console.log('📊 WhatsApp Integration Status:');
  console.log('================================');
  
  try {
    const systemHealth = await whatsappService.getSystemHealthStatus();
    
    console.log(`📈 System Overview:`);
    console.log(`   Total Tenants: ${systemHealth.totalTenants}`);
    console.log(`   Healthy Tenants: ${systemHealth.healthyTenants}`);
    console.log(`   Total Endpoints: ${systemHealth.totalEndpoints}`);
    console.log(`   Healthy Endpoints: ${systemHealth.healthyEndpoints}`);
    console.log(`   Total Devices: ${systemHealth.totalDevices}`);
    console.log(`   Connected Devices: ${systemHealth.connectedDevices}`);
    
    const healthPercentage = systemHealth.totalTenants > 0 
      ? Math.round((systemHealth.healthyTenants / systemHealth.totalTenants) * 100)
      : 0;
    
    console.log(`\n🏥 Overall Health: ${healthPercentage}%`);
    
    if (healthPercentage >= 90) {
      console.log('🟢 System is healthy');
    } else if (healthPercentage >= 70) {
      console.log('🟡 System is degraded');
    } else {
      console.log('🔴 System needs attention');
    }
    
  } catch (error) {
    console.error('❌ Failed to get WhatsApp status:', error);
  }
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'init';

  switch (command) {
    case 'init':
      await initializeWhatsAppForAllTenants();
      break;
    
    case 'test':
      await testWhatsAppInfrastructure();
      break;
    
    case 'status':
      await displayWhatsAppStatus();
      break;
    
    case 'help':
      console.log('WhatsApp Integration Management Script');
      console.log('=====================================');
      console.log('');
      console.log('Commands:');
      console.log('  init     Initialize WhatsApp for all existing tenants');
      console.log('  test     Test WhatsApp infrastructure');
      console.log('  status   Display WhatsApp system status');
      console.log('  help     Show this help message');
      console.log('');
      console.log('Usage:');
      console.log('  npm run whatsapp:init');
      console.log('  npm run whatsapp:test');
      console.log('  npm run whatsapp:status');
      break;
    
    default:
      console.error(`❌ Unknown command: ${command}`);
      console.log('Run "npm run whatsapp:help" for available commands');
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
  initializeWhatsAppForAllTenants,
  testWhatsAppInfrastructure,
  displayWhatsAppStatus
};