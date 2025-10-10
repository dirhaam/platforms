'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Calendar, TrendingUp, Users, DollarSign, Clock, BarChart3 } from 'lucide-react';
import { AnalyticsDashboardData, AnalyticsFilters } from '@/types/analytics';
import { MetricsOverview } from './MetricsOverview';
import { BookingAnalytics } from './BookingAnalytics';
import { CustomerAnalytics } from './CustomerAnalytics';
import { ServiceAnalytics } from './ServiceAnalytics';
import { TimeAnalytics } from './TimeAnalytics';
import { ConversionFunnel } from './ConversionFunnel';
import { DateRangePicker } from './DateRangePicker';

interface AnalyticsDashboardProps {
  tenantId: string;
  initialData?: AnalyticsDashboardData;
}

export function AnalyticsDashboard({ tenantId, initialData }: AnalyticsDashboardProps) {
  const [data, setData] = useState<AnalyticsDashboardData | null>(initialData || null);
  const [loading, setLoading] = useState(!initialData);
  const [filters, setFilters] = useState<AnalyticsFilters>({
    dateRange: {
      startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
      endDate: new Date()
    },
    comparisonEnabled: false
  });

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/analytics/tenant/${tenantId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(filters),
      });

      if (response.ok) {
        const analyticsData = await response.json();
        setData(analyticsData);
      }
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [filters]);

  const handleFiltersChange = (newFilters: Partial<AnalyticsFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  const toggleComparison = () => {
    setFilters(prev => ({ ...prev, comparisonEnabled: !prev.comparisonEnabled }));
  };

  if (loading && !data) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Business Analytics</h2>
          <div className="flex items-center space-x-2">
            <div className="h-10 w-32 bg-gray-200 rounded animate-pulse" />
            <div className="h-10 w-24 bg-gray-200 rounded animate-pulse" />
          </div>
        </div>
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
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-12">
        <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Analytics Data</h3>
        <p className="text-gray-500">Unable to load analytics data. Please try again.</p>
        <Button onClick={fetchAnalytics} className="mt-4">
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Business Analytics</h2>
          <p className="text-gray-600">
            {filters.dateRange.startDate.toLocaleDateString()} - {filters.dateRange.endDate.toLocaleDateString()}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <DateRangePicker
            value={filters.dateRange}
            onChange={(dateRange) => handleFiltersChange({ dateRange })}
          />
          <Button
            variant={filters.comparisonEnabled ? "default" : "outline"}
            onClick={toggleComparison}
            size="sm"
          >
            <TrendingUp className="h-4 w-4 mr-2" />
            Compare
          </Button>
        </div>
      </div>

      {/* Metrics Overview */}
      <MetricsOverview 
        data={data} 
        loading={loading}
        comparisonEnabled={filters.comparisonEnabled}
      />

      {/* Detailed Analytics Tabs */}
      <Tabs defaultValue="bookings" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="bookings" className="flex items-center space-x-2">
            <Calendar className="h-4 w-4" />
            <span>Bookings</span>
          </TabsTrigger>
          <TabsTrigger value="customers" className="flex items-center space-x-2">
            <Users className="h-4 w-4" />
            <span>Customers</span>
          </TabsTrigger>
          <TabsTrigger value="services" className="flex items-center space-x-2">
            <BarChart3 className="h-4 w-4" />
            <span>Services</span>
          </TabsTrigger>
          <TabsTrigger value="time" className="flex items-center space-x-2">
            <Clock className="h-4 w-4" />
            <span>Time Analysis</span>
          </TabsTrigger>
          <TabsTrigger value="conversion" className="flex items-center space-x-2">
            <TrendingUp className="h-4 w-4" />
            <span>Conversion</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="bookings">
          <BookingAnalytics 
            data={data.bookingMetrics}
            timeData={data.timeBasedMetrics}
            comparisonData={data.comparisonPeriod?.bookingMetrics}
          />
        </TabsContent>

        <TabsContent value="customers">
          <CustomerAnalytics 
            data={data.customerMetrics}
            comparisonData={data.comparisonPeriod?.customerMetrics}
          />
        </TabsContent>

        <TabsContent value="services">
          <ServiceAnalytics data={data.serviceMetrics} />
        </TabsContent>

        <TabsContent value="time">
          <TimeAnalytics 
            data={data.timeBasedMetrics}
            kpis={data.businessKPIs}
          />
        </TabsContent>

        <TabsContent value="conversion">
          <ConversionFunnel tenantId={tenantId} dateRange={filters.dateRange} />
        </TabsContent>
      </Tabs>
    </div>
  );
}