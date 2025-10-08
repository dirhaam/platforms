import { redis } from '@/lib/redis';

export function isValidIcon(str: string) {
  if (str.length > 10) {
    return false;
  }

  try {
    // Primary validation: Check if the string contains at least one emoji character
    // This regex pattern matches most emoji Unicode ranges
    const emojiPattern = /[\p{Emoji}]/u;
    if (emojiPattern.test(str)) {
      return true;
    }
  } catch (error) {
    // If the regex fails (e.g., in environments that don't support Unicode property escapes),
    // fall back to a simpler validation
    console.warn(
      'Emoji regex validation failed, using fallback validation',
      error
    );
  }

  // Fallback validation: Check if the string is within a reasonable length
  // This is less secure but better than no validation
  return str.length >= 1 && str.length <= 10;
}

type SubdomainData = {
  emoji: string;
  createdAt: number;
};

// Enhanced tenant data structure (compatible with database types)
export interface EnhancedTenant {
  // Existing fields from current SubdomainData
  subdomain: string;
  emoji: string;
  createdAt: number;
  
  // New fields for enhanced functionality
  id: string;
  businessName: string;
  businessCategory: string;
  ownerName: string;
  email: string;
  phone: string;
  address?: string;
  businessDescription?: string;
  logo?: string;
  
  // Feature flags (matching database schema)
  whatsappEnabled: boolean;
  homeVisitEnabled: boolean;
  analyticsEnabled: boolean;
  customTemplatesEnabled: boolean;
  multiStaffEnabled: boolean;
  
  // Subscription info
  subscriptionPlan: string;
  subscriptionStatus: string;
  subscriptionExpiresAt?: Date;
  
  updatedAt: Date;
  
  // Computed properties for backward compatibility
  features: {
    whatsapp: boolean;
    homeVisit: boolean;
    analytics: boolean;
    customTemplates: boolean;
    multiStaff: boolean;
  };
  subscription: {
    plan: 'basic' | 'premium' | 'enterprise';
    status: 'active' | 'suspended' | 'cancelled';
    expiresAt?: Date;
  };
}

// Business categories for registration
export const BUSINESS_CATEGORIES = [
  'Beauty & Wellness',
  'Healthcare',
  'Fitness & Sports',
  'Education & Training',
  'Professional Services',
  'Home Services',
  'Automotive',
  'Food & Beverage',
  'Entertainment',
  'Other'
] as const;

export type BusinessCategory = typeof BUSINESS_CATEGORIES[number];

// Registration data interface
export interface TenantRegistrationData {
  // Existing fields
  subdomain: string;
  icon: string;
  
  // New fields
  businessName: string;
  ownerName: string;
  email: string;
  phone: string;
  businessCategory: BusinessCategory;
  businessDescription?: string;
  address?: string;
}

export async function getSubdomainData(subdomain: string): Promise<SubdomainData | EnhancedTenant | null> {
  const sanitizedSubdomain = subdomain.toLowerCase().replace(/[^a-z0-9-]/g, '');
  
  // Try to get from migration service first (includes PostgreSQL fallback)
  try {
    const { getSubdomainDataWithFallback } = await import('./migration/tenant-migration');
    const data = await getSubdomainDataWithFallback(sanitizedSubdomain);
    return data;
  } catch (error) {
    console.warn('Migration service unavailable, falling back to Redis:', error);
    
    // Fallback to direct Redis access
    const data = await redis.get<SubdomainData | EnhancedTenant>(
      `subdomain:${sanitizedSubdomain}`
    );
    return data;
  }
}

// Helper function to check if data is enhanced tenant data
export function isEnhancedTenant(data: SubdomainData | EnhancedTenant): data is EnhancedTenant {
  return 'businessName' in data && 'ownerName' in data;
}

// Migration function to convert legacy data to enhanced format
export function migrateFromLegacy(subdomain: string, legacyData: SubdomainData): EnhancedTenant {
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days from now
  
  return {
    // Legacy fields
    subdomain,
    emoji: legacyData.emoji,
    createdAt: legacyData.createdAt,
    
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
    // Try to get from PostgreSQL first
    const { prisma } = await import('./database');
    const { TenantMigrationService } = await import('./migration/tenant-migration');
    
    const pgTenants = await prisma.tenant.findMany({
      orderBy: { createdAt: 'desc' },
    });

    if (pgTenants.length > 0) {
      return pgTenants.map(tenant => TenantMigrationService.convertPrismaToEnhanced(tenant));
    }
  } catch (error) {
    console.warn('PostgreSQL unavailable, falling back to Redis:', error);
  }

  // Fallback to Redis
  const keys = await redis.keys('subdomain:*');

  if (!keys.length) {
    return [];
  }

  const values = await redis.mget<(SubdomainData | EnhancedTenant)[]>(...keys);

  return keys.map((key, index) => {
    const subdomain = key.replace('subdomain:', '');
    const data = values[index];

    if (!data) {
      // Return minimal enhanced tenant for missing data
      return migrateFromLegacy(subdomain, {
        emoji: '❓',
        createdAt: Date.now()
      });
    }

    // If it's already enhanced data, return as is
    if (isEnhancedTenant(data)) {
      return { ...data, subdomain };
    }

    // If it's legacy data, migrate it
    return migrateFromLegacy(subdomain, data);
  });
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
