export interface BookingMetrics {
  totalBookings: number;
  confirmedBookings: number;
  completedBookings: number;
  cancelledBookings: number;
  noShowBookings: number;
  conversionRate: number;
  averageBookingValue: number;
  totalRevenue: number;
}

export interface CustomerMetrics {
  totalCustomers: number;
  newCustomers: number;
  returningCustomers: number;
  customerRetentionRate: number;
  averageCustomerLifetimeValue: number;
  topCustomers: {
    id: string;
    name: string;
    totalBookings: number;
    totalSpent: number;
  }[];
}

export interface ServiceMetrics {
  totalServices: number;
  activeServices: number;
  topServices: {
    id: string;
    name: string;
    bookingCount: number;
    revenue: number;
  }[];
  servicePerformance: {
    serviceId: string;
    serviceName: string;
    bookings: number;
    revenue: number;
    averageRating?: number;
  }[];
}

export interface TimeBasedMetrics {
  hourlyDistribution: {
    hour: number;
    bookings: number;
  }[];
  dailyDistribution: {
    day: string;
    bookings: number;
    revenue: number;
  }[];
  monthlyTrends: {
    month: string;
    bookings: number;
    revenue: number;
    customers: number;
  }[];
}

export interface BusinessKPIs {
  bookingGrowthRate: number;
  revenueGrowthRate: number;
  customerGrowthRate: number;
  averageBookingsPerCustomer: number;
  peakBookingHours: number[];
  busyDays: string[];
  seasonalTrends: {
    period: string;
    bookings: number;
    revenue: number;
  }[];
}

export interface SalesMetrics {
  totalPaidAmount: number;
  totalUnpaidAmount: number;
  paymentMethodBreakdown: {
    method: string;
    count: number;
    amount: number;
  }[];
  dailySales: {
    date: string;
    amount: number;
    transactions: number;
  }[];
  paymentSuccessRate: number;
}

export interface AnalyticsDashboardData {
  bookingMetrics: BookingMetrics;
  customerMetrics: CustomerMetrics;
  serviceMetrics: ServiceMetrics;
  timeBasedMetrics: TimeBasedMetrics;
  businessKPIs: BusinessKPIs;
  salesMetrics: SalesMetrics;
  dateRange: {
    startDate: Date;
    endDate: Date;
  };
  comparisonPeriod?: {
    bookingMetrics: BookingMetrics;
    customerMetrics: CustomerMetrics;
    dateRange: {
      startDate: Date;
      endDate: Date;
    };
  };
}

export interface AnalyticsFilters {
  dateRange: {
    startDate: Date;
    endDate: Date;
  };
  services?: string[];
  customerSegments?: string[];
  bookingStatuses?: string[];
  comparisonEnabled?: boolean;
}

export interface ConversionMetrics {
  websiteVisits: number;
  bookingAttempts: number;
  completedBookings: number;
  conversionFunnel: {
    stage: string;
    count: number;
    conversionRate: number;
  }[];
}

export interface PlatformAnalytics {
  totalTenants: number;
  activeTenants: number;
  totalBookings: number;
  totalRevenue: number;
  tenantGrowth: {
    month: string;
    newTenants: number;
    activeTenants: number;
  }[];
  topPerformingTenants: {
    tenantId: string;
    businessName: string;
    bookings: number;
    revenue: number;
  }[];
  featureUsage: {
    feature: string;
    adoptionRate: number;
    activeUsers: number;
  }[];
}