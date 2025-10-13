import { db } from '@/lib/database';
import { services, bookings } from '@/lib/database/schema';
import { Service, CreateServiceRequest, UpdateServiceRequest } from '@/types/booking';
import { eq, and, ne, gte, lte, or, asc, desc, sql } from 'drizzle-orm';

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
      const [newService] = await db.insert(services).values({
        id: randomUUID(),
        tenantId,
        name: data.name,
        description: data.description,
        duration: data.duration,
        price: data.price,
        category: data.category,
        isActive: true, // Default to active
        homeVisitAvailable: data.homeVisitAvailable || false,
        homeVisitSurcharge: data.homeVisitSurcharge,
        images: data.images || [],
        requirements: data.requirements || [],
        createdAt: new Date(),
        updatedAt: new Date()
      } as any).returning();
      
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
      // Check if service exists and belongs to tenant
      const [existingService] = await db.select().from(services).where(
        and(
          eq(services.id, serviceId),
          eq(services.tenantId, tenantId)
        )
      ).limit(1);
      
      if (!existingService) {
        return { error: 'Service not found' };
      }
      
      // Build update object
      const updateData: any = {};
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
      
      updateData.updatedAt = new Date();
      
      const [updatedService] = await db.update(services).set(updateData).where(eq(services.id, serviceId)).returning();
      
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
      let query: any = db.select().from(services).where(eq(services.tenantId, tenantId));
      
      if (options.category) query = query.where(and(eq(services.tenantId, tenantId), eq(services.category, options.category)));
      if (options.isActive !== undefined) query = query.where(and(eq(services.tenantId, tenantId), eq(services.isActive, options.isActive)));
      if (options.homeVisitAvailable !== undefined) query = query.where(and(eq(services.tenantId, tenantId), eq(services.homeVisitAvailable, options.homeVisitAvailable)));
      
      // Apply filters one by one
      if (options.category) query = query.where(eq(services.category, options.category));
      if (options.isActive !== undefined) query = query.where(eq(services.isActive, options.isActive));
      if (options.homeVisitAvailable !== undefined) query = query.where(eq(services.homeVisitAvailable, options.homeVisitAvailable));
      
      query = query.orderBy(desc(services.createdAt));
      if (options.limit) query = query.limit(options.limit);
      if (options.offset) query = query.offset(options.offset);
      
      const serviceResults = await query;
      
      return serviceResults as Service[];
    } catch (error) {
      console.error('Error fetching services:', error);
      return [];
    }
  }
  
  // Get a single service
  static async getService(tenantId: string, serviceId: string): Promise<Service | null> {
    try {
      const [serviceResult] = await db.select().from(services).where(
        and(
          eq(services.id, serviceId),
          eq(services.tenantId, tenantId)
        )
      ).limit(1);
      
      return serviceResult ? (serviceResult as unknown as Service) : null;
    } catch (error) {
      console.error('Error fetching service:', error);
      return null;
    }
  }
  
  // Delete a service
  static async deleteService(tenantId: string, serviceId: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Check if service has active bookings
      const activeBookingsResult = await db.select({ count: sql<number>`count(*)` }).from(bookings).where(
        and(
          eq(bookings.serviceId, serviceId),
          or(
            eq(bookings.status, 'pending'),
            eq(bookings.status, 'confirmed')
          )
        )
      );
      const activeBookings = activeBookingsResult[0]?.count || 0;
      
      if (activeBookings > 0) {
        return { 
          success: false, 
          error: 'Cannot delete service with active bookings. Please cancel or complete all bookings first.' 
        };
      }
      
      const [service] = await db.select().from(services).where(
        and(
          eq(services.id, serviceId),
          eq(services.tenantId, tenantId)
        )
      ).limit(1);
      
      if (!service) {
        return { success: false, error: 'Service not found' };
      }
      
      await db.delete(services).where(eq(services.id, serviceId));
      
      return { success: true };
    } catch (error) {
      console.error('Error deleting service:', error);
      return { success: false, error: 'Failed to delete service' };
    }
  }
  
  // Get service categories for a tenant
  static async getServiceCategories(tenantId: string): Promise<string[]> {
    try {
      const categoryResults = await db
        .selectDistinct({ category: services.category })
        .from(services)
        .where(and(eq(services.tenantId, tenantId), eq(services.isActive, true)));

      return categoryResults.map(c => c.category).filter(Boolean);
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
      let baseWhere: any = eq(bookings.tenantId, tenantId);
      if (serviceId) {
        baseWhere = and(baseWhere, eq(bookings.serviceId, serviceId));
      }
      
      // Get counts using separate queries
      const totalBookingsResult = await db.select({ count: sql<number>`count(*)` }).from(bookings).where(baseWhere);
      const completedBookingsResult = await db.select({ count: sql<number>`count(*)` }).from(bookings).where(
        and(baseWhere, eq(bookings.status, 'completed'))
      );
      const cancelledBookingsResult = await db.select({ count: sql<number>`count(*)` }).from(bookings).where(
        and(baseWhere, eq(bookings.status, 'cancelled'))
      );
      
      // Get total revenue for completed and paid bookings
      const revenueResult = await db.select({
        total: sql<number>`SUM(${bookings.totalAmount})`
      }).from(bookings).where(
        and(
          baseWhere,
          eq(bookings.status, 'completed'),
          eq(bookings.paymentStatus, 'paid')
        )
      );
      
      return {
        totalBookings: totalBookingsResult[0]?.count || 0,
        completedBookings: completedBookingsResult[0]?.count || 0,
        cancelledBookings: cancelledBookingsResult[0]?.count || 0,
        totalRevenue: Number(revenueResult[0]?.total || 0)
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