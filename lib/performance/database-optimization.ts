import { PrismaClient } from '@/lib/generated/prisma';

// Database optimization configuration
export const DB_CONFIG = {
  CONNECTION_POOL: {
    MIN_CONNECTIONS: 2,
    MAX_CONNECTIONS: 10,
    IDLE_TIMEOUT: 30000, // 30 seconds
    CONNECTION_TIMEOUT: 5000, // 5 seconds
  },
  QUERY_OPTIMIZATION: {
    DEFAULT_PAGE_SIZE: 20,
    MAX_PAGE_SIZE: 100,
    BATCH_SIZE: 1000,
  },
  INDEXES: {
    // Define important indexes for performance
    TENANT: ['subdomain', 'email', 'subscriptionStatus'],
    BOOKING: ['tenantId', 'customerId', 'serviceId', 'scheduledAt', 'status'],
    CUSTOMER: ['tenantId', 'email', 'phone'],
    SERVICE: ['tenantId', 'isActive', 'category'],
    STAFF: ['tenantId', 'email', 'isActive'],
    SECURITY_AUDIT_LOG: ['tenantId', 'userId', 'action', 'timestamp'],
  },
} as const;

export interface QueryOptions {
  page?: number;
  limit?: number;
  orderBy?: Record<string, 'asc' | 'desc'>;
  include?: Record<string, boolean | object>;
  select?: Record<string, boolean>;
}

export interface PaginationResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export class DatabaseOptimization {
  // Optimized pagination helper
  static async paginate<T>(
    model: any,
    where: any = {},
    options: QueryOptions = {}
  ): Promise<PaginationResult<T>> {
    const {
      page = 1,
      limit = DB_CONFIG.QUERY_OPTIMIZATION.DEFAULT_PAGE_SIZE,
      orderBy = { createdAt: 'desc' },
      include,
      select,
    } = options;

    const actualLimit = Math.min(limit, DB_CONFIG.QUERY_OPTIMIZATION.MAX_PAGE_SIZE);
    const offset = (page - 1) * actualLimit;

    const queryOptions: any = {
      where,
      skip: offset,
      take: actualLimit,
      orderBy,
    };

    if (include) queryOptions.include = include;
    if (select) queryOptions.select = select;

    const [data, total] = await Promise.all([
      model.findMany(queryOptions),
      model.count({ where }),
    ]);

    const pages = Math.ceil(total / actualLimit);

    return {
      data,
      pagination: {
        page,
        limit: actualLimit,
        total,
        pages,
        hasNext: page < pages,
        hasPrev: page > 1,
      },
    };
  }

  // Optimized tenant queries
  static async getTenantWithRelations(
    prisma: PrismaClient,
    tenantId: string,
    includeRelations: {
      services?: boolean;
      customers?: boolean;
      staff?: boolean;
      businessHours?: boolean;
      bookings?: boolean;
    } = {}
  ) {
    const include: any = {};

    if (includeRelations.services) {
      include.services = {
        where: { isActive: true },
        orderBy: { name: 'asc' },
      };
    }

    if (includeRelations.customers) {
      include.customers = {
        orderBy: { name: 'asc' },
        take: 100, // Limit to prevent large queries
      };
    }

    if (includeRelations.staff) {
      include.staff = {
        where: { isActive: true },
        orderBy: { name: 'asc' },
      };
    }

    if (includeRelations.businessHours) {
      include.businessHours = true;
    }

    if (includeRelations.bookings) {
      include.bookings = {
        where: {
          scheduledAt: {
            gte: new Date(), // Only future bookings
          },
        },
        orderBy: { scheduledAt: 'asc' },
        take: 50, // Limit recent bookings
        include: {
          customer: {
            select: { id: true, name: true, phone: true },
          },
          service: {
            select: { id: true, name: true, duration: true },
          },
        },
      };
    }

    return await prisma.tenant.findUnique({
      where: { id: tenantId },
      include,
    });
  }

  // Optimized booking queries
  static async getBookingsForDateRange(
    prisma: PrismaClient,
    tenantId: string,
    startDate: Date,
    endDate: Date,
    options: {
      includeCustomer?: boolean;
      includeService?: boolean;
      status?: string[];
    } = {}
  ) {
    const where: any = {
      tenantId,
      scheduledAt: {
        gte: startDate,
        lte: endDate,
      },
    };

    if (options.status && options.status.length > 0) {
      where.status = { in: options.status };
    }

    const include: any = {};

    if (options.includeCustomer) {
      include.customer = {
        select: {
          id: true,
          name: true,
          phone: true,
          email: true,
        },
      };
    }

    if (options.includeService) {
      include.service = {
        select: {
          id: true,
          name: true,
          duration: true,
          price: true,
        },
      };
    }

    return await prisma.booking.findMany({
      where,
      include,
      orderBy: { scheduledAt: 'asc' },
    });
  }

  // Optimized customer search
  static async searchCustomers(
    prisma: PrismaClient,
    tenantId: string,
    searchTerm: string,
    options: QueryOptions = {}
  ) {
    const where = {
      tenantId,
      OR: [
        { name: { contains: searchTerm, mode: 'insensitive' as const } },
        { email: { contains: searchTerm, mode: 'insensitive' as const } },
        { phone: { contains: searchTerm } },
      ],
    };

    return await this.paginate(prisma.customer, where, {
      ...options,
      orderBy: { name: 'asc' },
      include: {
        bookings: {
          take: 5,
          orderBy: { scheduledAt: 'desc' },
          select: {
            id: true,
            scheduledAt: true,
            status: true,
            service: {
              select: { name: true },
            },
          },
        },
      },
    });
  }

