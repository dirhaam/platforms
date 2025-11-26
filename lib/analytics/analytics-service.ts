import { createClient } from '@supabase/supabase-js';
import {
  AnalyticsDashboardData,
  BookingMetrics,
  CustomerMetrics,
  ServiceMetrics,
  TimeBasedMetrics,
  BusinessKPIs,
  SalesMetrics,
  AnalyticsFilters,
  ConversionMetrics,
  PlatformAnalytics,
} from '@/types/analytics';

const getSupabaseClient = () => {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
};

type BookingRow = {
  id: string;
  tenantId: string;
  customerId: string;
  serviceId: string;
  status: string | null;
  scheduledAt: Date;
  createdAt: Date;
  totalAmount: string | number | null;
  paymentStatus: string | null;
  paymentMethod: string | null;
  paidAmount: string | number | null;
};

type CustomerRow = {
  id: string;
  tenantId: string;
  name: string;
  createdAt: Date;
};

type ServiceRow = {
  id: string;
  tenantId: string;
  name: string;
  isActive: boolean | null;
};

const COMPLETED_STATUSES = ['completed', 'confirmed'] as const;
const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function formatPaymentMethod(method: string): string {
  const methodMap: Record<string, string> = {
    'cash': 'Cash',
    'card': 'Kartu Debit/Kredit',
    'transfer': 'Transfer Bank',
    'qris': 'QRIS',
    'bank_transfer': 'Transfer Bank',
    'credit_card': 'Kartu Kredit',
    'debit_card': 'Kartu Debit',
  };
  return methodMap[method.toLowerCase()] || method;
}

function toNumber(value: unknown): number {
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
}

async function fetchTenantBookings(
  tenantId: string,
  startDate: Date,
  endDate: Date,
  options: { statuses?: string[]; serviceIds?: string[] } = {}
): Promise<BookingRow[]> {
  const supabase = getSupabaseClient();
  
  let query = supabase
    .from('bookings')
    .select('*')
    .eq('tenantId', tenantId)
    .gte('createdAt', startDate.toISOString())
    .lte('createdAt', endDate.toISOString());

  if (options.statuses && options.statuses.length > 0) {
    query = query.in('status', options.statuses);
  }

  if (options.serviceIds && options.serviceIds.length > 0) {
    query = query.in('serviceId', options.serviceIds);
  }

  const { data, error } = await query;
  
  if (error) {
    console.error('Error fetching bookings:', error);
    return [];
  }

  return (data || []).map<BookingRow>(row => ({
    id: row.id,
    tenantId: row.tenantId,
    customerId: row.customerId,
    serviceId: row.serviceId,
    status: row.status,
    scheduledAt: row.scheduledAt ? new Date(row.scheduledAt) : new Date(),
    createdAt: row.createdAt ? new Date(row.createdAt) : new Date(),
    totalAmount: row.totalAmount,
    paymentStatus: row.paymentStatus,
    paymentMethod: row.paymentMethod,
    paidAmount: row.paidAmount,
  }));
}

async function fetchTenantCustomers(tenantId: string): Promise<CustomerRow[]> {
  const supabase = getSupabaseClient();
  
  const { data, error } = await supabase
    .from('customers')
    .select('*')
    .eq('tenantId', tenantId);
  
  if (error) {
    console.error('Error fetching customers:', error);
    return [];
  }
  
  return (data || []).map<CustomerRow>(row => ({
    id: row.id,
    tenantId: row.tenantId,
    name: row.name,
    createdAt: row.createdAt ? new Date(row.createdAt) : new Date(),
  }));
}

async function fetchTenantServices(tenantId: string): Promise<ServiceRow[]> {
  const supabase = getSupabaseClient();
  
  const { data, error } = await supabase
    .from('services')
    .select('*')
    .eq('tenantId', tenantId);
  
  if (error) {
    console.error('Error fetching services:', error);
    return [];
  }
  
  return (data || []).map<ServiceRow>(row => ({
    id: row.id,
    tenantId: row.tenantId,
    name: row.name,
    isActive: row.isActive,
  }));
}

