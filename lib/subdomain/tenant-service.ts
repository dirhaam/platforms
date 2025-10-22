import { getSubdomainData, isEnhancedTenant } from '@/lib/subdomains';
import { getRecommendedTemplate, getTemplateById, type LandingPageTemplate } from '@/lib/templates/landing-page-templates';
import { CacheService } from '@/lib/cache/cache-service';
import { PerformanceMonitor } from '@/lib/performance/performance-monitor';
import { Service } from '@/types/booking';
import { createClient } from '@supabase/supabase-js';

const getSupabaseClient = () => {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
};

export interface TenantLandingData {
  id: string;
  subdomain: string;
  emoji: string;
  businessName: string;
  businessCategory: string;
  ownerName: string;
  email: string;
  phone: string;
  address?: string;
  businessDescription?: string;
  logo?: string;
  brandColors?: {
    primary: string;
    secondary: string;
    accent: string;
  };
  template: LandingPageTemplate;
}

export interface BusinessHours {
  [key: string]: {
    isOpen: boolean;
    openTime: string;
    closeTime: string;
  };
}

export class TenantService {
  static async getTenantLandingData(subdomain: string): Promise<TenantLandingData | null> {
    return await PerformanceMonitor.monitorDatabaseQuery(
      'getTenantLandingData',
      async () => {
        console.log(`[getTenantLandingData] Starting for subdomain: ${subdomain}`);
        
        // Try to get from cache first
        const cached = await CacheService.getTenantBySubdomain(subdomain);
        if (cached) {
          console.log(`[getTenantLandingData] Found in cache for subdomain: ${subdomain}`);
          return this.formatTenantLandingData(cached);
        }

        console.log(`[getTenantLandingData] Not in cache, fetching from DB for subdomain: ${subdomain}`);
        const subdomainData = await getSubdomainData(subdomain);
        
        if (!subdomainData) {
          console.error(`[getTenantLandingData] No data found for subdomain: ${subdomain}`);
          return null;
        }

        console.log(`[getTenantLandingData] Data found:`, { subdomain, businessName: subdomainData.businessName });

        // Cache the result
        await CacheService.setTenantBySubdomain(subdomain, subdomainData);

        return this.formatTenantLandingData(subdomainData);
      },
      subdomain
    );
  }

  private static formatTenantLandingData(subdomainData: any): TenantLandingData {
    // Handle both legacy and enhanced tenant data
    if (isEnhancedTenant(subdomainData)) {
      // Use template from database if available, otherwise use recommended template
      let template;
      // Check for templateId using type assertion since it's not part of EnhancedTenant interface
      // but might be present in the raw database response
      const templateId = (subdomainData as any).templateId;
      if (templateId && typeof templateId === 'string') {
        template = getTemplateById(templateId) || getRecommendedTemplate(subdomainData.businessCategory);
      } else {
        template = getRecommendedTemplate(subdomainData.businessCategory);
      }
      
      return {
        id: subdomainData.id,
        subdomain: subdomainData.subdomain,
        emoji: subdomainData.emoji,
        businessName: subdomainData.businessName,
        businessCategory: subdomainData.businessCategory,
        ownerName: subdomainData.ownerName,
        email: subdomainData.email,
        phone: subdomainData.phone,
        address: subdomainData.address,
        businessDescription: subdomainData.businessDescription,
        logo: subdomainData.logo,
        brandColors: subdomainData.brandColors,
        template,
      };
    } else {
      // Handle legacy data with defaults
      const template = getRecommendedTemplate('Other');
      
      return {
        id: `legacy_${subdomainData.subdomain}`,
        subdomain: subdomainData.subdomain,
        emoji: subdomainData.emoji,
        businessName: `Business ${subdomainData.subdomain}`,
        businessCategory: 'Other',
        ownerName: 'Owner',
        email: '',
        phone: '',
        template,
      };
    }
  }

