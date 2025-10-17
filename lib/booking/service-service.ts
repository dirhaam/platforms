import { createClient } from '@supabase/supabase-js';
import { Service, CreateServiceRequest, UpdateServiceRequest } from '@/types/booking';

const randomUUID = () => {
  if (typeof globalThis.crypto?.randomUUID === 'function') {
    return globalThis.crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2);
};

export class ServiceService {
  // Create a new service
  static async createService(
    tenantId: string,
    data: CreateServiceRequest
  ): Promise<{ service?: Service; error?: string }> {
    try {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      );

      const { data: newService, error } = await supabase
        .from('services')
        .insert({
          id: randomUUID(),
          tenantId,
          name: data.name,
          description: data.description,
          duration: data.duration,
          price: data.price,
          category: data.category,
          isActive: true,
          homeVisitAvailable: data.homeVisitAvailable || false,
          homeVisitSurcharge: data.homeVisitSurcharge,
          images: data.images || [],
          requirements: data.requirements || [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        })
        .select()
        .single();
      
      if (error || !newService) throw error || new Error('Failed to create service');
      return { service: newService as unknown as Service };
    } catch (error) {
      console.error('Error creating service:', error);
      return { error: 'Failed to create service' };
    }
  }
  
  // Update a service
  static async updateService(
    tenantId: string,
    serviceId: string,
    data: UpdateServiceRequest
  ): Promise<{ service?: Service; error?: string }> {
    try {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      );

      const { data: existingService, error: fetchError } = await supabase
        .from('services')
        .select('*')
        .eq('id', serviceId)
        .eq('tenantId', tenantId)
        .limit(1)
        .single();
      
      if (fetchError || !existingService) {
        return { error: 'Service not found' };
      }
      
      const updateData: any = { updatedAt: new Date().toISOString() };
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
      
      const { data: updatedService, error: updateError } = await supabase
        .from('services')
        .update(updateData)
        .eq('id', serviceId)
        .select()
        .single();
      
      if (updateError || !updatedService) throw updateError || new Error('Failed to update service');
      return { service: updatedService as unknown as Service };
    } catch (error) {
      console.error('Error updating service:', error);
      return { error: 'Failed to update service' };
    }
  }
  
  // Get services for a tenant
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
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      );

      let query = supabase
        .from('services')
        .select('*')
        .eq('tenantId', tenantId);
      
      if (options.category) query = query.eq('category', options.category);
      if (options.isActive !== undefined) query = query.eq('isActive', options.isActive);
      if (options.homeVisitAvailable !== undefined) query = query.eq('homeVisitAvailable', options.homeVisitAvailable);
      
      query = query.order('createdAt', { ascending: false });
      
      if (options.limit) query = query.limit(options.limit);
      if (options.offset) query = query.range(options.offset, options.offset + (options.limit || 50) - 1);
      
      const { data: serviceResults, error } = await query;
      
      if (error) throw error;
      return (serviceResults || []) as Service[];
    } catch (error) {
      console.error('Error fetching services:', error);
      return [];
    }
  }
  
  // Get a single service
  static async getService(tenantId: string, serviceId: string): Promise<Service | null> {
    try {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      );

      const { data: serviceResult, error } = await supabase
        .from('services')
        .select('*')
        .eq('id', serviceId)
        .eq('tenantId', tenantId)
        .limit(1)
        .single();
      
      if (error) return null;
      return serviceResult ? (serviceResult as unknown as Service) : null;
    } catch (error) {
      console.error('Error fetching service:', error);
      return null;
    }
  }
  
  // Delete a service
  static async deleteService(tenantId: string, serviceId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      );

      const { count } = await supabase
        .from('bookings')
        .select('id', { count: 'exact' })
        .eq('serviceId', serviceId)
        .in('status', ['pending', 'confirmed']);
      
      const activeBookings = count || 0;
      
      if (activeBookings > 0) {
        return { 
          success: false, 
          error: 'Cannot delete service with active bookings. Please cancel or complete all bookings first.' 
        };
      }
      
      const { data: service, error: fetchError } = await supabase
        .from('services')
        .select('*')
        .eq('id', serviceId)
        .eq('tenantId', tenantId)
        .limit(1)
        .single();
      
      if (fetchError || !service) {
        return { success: false, error: 'Service not found' };
      }
      
      const { error: deleteError } = await supabase
        .from('services')
        .delete()
        .eq('id', serviceId);
      
      if (deleteError) throw deleteError;
      return { success: true };
    } catch (error) {
      console.error('Error deleting service:', error);
      return { success: false, error: 'Failed to delete service' };
    }
  }
  
  // Get service categories for a tenant
  static async getServiceCategories(tenantId: string): Promise<string[]> {
    try {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      );

      const { data: categoryResults, error } = await supabase
        .from('services')
        .select('category')
        .eq('tenantId', tenantId)
        .eq('isActive', true);

      if (error || !categoryResults) return [];
      
      const uniqueCategories = Array.from(new Set(categoryResults.map(c => c.category).filter(Boolean)));
      return uniqueCategories as string[];
    } catch (error) {
      console.error('Error fetching service categories:', error);
      return [];
    }
  }
  
  // Get service statistics
  static async getServiceStats(tenantId: string, serviceId?: string): Promise<{
    totalBookings: number;
    completedBookings: number;
    cancelledBookings: number;
    totalRevenue: number;
    averageRating?: number;
  }> {
    try {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      );

      let query = supabase
        .from('bookings')
        .select('id', { count: 'exact' })
        .eq('tenantId', tenantId);
      
      if (serviceId) query = query.eq('serviceId', serviceId);
      const { count: totalBookings } = await query;
      
      query = supabase
        .from('bookings')
        .select('id', { count: 'exact' })
        .eq('tenantId', tenantId)
        .eq('status', 'completed');
      
      if (serviceId) query = query.eq('serviceId', serviceId);
      const { count: completedBookings } = await query;
      
      query = supabase
        .from('bookings')
        .select('id', { count: 'exact' })
        .eq('tenantId', tenantId)
        .eq('status', 'cancelled');
      
      if (serviceId) query = query.eq('serviceId', serviceId);
      const { count: cancelledBookings } = await query;
      
      query = supabase
        .from('bookings')
        .select('totalAmount')
        .eq('tenantId', tenantId)
        .eq('status', 'completed')
        .eq('paymentStatus', 'paid');
      
      if (serviceId) query = query.eq('serviceId', serviceId);
      const { data: revenueData } = await query;
      
      const totalRevenue = (revenueData || []).reduce((sum, b) => sum + (Number(b.totalAmount) || 0), 0);
      
      return {
        totalBookings: totalBookings || 0,
        completedBookings: completedBookings || 0,
        cancelledBookings: cancelledBookings || 0,
        totalRevenue
      };
    } catch (error) {
      console.error('Error fetching service stats:', error);
      return {
        totalBookings: 0,
        completedBookings: 0,
        cancelledBookings: 0,
        totalRevenue: 0
      };
    }
  }
}
