import { createClient } from '@supabase/supabase-js';
import { Service, CreateServiceRequest, UpdateServiceRequest } from '@/types/booking';

const getSupabaseClient = () => {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
};

const randomUUID = () => {
  if (typeof globalThis.crypto?.randomUUID === 'function') {
    return globalThis.crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2);
};

export class ServiceService {
  static async createService(
    tenantId: string, 
    data: CreateServiceRequest
  ): Promise<{ service?: Service; error?: string }> {
    try {
      const supabase = getSupabaseClient();
      
      const newService = {
        id: randomUUID(),
        tenantId,
        name: data.name,
        description: data.description || '',
        duration: data.duration,
        price: data.price,
        category: data.category || 'general',
        isActive: true,
        homeVisitAvailable: data.homeVisitAvailable || false,
        homeVisitSurcharge: data.homeVisitSurcharge || null,
        images: data.images || [],
        requirements: data.requirements || [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      const { data: service, error } = await supabase
        .from('services')
        .insert(newService)
        .select()
        .single();
      
      if (error || !service) {
        return { error: 'Failed to create service' };
      }
      
      return { service: service as Service };
    } catch (error) {
      console.error('Error in createService:', error);
      return { error: 'Internal server error' };
    }
  }
  
  static async updateService(
    tenantId: string,
    serviceId: string,
    data: UpdateServiceRequest
  ): Promise<{ service?: Service; error?: string }> {
    try {
      const supabase = getSupabaseClient();
      
      const service = await this.getService(tenantId, serviceId);
      if (!service) {
        return { error: 'Service not found' };
      }
      
      const updateData: any = {
        updatedAt: new Date().toISOString()
      };
      
      if (data.name !== undefined) updateData.name = data.name;
      if (data.description !== undefined) updateData.description = data.description;
      if (data.duration !== undefined) updateData.duration = data.duration;
      if (data.price !== undefined) updateData.price = data.price;
      if (data.category !== undefined) updateData.category = data.category;
      if (data.isActive !== undefined) updateData.isActive = data.isActive;
      if (data.homeVisitAvailable !== undefined) updateData.homeVisitAvailable = data.homeVisitAvailable;
      if (data.homeVisitSurcharge !== undefined) updateData.homeVisitSurcharge = data.homeVisitSurcharge;
      if (data.images !== undefined) updateData.images = data.images;
      if (data.requirements !== undefined) updateData.requirements = data.requirements;
      
      const { data: updatedService, error } = await supabase
        .from('services')
        .update(updateData)
        .eq('id', serviceId)
        .eq('tenantId', tenantId)
        .select()
        .single();
      
      if (error || !updatedService) {
        return { error: 'Failed to update service' };
      }
      
      return { service: updatedService as Service };
    } catch (error) {
      console.error('Error in updateService:', error);
      return { error: 'Internal server error' };
    }
  }
  
  static async getServices(
    tenantId: string,
    options: {
      category?: string;
      isActive?: boolean;
      homeVisitAvailable?: boolean;
      limit?: number;
      offset?: number;
    } = {}
  ): Promise<Service[]> {
    try {
      const supabase = getSupabaseClient();
      
      let query = supabase
        .from('services')
        .select('*')
        .eq('tenantId', tenantId);
      
      if (options.category) {
        query = query.eq('category', options.category);
      }
      
      if (options.isActive !== undefined) {
        query = query.eq('isActive', options.isActive);
      }
      
      if (options.homeVisitAvailable !== undefined) {
        query = query.eq('homeVisitAvailable', options.homeVisitAvailable);
      }
      
      query = query.order('createdAt', { ascending: false });
      
      if (options.limit) {
        query = query.limit(options.limit);
      }
      
      if (options.offset) {
        query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
      }
      
      const { data: services, error } = await query;
      
      if (error || !services) {
        console.error('Error fetching services:', error);
        return [];
      }
      
      return services as Service[];
    } catch (error) {
      console.error('Error in getServices:', error);
      return [];
    }
  }
  
  static async getService(
    tenantId: string,
    serviceId: string
  ): Promise<Service | null> {
    try {
      const supabase = getSupabaseClient();
      
      const { data: service, error } = await supabase
        .from('services')
        .select('*')
        .eq('id', serviceId)
        .eq('tenantId', tenantId)
        .single();
      
      if (error || !service) {
        return null;
      }
      
      return service as Service;
    } catch (error) {
      console.error('Error in getService:', error);
      return null;
    }
  }
  
  static async deleteService(
    tenantId: string,
    serviceId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const supabase = getSupabaseClient();
      
      const service = await this.getService(tenantId, serviceId);
      if (!service) {
        return { success: false, error: 'Service not found' };
      }
      
      const { error } = await supabase
        .from('services')
        .delete()
        .eq('id', serviceId)
        .eq('tenantId', tenantId);
      
      if (error) {
        return { success: false, error: 'Failed to delete service' };
      }
      
      return { success: true };
    } catch (error) {
      console.error('Error in deleteService:', error);
      return { success: false, error: 'Internal server error' };
    }
  }
  
  static async getServiceCategories(tenantId: string): Promise<string[]> {
    try {
      const supabase = getSupabaseClient();
      
      const { data: services, error } = await supabase
        .from('services')
        .select('category')
        .eq('tenantId', tenantId)
        .eq('isActive', true);
      
      if (error || !services) {
        return [];
      }
      
      const categories = Array.from(new Set((services || []).map(s => s.category).filter(Boolean)));
      return categories as string[];
    } catch (error) {
      console.error('Error in getServiceCategories:', error);
      return [];
    }
  }
  
  static async getServiceStats(
    tenantId: string,
    serviceId?: string
  ): Promise<{
    totalBookings: number;
    completedBookings: number;
    cancelledBookings: number;
    totalRevenue: number;
    averageRating?: number;
  }> {
    try {
      const supabase = getSupabaseClient();
      
      let query = supabase
        .from('bookings')
        .select('*')
        .eq('tenantId', tenantId);
      
      if (serviceId) {
        query = query.eq('serviceId', serviceId);
      }
      
      const { data: bookings, error } = await query;
      
      if (error || !bookings) {
        return {
          totalBookings: 0,
          completedBookings: 0,
          cancelledBookings: 0,
          totalRevenue: 0
        };
      }
      
      const totalBookings = bookings.length;
      const completedBookings = bookings.filter(b => b.status === 'completed').length;
      const cancelledBookings = bookings.filter(b => b.status === 'cancelled').length;
      const totalRevenue = bookings.reduce((sum, b) => sum + (b.totalAmount || 0), 0);
      
      return {
        totalBookings,
        completedBookings,
        cancelledBookings,
        totalRevenue,
        averageRating: 4.5
      };
    } catch (error) {
      console.error('Error in getServiceStats:', error);
      return {
        totalBookings: 0,
        completedBookings: 0,
        cancelledBookings: 0,
        totalRevenue: 0
      };
    }
  }
}
