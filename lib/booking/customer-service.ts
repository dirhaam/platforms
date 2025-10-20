import { createClient } from '@supabase/supabase-js';
import { Customer, CreateCustomerRequest, UpdateCustomerRequest } from '@/types/booking';

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

// Map database snake_case fields to camelCase Customer interface
const mapToCustomer = (dbData: any): Customer => {
  return {
    id: dbData.id,
    tenantId: dbData.tenant_id,
    name: dbData.name,
    email: dbData.email,
    phone: dbData.phone,
    address: dbData.address,
    notes: dbData.notes,
    totalBookings: dbData.total_bookings,
    lastBookingAt: dbData.last_booking_at ? new Date(dbData.last_booking_at) : null,
    whatsappNumber: dbData.whatsapp_number,
    createdAt: new Date(dbData.created_at),
    updatedAt: new Date(dbData.updated_at)
  };
};

export class CustomerService {
  static async createCustomer(tenantId: string, data: CreateCustomerRequest): Promise<{ customer?: Customer; error?: string }> {
    try {
      const supabase = getSupabaseClient();
      
      const newCustomer = {
        id: randomUUID(),
        tenant_id: tenantId,
        name: data.name,
        email: data.email || null,
        phone: data.phone,
        address: data.address || null,
        notes: data.notes || null,
        whatsapp_number: data.phone,
        total_bookings: 0,
        last_booking_at: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      const { data: customer, error } = await supabase
        .from('customers')
        .insert(newCustomer)
        .select()
        .single();
      
      if (error || !customer) {
        return { error: 'Failed to create customer' };
      }
      
      return { customer: customer as Customer };
    } catch (error) {
      console.error('Error in createCustomer:', error);
      return { error: 'Internal server error' };
    }
  }
  
  static async updateCustomer(tenantId: string, customerId: string, data: UpdateCustomerRequest): Promise<{ customer?: Customer; error?: string }> {
    try {
      const supabase = getSupabaseClient();
      
      const customer = await this.getCustomer(tenantId, customerId);
      if (!customer) {
        return { error: 'Customer not found' };
      }
      
      const updateData: any = {
        updated_at: new Date().toISOString()
      };
      
      if (data.name !== undefined) updateData.name = data.name;
      if (data.email !== undefined) updateData.email = data.email;
      if (data.phone !== undefined) updateData.phone = data.phone;
      if (data.address !== undefined) updateData.address = data.address;
      if (data.notes !== undefined) updateData.notes = data.notes;
      
      const { data: updatedCustomer, error } = await supabase
        .from('customers')
        .update(updateData)
        .eq('id', customerId)
        .eq('tenant_id', tenantId)
        .select()
        .single();
      
      if (error || !updatedCustomer) {
        return { error: 'Failed to update customer' };
      }
      
      return { customer: updatedCustomer as Customer };
    } catch (error) {
      console.error('Error in updateCustomer:', error);
      return { error: 'Internal server error' };
    }
  }
  
  static async getCustomer(tenantId: string, customerId: string): Promise<Customer | null> {
    try {
      const supabase = getSupabaseClient();
      
      const { data: customer, error } = await supabase
        .from('customers')
        .select('*')
        .eq('id', customerId)
        .eq('tenant_id', tenantId)
        .single();
      
      if (error || !customer) {
        return null;
      }
      
      return customer as Customer;
    } catch (error) {
      console.error('Error in getCustomer:', error);
      return null;
    }
  }
  
  static async getCustomers(tenantId: string, options: any = {}): Promise<any> {
    try {
      const supabase = getSupabaseClient();
      
      let query = supabase
        .from('customers')
        .select('*')
        .eq('tenant_id', tenantId);
      
      if (options.search) {
        query = query.or(`name.ilike.%${options.search}%,phone.ilike.%${options.search}%,email.ilike.%${options.search}%`);
      }
      
      if (options.hasBookings === true) {
        query = query.gt('totalBookings', 0);
      } else if (options.hasBookings === false) {
        query = query.eq('totalBookings', 0);
      }
      
      if (options.sortBy) {
        const ascending = options.sortOrder !== 'desc';
        query = query.order(options.sortBy, { ascending });
      } else {
        query = query.order('createdAt', { ascending: false });
      }
      
      if (options.limit) {
        query = query.limit(options.limit);
      }
      
      if (options.offset) {
        query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
      }
      
      const { data: customers, error, count } = await query;
      
      if (error) {
        console.error('Error fetching customers:', error);
        return { customers: [], count: 0, error: error.message };
      }
      
      return { customers: (customers || []) as Customer[], count: count || 0 };
    } catch (error) {
      console.error('Error in getCustomers:', error);
      return { customers: [], count: 0, error: 'Internal server error' };
    }
  }
  
  static async deleteCustomer(tenantId: string, customerId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const supabase = getSupabaseClient();
      
      const customer = await this.getCustomer(tenantId, customerId);
      if (!customer) {
        return { success: false, error: 'Customer not found' };
      }
      
      const { error } = await supabase
        .from('customers')
        .delete()
        .eq('id', customerId)
        .eq('tenant_id', tenantId);
      
      if (error) {
        return { success: false, error: 'Failed to delete customer' };
      }
      
      return { success: true };
    } catch (error) {
      console.error('Error in deleteCustomer:', error);
      return { success: false, error: 'Internal server error' };
    }
  }
  
