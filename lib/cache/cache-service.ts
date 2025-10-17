import {
  getCache as supabaseGetCache,
  setCache as supabaseSetCache,
  deleteCache as supabaseDeleteCache,
  deleteCacheByPattern as supabaseDeleteCacheByPattern,
  listCacheKeys as supabaseListCacheKeys,
} from '@/lib/database-service';
import { createClient } from '@supabase/supabase-js';

// Cache configuration
export const CACHE_CONFIG = {
  TTL: {
    TENANT: 60 * 60, // 1 hour
    BOOKING: 30 * 60, // 30 minutes
    CUSTOMER: 60 * 60, // 1 hour
    SERVICE: 2 * 60 * 60, // 2 hours
    ANALYTICS: 15 * 60, // 15 minutes
    BUSINESS_HOURS: 24 * 60 * 60, // 24 hours
    STAFF: 60 * 60, // 1 hour
    SETTINGS: 2 * 60 * 60, // 2 hours
  },
  KEYS: {
    TENANT: (id: string) => `tenant:${id}`,
    TENANT_BY_SUBDOMAIN: (subdomain: string) => `tenant:subdomain:${subdomain}`,
    BOOKING: (id: string) => `booking:${id}`,
    BOOKINGS_BY_TENANT: (tenantId: string, date?: string) => 
      `bookings:tenant:${tenantId}${date ? `:${date}` : ''}`,
    CUSTOMER: (id: string) => `customer:${id}`,
    CUSTOMERS_BY_TENANT: (tenantId: string) => `customers:tenant:${tenantId}`,
    SERVICE: (id: string) => `service:${id}`,
    SERVICES_BY_TENANT: (tenantId: string) => `services:tenant:${tenantId}`,
    ANALYTICS: (tenantId: string, type: string, period: string) => 
      `analytics:${tenantId}:${type}:${period}`,
    BUSINESS_HOURS: (tenantId: string) => `business_hours:${tenantId}`,
    STAFF: (id: string) => `staff:${id}`,
    STAFF_BY_TENANT: (tenantId: string) => `staff:tenant:${tenantId}`,
    SETTINGS: (tenantId: string, type: string) => `settings:${tenantId}:${type}`,
  },
} as const;

export interface CacheOptions {
  ttl?: number;
  tags?: string[];
}

export class CacheService {
  // Generic get method
  static async get<T>(key: string): Promise<T | null> {
    try {
      const data = await supabaseGetCache(key);
      return data as T | null;
    } catch (error) {
      console.error(`Cache get error for key ${key}:`, error);
      return null;
    }
  }

  // Generic set method
  static async set<T>(
    key: string, 
    value: T, 
    options: CacheOptions = {}
  ): Promise<void> {
    try {
      const { ttl } = options;
      await supabaseSetCache(key, value, ttl);
    } catch (error) {
      console.error(`Cache set error for key ${key}:`, error);
    }
  }

  // Delete single key
  static async delete(key: string): Promise<void> {
    try {
      await supabaseDeleteCache(key);
    } catch (error) {
      console.error(`Cache delete error for key ${key}:`, error);
    }
  }

  // Delete multiple keys
  static async deleteMany(keys: string[]): Promise<void> {
    try {
      if (keys.length > 0) {
        await Promise.all(keys.map(key => supabaseDeleteCache(key)));
      }
    } catch (error) {
      console.error(`Cache delete many error:`, error);
    }
  }

  // Delete keys by pattern
  static async deleteByPattern(pattern: string): Promise<void> {
    try {
      await supabaseDeleteCacheByPattern(pattern);
    } catch (error) {
      console.error(`Cache delete by pattern error for ${pattern}:`, error);
    }
  }

  // Check if key exists
  static async exists(key: string): Promise<boolean> {
    try {
      const value = await supabaseGetCache(key);
      return value !== null && value !== undefined;
    } catch (error) {
      console.error(`Cache exists error for key ${key}:`, error);
      return false;
    }
  }