  // Batch operations for better performance
  static async batchCreateBookings(
    prisma: PrismaClient,
    bookings: any[]
  ) {
    const batchSize = DB_CONFIG.QUERY_OPTIMIZATION.BATCH_SIZE;
    const results = [];

    for (let i = 0; i < bookings.length; i += batchSize) {
      const batch = bookings.slice(i, i + batchSize);
      const batchResult = await prisma.booking.createMany({
        data: batch,
        skipDuplicates: true,
      });
      results.push(batchResult);
    }

    return results;
  }

  static async batchUpdateBookings(
    prisma: PrismaClient,
    updates: Array<{ id: string; data: any }>
  ) {
    const batchSize = DB_CONFIG.QUERY_OPTIMIZATION.BATCH_SIZE;
    const results = [];

    for (let i = 0; i < updates.length; i += batchSize) {
      const batch = updates.slice(i, i + batchSize);
      const promises = batch.map(({ id, data }) =>
        prisma.booking.update({
          where: { id },
          data,
        })
      );
      const batchResult = await Promise.all(promises);
      results.push(...batchResult);
    }

    return results;
  }

  // Analytics queries optimization
  static async getBookingAnalytics(
    prisma: PrismaClient,
    tenantId: string,
    startDate: Date,
    endDate: Date
  ) {
    // Use raw queries for complex analytics to improve performance
    const bookingStats = await prisma.$queryRaw`
      SELECT 
        DATE(scheduled_at) as date,
        COUNT(*) as total_bookings,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_bookings,
        COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_bookings,
        COUNT(CASE WHEN status = 'no_show' THEN 1 END) as no_show_bookings,
        SUM(total_amount) as total_revenue,
        AVG(total_amount) as avg_booking_value
      FROM bookings 
      WHERE tenant_id = ${tenantId}
        AND scheduled_at >= ${startDate}
        AND scheduled_at <= ${endDate}
      GROUP BY DATE(scheduled_at)
      ORDER BY date ASC
    `;

    const serviceStats = await prisma.$queryRaw`
      SELECT 
        s.name as service_name,
        COUNT(b.id) as booking_count,
        SUM(b.total_amount) as revenue,
        AVG(b.total_amount) as avg_price
      FROM bookings b
      JOIN services s ON b.service_id = s.id
      WHERE b.tenant_id = ${tenantId}
        AND b.scheduled_at >= ${startDate}
        AND b.scheduled_at <= ${endDate}
        AND b.status = 'completed'
      GROUP BY s.id, s.name
      ORDER BY booking_count DESC
      LIMIT 10
    `;

    return {
      bookingStats,
      serviceStats,
    };
  }

  // Database health monitoring
  static async getDatabaseHealth(prisma: PrismaClient): Promise<{
    isHealthy: boolean;
    connectionCount?: number;
    slowQueries?: number;
    avgResponseTime?: number;
  }> {
    try {
      const start = Date.now();
      
      // Simple health check query
      await prisma.$queryRaw`SELECT 1`;
      
      const responseTime = Date.now() - start;

      return {
        isHealthy: responseTime < 1000, // Consider healthy if response < 1s
        avgResponseTime: responseTime,
      };
    } catch (error) {
      console.error('Database health check failed:', error);
      return {
        isHealthy: false,
      };
    }
  }

  // Query performance monitoring
  static async logSlowQuery(
    query: string,
    duration: number,
    params?: any
  ) {
    if (duration > 1000) { // Log queries taking more than 1 second
      console.warn('Slow query detected:', {
        query,
        duration: `${duration}ms`,
        params,
        timestamp: new Date().toISOString(),
      });
    }
  }

  // Connection pool monitoring
  static getConnectionPoolStats() {
    // This would depend on your database setup
    // For Prisma, connection pool stats are not directly accessible
    // You might need to implement custom monitoring
    return {
      activeConnections: 'N/A',
      idleConnections: 'N/A',
      totalConnections: 'N/A',
    };
  }

  // Index usage analysis (PostgreSQL specific)
  static async analyzeIndexUsage(prisma: PrismaClient) {
    try {
      const indexStats = await prisma.$queryRaw`
        SELECT 
          schemaname,
          tablename,
          indexname,
          idx_tup_read,
          idx_tup_fetch,
          idx_scan
        FROM pg_stat_user_indexes
        WHERE idx_scan = 0
        ORDER BY schemaname, tablename;
      `;

      return indexStats;
    } catch (error) {
      console.error('Failed to analyze index usage:', error);
      return [];
    }
  }

  // Table size analysis
  static async getTableSizes(prisma: PrismaClient) {
    try {
      const tableSizes = await prisma.$queryRaw`
        SELECT 
          schemaname,
          tablename,
          pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size,
          pg_total_relation_size(schemaname||'.'||tablename) as size_bytes
        FROM pg_tables
        WHERE schemaname = 'public'
        ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
      `;

      return tableSizes;
    } catch (error) {
      console.error('Failed to get table sizes:', error);
      return [];
    }
  }

  // Vacuum and analyze recommendations
  static async getMaintenanceRecommendations(prisma: PrismaClient) {
    try {
      const stats = await prisma.$queryRaw`
        SELECT 
          schemaname,
          tablename,
          n_tup_ins,
          n_tup_upd,
          n_tup_del,
          last_vacuum,
          last_autovacuum,
          last_analyze,
          last_autoanalyze
        FROM pg_stat_user_tables
        WHERE schemaname = 'public'
        ORDER BY n_tup_ins + n_tup_upd + n_tup_del DESC;
      `;

      return stats;
    } catch (error) {
      console.error('Failed to get maintenance recommendations:', error);
      return [];
    }
  }
}