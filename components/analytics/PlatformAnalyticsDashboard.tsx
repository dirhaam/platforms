'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Building2, 
  Users, 
  DollarSign, 
  TrendingUp, 
  TrendingDown,
  Activity,
  Zap,
  BarChart3,
  Calendar
} from 'lucide-react';
import { PlatformAnalytics } from '@/types/analytics';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { DateRangePicker } from './DateRangePicker';

export function PlatformAnalyticsDashboard() {
  const [data, setData] = useState<PlatformAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    endDate: new Date()
  });

  const fetchPlatformAnalytics = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/analytics/platform', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dateRange),
      });

      if (response.ok) {
        const analyticsData = await response.json();
        setData(analyticsData);
      }
    } catch (error) {
      console.error('Failed to fetch platform analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlatformAnalytics();
  }, [dateRange]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  if (loading && !data) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Platform Analytics</h2>
          <div className="h-10 w-32 bg-gray-200 rounded animate-pulse" />
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
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Platform Data</h3>
        <p className="text-gray-500">Unable to load platform analytics. Please try again.</p>
        <Button onClick={fetchPlatformAnalytics} className="mt-4">
          Retry
        </Button>
      </div>
    );
  }

  // Prepare chart data
  const tenantGrowthData = data.tenantGrowth.map(growth => ({
    month: new Date(growth.month + '-01').toLocaleDateString('en-US', { month: 'short' }),
    newTenants: growth.newTenants,
    activeTenants: growth.activeTenants
  }));

  const featureAdoptionData = data.featureUsage.map(feature => ({
    name: feature.feature,
    adoption: feature.adoptionRate,
    users: feature.activeUsers
  }));

  const topTenantsData = data.topPerformingTenants.slice(0, 10);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Platform Analytics</h2>
          <p className="text-gray-600">
            {dateRange.startDate.toLocaleDateString()} - {dateRange.endDate.toLocaleDateString()}
          </p>
        </div>
        <DateRangePicker
          value={dateRange}
          onChange={setDateRange}
        />
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total Tenants
            </CardTitle>
            <Building2 className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.totalTenants}</div>
            <p className="text-xs text-gray-500 mt-1">
              Registered businesses
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Active Tenants
            </CardTitle>
            <Activity className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.activeTenants}</div>
            <p className="text-xs text-gray-500 mt-1">
              {((data.activeTenants / data.totalTenants) * 100).toFixed(1)}% of total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total Bookings
            </CardTitle>
            <Calendar className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.totalBookings}</div>
            <p className="text-xs text-gray-500 mt-1">
              Platform-wide bookings
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total Revenue
            </CardTitle>
            <DollarSign className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(data.totalRevenue)}</div>
            <p className="text-xs text-gray-500 mt-1">
              Platform revenue
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analytics */}
      <Tabs defaultValue="growth" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="growth">Growth</TabsTrigger>
          <TabsTrigger value="tenants">Top Tenants</TabsTrigger>
          <TabsTrigger value="features">Features</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
        </TabsList>

        <TabsContent value="growth" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Tenant Growth Over Time</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={tenantGrowthData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Line 
                      type="monotone" 
                      dataKey="newTenants" 
                      stroke="#3B82F6" 
                      strokeWidth={2}
                      name="New Tenants"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="activeTenants" 
                      stroke="#10B981" 
                      strokeWidth={2}
                      name="Active Tenants"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tenants" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Top Performing Tenants</CardTitle>
              <CardDescription>
                Tenants with highest booking volume and revenue
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {topTenantsData.map((tenant, index) => (
                  <div key={tenant.tenantId} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-600 rounded-full text-sm font-medium">
                        {index + 1}
                      </div>
                      <div>
                        <div className="font-medium">{tenant.businessName}</div>
                        <div className="text-sm text-gray-600">
                          {tenant.bookings} bookings
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">{formatCurrency(tenant.revenue)}</div>
                      <div className="text-sm text-gray-600">
                        {formatCurrency(tenant.bookings > 0 ? tenant.revenue / tenant.bookings : 0)} avg
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="features" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Feature Adoption Rates</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={featureAdoptionData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip formatter={(value) => [`${value}%`, 'Adoption Rate']} />
                      <Bar dataKey="adoption" fill="#8B5CF6" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Feature Usage Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {data.featureUsage.map((feature, index) => (
                    <div key={feature.feature} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <Zap className="h-5 w-5 text-purple-600" />
                        <div>
                          <div className="font-medium">{feature.feature}</div>
                          <div className="text-sm text-gray-600">
                            {feature.activeUsers} active users
                          </div>
                        </div>
                      </div>
                      <Badge 
                        variant="secondary"
                        className={
                          feature.adoptionRate > 75 ? 'bg-green-100 text-green-800' :
                          feature.adoptionRate > 50 ? 'bg-blue-100 text-blue-800' :
                          feature.adoptionRate > 25 ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }
                      >
                        {feature.adoptionRate.toFixed(1)}%
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="insights" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Platform Health</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <TrendingUp className="h-5 w-5 text-green-600" />
                      <span className="font-medium">Active Tenant Rate</span>
                    </div>
                    <Badge className="bg-green-100 text-green-800">
                      {((data.activeTenants / data.totalTenants) * 100).toFixed(1)}%
                    </Badge>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <BarChart3 className="h-5 w-5 text-blue-600" />
                      <span className="font-medium">Avg Bookings per Tenant</span>
                    </div>
                    <Badge className="bg-blue-100 text-blue-800">
                      {data.activeTenants > 0 ? (data.totalBookings / data.activeTenants).toFixed(1) : '0'}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <DollarSign className="h-5 w-5 text-purple-600" />
                      <span className="font-medium">Avg Revenue per Tenant</span>
                    </div>
                    <Badge className="bg-purple-100 text-purple-800">
                      {formatCurrency(data.activeTenants > 0 ? data.totalRevenue / data.activeTenants : 0)}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Growth Opportunities</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="p-3 bg-yellow-50 rounded-lg">
                    <div className="font-medium text-yellow-800">Feature Adoption</div>
                    <div className="text-sm text-yellow-700 mt-1">
                      {data.featureUsage.filter(f => f.adoptionRate < 50).length} features have low adoption rates
                    </div>
                  </div>
                  
                  <div className="p-3 bg-orange-50 rounded-lg">
                    <div className="font-medium text-orange-800">Inactive Tenants</div>
                    <div className="text-sm text-orange-700 mt-1">
                      {data.totalTenants - data.activeTenants} tenants haven't created bookings yet
                    </div>
                  </div>

                  <div className="p-3 bg-green-50 rounded-lg">
                    <div className="font-medium text-green-800">Revenue Potential</div>
                    <div className="text-sm text-green-700 mt-1">
                      Focus on top {Math.min(5, data.topPerformingTenants.length)} tenants for premium features
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}