  // Get or set pattern (cache-aside)
  static async getOrSet<T>(
    key: string,
    fetcher: () => Promise<T>,
    options: CacheOptions = {}
  ): Promise<T> {
    try {
      // Try to get from cache first
      const cached = await this.get<T>(key);
      if (cached !== null) {
        return cached;
      }

      // If not in cache, fetch data
      const data = await fetcher();
      
      // Store in cache
      await this.set(key, data, options);
      
      return data;
    } catch (error) {
      console.error(`Cache getOrSet error for key ${key}:`, error);
      // If cache fails, still return the fetched data
      return await fetcher();
    }
  }

  // Tenant-specific methods
  static async getTenant(tenantId: string) {
    return await this.get(CACHE_CONFIG.KEYS.TENANT(tenantId));
  }

  static async setTenant(tenantId: string, tenant: any) {
    await this.set(
      CACHE_CONFIG.KEYS.TENANT(tenantId), 
      tenant, 
      { ttl: CACHE_CONFIG.TTL.TENANT }
    );
  }

  static async getTenantBySubdomain(subdomain: string) {
    return await this.get(CACHE_CONFIG.KEYS.TENANT_BY_SUBDOMAIN(subdomain));
  }

  static async setTenantBySubdomain(subdomain: string, tenant: any) {
    await this.set(
      CACHE_CONFIG.KEYS.TENANT_BY_SUBDOMAIN(subdomain), 
      tenant, 
      { ttl: CACHE_CONFIG.TTL.TENANT }
    );
  }

  static async invalidateTenant(tenantId: string, subdomain?: string) {
    const keys = [CACHE_CONFIG.KEYS.TENANT(tenantId)];
    if (subdomain) {
      keys.push(CACHE_CONFIG.KEYS.TENANT_BY_SUBDOMAIN(subdomain));
    }
    await this.deleteMany(keys);
  }

  // Booking-specific methods
  static async getBooking(bookingId: string) {
    return await this.get(CACHE_CONFIG.KEYS.BOOKING(bookingId));
  }

  static async setBooking(bookingId: string, booking: any) {
    await this.set(
      CACHE_CONFIG.KEYS.BOOKING(bookingId), 
      booking, 
      { ttl: CACHE_CONFIG.TTL.BOOKING }
    );
  }

  static async getBookingsByTenant(tenantId: string, date?: string) {
    return await this.get(CACHE_CONFIG.KEYS.BOOKINGS_BY_TENANT(tenantId, date));
  }

  static async setBookingsByTenant(tenantId: string, bookings: any[], date?: string) {
    await this.set(
      CACHE_CONFIG.KEYS.BOOKINGS_BY_TENANT(tenantId, date), 
      bookings, 
      { ttl: CACHE_CONFIG.TTL.BOOKING }
    );
  }

  static async invalidateBookings(tenantId: string, bookingId?: string) {
    const patterns = [
      `bookings:tenant:${tenantId}*`,
    ];
    
    if (bookingId) {
      patterns.push(CACHE_CONFIG.KEYS.BOOKING(bookingId));
    }

    for (const pattern of patterns) {
      await this.deleteByPattern(pattern);
    }
  }

  // Customer-specific methods
  static async getCustomer(customerId: string) {
    return await this.get(CACHE_CONFIG.KEYS.CUSTOMER(customerId));
  }

  static async setCustomer(customerId: string, customer: any) {
    await this.set(
      CACHE_CONFIG.KEYS.CUSTOMER(customerId), 
      customer, 
      { ttl: CACHE_CONFIG.TTL.CUSTOMER }
    );
  }

  static async getCustomersByTenant(tenantId: string) {
    return await this.get(CACHE_CONFIG.KEYS.CUSTOMERS_BY_TENANT(tenantId));
  }

  static async setCustomersByTenant(tenantId: string, customers: any[]) {
    await this.set(
      CACHE_CONFIG.KEYS.CUSTOMERS_BY_TENANT(tenantId), 
      customers, 
      { ttl: CACHE_CONFIG.TTL.CUSTOMER }
    );
  }

