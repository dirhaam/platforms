'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ServiceMetrics } from '@/types/analytics';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Package, TrendingUp, DollarSign, Activity } from 'lucide-react';

interface ServiceAnalyticsProps {
  data: ServiceMetrics;
}

export function ServiceAnalytics({ data }: ServiceAnalyticsProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  // Top services data for pie chart
  const topServicesData = data.topServices.map((service, index) => ({
    name: service.name.length > 20 ? service.name.substring(0, 20) + '...' : service.name,
    value: service.revenue,
    bookings: service.bookingCount,
    color: `hsl(${(index * 360) / data.topServices.length}, 70%, 50%)`
  }));

  // Service performance data for bar chart
  const performanceData = data.servicePerformance
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 10)
    .map(service => ({
      name: service.serviceName.length > 15 ? service.serviceName.substring(0, 15) + '...' : service.serviceName,
      bookings: service.bookings,
      revenue: service.revenue,
      avgRevenue: service.bookings > 0 ? service.revenue / service.bookings : 0
    }));

  return (
    <div className="space-y-6">
      {/* Service Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Services</CardTitle>
            <Package className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.totalServices}</div>
            <p className="text-xs text-gray-500 mt-1">
              Services in catalog
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Services</CardTitle>
            <Activity className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.activeServices}</div>
            <p className="text-xs text-gray-500 mt-1">
              Currently available
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Top Service Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data.topServices.length > 0 ? formatCurrency(data.topServices[0].revenue) : formatCurrency(0)}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {data.topServices.length > 0 ? data.topServices[0].name : 'No data'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Most Booked</CardTitle>
            <TrendingUp className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data.topServices.length > 0 ? data.topServices[0].bookingCount : 0}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {data.topServices.length > 0 ? data.topServices[0].name : 'No bookings'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Service Revenue Distribution and Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Revenue Distribution by Service</CardTitle>
          </CardHeader>
          <CardContent>
            {topServicesData.length > 0 ? (
              <>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={topServicesData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {topServicesData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(value) => [formatCurrency(Number(value)), 'Revenue']}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-2 mt-4">
                  {topServicesData.slice(0, 5).map((item, index) => (
                    <div key={index} className="flex items-center justify-between text-sm">
                      <div className="flex items-center space-x-2">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: item.color }}
                        />
                        <span className="text-gray-600">{item.name}</span>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">{formatCurrency(item.value)}</div>
                        <div className="text-xs text-gray-500">{item.bookings} bookings</div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Package className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No service data available</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Service Performance Metrics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Service Utilization</span>
                  <Badge variant="secondary">
                    {data.totalServices > 0 ? 
                      `${((data.activeServices / data.totalServices) * 100).toFixed(1)}%` : 
                      '0%'
                    }
                  </Badge>
                </div>
                <div className="mt-2 text-xs text-gray-600">
                  {data.activeServices} out of {data.totalServices} services are active
                </div>
              </div>

              {data.topServices.length > 0 && (
                <>
                  <div className="p-4 bg-green-50 rounded-lg">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Top Performer</span>
                      <Badge variant="secondary" className="bg-green-100 text-green-800">
                        {data.topServices[0].name}
                      </Badge>
                    </div>
                    <div className="mt-2 text-xs text-gray-600">
                      {formatCurrency(data.topServices[0].revenue)} revenue, {data.topServices[0].bookingCount} bookings
                    </div>
                  </div>

                  <div className="p-4 bg-purple-50 rounded-lg">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Average Revenue per Service</span>
                      <Badge variant="secondary" className="bg-purple-100 text-purple-800">
                        {formatCurrency(
                          data.servicePerformance.reduce((sum, s) => sum + s.revenue, 0) / 
                          Math.max(data.servicePerformance.length, 1)
                        )}
                      </Badge>
                    </div>
                    <div className="mt-2 text-xs text-gray-600">
                      Based on {data.servicePerformance.length} services with bookings
                    </div>
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Service Performance Chart */}
      {performanceData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Service Performance - Bookings vs Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={performanceData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="name" 
                    angle={-45}
                    textAnchor="end"
                    height={100}
                  />
                  <YAxis yAxisId="bookings" orientation="left" />
                  <YAxis yAxisId="revenue" orientation="right" />
                  <Tooltip 
                    formatter={(value, name) => [
                      name === 'revenue' ? formatCurrency(Number(value)) : value,
                      name === 'revenue' ? 'Revenue' : 'Bookings'
                    ]}
                  />
                  <Bar yAxisId="bookings" dataKey="bookings" fill="#3B82F6" name="bookings" />
                  <Bar yAxisId="revenue" dataKey="revenue" fill="#10B981" name="revenue" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Detailed Service List */}
      <Card>
        <CardHeader>
          <CardTitle>All Services Performance</CardTitle>
        </CardHeader>
        <CardContent>
          {data.servicePerformance.length > 0 ? (
            <div className="space-y-3">
              {data.servicePerformance
                .sort((a, b) => b.revenue - a.revenue)
                .map((service, index) => (
                  <div key={service.serviceId} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-600 rounded-full text-sm font-medium">
                        {index + 1}
                      </div>
                      <div>
                        <div className="font-medium">{service.serviceName}</div>
                        <div className="text-sm text-gray-600">
                          {service.bookings} booking{service.bookings !== 1 ? 's' : ''}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">{formatCurrency(service.revenue)}</div>
                      <div className="text-sm text-gray-600">
                        {formatCurrency(service.bookings > 0 ? service.revenue / service.bookings : 0)} avg
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Package className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No service performance data available</p>
              <p className="text-sm mt-2">Services will appear here once you have bookings</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}