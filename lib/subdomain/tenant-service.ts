import { getSubdomainData, isEnhancedTenant } from '@/lib/subdomains';
import { getRecommendedTemplate, type LandingPageTemplate } from '@/lib/templates/landing-page-templates';
import { CacheService } from '@/lib/cache/cache-service';
import { PerformanceMonitor } from '@/lib/performance/performance-monitor';
import { Service } from '@/types/booking';

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
        // Try to get from cache first
        const cached = await CacheService.getTenantBySubdomain(subdomain);
        if (cached) {
          return this.formatTenantLandingData(cached);
        }

        const subdomainData = await getSubdomainData(subdomain);
        
        if (!subdomainData) {
          return null;
        }

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
      const template = getRecommendedTemplate(subdomainData.businessCategory);
      
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
          // Try to get services from PostgreSQL
          const { prisma } = await import('@/lib/database');
          
          const services = await prisma.service.findMany({
            where: {
              tenantId,
              isActive: true,
            },
            orderBy: {
              createdAt: 'desc',
            },
          });

          const formattedServices: Service[] = services.map(service => ({
            id: service.id,
            tenantId: service.tenantId,
            name: service.name,
            description: service.description,
            duration: service.duration,
            price: service.price,
            category: service.category,
            isActive: service.isActive,
            homeVisitAvailable: service.homeVisitAvailable,
            homeVisitSurcharge: service.homeVisitSurcharge || undefined,
            images: service.images,
            requirements: service.requirements,
            createdAt: service.createdAt,
            updatedAt: service.updatedAt,
          }));

          // Cache the result
          await CacheService.setServicesByTenant(tenantId, formattedServices);

          return formattedServices;
        } catch (error) {
          console.warn('Could not fetch services from database:', error);
          
          // Return sample services for demo purposes
          const sampleServices = await this.getSampleServices();
          
          // Cache sample services with shorter TTL
          await CacheService.setServicesByTenant(tenantId, sampleServices);
          
          return sampleServices;
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
          // Try to get business hours from PostgreSQL
          const { prisma } = await import('@/lib/database');
          
          const businessHours = await prisma.businessHours.findUnique({
            where: {
              tenantId,
            },
          });

          let result: BusinessHours;
          
          if (businessHours && businessHours.schedule) {
            result = businessHours.schedule as BusinessHours;
          } else {
            result = this.getDefaultBusinessHours();
          }

          // Cache the result
          await CacheService.setBusinessHours(tenantId, result);

          return result;
        } catch (error) {
          console.warn('Could not fetch business hours from database:', error);
          
          // Return default business hours
          const defaultHours = this.getDefaultBusinessHours();
          
          // Cache default hours with shorter TTL
          await CacheService.setBusinessHours(tenantId, defaultHours);
          
          return defaultHours;
        }
      },
      tenantId
    );
  }

  private static async getSampleServices(): Promise<Service[]> {
    const { Decimal } = await import('@prisma/client/runtime/library');
    const now = new Date();
    return [
      {
        id: 'sample-1',
        tenantId: 'sample-tenant',
        name: 'Consultation',
        description: 'Initial consultation to understand your needs',
        duration: 30,
        price: new Decimal(50),
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
        price: new Decimal(100),
        category: 'Standard',
        isActive: true,
        homeVisitAvailable: true,
        homeVisitSurcharge: new Decimal(25),
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
        price: new Decimal(150),
        category: 'Premium',
        isActive: true,
        homeVisitAvailable: true,
        homeVisitSurcharge: new Decimal(35),
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