  static async invalidateCustomers(tenantId: string, customerId?: string) {
    const keys = [CACHE_CONFIG.KEYS.CUSTOMERS_BY_TENANT(tenantId)];
    
    if (customerId) {
      keys.push(CACHE_CONFIG.KEYS.CUSTOMER(customerId));
    }

    await this.deleteMany(keys);
  }

  // Service-specific methods
  static async getService(serviceId: string) {
    return await this.get(CACHE_CONFIG.KEYS.SERVICE(serviceId));
  }

  static async setService(serviceId: string, service: any) {
    await this.set(
      CACHE_CONFIG.KEYS.SERVICE(serviceId), 
      service, 
      { ttl: CACHE_CONFIG.TTL.SERVICE }
    );
  }

  static async getServicesByTenant(tenantId: string) {
    return await this.get(CACHE_CONFIG.KEYS.SERVICES_BY_TENANT(tenantId));
  }

  static async setServicesByTenant(tenantId: string, services: any[]) {
    await this.set(
      CACHE_CONFIG.KEYS.SERVICES_BY_TENANT(tenantId), 
      services, 
      { ttl: CACHE_CONFIG.TTL.SERVICE }
    );
  }

  static async invalidateServices(tenantId: string, serviceId?: string) {
    const keys = [CACHE_CONFIG.KEYS.SERVICES_BY_TENANT(tenantId)];
    
    if (serviceId) {
      keys.push(CACHE_CONFIG.KEYS.SERVICE(serviceId));
    }

    await this.deleteMany(keys);
  }

  // Analytics-specific methods
  static async getAnalytics(tenantId: string, type: string, period: string) {
    return await this.get(CACHE_CONFIG.KEYS.ANALYTICS(tenantId, type, period));
  }

  static async setAnalytics(tenantId: string, type: string, period: string, data: any) {
    await this.set(
      CACHE_CONFIG.KEYS.ANALYTICS(tenantId, type, period), 
      data, 
      { ttl: CACHE_CONFIG.TTL.ANALYTICS }
    );
  }

  static async invalidateAnalytics(tenantId: string) {
    await this.deleteByPattern(`analytics:${tenantId}:*`);
  }

  // Business hours methods
  static async getBusinessHours(tenantId: string) {
    return await this.get(CACHE_CONFIG.KEYS.BUSINESS_HOURS(tenantId));
  }

  static async setBusinessHours(tenantId: string, businessHours: any) {
    await this.set(
      CACHE_CONFIG.KEYS.BUSINESS_HOURS(tenantId), 
      businessHours, 
      { ttl: CACHE_CONFIG.TTL.BUSINESS_HOURS }
    );
  }

  static async invalidateBusinessHours(tenantId: string) {
    await this.delete(CACHE_CONFIG.KEYS.BUSINESS_HOURS(tenantId));
  }

  // Staff methods
  static async getStaff(staffId: string) {
    return await this.get(CACHE_CONFIG.KEYS.STAFF(staffId));
  }

  static async setStaff(staffId: string, staff: any) {
    await this.set(
      CACHE_CONFIG.KEYS.STAFF(staffId), 
      staff, 
      { ttl: CACHE_CONFIG.TTL.STAFF }
    );
  }

  static async getStaffByTenant(tenantId: string) {
    return await this.get(CACHE_CONFIG.KEYS.STAFF_BY_TENANT(tenantId));
  }

  static async setStaffByTenant(tenantId: string, staff: any[]) {
    await this.set(
      CACHE_CONFIG.KEYS.STAFF_BY_TENANT(tenantId), 
      staff, 
      { ttl: CACHE_CONFIG.TTL.STAFF }
    );
  }

  static async invalidateStaff(tenantId: string, staffId?: string) {
    const keys = [CACHE_CONFIG.KEYS.STAFF_BY_TENANT(tenantId)];
    
    if (staffId) {
      keys.push(CACHE_CONFIG.KEYS.STAFF(staffId));
    }

    await this.deleteMany(keys);
  }

