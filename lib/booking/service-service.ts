import { prisma } from '@/lib/database';
import { Service, CreateServiceRequest, UpdateServiceRequest } from '@/types/booking';

export class ServiceService {
  // Create a new service
  static async createService(
    tenantId: string,
    data: CreateServiceRequest
  ): Promise<{ service?: Service; error?: string }> {
    try {
      const service = await prisma.service.create({
        data: {
          tenantId,
          name: data.name,
          description: data.description,
          duration: data.duration,
          price: data.price,
          category: data.category,
          homeVisitAvailable: data.homeVisitAvailable || false,
          homeVisitSurcharge: data.homeVisitSurcharge,
          images: data.images || [],
          requirements: data.requirements || []
        }
      });
      
      return { service: service as Service };
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
      const existingService = await prisma.service.findFirst({
        where: { id: serviceId, tenantId }
      });
      
      if (!existingService) {
        return { error: 'Service not found' };
      }
      
      const service = await prisma.service.update({
        where: { id: serviceId },
        data: {
          ...(data.name !== undefined && { name: data.name }),
          ...(data.description !== undefined && { description: data.description }),
          ...(data.duration !== undefined && { duration: data.duration }),
          ...(data.price !== undefined && { price: data.price }),
          ...(data.category !== undefined && { category: data.category }),
          ...(data.isActive !== undefined && { isActive: data.isActive }),
          ...(data.homeVisitAvailable !== undefined && { homeVisitAvailable: data.homeVisitAvailable }),
          ...(data.homeVisitSurcharge !== undefined && { homeVisitSurcharge: data.homeVisitSurcharge }),
          ...(data.images !== undefined && { images: data.images }),
          ...(data.requirements !== undefined && { requirements: data.requirements })
        }
      });
      
      return { service: service as Service };
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
      const where: any = { tenantId };
      
      if (options.category) where.category = options.category;
      if (options.isActive !== undefined) where.isActive = options.isActive;
      if (options.homeVisitAvailable !== undefined) where.homeVisitAvailable = options.homeVisitAvailable;
      
      const services = await prisma.service.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: options.limit,
        skip: options.offset
      });
      
      return services as Service[];
    } catch (error) {
      console.error('Error fetching services:', error);
      return [];
    }
  }
  
  // Get a single service
  static async getService(tenantId: string, serviceId: string): Promise<Service | null> {
    try {
      const service = await prisma.service.findFirst({
        where: { id: serviceId, tenantId }
      });
      
      return service as Service | null;
    } catch (error) {
      console.error('Error fetching service:', error);
      return null;
    }
  }
  
  // Delete a service
  static async deleteService(tenantId: string, serviceId: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Check if service has active bookings
      const activeBookings = await prisma.booking.count({
        where: {
          serviceId,
          status: { in: ['pending', 'confirmed'] }
        }
      });
      
      if (activeBookings > 0) {
        return { 
          success: false, 
          error: 'Cannot delete service with active bookings. Please cancel or complete all bookings first.' 
        };
      }
      
      const service = await prisma.service.findFirst({
        where: { id: serviceId, tenantId }
      });
      
      if (!service) {
        return { success: false, error: 'Service not found' };
      }
      
      await prisma.service.delete({
        where: { id: serviceId }
      });
      
      return { success: true };
    } catch (error) {
      console.error('Error deleting service:', error);
      return { success: false, error: 'Failed to delete service' };
    }
  }
  
  // Get service categories for a tenant
  static async getServiceCategories(tenantId: string): Promise<string[]> {
    try {
      const categories = await prisma.service.findMany({
        where: { tenantId, isActive: true },
        select: { category: true },
        distinct: ['category']
      });
      
      return categories.map(c => c.category);
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
      const where: any = { tenantId };
      if (serviceId) where.serviceId = serviceId;
      
      const [totalBookings, completedBookings, cancelledBookings, revenueResult] = await Promise.all([
        prisma.booking.count({ where }),
        prisma.booking.count({ where: { ...where, status: 'completed' } }),
        prisma.booking.count({ where: { ...where, status: 'cancelled' } }),
        prisma.booking.aggregate({
          where: { ...where, status: 'completed', paymentStatus: 'paid' },
          _sum: { totalAmount: true }
        })
      ]);
      
      return {
        totalBookings,
        completedBookings,
        cancelledBookings,
        totalRevenue: Number(revenueResult._sum.totalAmount || 0)
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