  static async findOrCreateCustomer(tenantId: string, data: any): Promise<{ customer?: Customer; error?: string; created?: boolean }> {
    try {
      const supabase = getSupabaseClient();
      
      const { data: existingCustomer, error: fetchError } = await supabase
        .from('customers')
        .select('*')
        .eq('tenant_id', tenantId)
        .eq('phone', data.phone)
        .single();
      
      if (!fetchError && existingCustomer) {
        return { customer: existingCustomer as Customer, created: false };
      }
      
      return await this.createCustomer(tenantId, data);
    } catch (error) {
      console.error('Error in findOrCreateCustomer:', error);
      return { error: 'Internal server error', created: false };
    }
  }
  
  static async searchCustomers(tenantId: string, query: string, limit?: number): Promise<Customer[]> {
    try {
      const supabase = getSupabaseClient();
      
      let searchQuery = supabase
        .from('customers')
        .select('*')
        .eq('tenant_id', tenantId)
        .or(`name.ilike.%${query}%,phone.ilike.%${query}%,email.ilike.%${query}%`);
      
      if (limit) {
        searchQuery = searchQuery.limit(limit);
      }
      
      const { data: customers, error } = await searchQuery;
      
      if (error || !customers) {
        return [];
      }
      
      return customers as Customer[];
    } catch (error) {
      console.error('Error in searchCustomers:', error);
      return [];
    }
  }
  
  static async getCustomerStats(tenantId: string): Promise<any> {
    try {
      const supabase = getSupabaseClient();
      
      const { count: totalCustomers } = await supabase
        .from('customers')
        .select('*', { count: 'exact', head: true })
        .eq('tenant_id', tenantId);
      
      const now = new Date();
      const monthAgo = new Date(now.getFullYear(), now.getMonth(), 1);
      
      const { count: newCustomersThisMonth } = await supabase
        .from('customers')
        .select('*', { count: 'exact', head: true })
        .eq('tenant_id', tenantId)
        .gte('created_at', monthAgo.toISOString());
      
      const { data: customers } = await supabase
        .from('customers')
        .select('total_bookings')
        .eq('tenant_id', tenantId);
      
      const totalBookings = (customers || []).reduce((sum, c: any) => sum + (c.total_bookings || 0), 0);
      
      return {
        totalCustomers: totalCustomers || 0,
        newCustomersThisMonth: newCustomersThisMonth || 0,
        totalBookings
      };
    } catch (error) {
      console.error('Error in getCustomerStats:', error);
      return {
        totalCustomers: 0,
        newCustomersThisMonth: 0,
        totalBookings: 0
      };
    }
  }
}
