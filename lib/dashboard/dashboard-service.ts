import { createClient } from '@supabase/supabase-js';

const getSupabaseClient = () => {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
};

const COMPLETED_STATUSES = ['confirmed', 'completed'] as const;

function toNumber(value: unknown): number {
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
}

async function countBookings(tenantId: string, filters: any = {}): Promise<number> {
  const supabase = getSupabaseClient();
  let query = supabase
    .from('bookings')
    .select('*', { count: 'exact', head: true })
    .eq('tenantId', tenantId);
  
  if (filters.status) {
    if (Array.isArray(filters.status)) {
      query = query.in('status', filters.status);
    } else {
      query = query.eq('status', filters.status);
    }
  }
  
  if (filters.paymentStatus) {
    query = query.eq('paymentStatus', filters.paymentStatus);
  }
  
  if (filters.startDate) {
    query = query.gte('scheduledAt', filters.startDate.toISOString());
  }
  
  if (filters.endDate) {
    query = query.lte('scheduledAt', filters.endDate.toISOString());
  }
  
  if (filters.createdBefore) {
    query = query.lt('createdAt', filters.createdBefore.toISOString());
  }
  
  if (filters.createdAfter) {
    query = query.gte('createdAt', filters.createdAfter.toISOString());
  }
  
  if (filters.updatedBefore) {
    query = query.lt('updatedAt', filters.updatedBefore.toISOString());
  }
  
  const { count, error } = await query;
  
  if (error) {
    console.error('Error counting bookings:', error);
    return 0;
  }
  
  return count || 0;
}

async function sumBookings(tenantId: string, filters: any = {}): Promise<number> {
  const supabase = getSupabaseClient();
  let query = supabase
    .from('bookings')
    .select('totalAmount')
    .eq('tenantId', tenantId);
  
  if (filters.status) {
    if (Array.isArray(filters.status)) {
      query = query.in('status', filters.status);
    } else {
      query = query.eq('status', filters.status);
    }
  }
  
  if (filters.startDate) {
    query = query.gte('scheduledAt', filters.startDate.toISOString());
  }
  
  if (filters.endDate) {
    query = query.lte('scheduledAt', filters.endDate.toISOString());
  }
  
  const { data, error } = await query;
  
  if (error) {
    console.error('Error summing bookings:', error);
    return 0;
  }
  
  return (data || []).reduce((sum, booking) => sum + toNumber(booking.totalAmount), 0);
}

async function sumSalesTransactions(tenantId: string, filters: any = {}): Promise<number> {
  const supabase = getSupabaseClient();
  let query = supabase
    .from('sales_transactions')
    .select('total_amount')
    .eq('tenant_id', tenantId);
  
  if (filters.status) {
    if (Array.isArray(filters.status)) {
      query = query.in('status', filters.status);
    } else {
      query = query.eq('status', filters.status);
    }
  }
  
  if (filters.startDate) {
    query = query.gte('created_at', filters.startDate.toISOString());
  }
  
  if (filters.endDate) {
    query = query.lt('created_at', filters.endDate.toISOString());
  }
  
  const { data, error } = await query;
  
  if (error) {
    console.error('Error summing sales transactions:', error);
    return 0;
  }
  
  return (data || []).reduce((sum, txn) => sum + toNumber(txn.total_amount), 0);
}

async function countCustomers(tenantId: string, filters: any = {}): Promise<number> {
  const supabase = getSupabaseClient();
  let query = supabase
    .from('customers')
    .select('*', { count: 'exact', head: true })
    .eq('tenantId', tenantId);
  
  if (filters.createdAfter) {
    query = query.gte('createdAt', filters.createdAfter.toISOString());
  }
  
  if (filters.createdBefore) {
    query = query.lte('createdAt', filters.createdBefore.toISOString());
  }
  
  const { count, error } = await query;
  
  if (error) {
    console.error('Error counting customers:', error);
    return 0;
  }
  
  return count || 0;
}

// Helper functions already defined above

export interface DashboardStats {
  todayBookings: number;
  todayBookingsChange: number;
  totalCustomers: number;
  newCustomersThisWeek: number;
  todayRevenue: number;
  revenueChange: number;
  completionRate: number;
}

