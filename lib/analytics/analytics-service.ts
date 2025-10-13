import { db } from '@/lib/database';
import { bookings, customers, services, tenants } from '@/lib/database/schema';
import {
  AnalyticsDashboardData,
  BookingMetrics,
  CustomerMetrics,
  ServiceMetrics,
  TimeBasedMetrics,
  BusinessKPIs,
  AnalyticsFilters,
  ConversionMetrics,
  PlatformAnalytics,
} from '@/types/analytics';
import { and, eq, gte, lte, inArray } from 'drizzle-orm';
import { sql } from 'drizzle-orm';

type BookingRow = {
  id: string;
  tenantId: string;
  customerId: string;
  serviceId: string;
  status: string | null;
  scheduledAt: Date;
  createdAt: Date;
  totalAmount: string | number | null;
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
  const conditions = [
    eq(bookings.tenantId, tenantId),
    gte(bookings.createdAt, startDate),
    lte(bookings.createdAt, endDate),
  ];

  if (options.statuses && options.statuses.length > 0) {
    conditions.push(inArray(bookings.status, options.statuses as any));
  }

  if (options.serviceIds && options.serviceIds.length > 0) {
    conditions.push(inArray(bookings.serviceId, options.serviceIds as any));
  }

  const rows = await db
    .select({
      id: bookings.id,
      tenantId: bookings.tenantId,
      customerId: bookings.customerId,
      serviceId: bookings.serviceId,
      status: bookings.status,
      scheduledAt: bookings.scheduledAt,
      createdAt: bookings.createdAt,
      totalAmount: bookings.totalAmount,
    })
    .from(bookings)
    .where(and(...conditions));

  return rows.map<BookingRow>(row => ({
    ...row,
    scheduledAt: row.scheduledAt ?? row.createdAt ?? new Date(),
    createdAt: row.createdAt ?? new Date(),
  }));
}

async function fetchTenantCustomers(tenantId: string): Promise<CustomerRow[]> {
  const rows = await db
    .select({
      id: customers.id,
      tenantId: customers.tenantId,
      name: customers.name,
      createdAt: customers.createdAt,
    })
    .from(customers)
    .where(eq(customers.tenantId, tenantId));

  return rows.map<CustomerRow>(row => ({
    ...row,
    createdAt: row.createdAt ?? new Date(),
  }));
}

async function fetchTenantServices(tenantId: string): Promise<ServiceRow[]> {
  const rows = await db
    .select({
      id: services.id,
      tenantId: services.tenantId,
      name: services.name,
      isActive: services.isActive,
    })
    .from(services)
    .where(eq(services.tenantId, tenantId));

  return rows.map<ServiceRow>(row => ({
    ...row,
    isActive: row.isActive ?? false,
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
      businessKPIs
    ] = await Promise.all([
      this.getBookingMetrics(tenantId, startDate, endDate, filters),
      this.getCustomerMetrics(tenantId, startDate, endDate),
      this.getServiceMetrics(tenantId, startDate, endDate),
      this.getTimeBasedMetrics(tenantId, startDate, endDate),
      this.getBusinessKPIs(tenantId, startDate, endDate)
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
      dateRange: filters.dateRange,
      comparisonPeriod
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

    const [{ count: newCustomersResult }] = await db
      .select({ count: sql<number>`cast(count(${customers.id}) as int)` })
      .from(customers)
      .where(
        and(
          eq(customers.tenantId, tenantId),
          gte(customers.createdAt, startDate),
          lte(customers.createdAt, endDate)
        )
      );

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
    const [currentCustomersRows, previousCustomersRows] = await Promise.all([
      db
        .select({ count: sql<number>`cast(count(${customers.id}) as int)` })
        .from(customers)
        .where(and(eq(customers.tenantId, tenantId), lte(customers.createdAt, endDate))),
      db
        .select({ count: sql<number>`cast(count(${customers.id}) as int)` })
        .from(customers)
        .where(and(eq(customers.tenantId, tenantId), lte(customers.createdAt, prevEndDate))),
    ]);

    const currentCustomers = currentCustomersRows[0]?.count ?? 0;
    const previousCustomers = previousCustomersRows[0]?.count ?? 0;

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
    const tenantRows = await db
      .select({
        id: tenants.id,
        businessName: tenants.businessName,
        createdAt: tenants.createdAt,
      })
      .from(tenants);

    const bookingRowsRaw = await db
      .select({
        id: bookings.id,
        tenantId: bookings.tenantId,
        totalAmount: bookings.totalAmount,
        createdAt: bookings.createdAt,
        status: bookings.status,
      })
      .from(bookings)
      .where(
        and(
          gte(bookings.createdAt, startDate),
          lte(bookings.createdAt, endDate),
          inArray(bookings.status, Array.from(COMPLETED_STATUSES) as any)
        )
      );

    const bookingRows = bookingRowsRaw.map(row => ({
      ...row,
      createdAt: row.createdAt ?? new Date(),
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