export class AnalyticsService {
  static async getTenantAnalytics(
    tenantId: string, 
    filters: AnalyticsFilters
  ): Promise<AnalyticsDashboardData> {
    const { startDate, endDate } = filters.dateRange;
    
    const [
      bookingMetrics,
      customerMetrics,
      serviceMetrics,
      timeBasedMetrics,
      businessKPIs,
      salesMetrics
    ] = await Promise.all([
      this.getBookingMetrics(tenantId, startDate, endDate, filters),
      this.getCustomerMetrics(tenantId, startDate, endDate),
      this.getServiceMetrics(tenantId, startDate, endDate),
      this.getTimeBasedMetrics(tenantId, startDate, endDate),
      this.getBusinessKPIs(tenantId, startDate, endDate),
      this.getSalesMetrics(tenantId, startDate, endDate)
    ]);

    let comparisonPeriod;
    if (filters.comparisonEnabled) {
      const periodDiff = endDate.getTime() - startDate.getTime();
      const comparisonStart = new Date(startDate.getTime() - periodDiff);
      const comparisonEnd = new Date(startDate.getTime() - 1);
      
      comparisonPeriod = {
        bookingMetrics: await this.getBookingMetrics(tenantId, comparisonStart, comparisonEnd, filters),
        customerMetrics: await this.getCustomerMetrics(tenantId, comparisonStart, comparisonEnd),
        dateRange: {
          startDate: comparisonStart,
          endDate: comparisonEnd
        }
      };
    }

    return {
      bookingMetrics,
      customerMetrics,
      serviceMetrics,
      timeBasedMetrics,
      businessKPIs,
      salesMetrics,
      dateRange: filters.dateRange,
      comparisonPeriod
    };
  }

