import { prisma } from '@/lib/database';
import { Customer, CreateCustomerRequest, UpdateCustomerRequest } from '@/types/booking';

export class CustomerService {
  // Create a new customer
  static async createCustomer(
    tenantId: string,
    data: CreateCustomerRequest
  ): Promise<{ customer?: Customer; error?: string }> {
    try {
      // Check if customer with same phone already exists for this tenant
      const existingCustomer = await prisma.customer.findFirst({
        where: { tenantId, phone: data.phone }
      });
      
      if (existingCustomer) {
        return { error: 'Customer with this phone number already exists' };
      }
      
      const customer = await prisma.customer.create({
        data: {
          tenantId,
          name: data.name,
          email: data.email,
          phone: data.phone,
          address: data.address,
          notes: data.notes,
          whatsappNumber: data.whatsappNumber
        }
      });
      
      return { customer: customer as Customer };
    } catch (error) {
      console.error('Error creating customer:', error);
      return { error: 'Failed to create customer' };
    }
  }
  
  // Update a customer
  static async updateCustomer(
    tenantId: string,
    customerId: string,
    data: UpdateCustomerRequest
  ): Promise<{ customer?: Customer; error?: string }> {
    try {
      // Check if customer exists and belongs to tenant
      const existingCustomer = await prisma.customer.findFirst({
        where: { id: customerId, tenantId }
      });
      
      if (!existingCustomer) {
        return { error: 'Customer not found' };
      }
      
      // Check if phone number is being changed and if it conflicts
      if (data.phone && data.phone !== existingCustomer.phone) {
        const phoneConflict = await prisma.customer.findFirst({
          where: { 
            tenantId, 
            phone: data.phone,
            id: { not: customerId }
          }
        });
        
        if (phoneConflict) {
          return { error: 'Another customer with this phone number already exists' };
        }
      }
      
      const customer = await prisma.customer.update({
        where: { id: customerId },
        data: {
          ...(data.name !== undefined && { name: data.name }),
          ...(data.email !== undefined && { email: data.email }),
          ...(data.phone !== undefined && { phone: data.phone }),
          ...(data.address !== undefined && { address: data.address }),
          ...(data.notes !== undefined && { notes: data.notes }),
          ...(data.whatsappNumber !== undefined && { whatsappNumber: data.whatsappNumber })
        }
      });
      
      return { customer: customer as Customer };
    } catch (error) {
      console.error('Error updating customer:', error);
      return { error: 'Failed to update customer' };
    }
  }
  
  // Get customers for a tenant
  static async getCustomers(
    tenantId: string,
    options: {
      search?: string;
      hasBookings?: boolean;
      limit?: number;
      offset?: number;
      sortBy?: 'name' | 'createdAt' | 'lastBookingAt' | 'totalBookings';
      sortOrder?: 'asc' | 'desc';
    } = {}
  ): Promise<{ customers: Customer[]; total: number }> {
    try {
      const where: any = { tenantId };
      
      // Search functionality
      if (options.search) {
        where.OR = [
          { name: { contains: options.search, mode: 'insensitive' } },
          { phone: { contains: options.search } },
          { email: { contains: options.search, mode: 'insensitive' } }
        ];
      }
      
      // Filter by booking status
      if (options.hasBookings !== undefined) {
        if (options.hasBookings) {
          where.totalBookings = { gt: 0 };
        } else {
          where.totalBookings = 0;
        }
      }
      
      // Determine sort order
      const orderBy: any = {};
      const sortBy = options.sortBy || 'createdAt';
      const sortOrder = options.sortOrder || 'desc';
      orderBy[sortBy] = sortOrder;
      
      const [customers, total] = await Promise.all([
        prisma.customer.findMany({
          where,
          orderBy,
          take: options.limit,
          skip: options.offset,
          include: {
            bookings: {
              take: 5,
              orderBy: { scheduledAt: 'desc' },
              include: {
                service: {
                  select: { name: true, category: true }
                }
              }
            }
          }
        }),
        prisma.customer.count({ where })
      ]);
      
      return { 
        customers: customers as Customer[], 
        total 
      };
    } catch (error) {
      console.error('Error fetching customers:', error);
      return { customers: [], total: 0 };
    }
  }
  
  // Get a single customer with booking history
  static async getCustomer(tenantId: string, customerId: string): Promise<Customer | null> {
    try {
      const customer = await prisma.customer.findFirst({
        where: { id: customerId, tenantId },
        include: {
          bookings: {
            orderBy: { scheduledAt: 'desc' },
            include: {
              service: {
                select: { name: true, category: true, duration: true, price: true }
              }
            }
          }
        }
      });
      
      return customer as Customer | null;
    } catch (error) {
      console.error('Error fetching customer:', error);
      return null;
    }
  }
  
