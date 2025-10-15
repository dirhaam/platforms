import { supabase } from '@/lib/database';
import { getTenant, setTenant, deleteTenant } from '@/lib/database-service';
import { EnhancedTenant, TenantRegistrationData, BusinessCategory, isValidIcon } from '@/lib/subdomain-constants';

export async function getSubdomainData(subdomain: string): Promise<EnhancedTenant | null> {
  const sanitizedSubdomain = subdomain.toLowerCase().replace(/[^a-z0-9-]/g, '');

  try {
    const existing = await getTenant(sanitizedSubdomain);
    if (!existing) {
      return null;
    }

    if (isEnhancedTenant(existing)) {
      return existing;
    }

    return migrateFromLegacy(sanitizedSubdomain, existing);
  } catch (error) {
    console.error('Error getting subdomain data:', error);
    return null;
  }
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
    const { data, error } = await supabase
      .from('tenant_subdomains')
      .select('subdomain, tenant_data')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error getting all subdomains from Supabase:', error);
      return [];
    }

    return (data ?? [])
      .map(row => {
        if (row?.tenant_data && isEnhancedTenant(row.tenant_data)) {
          return row.tenant_data as EnhancedTenant;
        }
        if (row?.tenant_data) {
          return migrateFromLegacy(row.subdomain, row.tenant_data);
        }
        return null;
      })
      .filter((tenant): tenant is EnhancedTenant => tenant !== null);
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