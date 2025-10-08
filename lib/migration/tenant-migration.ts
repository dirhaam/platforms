import { redis } from '@/lib/redis';
import { prisma } from '@/lib/database';
import type { 
  LegacySubdomainData, 
  MigrationResult,
  EnhancedTenant,
  Tenant as PrismaTenant
} from '@/types/database';
import { 
  isEnhancedTenant, 
  migrateFromLegacy
} from '@/lib/subdomains';
import { TenantValidation } from '@/lib/validation/tenant-validation';

/**
 * Tenant Migration System
 * Handles migration of tenant data from Redis to PostgreSQL
 * Maintains backward compatibility with existing Redis data
 */
export class TenantMigrationService {
  
  /**
   * Check if data is legacy SubdomainData format
   */
  static isLegacyData(data: any): data is LegacySubdomainData {
    return data && 
           typeof data.emoji === 'string' && 
           typeof data.createdAt === 'number' && 
           !data.businessName;
  }

  /**
   * Check if data is enhanced tenant format
   */
  static isEnhancedTenant(data: any): data is EnhancedTenant {
    return data && 
           typeof data.businessName === 'string' && 
           typeof data.ownerName === 'string' &&
           typeof data.email === 'string';
  }



  /**
   * Migrate all tenant data from Redis to PostgreSQL
   */
  static async migrateAllTenants(): Promise<MigrationResult> {
    const result: MigrationResult = {
      success: true,
      migratedCount: 0,
      errors: [],
      skippedCount: 0,
    };

    try {
      // Get all subdomain keys from Redis
      const keys = await redis.keys('subdomain:*');
      
      if (!keys.length) {
        console.log('No tenant data found in Redis');
        return result;
      }

      console.log(`Found ${keys.length} tenants in Redis`);

      // Get all data from Redis
      const values = await redis.mget<(LegacySubdomainData | EnhancedTenant)[]>(...keys);

      // Process each tenant
      for (let i = 0; i < keys.length; i++) {
        const key = keys[i];
        const data = values[i];
        const subdomain = key.replace('subdomain:', '');

        if (!data) {
          result.errors.push(`No data found for subdomain: ${subdomain}`);
          result.skippedCount++;
          continue;
        }

        try {
          await this.migrateSingleTenant(subdomain, data);
          result.migratedCount++;
          console.log(`✓ Migrated tenant: ${subdomain}`);
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          result.errors.push(`Failed to migrate ${subdomain}: ${errorMessage}`);
          result.skippedCount++;
          console.error(`✗ Failed to migrate tenant: ${subdomain}`, error);
        }
      }

      if (result.errors.length > 0) {
        result.success = false;
      }

      console.log(`Migration completed: ${result.migratedCount} migrated, ${result.skippedCount} skipped`);
      return result;

    } catch (error) {
      result.success = false;
      result.errors.push(error instanceof Error ? error.message : 'Unknown migration error');
      console.error('Migration failed:', error);
      return result;
    }
  }

