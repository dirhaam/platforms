'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Calendar, 
  Users, 
  DollarSign, 
  TrendingUp, 
  TrendingDown,
  CheckCircle,
  XCircle,
  Clock
} from 'lucide-react';
import { AnalyticsDashboardData } from '@/types/analytics';

interface MetricsOverviewProps {
  data: AnalyticsDashboardData;
  loading?: boolean;
  comparisonEnabled?: boolean;
}

export function MetricsOverview({ data, loading, comparisonEnabled }: MetricsOverviewProps) {
  const { bookingMetrics, customerMetrics, businessKPIs } = data;
  const comparison = data.comparisonPeriod;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  const getChangeIndicator = (current: number, previous?: number) => {
    if (!previous || !comparisonEnabled) return null;
    
    const change = ((current - previous) / previous) * 100;
    const isPositive = change > 0;
    
    return (
      <div className={`flex items-center space-x-1 text-sm ${
        isPositive ? 'text-green-600' : 'text-red-600'
      }`}>
        {isPositive ? (
          <TrendingUp className="h-3 w-3" />
        ) : (
          <TrendingDown className="h-3 w-3" />
        )}
        <span>{Math.abs(change).toFixed(1)}%</span>
      </div>
    );
  };

  const metrics = [
    {
      title: 'Total Bookings',
      value: bookingMetrics.totalBookings,
      previousValue: comparison?.bookingMetrics.totalBookings,
      icon: Calendar,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      description: 'All bookings in period'
    },
    {
      title: 'Total Revenue',
      value: formatCurrency(bookingMetrics.totalRevenue),
      previousValue: comparison?.bookingMetrics.totalRevenue,
      icon: DollarSign,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      description: 'Revenue from completed bookings'
    },
    {
      title: 'Total Customers',
      value: customerMetrics.totalCustomers,
      previousValue: comparison?.customerMetrics.totalCustomers,
      icon: Users,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      description: 'Unique customers'
    },
    {
      title: 'Conversion Rate',
      value: formatPercentage(bookingMetrics.conversionRate),
      previousValue: comparison?.bookingMetrics.conversionRate,
      icon: TrendingUp,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      description: 'Completed vs total bookings'
    }
  ];

  const statusMetrics = [
    {
      label: 'Confirmed',
      value: bookingMetrics.confirmedBookings,
      icon: CheckCircle,
      color: 'text-green-600'
    },
    {
      label: 'Completed',
      value: bookingMetrics.completedBookings,
      icon: CheckCircle,
      color: 'text-blue-600'
    },
    {
      label: 'Cancelled',
      value: bookingMetrics.cancelledBookings,
      icon: XCircle,
      color: 'text-red-600'
    },
    {
      label: 'No Show',
      value: bookingMetrics.noShowBookings,
      icon: Clock,
      color: 'text-yellow-600'
    }
  ];

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
            </CardHeader>
            <CardContent>
              <div className="h-8 w-16 bg-gray-200 rounded animate-pulse mb-2" />
              <div className="h-3 w-20 bg-gray-200 rounded animate-pulse" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Main Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metrics.map((metric, index) => {
          const Icon = metric.icon;
          const changeIndicator = getChangeIndicator(
            typeof metric.value === 'string' ? 
              parseFloat(metric.value.replace(/[^0-9.-]+/g, '')) : 
              metric.value,
            metric.previousValue
          );

          return (
            <Card key={index}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  {metric.title}
                </CardTitle>
                <div className={`p-2 rounded-lg ${metric.bgColor}`}>
                  <Icon className={`h-4 w-4 ${metric.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-bold">{metric.value}</div>
                    <p className="text-xs text-gray-500 mt-1">
                      {metric.description}
                    </p>
                  </div>
                  {changeIndicator}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Booking Status Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Booking Status Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {statusMetrics.map((status, index) => {
              const Icon = status.icon;
              return (
                <div key={index} className="flex items-center space-x-3 p-3 rounded-lg bg-gray-50">
                  <Icon className={`h-5 w-5 ${status.color}`} />
                  <div>
                    <div className="text-lg font-semibold">{status.value}</div>
                    <div className="text-sm text-gray-600">{status.label}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Key Performance Indicators */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Key Performance Indicators</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {formatCurrency(bookingMetrics.averageBookingValue)}
              </div>
              <div className="text-sm text-gray-600">Average Booking Value</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {formatPercentage(customerMetrics.customerRetentionRate)}
              </div>
              <div className="text-sm text-gray-600">Customer Retention Rate</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {businessKPIs.averageBookingsPerCustomer.toFixed(1)}
              </div>
              <div className="text-sm text-gray-600">Avg Bookings per Customer</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Growth Indicators */}
      {comparisonEnabled && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Growth Indicators</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="flex items-center justify-between p-4 rounded-lg bg-blue-50">
                <div>
                  <div className="text-sm text-gray-600">Booking Growth</div>
                  <div className="text-xl font-bold">
                    {formatPercentage(businessKPIs.bookingGrowthRate)}
                  </div>
                </div>
                {businessKPIs.bookingGrowthRate > 0 ? (
                  <TrendingUp className="h-6 w-6 text-green-600" />
                ) : (
                  <TrendingDown className="h-6 w-6 text-red-600" />
                )}
              </div>
              <div className="flex items-center justify-between p-4 rounded-lg bg-green-50">
                <div>
                  <div className="text-sm text-gray-600">Revenue Growth</div>
                  <div className="text-xl font-bold">
                    {formatPercentage(businessKPIs.revenueGrowthRate)}
                  </div>
                </div>
                {businessKPIs.revenueGrowthRate > 0 ? (
                  <TrendingUp className="h-6 w-6 text-green-600" />
                ) : (
                  <TrendingDown className="h-6 w-6 text-red-600" />
                )}
              </div>
              <div className="flex items-center justify-between p-4 rounded-lg bg-purple-50">
                <div>
                  <div className="text-sm text-gray-600">Customer Growth</div>
                  <div className="text-xl font-bold">
                    {formatPercentage(businessKPIs.customerGrowthRate)}
                  </div>
                </div>
                {businessKPIs.customerGrowthRate > 0 ? (
                  <TrendingUp className="h-6 w-6 text-green-600" />
                ) : (
                  <TrendingDown className="h-6 w-6 text-red-600" />
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}