export interface DashboardBooking {
  id: string;
  scheduledAt: Date;
  status: string;
  totalAmount: number;
  customer: {
    id: string;
    name: string;
    phone: string;
  };
  service: {
    id: string;
    name: string;
  };
}

export interface DashboardCustomer {
  id: string;
  name: string;
  phone: string;
  totalBookings: number;
  lastBookingAt: Date | null;
}

export interface PendingAction {
  id: string;
  type: 'booking_confirmation' | 'payment_overdue' | 'customer_message';
  title: string;
  description: string;
  actionUrl: string;
  actionText: string;
  priority: 'high' | 'medium' | 'low';
  createdAt: Date;
}

export class DashboardService {
  // Get today's statistics
  static async getTodayStats(tenantId: string): Promise<DashboardStats> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);

    try {
      const todayBookings = await countBookings(tenantId, {
        startDate: today,
        endDate: yesterday,
        status: null // all statuses
      });
      
      const yesterdayBookings = await countBookings(tenantId, {
        startDate: yesterday,
        endDate: today,
        status: null // all statuses
      });
      
      const totalCustomers = await countCustomers(tenantId);
      
      const newCustomersThisWeek = await countCustomers(tenantId, {
        createdAfter: weekAgo
      });
      
      const todayBookingsRevenue = await sumBookings(tenantId, {
        startDate: today,
        endDate: tomorrow,
        status: COMPLETED_STATUSES
      });
      
      const todaySalesRevenue = await sumSalesTransactions(tenantId, {
        startDate: today,
        endDate: tomorrow,
        status: 'completed'
      });
      
      const todayRevenue = todayBookingsRevenue + todaySalesRevenue;
      
      const yesterdayBookingsRevenue = await sumBookings(tenantId, {
        startDate: yesterday,
        endDate: today,
        status: COMPLETED_STATUSES
      });
      
      const yesterdaySalesRevenue = await sumSalesTransactions(tenantId, {
        startDate: yesterday,
        endDate: today,
        status: 'completed'
      });
      
      const yesterdayRevenue = yesterdayBookingsRevenue + yesterdaySalesRevenue;
      
      const thisWeekBookings = await countBookings(tenantId, {
        startDate: weekAgo
      });
      
      const thisWeekCompleted = await countBookings(tenantId, {
        startDate: weekAgo,
        status: 'completed'
      });

      const todayBookingsChange = yesterdayBookings > 0 
        ? Math.round(((todayBookings - yesterdayBookings) / yesterdayBookings) * 100)
        : 0;

      const revenueChange = yesterdayRevenue > 0
        ? Math.round(((todayRevenue - yesterdayRevenue) / yesterdayRevenue) * 100)
        : 0;

      const completionRate = thisWeekBookings > 0
        ? Math.round((thisWeekCompleted / thisWeekBookings) * 100)
        : 0;

      return {
        todayBookings,
        todayBookingsChange,
        totalCustomers,
        newCustomersThisWeek,
        todayRevenue,
        revenueChange,
        completionRate,
      };
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      return {
        todayBookings: 0,
        todayBookingsChange: 0,
        totalCustomers: 0,
        newCustomersThisWeek: 0,
        todayRevenue: 0,
        revenueChange: 0,
        completionRate: 0,
      };
    }
  }

  // Get recent bookings
  static async getRecentBookings(tenantId: string, limit: number = 10): Promise<DashboardBooking[]> {
    try {
      const supabase = getSupabaseClient();
      
      // Get recent bookings with customer and service data
      const { data: bookings, error } = await supabase
        .from('bookings')
        .select(`
          id,
          scheduledAt,
          status,
          totalAmount,
          customer:customers(id, name, phone),
          service:services(id, name)
        `)
        .eq('tenantId', tenantId)
        .order('createdAt', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error fetching recent bookings:', error);
        return [];
      }

      return (bookings || []).map((booking: any) => ({
        id: booking.id,
        scheduledAt: booking.scheduledAt ? new Date(booking.scheduledAt) : new Date(),
        status: booking.status || 'pending',
        totalAmount: toNumber(booking.totalAmount),
        customer: {
          id: booking.customer?.id || '',
          name: booking.customer?.name || 'Unknown',
          phone: booking.customer?.phone || '',
        },
        service: {
          id: booking.service?.id || '',
          name: booking.service?.name || 'Unknown',
        },
      }));
    } catch (error) {
      console.error('Error fetching recent bookings:', error);
      return [];
    }
  }

  // Get upcoming bookings
  static async getUpcomingBookings(tenantId: string, limit: number = 10): Promise<DashboardBooking[]> {
    const now = new Date();
    
    try {
      const supabase = getSupabaseClient();
      
      const { data: bookings, error } = await supabase
        .from('bookings')
        .select(`
          id,
          scheduledAt,
          status,
          totalAmount,
          customer:customers(id, name, phone),
          service:services(id, name)
        `)
        .eq('tenantId', tenantId)
        .gte('scheduledAt', now.toISOString())
        .in('status', ['pending', 'confirmed'])
        .order('scheduledAt', { ascending: true })
        .limit(limit);

      if (error) {
        console.error('Error fetching upcoming bookings:', error);
        return [];
      }

      return (bookings || []).map((booking: any) => ({
        id: booking.id,
        scheduledAt: booking.scheduledAt ? new Date(booking.scheduledAt) : new Date(),
        status: booking.status || 'pending',
        totalAmount: toNumber(booking.totalAmount),
        customer: {
          id: booking.customer?.id || '',
          name: booking.customer?.name || 'Unknown',
          phone: booking.customer?.phone || '',
        },
        service: {
          id: booking.service?.id || '',
          name: booking.service?.name || 'Unknown',
        },
      }));
    } catch (error) {
      console.error('Error fetching upcoming bookings:', error);
      return [];
    }
  }

  // Get recent customers
  static async getRecentCustomers(tenantId: string, limit: number = 10): Promise<DashboardCustomer[]> {
    try {
      const supabase = getSupabaseClient();
      
      const { data: customers, error } = await supabase
        .from('customers')
        .select('id, name, phone, totalBookings, lastBookingAt')
        .eq('tenantId', tenantId)
        .order('createdAt', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error fetching recent customers:', error);
        return [];
      }

      return (customers || []).map(customer => ({
        id: customer.id,
        name: customer.name,
        phone: customer.phone || '',
        totalBookings: customer.totalBookings ?? 0,
        lastBookingAt: customer.lastBookingAt ? new Date(customer.lastBookingAt) : null,
      }));
    } catch (error) {
      console.error('Error fetching recent customers:', error);
      return [];
    }
  }

  // Get pending actions that need attention
  static async getPendingActions(tenantId: string): Promise<PendingAction[]> {
    const actions: PendingAction[] = [];
    const now = new Date();

    try {
      const supabase = getSupabaseClient();

      // Pending booking confirmations (bookings created more than 1 hour ago but still pending)
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
      const { count: pendingBookingsCount, error: pendingError } = await supabase
        .from('bookings')
        .select('*', { count: 'exact', head: true })
        .eq('tenantId', tenantId)
        .eq('status', 'pending')
        .lt('createdAt', oneHourAgo.toISOString());

      if (!pendingError && pendingBookingsCount && pendingBookingsCount > 0) {
        actions.push({
          id: 'pending-bookings',
          type: 'booking_confirmation',
          title: `${pendingBookingsCount} booking${pendingBookingsCount > 1 ? 's' : ''} awaiting confirmation`,
          description: 'These bookings have been waiting for more than an hour',
          actionUrl: '/admin/bookings?status=pending',
          actionText: 'Review Bookings',
          priority: 'high',
          createdAt: now,
        });
      }

      // Overdue payments
      const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const { count: overduePaymentsCount, error: overdueError } = await supabase
        .from('bookings')
        .select('*', { count: 'exact', head: true })
        .eq('tenantId', tenantId)
        .eq('status', 'completed')
        .eq('paymentStatus', 'pending')
        .lt('updatedAt', oneDayAgo.toISOString());

      if (!overdueError && overduePaymentsCount && overduePaymentsCount > 0) {
        actions.push({
          id: 'overdue-payments',
          type: 'payment_overdue',
          title: `${overduePaymentsCount} overdue payment${overduePaymentsCount > 1 ? 's' : ''}`,
          description: 'These payments are overdue by more than 24 hours',
          actionUrl: '/admin/bookings?payment_status=overdue',
          actionText: 'Follow Up',
          priority: 'high',
          createdAt: now,
        });
      }

      // Today's appointments
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const { count: todayCount, error: todayError } = await supabase
        .from('bookings')
        .select('*', { count: 'exact', head: true })
        .eq('tenantId', tenantId)
        .eq('status', 'confirmed')
        .gte('scheduledAt', today.toISOString())
        .lt('scheduledAt', tomorrow.toISOString());

      if (!todayError && todayCount && todayCount > 0) {
        actions.push({
          id: 'today-confirmations',
          type: 'booking_confirmation',
          title: `${todayCount} appointment${todayCount > 1 ? 's' : ''} today`,
          description: 'Consider sending confirmation reminders',
          actionUrl: '/admin/bookings?date=today',
          actionText: 'Send Reminders',
          priority: 'medium',
          createdAt: now,
        });
      }

      return actions.sort((a, b) => {
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
        if (priorityDiff !== 0) return priorityDiff;
        return b.createdAt.getTime() - a.createdAt.getTime();
      });
    } catch (error) {
      console.error('Error fetching pending actions:', error);
      return [];
    }
  }

  // Get dashboard summary for a specific date range
  static async getDashboardSummary(
    tenantId: string,
    startDate: Date,
    endDate: Date
  ): Promise<{
    totalBookings: number;
    totalRevenue: number;
    totalCustomers: number;
    averageBookingValue: number;
    completionRate: number;
  }> {
    try {
      const supabase = getSupabaseClient();
      const startDateStr = startDate.toISOString();
      const endDateStr = endDate.toISOString();

      const [
        { count: bookingsCount },
        { data: bookingsData },
        { data: salesData },
        { count: customersCount },
        { count: completedCount },
      ] = await Promise.all([
        supabase
          .from('bookings')
          .select('*', { count: 'exact', head: true })
          .eq('tenantId', tenantId)
          .gte('scheduledAt', startDateStr)
          .lte('scheduledAt', endDateStr),
        supabase
          .from('bookings')
          .select('totalAmount')
          .eq('tenantId', tenantId)
          .in('status', Array.from(COMPLETED_STATUSES))
          .gte('scheduledAt', startDateStr)
          .lte('scheduledAt', endDateStr),
        supabase
          .from('sales_transactions')
          .select('total_amount')
          .eq('tenant_id', tenantId)
          .eq('status', 'completed')
          .gte('created_at', startDateStr)
          .lte('created_at', endDateStr),
        supabase
          .from('customers')
          .select('*', { count: 'exact', head: true })
          .eq('tenantId', tenantId)
          .gte('createdAt', startDateStr)
          .lte('createdAt', endDateStr),
        supabase
          .from('bookings')
          .select('*', { count: 'exact', head: true })
          .eq('tenantId', tenantId)
          .eq('status', 'completed')
          .gte('scheduledAt', startDateStr)
          .lte('scheduledAt', endDateStr),
      ]);

      const bookingsRevenue = (bookingsData || []).reduce((sum, b) => sum + toNumber(b.totalAmount), 0);
      const salesRevenue = (salesData || []).reduce((sum, s) => sum + toNumber(s.total_amount), 0);
      const totalRevenue = bookingsRevenue + salesRevenue;
      const bookingsCount_val = bookingsCount || 0;
      const completedCount_val = completedCount || 0;

      const averageBookingValue = bookingsCount_val > 0 ? totalRevenue / bookingsCount_val : 0;
      const completionRate = bookingsCount_val > 0 ? (completedCount_val / bookingsCount_val) * 100 : 0;

      return {
        totalBookings: bookingsCount_val,
        totalRevenue,
        totalCustomers: customersCount || 0,
        averageBookingValue,
        completionRate: Math.round(completionRate),
      };
    } catch (error) {
      console.error('Error fetching dashboard summary:', error);
      return {
        totalBookings: 0,
        totalRevenue: 0,
        totalCustomers: 0,
        averageBookingValue: 0,
        completionRate: 0,
      };
    }
  }
}