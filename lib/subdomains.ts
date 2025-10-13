import { db } from '@/lib/database';
import { tenants } from '@/lib/database/schema';
import { eq, desc } from 'drizzle-orm';
import { getTenant, setTenant, deleteTenant } from '@/lib/d1';
import { EnhancedTenant, TenantRegistrationData, BusinessCategory, isValidIcon } from '@/lib/subdomain-constants';

export async function getSubdomainData(subdomain: string): Promise<EnhancedTenant | null> {
  const sanitizedSubdomain = subdomain.toLowerCase().replace(/[^a-z0-9-]/g, '');
  
  try {
    // Try to get from database first
    const [tenantResult] = await db.select().from(tenants).where(
      eq(tenants.subdomain, sanitizedSubdomain)
    ).limit(1);
    
    if (tenantResult) {
      // Convert database tenant to EnhancedTenant format
      return convertDbToEnhancedTenant(tenantResult);
    }
    
    // Fallback to D1 if not found in database
    const d1Data = await getTenant(sanitizedSubdomain);
    if (d1Data) {
      return d1Data;
    }
    
    return null;
  } catch (error) {
    console.error('Error getting subdomain data:', error);
    return null;
  }
}

// Helper function to convert database tenant to EnhancedTenant
function convertDbToEnhancedTenant(dbTenant: any): EnhancedTenant {
  return {
    // Basic info
    subdomain: dbTenant.subdomain,
    emoji: dbTenant.emoji || '🏢',
    createdAt: dbTenant.createdAt ? dbTenant.createdAt.getTime() : Date.now(),
    
    // New fields from database
    id: dbTenant.id,
    businessName: dbTenant.businessName,
    businessCategory: dbTenant.businessCategory,
    ownerName: dbTenant.ownerName,
    email: dbTenant.email,
    phone: dbTenant.phone,
    address: dbTenant.address,
    businessDescription: dbTenant.businessDescription,
    logo: dbTenant.logo,
    
    // Brand colors
    brandColors: dbTenant.brandColors,
    
    // Feature flags
    whatsappEnabled: dbTenant.whatsappEnabled,
    homeVisitEnabled: dbTenant.homeVisitEnabled,
    analyticsEnabled: dbTenant.analyticsEnabled,
    customTemplatesEnabled: dbTenant.customTemplatesEnabled,
    multiStaffEnabled: dbTenant.multiStaffEnabled,
    
    // Subscription info
    subscriptionPlan: dbTenant.subscriptionPlan,
    subscriptionStatus: dbTenant.subscriptionStatus,
    subscriptionExpiresAt: dbTenant.subscriptionExpiresAt,
    
    updatedAt: dbTenant.updatedAt,
    
    // Computed properties for backward compatibility
    features: {
      whatsapp: dbTenant.whatsappEnabled,
      homeVisit: dbTenant.homeVisitEnabled,
      analytics: dbTenant.analyticsEnabled,
      customTemplates: dbTenant.customTemplatesEnabled,
      multiStaff: dbTenant.multiStaffEnabled,
    },
    subscription: {
      plan: dbTenant.subscriptionPlan as 'basic' | 'premium' | 'enterprise',
      status: dbTenant.subscriptionStatus as 'active' | 'suspended' | 'cancelled',
      expiresAt: dbTenant.subscriptionExpiresAt,
    },
  };
}

// Helper function to check if data is enhanced tenant data
export function isEnhancedTenant(data: any): data is EnhancedTenant {
  return 'businessName' in data && 'ownerName' in data;
}

// Migration function to convert legacy data to enhanced format
export function migrateFromLegacy(subdomain: string, legacyData: any): EnhancedTenant {
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days from now
  
  return {
    // Legacy fields
    subdomain,
    emoji: legacyData.emoji,
    createdAt: legacyData.createdAt || Date.now(),
    
    // New required fields with defaults
    id: `tenant_${subdomain}_${Date.now()}`,
    businessName: `Business ${subdomain}`,
    businessCategory: 'Other',
    ownerName: 'Owner',
    email: '',
    phone: '',
    
    // Feature flags (database format)
    whatsappEnabled: false,
    homeVisitEnabled: false,
    analyticsEnabled: false,
    customTemplatesEnabled: false,
    multiStaffEnabled: false,
    
    // Subscription info (database format)
    subscriptionPlan: 'basic',
    subscriptionStatus: 'active',
    subscriptionExpiresAt: expiresAt,
    
    updatedAt: new Date(),
    
    // Computed properties for backward compatibility
    features: {
      whatsapp: false,
      homeVisit: false,
      analytics: false,
      customTemplates: false,
      multiStaff: false,
    },
    subscription: {
      plan: 'basic',
      status: 'active',
      expiresAt,
    },
  };
}

export async function getAllSubdomains(): Promise<EnhancedTenant[]> {
  try {
    // Get all tenants from database
    const dbTenants = await db.select().from(tenants).orderBy(desc(tenants.createdAt));
    
    // Convert database tenants to EnhancedTenant format
    return dbTenants.map(convertDbToEnhancedTenant);
  } catch (error) {
    console.error('Error getting all subdomains from database:', error);
    return [];
  }
}

// Function to create enhanced tenant data
export async function createEnhancedTenant(registrationData: TenantRegistrationData): Promise<EnhancedTenant> {
  const tenantId = `tenant_${registrationData.subdomain}_${Date.now()}`;
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days trial
  
  const enhancedTenant: EnhancedTenant = {
    // Basic info
    id: tenantId,
    subdomain: registrationData.subdomain,
    emoji: registrationData.icon,
    createdAt: Date.now(),
    
    // Business info
    businessName: registrationData.businessName,
    businessCategory: registrationData.businessCategory,
    ownerName: registrationData.ownerName,
    email: registrationData.email,
    phone: registrationData.phone,
    address: registrationData.address,
    businessDescription: registrationData.businessDescription,
    
    // Feature flags (database format)
    whatsappEnabled: false,
    homeVisitEnabled: false,
    analyticsEnabled: true, // Basic analytics enabled by default
    customTemplatesEnabled: false,
    multiStaffEnabled: false,
    
    // Subscription info (database format)
    subscriptionPlan: 'basic',
    subscriptionStatus: 'active',
    subscriptionExpiresAt: expiresAt,
    
    updatedAt: new Date(),
    
    // Computed properties for backward compatibility
    features: {
      whatsapp: false,
      homeVisit: false,
      analytics: true,
      customTemplates: false,
      multiStaff: false,
    },
    subscription: {
      plan: 'basic',
      status: 'active',
      expiresAt,
    },
  };

  return enhancedTenant;
}