  static async getTenantServices(tenantId: string): Promise<Service[]> {
    return await PerformanceMonitor.monitorDatabaseQuery(
      'getTenantServices',
      async () => {
        // Try to get from cache first
        const cached = await CacheService.getServicesByTenant(tenantId);
        if (cached && Array.isArray(cached)) {
          return cached as Service[];
        }

        try {
          const supabase = getSupabaseClient();
          
          const { data: services, error } = await supabase
            .from('services')
            .select('*')
            .eq('tenant_id', tenantId)
            .eq('is_active', true)
            .order('created_at', { ascending: false });

          if (error) {
            console.error('Error fetching services:', error);
            throw error;
          }

          const formattedServices: Service[] = (services || []).map(service => {
            const createdAt = service.created_at ? new Date(service.created_at) : new Date();
            const updatedAt = service.updated_at ? new Date(service.updated_at) : new Date();

            return {
              id: service.id,
              tenantId: service.tenant_id,
              name: service.name,
              description: service.description,
              duration: service.duration,
              price: Number(service.price ?? 0),
              category: service.category,
              isActive: service.is_active ?? true,
              homeVisitAvailable: service.home_visit_available ?? false,
              homeVisitSurcharge: service.home_visit_surcharge !== null && service.home_visit_surcharge !== undefined
                ? Number(service.home_visit_surcharge)
                : undefined,
              images: service.images ?? [],
              requirements: service.requirements ?? [],
              createdAt,
              updatedAt,
            };
          });

          // Cache the result
          await CacheService.setServicesByTenant(tenantId, formattedServices);

          return formattedServices;
        } catch (error) {
          console.warn('Could not fetch services from database:', error);
          
          // Return empty array if no services found. This ensures 
          // we only show data that comes from admin dashboard
          const emptyServices: Service[] = [];
          
          // Cache empty result to prevent repeated failed calls
          await CacheService.setServicesByTenant(tenantId, emptyServices);
          
          return emptyServices;
        }
      },
      tenantId
    );
  }

  static async getTenantBusinessHours(tenantId: string): Promise<BusinessHours | null> {
    return await PerformanceMonitor.monitorDatabaseQuery(
      'getTenantBusinessHours',
      async () => {
        // Try to get from cache first
        const cached = await CacheService.getBusinessHours(tenantId);
        if (cached && typeof cached === 'object') {
          return cached as BusinessHours;
        }

        try {
          const supabase = getSupabaseClient();
          
          const { data: records, error } = await supabase
            .from('business_hours')
            .select('*')
            .eq('tenant_id', tenantId)
            .limit(1);
          
          if (error) {
            console.error('Error fetching business hours:', error);
            throw error;
          }
          
          const record = records && records.length > 0 ? records[0] : null;
          const result: BusinessHours = record?.schedule
            ? (record.schedule as BusinessHours)
            : this.getDefaultBusinessHours();

          await CacheService.setBusinessHours(tenantId, result);

          return result;
        } catch (error) {
          console.warn('Could not fetch business hours from database:', error);
          
          // Return null if no business hours found. This ensures 
          // we only show data that comes from admin dashboard
          const noHours: BusinessHours | null = null;
          
          // Cache null result to prevent repeated failed calls
          await CacheService.setBusinessHours(tenantId, null);
          
          return null;
        }
      },
      tenantId
    );
  }

  private static async getSampleServices(): Promise<Service[]> {
    const now = new Date();
    return [
      {
        id: 'sample-1',
        tenantId: 'sample-tenant',
        name: 'Consultation',
        description: 'Initial consultation to understand your needs',
        duration: 30,
        price: 50,
        category: 'Consultation',
        isActive: true,
        homeVisitAvailable: false,
        homeVisitSurcharge: undefined,
        images: [],
        requirements: [],
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'sample-2',
        tenantId: 'sample-tenant',
        name: 'Standard Service',
        description: 'Our most popular service package',
        duration: 60,
        price: 100,
        category: 'Standard',
        isActive: true,
        homeVisitAvailable: true,
        homeVisitSurcharge: 25,
        images: [],
        requirements: [],
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'sample-3',
        tenantId: 'sample-tenant',
        name: 'Premium Service',
        description: 'Comprehensive premium service with extras',
        duration: 90,
        price: 150,
        category: 'Premium',
        isActive: true,
        homeVisitAvailable: true,
        homeVisitSurcharge: 35,
        images: [],
        requirements: [],
        createdAt: now,
        updatedAt: now,
      },
    ];
  }

  private static getDefaultBusinessHours(): BusinessHours {
    return {
      monday: { isOpen: true, openTime: '09:00', closeTime: '17:00' },
      tuesday: { isOpen: true, openTime: '09:00', closeTime: '17:00' },
      wednesday: { isOpen: true, openTime: '09:00', closeTime: '17:00' },
      thursday: { isOpen: true, openTime: '09:00', closeTime: '17:00' },
      friday: { isOpen: true, openTime: '09:00', closeTime: '17:00' },
      saturday: { isOpen: true, openTime: '10:00', closeTime: '15:00' },
      sunday: { isOpen: false, openTime: '', closeTime: '' },
    };
  }
}