import { db } from '@/lib/database';
import { 
  AnalyticsDashboardData, 
  BookingMetrics, 
  CustomerMetrics, 
  ServiceMetrics, 
  TimeBasedMetrics, 
  BusinessKPIs,
  AnalyticsFilters,
  ConversionMetrics,
  PlatformAnalytics
} from '@/types/analytics';

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
    const whereClause = {
      tenantId,
      createdAt: {
        gte: startDate,
        lte: endDate
      },
      ...(filters.services?.length && { serviceId: { in: filters.services } }),
      ...(filters.bookingStatuses?.length && { status: { in: filters.bookingStatuses } })
    };

    const [bookings, totalRevenue] = await Promise.all([
      db.booking.findMany({
        where: whereClause,
        include: {
          service: true
        }
      }),
      db.booking.aggregate({
        where: {
          ...whereClause,
          status: { in: ['completed', 'confirmed'] }
        },
        _sum: {
          totalAmount: true
        }
      })
    ]);

    const totalBookings = bookings.length;
    const confirmedBookings = bookings.filter(b => b.status === 'confirmed').length;
    const completedBookings = bookings.filter(b => b.status === 'completed').length;
    const cancelledBookings = bookings.filter(b => b.status === 'cancelled').length;
    const noShowBookings = bookings.filter(b => b.status === 'no_show').length;
    
    const conversionRate = totalBookings > 0 ? (completedBookings / totalBookings) * 100 : 0;
    const averageBookingValue = completedBookings > 0 ? 
      (totalRevenue._sum.totalAmount || 0) / completedBookings : 0;

    return {
      totalBookings,
      confirmedBookings,
      completedBookings,
      cancelledBookings,
      noShowBookings,
      conversionRate,
      averageBookingValue,
      totalRevenue: totalRevenue._sum.totalAmount || 0
    };
  }

  private static async getCustomerMetrics(
    tenantId: string, 
    startDate: Date, 
    endDate: Date
  ): Promise<CustomerMetrics> {
    const [customers, newCustomers, bookingStats, topCustomers] = await Promise.all([
      db.customer.count({
        where: { tenantId }
      }),
      db.customer.count({
        where: {
          tenantId,
          createdAt: {
            gte: startDate,
            lte: endDate
          }
        }
      }),
      db.booking.groupBy({
        by: ['customerId'],
        where: {
          tenantId,
          createdAt: {
            gte: startDate,
            lte: endDate
          },
          status: { in: ['completed', 'confirmed'] }
        },
        _count: {
          id: true
        },
        _sum: {
          totalAmount: true
        }
      }),
      db.customer.findMany({
        where: { tenantId },
        include: {
          bookings: {
            where: {
              status: { in: ['completed', 'confirmed'] },
              createdAt: {
                gte: startDate,
                lte: endDate
              }
            }
          }
        },
        take: 10
      })
    ]);

    const returningCustomers = bookingStats.filter(stat => stat._count.id > 1).length;
    const customerRetentionRate = customers > 0 ? (returningCustomers / customers) * 100 : 0;
    
    const totalRevenue = bookingStats.reduce((sum, stat) => sum + (stat._sum.totalAmount || 0), 0);
    const averageCustomerLifetimeValue = customers > 0 ? totalRevenue / customers : 0;

    const topCustomersData = topCustomers
      .map(customer => ({
        id: customer.id,
        name: customer.name,
        totalBookings: customer.bookings.length,
        totalSpent: customer.bookings.reduce((sum, booking) => sum + booking.totalAmount, 0)
      }))
      .sort((a, b) => b.totalSpent - a.totalSpent)
      .slice(0, 5);

    return {
      totalCustomers: customers,
      newCustomers,
      returningCustomers,
      customerRetentionRate,
      averageCustomerLifetimeValue,
      topCustomers: topCustomersData
    };
  }

  private static async getServiceMetrics(
    tenantId: string, 
    startDate: Date, 
    endDate: Date
  ): Promise<ServiceMetrics> {
    const [services, serviceStats] = await Promise.all([
      db.service.findMany({
        where: { tenantId }
      }),
      db.booking.groupBy({
        by: ['serviceId'],
        where: {
          tenantId,
          createdAt: {
            gte: startDate,
            lte: endDate
          },
          status: { in: ['completed', 'confirmed'] }
        },
        _count: {
          id: true
        },
        _sum: {
          totalAmount: true
        }
      })
    ]);

    const serviceMap = new Map(services.map(s => [s.id, s]));
    
    const topServices = serviceStats
      .map(stat => {
        const service = serviceMap.get(stat.serviceId);
        return {
          id: stat.serviceId,
          name: service?.name || 'Unknown Service',
          bookingCount: stat._count.id,
          revenue: stat._sum.totalAmount || 0
        };
      })
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    const servicePerformance = serviceStats.map(stat => {
      const service = serviceMap.get(stat.serviceId);
      return {
        serviceId: stat.serviceId,
        serviceName: service?.name || 'Unknown Service',
        bookings: stat._count.id,
        revenue: stat._sum.totalAmount || 0
      };
    });

    return {
      totalServices: services.length,
      activeServices: services.filter(s => s.isActive).length,
      topServices,
      servicePerformance
    };
  }

  private static async getTimeBasedMetrics(
    tenantId: string, 
    startDate: Date, 
    endDate: Date
  ): Promise<TimeBasedMetrics> {
    const bookings = await db.booking.findMany({
      where: {
        tenantId,
        createdAt: {
          gte: startDate,
          lte: endDate
        },
        status: { in: ['completed', 'confirmed'] }
      }
    });

    // Hourly distribution
    const hourlyMap = new Map<number, number>();
    for (let i = 0; i < 24; i++) {
      hourlyMap.set(i, 0);
    }
    
    bookings.forEach(booking => {
      const hour = booking.scheduledAt.getHours();
      hourlyMap.set(hour, (hourlyMap.get(hour) || 0) + 1);
    });

    const hourlyDistribution = Array.from(hourlyMap.entries()).map(([hour, bookings]) => ({
      hour,
      bookings
    }));

    // Daily distribution (last 7 days)
    const dailyMap = new Map<string, { bookings: number; revenue: number }>();
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    
    days.forEach(day => {
      dailyMap.set(day, { bookings: 0, revenue: 0 });
    });

    bookings.forEach(booking => {
      const dayName = days[booking.scheduledAt.getDay()];
      const current = dailyMap.get(dayName) || { bookings: 0, revenue: 0 };
      dailyMap.set(dayName, {
        bookings: current.bookings + 1,
        revenue: current.revenue + booking.totalAmount
      });
    });

    const dailyDistribution = Array.from(dailyMap.entries()).map(([day, data]) => ({
      day,
      bookings: data.bookings,
      revenue: data.revenue
    }));

    // Monthly trends (last 12 months)
    const monthlyMap = new Map<string, { bookings: number; revenue: number; customers: Set<string> }>();
    
    bookings.forEach(booking => {
      const monthKey = booking.scheduledAt.toISOString().substring(0, 7); // YYYY-MM
      const current = monthlyMap.get(monthKey) || { bookings: 0, revenue: 0, customers: new Set() };
      current.bookings += 1;
      current.revenue += booking.totalAmount;
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
    const [currentCustomers, previousCustomers] = await Promise.all([
      db.customer.count({
        where: {
          tenantId,
          createdAt: { lte: endDate }
        }
      }),
      db.customer.count({
        where: {
          tenantId,
          createdAt: { lte: prevEndDate }
        }
      })
    ]);

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
    const bookings = await db.booking.findMany({
      where: {
        tenantId,
        createdAt: {
          gte: startDate,
          lte: endDate
        }
      }
    });

    const completedBookings = bookings.filter(b => b.status === 'completed').length;
    const totalAttempts = bookings.length;
    
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
    const [tenants, bookings, tenantGrowth] = await Promise.all([
      db.tenant.findMany({
        include: {
          bookings: {
            where: {
              createdAt: {
                gte: startDate,
                lte: endDate
              },
              status: { in: ['completed', 'confirmed'] }
            }
          }
        }
      }),
      db.booking.findMany({
        where: {
          createdAt: {
            gte: startDate,
            lte: endDate
          },
          status: { in: ['completed', 'confirmed'] }
        }
      }),
      db.tenant.groupBy({
        by: ['createdAt'],
        _count: {
          id: true
        },
        orderBy: {
          createdAt: 'asc'
        }
      })
    ]);

    const totalTenants = tenants.length;
    const activeTenants = tenants.filter(t => t.bookings.length > 0).length;
    const totalBookings = bookings.length;
    const totalRevenue = bookings.reduce((sum, b) => sum + b.totalAmount, 0);

    // Top performing tenants
    const topPerformingTenants = tenants
      .map(tenant => ({
        tenantId: tenant.id,
        businessName: tenant.businessName,
        bookings: tenant.bookings.length,
        revenue: tenant.bookings.reduce((sum, b) => sum + b.totalAmount, 0)
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);

    // Mock feature usage data
    const featureUsage = [
      { feature: 'Booking Management', adoptionRate: 100, activeUsers: totalTenants },
      { feature: 'Customer Management', adoptionRate: 85, activeUsers: Math.floor(totalTenants * 0.85) },
      { feature: 'Analytics', adoptionRate: 60, activeUsers: Math.floor(totalTenants * 0.6) },
      { feature: 'WhatsApp Integration', adoptionRate: 40, activeUsers: Math.floor(totalTenants * 0.4) }
    ];

    // Process tenant growth by month
    const monthlyGrowth = new Map<string, { newTenants: number; activeTenants: number }>();
    
    tenantGrowth.forEach(growth => {
      const monthKey = growth.createdAt.toISOString().substring(0, 7);
      const current = monthlyGrowth.get(monthKey) || { newTenants: 0, activeTenants: 0 };
      current.newTenants += growth._count.id;
      monthlyGrowth.set(monthKey, current);
    });

    const tenantGrowthData = Array.from(monthlyGrowth.entries())
      .map(([month, data]) => ({
        month,
        newTenants: data.newTenants,
        activeTenants: data.activeTenants
      }))
      .sort((a, b) => a.month.localeCompare(b.month));

    return {
      totalTenants,
      activeTenants,
      totalBookings,
      totalRevenue,
      tenantGrowth: tenantGrowthData,
      topPerformingTenants,
      featureUsage
    };
  }
}