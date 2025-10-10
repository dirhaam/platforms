'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BookingMetrics, TimeBasedMetrics } from '@/types/analytics';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';

interface BookingAnalyticsProps {
  data: BookingMetrics;
  timeData: TimeBasedMetrics;
  comparisonData?: BookingMetrics;
}

export function BookingAnalytics({ data, timeData, comparisonData }: BookingAnalyticsProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  // Booking status distribution for pie chart
  const statusData = [
    { name: 'Completed', value: data.completedBookings, color: '#10B981' },
    { name: 'Confirmed', value: data.confirmedBookings, color: '#3B82F6' },
    { name: 'Cancelled', value: data.cancelledBookings, color: '#EF4444' },
    { name: 'No Show', value: data.noShowBookings, color: '#F59E0B' }
  ].filter(item => item.value > 0);

  // Monthly trends data
  const monthlyData = timeData.monthlyTrends.map(trend => ({
    month: new Date(trend.month + '-01').toLocaleDateString('en-US', { month: 'short' }),
    bookings: trend.bookings,
    revenue: trend.revenue
  }));

  // Daily distribution data
  const dailyData = timeData.dailyDistribution.map(day => ({
    day: day.day.substring(0, 3), // Shorten day names
    bookings: day.bookings,
    revenue: day.revenue
  }));

  return (
    <div className="space-y-6">
      {/* Booking Status Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Booking Status Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [value, 'Bookings']} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-wrap gap-2 mt-4">
              {statusData.map((item, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-sm text-gray-600">
                    {item.name}: {item.value}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Booking Performance Metrics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                <span className="text-sm font-medium">Conversion Rate</span>
                <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                  {data.conversionRate.toFixed(1)}%
                </Badge>
              </div>
              <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                <span className="text-sm font-medium">Average Booking Value</span>
                <Badge variant="secondary" className="bg-green-100 text-green-800">
                  {formatCurrency(data.averageBookingValue)}
                </Badge>
              </div>
              <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
                <span className="text-sm font-medium">Total Revenue</span>
                <Badge variant="secondary" className="bg-purple-100 text-purple-800">
                  {formatCurrency(data.totalRevenue)}
                </Badge>
              </div>
              {comparisonData && (
                <div className="pt-4 border-t">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">vs Previous Period</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Bookings:</span>
                      <span className={
                        data.totalBookings > comparisonData.totalBookings 
                          ? 'text-green-600' 
                          : 'text-red-600'
                      }>
                        {data.totalBookings > comparisonData.totalBookings ? '+' : ''}
                        {data.totalBookings - comparisonData.totalBookings}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Revenue:</span>
                      <span className={
                        data.totalRevenue > comparisonData.totalRevenue 
                          ? 'text-green-600' 
                          : 'text-red-600'
                      }>
                        {formatCurrency(data.totalRevenue - comparisonData.totalRevenue)}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Trends */}
      <Card>
        <CardHeader>
          <CardTitle>Monthly Booking Trends</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis yAxisId="bookings" orientation="left" />
                <YAxis yAxisId="revenue" orientation="right" />
                <Tooltip 
                  formatter={(value, name) => [
                    name === 'revenue' ? formatCurrency(Number(value)) : value,
                    name === 'revenue' ? 'Revenue' : 'Bookings'
                  ]}
                />
                <Bar yAxisId="bookings" dataKey="bookings" fill="#3B82F6" name="bookings" />
                <Line 
                  yAxisId="revenue" 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="#10B981" 
                  strokeWidth={2}
                  name="revenue"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Daily Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>Daily Booking Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dailyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip 
                  formatter={(value, name) => [
                    name === 'revenue' ? formatCurrency(Number(value)) : value,
                    name === 'revenue' ? 'Revenue' : 'Bookings'
                  ]}
                />
                <Bar dataKey="bookings" fill="#8B5CF6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Booking Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{data.totalBookings}</div>
              <div className="text-sm text-gray-600">Total Bookings</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{data.completedBookings}</div>
              <div className="text-sm text-gray-600">Completed</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">{data.confirmedBookings}</div>
              <div className="text-sm text-gray-600">Confirmed</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{data.cancelledBookings + data.noShowBookings}</div>
              <div className="text-sm text-gray-600">Cancelled/No Show</div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}