  private static async getSalesMetrics(
    tenantId: string,
    startDate: Date,
    endDate: Date
  ): Promise<SalesMetrics> {
    const bookingRows = await fetchTenantBookings(tenantId, startDate, endDate);

    // Calculate paid and unpaid amounts
    let totalPaidAmount = 0;
    let totalUnpaidAmount = 0;
    const paymentMethodMap = new Map<string, { count: number; amount: number }>();
    const dailySalesMap = new Map<string, { amount: number; transactions: number }>();
    let paidBookingsCount = 0;

    bookingRows.forEach(booking => {
      const amount = toNumber(booking.totalAmount);
      const paidAmount = toNumber(booking.paidAmount);
      const isPaid = booking.paymentStatus === 'paid' || paidAmount >= amount;
      
      if (isPaid) {
        totalPaidAmount += amount;
        paidBookingsCount++;
      } else if (booking.status !== 'cancelled') {
        totalUnpaidAmount += amount - paidAmount;
      }

      // Payment method breakdown
      if (isPaid && booking.paymentMethod) {
        const methodName = formatPaymentMethod(booking.paymentMethod);
        const current = paymentMethodMap.get(methodName) || { count: 0, amount: 0 };
        current.count += 1;
        current.amount += amount;
        paymentMethodMap.set(methodName, current);
      }

      // Daily sales
      const dateKey = booking.createdAt.toISOString().split('T')[0];
      const dailyCurrent = dailySalesMap.get(dateKey) || { amount: 0, transactions: 0 };
      if (isPaid) {
        dailyCurrent.amount += amount;
        dailyCurrent.transactions += 1;
      }
      dailySalesMap.set(dateKey, dailyCurrent);
    });

    const paymentMethodBreakdown = Array.from(paymentMethodMap.entries())
      .map(([method, data]) => ({
        method,
        count: data.count,
        amount: data.amount
      }))
      .sort((a, b) => b.amount - a.amount);

    const dailySales = Array.from(dailySalesMap.entries())
      .map(([date, data]) => ({
        date,
        amount: data.amount,
        transactions: data.transactions
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    const totalValidBookings = bookingRows.filter(b => b.status !== 'cancelled').length;
    const paymentSuccessRate = totalValidBookings > 0
      ? (paidBookingsCount / totalValidBookings) * 100
      : 0;

    return {
      totalPaidAmount,
      totalUnpaidAmount,
      paymentMethodBreakdown,
      dailySales,
      paymentSuccessRate
    };
  }

  private static async getBookingMetrics(
    tenantId: string, 
    startDate: Date, 
    endDate: Date,
    filters: AnalyticsFilters
  ): Promise<BookingMetrics> {
    const bookingRows = await fetchTenantBookings(tenantId, startDate, endDate, {
      statuses: filters.bookingStatuses,
      serviceIds: filters.services,
    });

    const totalBookings = bookingRows.length;
    const confirmedBookings = bookingRows.filter(b => b.status === 'confirmed').length;
    const completedBookings = bookingRows.filter(b => b.status === 'completed').length;
    const cancelledBookings = bookingRows.filter(b => b.status === 'cancelled').length;
    const noShowBookings = bookingRows.filter(b => b.status === 'no_show').length;

    const revenueBookings = bookingRows.filter(b => COMPLETED_STATUSES.includes(b.status as (typeof COMPLETED_STATUSES)[number]));
    const totalRevenue = revenueBookings.reduce((sum, booking) => sum + toNumber(booking.totalAmount), 0);
    const conversionRate = totalBookings > 0 ? (completedBookings / totalBookings) * 100 : 0;
    const averageBookingValue = completedBookings > 0 ? totalRevenue / completedBookings : 0;

    return {
      totalBookings,
      confirmedBookings,
      completedBookings,
      cancelledBookings,
      noShowBookings,
      conversionRate,
      averageBookingValue,
      totalRevenue,
    };
  }

  private static async getCustomerMetrics(
    tenantId: string, 
    startDate: Date, 
    endDate: Date
  ): Promise<CustomerMetrics> {
    const customerRows = await fetchTenantCustomers(tenantId);

    const supabase = getSupabaseClient();
    
    const { count: newCustomersResult, error: countError } = await supabase
      .from('customers')
      .select('*', { count: 'exact', head: true })
      .eq('tenantId', tenantId)
      .gte('createdAt', startDate.toISOString())
      .lte('createdAt', endDate.toISOString());
    
    if (countError) {
      console.error('Error counting new customers:', countError);
    }

    const bookingRows = await fetchTenantBookings(tenantId, startDate, endDate, {
      statuses: Array.from(COMPLETED_STATUSES),
    });

    const bookingMap = new Map<string, { count: number; total: number }>();
    for (const booking of bookingRows) {
      const stat = bookingMap.get(booking.customerId) || { count: 0, total: 0 };
      stat.count += 1;
      stat.total += toNumber(booking.totalAmount);
      bookingMap.set(booking.customerId, stat);
    }

    const totalCustomers = customerRows.length;
    const returningCustomers = Array.from(bookingMap.values()).filter(stat => stat.count > 1).length;
    const totalRevenue = Array.from(bookingMap.values()).reduce((sum, stat) => sum + stat.total, 0);
    const customerRetentionRate = totalCustomers > 0 ? (returningCustomers / totalCustomers) * 100 : 0;
    const averageCustomerLifetimeValue = totalCustomers > 0 ? totalRevenue / totalCustomers : 0;

    const topCustomers = customerRows
      .map(customer => {
        const stats = bookingMap.get(customer.id) || { count: 0, total: 0 };
        return {
          id: customer.id,
          name: customer.name,
          totalBookings: stats.count,
          totalSpent: stats.total,
        };
      })
      .sort((a, b) => b.totalSpent - a.totalSpent)
      .slice(0, 5);

    return {
      totalCustomers,
      newCustomers: newCustomersResult ?? 0,
      returningCustomers,
      customerRetentionRate,
      averageCustomerLifetimeValue,
      topCustomers,
    };
  }

  private static async getServiceMetrics(
    tenantId: string, 
    startDate: Date, 
    endDate: Date
  ): Promise<ServiceMetrics> {
    const serviceRows = await fetchTenantServices(tenantId);
    const bookingRows = await fetchTenantBookings(tenantId, startDate, endDate, {
      statuses: Array.from(COMPLETED_STATUSES),
    });

    const statsByService = new Map<string, { count: number; revenue: number }>();
    for (const booking of bookingRows) {
      const stat = statsByService.get(booking.serviceId) || { count: 0, revenue: 0 };
      stat.count += 1;
      stat.revenue += toNumber(booking.totalAmount);
      statsByService.set(booking.serviceId, stat);
    }

    const topServices = serviceRows
      .map(service => {
        const stats = statsByService.get(service.id) || { count: 0, revenue: 0 };
        return {
          id: service.id,
          name: service.name,
          bookingCount: stats.count,
          revenue: stats.revenue,
        };
      })
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    const servicePerformance = Array.from(statsByService.entries()).map(([serviceId, stats]) => {
      const service = serviceRows.find(s => s.id === serviceId);
      return {
        serviceId,
        serviceName: service?.name || 'Unknown Service',
        bookings: stats.count,
        revenue: stats.revenue,
      };
    });

    return {
      totalServices: serviceRows.length,
      activeServices: serviceRows.filter(s => s.isActive).length,
      topServices,
      servicePerformance,
    };
  }

  private static async getTimeBasedMetrics(
    tenantId: string, 
    startDate: Date, 
    endDate: Date
  ): Promise<TimeBasedMetrics> {
    const bookingRows = await fetchTenantBookings(tenantId, startDate, endDate, {
      statuses: Array.from(COMPLETED_STATUSES),
    });

    // Hourly distribution
    const hourlyMap = new Map<number, number>();
    for (let i = 0; i < 24; i++) {
      hourlyMap.set(i, 0);
    }
    
    bookingRows.forEach(booking => {
      const hour = booking.scheduledAt.getHours();
      hourlyMap.set(hour, (hourlyMap.get(hour) || 0) + 1);
    });

    const hourlyDistribution = Array.from(hourlyMap.entries()).map(([hour, bookings]) => ({
      hour,
      bookings
    }));

    // Daily distribution (last 7 days)
    const dailyMap = new Map<string, { bookings: number; revenue: number }>();
    DAY_NAMES.forEach(day => {
      dailyMap.set(day, { bookings: 0, revenue: 0 });
    });

    bookingRows.forEach(booking => {
      const dayName = DAY_NAMES[booking.scheduledAt.getDay()];
      const current = dailyMap.get(dayName) || { bookings: 0, revenue: 0 };
      dailyMap.set(dayName, {
        bookings: current.bookings + 1,
        revenue: current.revenue + toNumber(booking.totalAmount)
      });
    });

    const dailyDistribution = Array.from(dailyMap.entries()).map(([day, data]) => ({
      day,
      bookings: data.bookings,
      revenue: data.revenue
    }));

    // Monthly trends (last 12 months)
    const monthlyMap = new Map<string, { bookings: number; revenue: number; customers: Set<string> }>();
    
    bookingRows.forEach(booking => {
      const monthKey = booking.scheduledAt.toISOString().substring(0, 7); // YYYY-MM
      const current = monthlyMap.get(monthKey) || { bookings: 0, revenue: 0, customers: new Set() };
      current.bookings += 1;
      current.revenue += toNumber(booking.totalAmount);
      current.customers.add(booking.customerId);
      monthlyMap.set(monthKey, current);
    });

    const monthlyTrends = Array.from(monthlyMap.entries())
      .map(([month, data]) => ({
        month,
        bookings: data.bookings,
        revenue: data.revenue,
        customers: data.customers.size
      }))
      .sort((a, b) => a.month.localeCompare(b.month));

    return {
      hourlyDistribution,
      dailyDistribution,
      monthlyTrends
    };
  }

  private static async getBusinessKPIs(
    tenantId: string, 
    startDate: Date, 
    endDate: Date
  ): Promise<BusinessKPIs> {
    // Calculate growth rates by comparing with previous period
    const periodDiff = endDate.getTime() - startDate.getTime();
    const prevStartDate = new Date(startDate.getTime() - periodDiff);
    const prevEndDate = new Date(startDate.getTime() - 1);

    const [currentMetrics, previousMetrics, timeMetrics] = await Promise.all([
      this.getBookingMetrics(tenantId, startDate, endDate, { dateRange: { startDate, endDate } }),
      this.getBookingMetrics(tenantId, prevStartDate, prevEndDate, { dateRange: { startDate: prevStartDate, endDate: prevEndDate } }),
      this.getTimeBasedMetrics(tenantId, startDate, endDate)
    ]);

    const bookingGrowthRate = previousMetrics.totalBookings > 0 ? 
      ((currentMetrics.totalBookings - previousMetrics.totalBookings) / previousMetrics.totalBookings) * 100 : 0;
    
    const revenueGrowthRate = previousMetrics.totalRevenue > 0 ? 
      ((currentMetrics.totalRevenue - previousMetrics.totalRevenue) / previousMetrics.totalRevenue) * 100 : 0;

    // Get customer growth rate
    const supabase = getSupabaseClient();
    const [currentCustomersResult, previousCustomersResult] = await Promise.all([
      supabase
        .from('customers')
        .select('*', { count: 'exact', head: true })
        .eq('tenantId', tenantId)
        .lte('createdAt', endDate.toISOString()),
      supabase
        .from('customers')
        .select('*', { count: 'exact', head: true })
        .eq('tenantId', tenantId)
        .lte('createdAt', prevEndDate.toISOString()),
    ]);

    const currentCustomers = currentCustomersResult.count ?? 0;
    const previousCustomers = previousCustomersResult.count ?? 0;

    const customerGrowthRate = previousCustomers > 0 ? 
      ((currentCustomers - previousCustomers) / previousCustomers) * 100 : 0;

    const averageBookingsPerCustomer = currentCustomers > 0 ? 
      currentMetrics.totalBookings / currentCustomers : 0;

    // Peak hours (top 3 hours with most bookings)
    const peakBookingHours = timeMetrics.hourlyDistribution
      .sort((a, b) => b.bookings - a.bookings)
      .slice(0, 3)
      .map(h => h.hour);

    // Busy days (top 3 days with most bookings)
    const busyDays = timeMetrics.dailyDistribution
      .sort((a, b) => b.bookings - a.bookings)
      .slice(0, 3)
      .map(d => d.day);

    // Seasonal trends (quarterly)
    const seasonalTrends = this.calculateSeasonalTrends(timeMetrics.monthlyTrends);

    return {
      bookingGrowthRate,
      revenueGrowthRate,
      customerGrowthRate,
      averageBookingsPerCustomer,
      peakBookingHours,
      busyDays,
      seasonalTrends
    };
  }

  private static calculateSeasonalTrends(monthlyTrends: any[]) {
    const quarters = [
      { period: 'Q1', months: ['01', '02', '03'] },
      { period: 'Q2', months: ['04', '05', '06'] },
      { period: 'Q3', months: ['07', '08', '09'] },
      { period: 'Q4', months: ['10', '11', '12'] }
    ];

    return quarters.map(quarter => {
      const quarterData = monthlyTrends.filter(trend => 
        quarter.months.some(month => trend.month.endsWith(`-${month}`))
      );

      return {
        period: quarter.period,
        bookings: quarterData.reduce((sum, data) => sum + data.bookings, 0),
        revenue: quarterData.reduce((sum, data) => sum + data.revenue, 0)
      };
    });
  }

  static async getConversionMetrics(
    tenantId: string, 
    startDate: Date, 
    endDate: Date
  ): Promise<ConversionMetrics> {
    // This would integrate with website analytics
    // For now, we'll use booking data as a proxy
    const bookingRows = await fetchTenantBookings(tenantId, startDate, endDate);

    const completedBookings = bookingRows.filter(b => b.status === 'completed').length;
    const totalAttempts = bookingRows.length;
    
    // Mock conversion funnel data
    const conversionFunnel = [
      { stage: 'Website Visits', count: totalAttempts * 10, conversionRate: 100 },
      { stage: 'Service Views', count: totalAttempts * 5, conversionRate: 50 },
      { stage: 'Booking Started', count: totalAttempts * 2, conversionRate: 20 },
      { stage: 'Booking Completed', count: completedBookings, conversionRate: (completedBookings / (totalAttempts * 2)) * 100 }
    ];

    return {
      websiteVisits: totalAttempts * 10,
      bookingAttempts: totalAttempts,
      completedBookings,
      conversionFunnel
    };
  }

  static async getPlatformAnalytics(
    startDate: Date, 
    endDate: Date
  ): Promise<PlatformAnalytics> {
    const supabase = getSupabaseClient();
    
    const { data: tenantRows, error: tenantError } = await supabase
      .from('tenants')
      .select('id, businessName, createdAt');

    const { data: bookingRowsRaw, error: bookingError } = await supabase
      .from('bookings')
      .select('id, tenantId, totalAmount, createdAt, status')
      .gte('createdAt', startDate.toISOString())
      .lte('createdAt', endDate.toISOString())
      .in('status', Array.from(COMPLETED_STATUSES));
    
    if (tenantError || bookingError) {
      console.error('Error fetching platform data:', { tenantError, bookingError });
      return {
        totalRevenue: 0,
        totalTenants: 0,
        totalBookings: 0,
        activeTenants: 0,
        topPerformingTenants: [],
        tenantGrowth: [],
        featureUsage: [],
      };
    }

    const bookingRows = (bookingRowsRaw || []).map(row => ({
      ...row,
      createdAt: row.createdAt ? new Date(row.createdAt) : new Date(),
    }));

    const totalTenants = tenantRows.length;
    const bookingsByTenant = new Map<string, BookingRow[]>();

    for (const booking of bookingRows) {
      const list = bookingsByTenant.get(booking.tenantId) || [];
      list.push(booking as unknown as BookingRow);
      bookingsByTenant.set(booking.tenantId, list);
    }

    const activeTenants = Array.from(bookingsByTenant.keys()).length;
    const totalBookings = bookingRows.length;
    const totalRevenue = bookingRows.reduce((sum, booking) => sum + toNumber(booking.totalAmount), 0);

    const topPerformingTenants = tenantRows
      .map(tenant => {
        const tenantBookings = bookingsByTenant.get(tenant.id) || [];
        const revenue = tenantBookings.reduce((sum, b) => sum + toNumber(b.totalAmount), 0);
        return {
          tenantId: tenant.id,
          businessName: tenant.businessName,
          bookings: tenantBookings.length,
          revenue,
        };
      })
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);

    const featureUsage = [
      { feature: 'Booking Management', adoptionRate: 100, activeUsers: totalTenants },
      { feature: 'Customer Management', adoptionRate: 85, activeUsers: Math.floor(totalTenants * 0.85) },
      { feature: 'Analytics', adoptionRate: 60, activeUsers: Math.floor(totalTenants * 0.6) },
      { feature: 'WhatsApp Integration', adoptionRate: 40, activeUsers: Math.floor(totalTenants * 0.4) },
    ];

    const monthlyGrowth = new Map<string, { newTenants: number; activeTenants: number }>();

    tenantRows.forEach(tenant => {
      if (!tenant.createdAt) return;
      const monthKey = tenant.createdAt.toISOString().substring(0, 7);
      const entry = monthlyGrowth.get(monthKey) || { newTenants: 0, activeTenants: 0 };
      entry.newTenants += 1;
      monthlyGrowth.set(monthKey, entry);
    });

    bookingRows.forEach(booking => {
      const monthKey = booking.createdAt.toISOString().substring(0, 7);
      const entry = monthlyGrowth.get(monthKey) || { newTenants: 0, activeTenants: 0 };
      entry.activeTenants += 1;
      monthlyGrowth.set(monthKey, entry);
    });

    const tenantGrowthData = Array.from(monthlyGrowth.entries())
      .map(([month, data]) => ({
        month,
        newTenants: data.newTenants,
        activeTenants: data.activeTenants,
      }))
      .sort((a, b) => a.month.localeCompare(b.month));

    return {
      totalTenants,
      activeTenants,
      totalBookings,
      totalRevenue,
      tenantGrowth: tenantGrowthData,
      topPerformingTenants,
      featureUsage,
    };
  }
}