  // Find or create customer by phone
  static async findOrCreateCustomer(
    tenantId: string,
    data: CreateCustomerRequest
  ): Promise<{ customer?: Customer; error?: string; created?: boolean }> {
    try {
      // Try to find existing customer by phone
      const existingCustomer = await prisma.customer.findFirst({
        where: { tenantId, phone: data.phone }
      });
      
      if (existingCustomer) {
        return { customer: existingCustomer as Customer, created: false };
      }
      
      // Create new customer
      const result = await this.createCustomer(tenantId, data);
      if (result.error) {
        return { error: result.error };
      }
      
      return { customer: result.customer, created: true };
    } catch (error) {
      console.error('Error finding or creating customer:', error);
      return { error: 'Failed to find or create customer' };
    }
  }
  
  // Delete a customer
  static async deleteCustomer(tenantId: string, customerId: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Check if customer has active bookings
      const activeBookings = await prisma.booking.count({
        where: {
          customerId,
          status: { in: ['pending', 'confirmed'] }
        }
      });
      
      if (activeBookings > 0) {
        return { 
          success: false, 
          error: 'Cannot delete customer with active bookings. Please cancel or complete all bookings first.' 
        };
      }
      
      const customer = await prisma.customer.findFirst({
        where: { id: customerId, tenantId }
      });
      
      if (!customer) {
        return { success: false, error: 'Customer not found' };
      }
      
      await prisma.customer.delete({
        where: { id: customerId }
      });
      
      return { success: true };
    } catch (error) {
      console.error('Error deleting customer:', error);
      return { success: false, error: 'Failed to delete customer' };
    }
  }
  
  // Get customer statistics
  static async getCustomerStats(tenantId: string): Promise<{
    totalCustomers: number;
    newCustomersThisMonth: number;
    activeCustomers: number; // Customers with bookings in last 30 days
    averageBookingsPerCustomer: number;
    topCustomers: Array<{
      id: string;
      name: string;
      totalBookings: number;
      totalSpent: number;
    }>;
  }> {
    try {
      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      
      const [
        totalCustomers,
        newCustomersThisMonth,
        activeCustomers,
        avgBookingsResult,
        topCustomersResult
      ] = await Promise.all([
        prisma.customer.count({ where: { tenantId } }),
        prisma.customer.count({ 
          where: { tenantId, createdAt: { gte: startOfMonth } } 
        }),
        prisma.customer.count({
          where: {
            tenantId,
            bookings: {
              some: {
                scheduledAt: { gte: thirtyDaysAgo }
              }
            }
          }
        }),
        prisma.customer.aggregate({
          where: { tenantId },
          _avg: { totalBookings: true }
        }),
        prisma.customer.findMany({
          where: { tenantId },
          orderBy: { totalBookings: 'desc' },
          take: 5,
          include: {
            bookings: {
              where: { status: 'completed', paymentStatus: 'paid' },
              select: { totalAmount: true }
            }
          }
        })
      ]);
      
      const topCustomers = topCustomersResult.map(customer => ({
        id: customer.id,
        name: customer.name,
        totalBookings: customer.totalBookings,
        totalSpent: customer.bookings.reduce((sum, booking) => 
          sum + Number(booking.totalAmount), 0
        )
      }));
      
      return {
        totalCustomers,
        newCustomersThisMonth,
        activeCustomers,
        averageBookingsPerCustomer: Number(avgBookingsResult._avg.totalBookings || 0),
        topCustomers
      };
    } catch (error) {
      console.error('Error fetching customer stats:', error);
      return {
        totalCustomers: 0,
        newCustomersThisMonth: 0,
        activeCustomers: 0,
        averageBookingsPerCustomer: 0,
        topCustomers: []
      };
    }
  }
  
  // Search customers by various criteria
  static async searchCustomers(
    tenantId: string,
    query: string,
    limit: number = 10
  ): Promise<Customer[]> {
    try {
      const customers = await prisma.customer.findMany({
        where: {
          tenantId,
          OR: [
            { name: { contains: query, mode: 'insensitive' } },
            { phone: { contains: query } },
            { email: { contains: query, mode: 'insensitive' } },
            { whatsappNumber: { contains: query } }
          ]
        },
        take: limit,
        orderBy: { totalBookings: 'desc' }
      });
      
      return customers as Customer[];
    } catch (error) {
      console.error('Error searching customers:', error);
      return [];
    }
  }
}