import { db } from '@/lib/database';
import { customers, bookings, services } from '@/lib/database/schema';
import { Customer, CreateCustomerRequest, UpdateCustomerRequest } from '@/types/booking';
import { eq, and, ne, gte, lte, or, ilike, asc, desc, sql } from 'drizzle-orm';

const randomUUID = () => {
  if (typeof globalThis.crypto?.randomUUID === 'function') {
    return globalThis.crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2);
};

export class CustomerService {
  // Create a new customer
  static async createCustomer(
    tenantId: string,
    data: CreateCustomerRequest
  ): Promise<{ customer?: Customer; error?: string }> {
    try {
      // Check if customer with same phone already exists for this tenant
      const [existingCustomer] = await db.select().from(customers).where(
        and(
          eq(customers.tenantId, tenantId),
          eq(customers.phone, data.phone)
        )
      ).limit(1);
      
      if (existingCustomer) {
        return { error: 'Customer with this phone number already exists' };
      }
      
      const [newCustomer] = await db.insert(customers).values({
        id: randomUUID(),
        tenantId,
        name: data.name,
        email: data.email,
        phone: data.phone,
        address: data.address,
        notes: data.notes,
        whatsappNumber: data.whatsappNumber,
        totalBookings: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      }).returning();
      
      return { customer: newCustomer as Customer };
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
      const [existingCustomer] = await db.select().from(customers).where(
        and(
          eq(customers.id, customerId),
          eq(customers.tenantId, tenantId)
        )
      ).limit(1);
      
      if (!existingCustomer) {
        return { error: 'Customer not found' };
      }
      
      // Check if phone number is being changed and if it conflicts
      if (data.phone && data.phone !== existingCustomer.phone) {
        const [phoneConflict] = await db.select().from(customers).where(
          and(
            eq(customers.tenantId, tenantId),
            eq(customers.phone, data.phone),
            ne(customers.id, customerId)
          )
        ).limit(1);
        
        if (phoneConflict) {
          return { error: 'Another customer with this phone number already exists' };
        }
      }
      
      // Build update object
      const updateData: any = {};
      if (data.name !== undefined) updateData.name = data.name;
      if (data.email !== undefined) updateData.email = data.email;
      if (data.phone !== undefined) updateData.phone = data.phone;
      if (data.address !== undefined) updateData.address = data.address;
      if (data.notes !== undefined) updateData.notes = data.notes;
      if (data.whatsappNumber !== undefined) updateData.whatsappNumber = data.whatsappNumber;
      
      updateData.updatedAt = new Date();
      
      const [updatedCustomer] = await db.update(customers).set(updateData).where(eq(customers.id, customerId)).returning();
      
      return { customer: updatedCustomer as Customer };
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
      // Build the query with base filter
      let query: any = db.select({
        id: customers.id,
        tenantId: customers.tenantId,
        name: customers.name,
        email: customers.email,
        phone: customers.phone,
        address: customers.address,
        notes: customers.notes,
        totalBookings: customers.totalBookings,
        lastBookingAt: customers.lastBookingAt,
        whatsappNumber: customers.whatsappNumber,
        createdAt: customers.createdAt,
        updatedAt: customers.updatedAt,
        // bookings: will be added separately due to limitation in Drizzle joins
      }).from(customers).where(eq(customers.tenantId, tenantId));
      
      // Add search functionality
      if (options.search) {
        query = query.where(
          and(
            eq(customers.tenantId, tenantId),
            or(
              ilike(customers.name, `%${options.search}%`),
              ilike(customers.phone, `%${options.search}%`),
              ilike(customers.email, `%${options.search}%`)
            )
          )
        );
      }
      
      // Filter by booking status
      if (options.hasBookings !== undefined) {
        if (options.hasBookings) {
          query = query.where(and(eq(customers.tenantId, tenantId), gte(customers.totalBookings, 1)));
        } else {
          query = query.where(and(eq(customers.tenantId, tenantId), eq(customers.totalBookings, 0)));
        }
      }
      
      // Determine sort order
      const sortBy = options.sortBy || 'createdAt';
      const sortOrder = options.sortOrder || 'desc';
      
      if (sortOrder === 'asc') {
        if (sortBy === 'name') query = query.orderBy(asc(customers.name));
        else if (sortBy === 'createdAt') query = query.orderBy(asc(customers.createdAt));
        else if (sortBy === 'lastBookingAt') query = query.orderBy(asc(customers.lastBookingAt));
        else if (sortBy === 'totalBookings') query = query.orderBy(asc(customers.totalBookings));
      } else {
        if (sortBy === 'name') query = query.orderBy(desc(customers.name));
        else if (sortBy === 'createdAt') query = query.orderBy(desc(customers.createdAt));
        else if (sortBy === 'lastBookingAt') query = query.orderBy(desc(customers.lastBookingAt));
        else if (sortBy === 'totalBookings') query = query.orderBy(desc(customers.totalBookings));
      }
      
      // Apply limit and offset
      if (options.limit) query = query.limit(options.limit);
      if (options.offset) query = query.offset(options.offset);
      
      const customerResults = await query;
      
      // Get the total count separately
      let countQuery: any = db.select({ count: sql<number>`count(*)` }).from(customers).where(eq(customers.tenantId, tenantId));
      
      if (options.search) {
        countQuery = countQuery.where(
          or(
            ilike(customers.name, `%${options.search}%`),
            ilike(customers.phone, `%${options.search}%`),
            ilike(customers.email, `%${options.search}%`)
          )
        );
      }
      
      if (options.hasBookings !== undefined) {
        if (options.hasBookings) {
          countQuery = countQuery.where(gte(customers.totalBookings, 1));
        } else {
          countQuery = countQuery.where(eq(customers.totalBookings, 0));
        }
      }
      
      const [countResult] = await countQuery;
      const total = countResult?.count || 0;
      
      // For each customer, we need to fetch their bookings separately if needed
      // For now, we'll just return the customers without bookings to avoid complex joins
      return { 
        customers: customerResults as Customer[], 
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
      const [customerResult] = await db.select({
        id: customers.id,
        tenantId: customers.tenantId,
        name: customers.name,
        email: customers.email,
        phone: customers.phone,
        address: customers.address,
        notes: customers.notes,
        totalBookings: customers.totalBookings,
        lastBookingAt: customers.lastBookingAt,
        whatsappNumber: customers.whatsappNumber,
        createdAt: customers.createdAt,
        updatedAt: customers.updatedAt
      }).from(customers).where(
        and(
          eq(customers.id, customerId),
          eq(customers.tenantId, tenantId)
        )
      ).limit(1);
      
      if (!customerResult) {
        return null;
      }
      
      // Note: In a full implementation, we would need to join with bookings and services
      // But for now, we'll return the customer without booking history to simplify
      return customerResult as Customer;
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
      const [existingCustomer] = await db.select().from(customers).where(
        and(
          eq(customers.tenantId, tenantId),
          eq(customers.phone, data.phone)
        )
      ).limit(1);
      
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
      const activeBookingsResult = await db.select({ count: sql<number>`count(*)` }).from(bookings).where(
        and(
          eq(bookings.customerId, customerId),
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
          error: 'Cannot delete customer with active bookings. Please cancel or complete all bookings first.' 
        };
      }
      
      const [customer] = await db.select().from(customers).where(
        and(
          eq(customers.id, customerId),
          eq(customers.tenantId, tenantId)
        )
      ).limit(1);
      
      if (!customer) {
        return { success: false, error: 'Customer not found' };
      }
      
      await db.delete(customers).where(eq(customers.id, customerId));
      
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
      
      // Get total customers
      const [totalResult] = await db.select({ count: sql<number>`count(*)` }).from(customers).where(eq(customers.tenantId, tenantId));
      const totalCustomers = totalResult?.count || 0;
      
      // Get new customers this month
      const [newThisMonthResult] = await db.select({ count: sql<number>`count(*)` }).from(customers).where(
        and(
          eq(customers.tenantId, tenantId),
          gte(customers.createdAt, startOfMonth)
        )
      );
      const newCustomersThisMonth = newThisMonthResult?.count || 0;
      
      // Get active customers (with bookings in last 30 days)
      // This requires a join between customers and bookings tables
      const activeCustomersResult = await db
        .select({ customerId: customers.id })
        .from(customers)
        .leftJoin(bookings, eq(customers.id, bookings.customerId))
        .where(
          and(
            eq(customers.tenantId, tenantId),
            gte(bookings.scheduledAt, thirtyDaysAgo)
          )
        )
        .groupBy(customers.id);
      const activeCustomers = activeCustomersResult.length;
      
      // Get average bookings per customer
      const avgResult = await db.select({
        avg: sql<number>`AVG(${customers.totalBookings})`
      }).from(customers).where(eq(customers.tenantId, tenantId));
      const averageBookingsPerCustomer = Number(avgResult[0]?.avg || 0);
      
      // Get top customers
      const topCustomersResult = await db
        .select({
          id: customers.id,
          name: customers.name,
          totalBookings: customers.totalBookings
        })
        .from(customers)
        .where(eq(customers.tenantId, tenantId))
        .orderBy(desc(customers.totalBookings))
        .limit(5);
      
      // For each top customer, calculate their total spent
      const topCustomers = await Promise.all(topCustomersResult.map(async (customer) => {
        const totalSpentResult = await db.select({
          total: sql<number>`SUM(${bookings.totalAmount})`
        }).from(bookings).where(
          and(
            eq(bookings.customerId, customer.id),
            eq(bookings.status, 'completed'),
            eq(bookings.paymentStatus, 'paid')
          )
        );
        const totalSpent = Number(totalSpentResult[0]?.total || 0);
        
        return {
          id: customer.id,
          name: customer.name,
          totalBookings: Number(customer.totalBookings ?? 0),
          totalSpent
        };
      }));
      
      return {
        totalCustomers,
        newCustomersThisMonth,
        activeCustomers,
        averageBookingsPerCustomer,
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
      const customerResults = await db.select().from(customers).where(
        and(
          eq(customers.tenantId, tenantId),
          or(
            ilike(customers.name, `%${query}%`),
            ilike(customers.phone, `%${query}%`),
            ilike(customers.email, `%${query}%`),
            ilike(customers.whatsappNumber, `%${query}%`)
          )
        )
      ).orderBy(desc(customers.totalBookings)).limit(limit);
      
      return customerResults as Customer[];
    } catch (error) {
      console.error('Error searching customers:', error);
      return [];
    }
  }
}