  // Settings methods
  static async getSettings(tenantId: string, type: string) {
    return await this.get(CACHE_CONFIG.KEYS.SETTINGS(tenantId, type));
  }

  static async setSettings(tenantId: string, type: string, settings: any) {
    await this.set(
      CACHE_CONFIG.KEYS.SETTINGS(tenantId, type), 
      settings, 
      { ttl: CACHE_CONFIG.TTL.SETTINGS }
    );
  }

  static async invalidateSettings(tenantId: string, type?: string) {
    if (type) {
      await this.delete(CACHE_CONFIG.KEYS.SETTINGS(tenantId, type));
    } else {
      await this.deleteByPattern(`settings:${tenantId}:*`);
    }
  }

  // Bulk invalidation for tenant
  static async invalidateAllTenantData(tenantId: string, subdomain?: string) {
    const patterns = [
      `tenant:${tenantId}`,
      `bookings:tenant:${tenantId}*`,
      `customers:tenant:${tenantId}`,
      `services:tenant:${tenantId}`,
      `analytics:${tenantId}:*`,
      `business_hours:${tenantId}`,
      `staff:tenant:${tenantId}`,
      `settings:${tenantId}:*`,
    ];

    if (subdomain) {
      patterns.push(`tenant:subdomain:${subdomain}`);
    }

    for (const pattern of patterns) {
      await this.deleteByPattern(pattern);
    }
  }

  // Cache warming methods
  static async warmTenantCache(tenantId: string) {
    try {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      );

      const { data: tenantRow, error: tenantError } = await supabase
        .from('tenants')
        .select('*')
        .eq('id', tenantId)
        .limit(1)
        .single();

      if (tenantError || !tenantRow) {
        console.warn(`Tenant ${tenantId} not found while warming cache`);
        return;
      }

      await this.setTenant(tenantId, tenantRow);
      await this.setTenantBySubdomain(tenantRow.subdomain, tenantRow);

      const { data: tenantServices, error: servicesError } = await supabase
        .from('services')
        .select('*')
        .eq('tenantId', tenantId)
        .eq('isActive', true);

      if (tenantServices && tenantServices.length) {
        await this.setServicesByTenant(tenantId, tenantServices);
      }

      const { data: tenantStaff, error: staffError } = await supabase
        .from('staff')
        .select('*')
        .eq('tenantId', tenantId)
        .eq('isActive', true);

      if (tenantStaff && tenantStaff.length) {
        await this.setStaffByTenant(tenantId, tenantStaff);
      }

      const { data: businessHoursRow, error: businessHoursError } = await supabase
        .from('businessHours')
        .select('*')
        .eq('tenantId', tenantId)
        .limit(1)
        .single();

      if (businessHoursRow?.schedule) {
        await this.setBusinessHours(tenantId, businessHoursRow.schedule);
      }

      console.log(`Cache warmed for tenant ${tenantId}`);
    } catch (error) {
      console.error(`Failed to warm cache for tenant ${tenantId}:`, error);
    }
  }

  // Cache statistics
  static async getCacheStats(): Promise<{
    totalKeys: number;
    memoryUsage?: string;
    hitRate?: number;
  }> {
    try {
      const keys = await supabaseListCacheKeys('%');
      return {
        totalKeys: keys.length,
        // Additional stats would require database telemetry beyond the Supabase cache table
      };
    } catch (error) {
      console.error('Failed to get cache stats:', error);
      return { totalKeys: 0 };
    }
  }

  // Health check
  static async healthCheck(): Promise<boolean> {
    try {
      const testKey = 'health_check';
      const testValue = Date.now().toString();
      
      await supabaseSetCache(testKey, testValue, 5);
      const retrieved = await supabaseGetCache(testKey);
      await supabaseDeleteCache(testKey);
      
      return retrieved === testValue;
    } catch (error) {
      console.error('Cache health check failed:', error);
      return false;
    }
  }
}