  /**
   * Migrate a single tenant from Redis to PostgreSQL
   */
  static async migrateSingleTenant(
    subdomain: string, 
    redisData: LegacySubdomainData | EnhancedTenant
  ): Promise<void> {
    // Check if tenant already exists in PostgreSQL
    const existingTenant = await prisma.tenant.findUnique({
      where: { subdomain },
    });

    if (existingTenant) {
      console.log(`Tenant ${subdomain} already exists in PostgreSQL, skipping`);
      return;
    }

    // Convert Redis data to enhanced tenant format
    let enhancedData: EnhancedTenant;
    
    if (this.isEnhancedTenant(redisData)) {
      enhancedData = { ...redisData, subdomain };
    } else {
      enhancedData = migrateFromLegacy(subdomain, redisData);
    }

    // Validate the data before migration
    const validation = TenantValidation.validateTenantData(enhancedData);
    if (!validation.isValid) {
      throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
    }

    // Sanitize data before storage
    const sanitizedData = TenantValidation.sanitizeTenantData(enhancedData);

    // Create tenant in PostgreSQL
    await prisma.tenant.create({
      data: {
        id: sanitizedData.id!,
        subdomain: sanitizedData.subdomain!,
        emoji: sanitizedData.emoji!,
        businessName: sanitizedData.businessName!,
        businessCategory: sanitizedData.businessCategory!,
        ownerName: sanitizedData.ownerName!,
        email: sanitizedData.email!,
        phone: sanitizedData.phone!,
        address: sanitizedData.address,
        businessDescription: sanitizedData.businessDescription,
        logo: sanitizedData.logo,
        
        // Brand colors as JSON
        brandColors: sanitizedData.brandColors || undefined,
        
        // Feature flags
        whatsappEnabled: sanitizedData.features?.whatsapp || false,
        homeVisitEnabled: sanitizedData.features?.homeVisit || false,
        analyticsEnabled: sanitizedData.features?.analytics || false,
        customTemplatesEnabled: sanitizedData.features?.customTemplates || false,
        multiStaffEnabled: sanitizedData.features?.multiStaff || false,
        
        // Subscription info
        subscriptionPlan: sanitizedData.subscription?.plan || 'basic',
        subscriptionStatus: sanitizedData.subscription?.status || 'active',
        subscriptionExpiresAt: sanitizedData.subscription?.expiresAt,
        
        // Timestamps
        createdAt: new Date(sanitizedData.createdAt!),
        updatedAt: sanitizedData.updatedAt || new Date(),
      },
    });
  }

  /**
   * Validate migration data before processing
   */
  static validateMigrationData(data: any): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!data) {
      errors.push('No data provided');
      return { isValid: false, errors };
    }

    // Check if it's legacy data
    if (this.isLegacyData(data)) {
      if (!data.emoji) {
        errors.push('Legacy data missing emoji');
      }
      if (!data.createdAt) {
        errors.push('Legacy data missing createdAt');
      }
    } else if (this.isEnhancedTenant(data)) {
      // Use the comprehensive validation from TenantValidation
      const validation = TenantValidation.validateTenantData(data);
      return { isValid: validation.isValid, errors: validation.errors };
    } else {
      errors.push('Invalid data format - not legacy or enhanced tenant data');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Create backward compatibility layer
   * Ensures existing Redis-based code continues to work
   */
  static async getSubdomainDataWithFallback(subdomain: string): Promise<EnhancedTenant | null> {
    try {
      // First, try to get from PostgreSQL
      const tenant = await prisma.tenant.findUnique({
        where: { subdomain },
      });

      if (tenant) {
        // Convert PostgreSQL data to EnhancedTenant format
        return this.convertPrismaToEnhanced(tenant);
      }

      // Fallback to Redis if not found in PostgreSQL
      const redisData = await redis.get<LegacySubdomainData | EnhancedTenant>(
        `subdomain:${subdomain}`
      );

      if (!redisData) {
        return null;
      }

      // If it's legacy data, migrate it on-the-fly
      if (this.isLegacyData(redisData)) {
        const enhancedData = migrateFromLegacy(subdomain, redisData);
        
        // Optionally migrate to PostgreSQL immediately
        try {
          await this.migrateSingleTenant(subdomain, redisData);
        } catch (error) {
          console.warn(`Failed to auto-migrate tenant ${subdomain}:`, error);
        }
        
        return enhancedData;
      }

      // If it's already enhanced data, return it
      if (this.isEnhancedTenant(redisData)) {
        return redisData as EnhancedTenant;
      }

      return null;

    } catch (error) {
      console.error(`Error getting subdomain data for ${subdomain}:`, error);
      return null;
    }
  }

  /**
   * Convert Prisma tenant data to EnhancedTenant format
   */
  static convertPrismaToEnhanced(tenant: PrismaTenant): EnhancedTenant {
    // Parse brand colors from JSON
    let brandColors: { primary: string; secondary: string; accent: string; } | undefined;
    if (tenant.brandColors) {
      try {
        brandColors = JSON.parse(tenant.brandColors as string);
      } catch (error) {
        console.warn('Failed to parse brand colors:', error);
      }
    }

    return {
      id: tenant.id,
      subdomain: tenant.subdomain,
      emoji: tenant.emoji,
      createdAt: tenant.createdAt.getTime(),
      businessName: tenant.businessName,
      businessCategory: tenant.businessCategory,
      ownerName: tenant.ownerName,
      email: tenant.email,
      phone: tenant.phone,
      address: tenant.address || undefined,
      businessDescription: tenant.businessDescription || undefined,
      logo: tenant.logo || undefined,
      brandColors,
      features: {
        whatsapp: tenant.whatsappEnabled,
        homeVisit: tenant.homeVisitEnabled,
        analytics: tenant.analyticsEnabled,
        customTemplates: tenant.customTemplatesEnabled,
        multiStaff: tenant.multiStaffEnabled,
      },
      subscription: {
        plan: tenant.subscriptionPlan as 'basic' | 'premium' | 'enterprise',
        status: tenant.subscriptionStatus as 'active' | 'suspended' | 'cancelled',
        expiresAt: tenant.subscriptionExpiresAt || undefined,
      },
      updatedAt: tenant.updatedAt,
    };
  }

  /**
   * Sync tenant data between Redis and PostgreSQL
   * Useful for maintaining consistency during transition period
   */
  static async syncTenantData(subdomain: string): Promise<void> {
    const pgTenant = await prisma.tenant.findUnique({
      where: { subdomain },
    });

    if (!pgTenant) {
      throw new Error(`Tenant ${subdomain} not found in PostgreSQL`);
    }

    const enhancedData = this.convertPrismaToEnhanced(pgTenant);

    // Update Redis with PostgreSQL data
    await redis.set(`subdomain:${subdomain}`, enhancedData);
  }

  /**
   * Data integrity check
   * Compares data between Redis and PostgreSQL
   */
  static async checkDataIntegrity(): Promise<{
    consistent: boolean;
    inconsistencies: string[];
    redisOnly: string[];
    postgresOnly: string[];
  }> {
    const result = {
      consistent: true,
      inconsistencies: [] as string[],
      redisOnly: [] as string[],
      postgresOnly: [] as string[],
    };

    try {
      // Get all subdomains from Redis
      const redisKeys = await redis.keys('subdomain:*');
      const redisSubdomains = redisKeys.map(key => key.replace('subdomain:', ''));

      // Get all subdomains from PostgreSQL
      const pgTenants = await prisma.tenant.findMany({
        select: { subdomain: true },
      });
      const pgSubdomains = pgTenants.map(t => t.subdomain);

      // Find Redis-only subdomains
      result.redisOnly = redisSubdomains.filter(s => !pgSubdomains.includes(s));

      // Find PostgreSQL-only subdomains
      result.postgresOnly = pgSubdomains.filter(s => !redisSubdomains.includes(s));

      // Check for inconsistencies in common subdomains
      const commonSubdomains = redisSubdomains.filter(s => pgSubdomains.includes(s));
      
      for (const subdomain of commonSubdomains) {
        try {
          const redisData = await redis.get<LegacySubdomainData | EnhancedTenant>(
            `subdomain:${subdomain}`
          );
          const pgTenant = await prisma.tenant.findUnique({
            where: { subdomain },
          });

          if (!redisData || !pgTenant) {
            result.inconsistencies.push(`Missing data for ${subdomain}`);
            continue;
          }

          // Basic consistency check
          if (redisData.emoji !== pgTenant.emoji) {
            result.inconsistencies.push(`Emoji mismatch for ${subdomain}`);
          }
        } catch (error) {
          result.inconsistencies.push(`Error checking ${subdomain}: ${error}`);
        }
      }

      result.consistent = result.inconsistencies.length === 0 && 
                         result.redisOnly.length === 0 && 
                         result.postgresOnly.length === 0;

      return result;

    } catch (error) {
      result.consistent = false;
      result.inconsistencies.push(`Integrity check failed: ${error}`);
      return result;
    }
  }
}

// Export convenience functions
export const {
  migrateAllTenants,
  migrateSingleTenant,
  getSubdomainDataWithFallback,
  syncTenantData,
  checkDataIntegrity,
} = TenantMigrationService;