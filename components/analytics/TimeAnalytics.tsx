'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TimeBasedMetrics, BusinessKPIs } from '@/types/analytics';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Area, AreaChart } from 'recharts';
import { Clock, Calendar, TrendingUp, Sun } from 'lucide-react';

interface TimeAnalyticsProps {
  data: TimeBasedMetrics;
  kpis: BusinessKPIs;
}

export function TimeAnalytics({ data, kpis }: TimeAnalyticsProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  // Format hourly data for better display
  const hourlyData = data.hourlyDistribution.map(hour => ({
    hour: `${hour.hour.toString().padStart(2, '0')}:00`,
    bookings: hour.bookings,
    isPeak: kpis.peakBookingHours.includes(hour.hour)
  }));

  // Format daily data
  const dailyData = data.dailyDistribution.map(day => ({
    day: day.day,
    bookings: day.bookings,
    revenue: day.revenue,
    isBusy: kpis.busyDays.includes(day.day)
  }));

  // Format monthly trends
  const monthlyData = data.monthlyTrends.map(trend => ({
    month: new Date(trend.month + '-01').toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
    bookings: trend.bookings,
    revenue: trend.revenue,
    customers: trend.customers
  }));

  // Seasonal trends data
  const seasonalData = kpis.seasonalTrends.map(season => ({
    period: season.period,
    bookings: season.bookings,
    revenue: season.revenue
  }));

  const getPeakHoursText = () => {
    if (kpis.peakBookingHours.length === 0) return 'No peak hours identified';
    
    const hours = kpis.peakBookingHours
      .sort((a, b) => a - b)
      .map(hour => `${hour.toString().padStart(2, '0')}:00`);
    
    return hours.join(', ');
  };

  const getBusyDaysText = () => {
    if (kpis.busyDays.length === 0) return 'No busy days identified';
    return kpis.busyDays.join(', ');
  };

  return (
    <div className="space-y-6">
      {/* Time-based KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Peak Hours</CardTitle>
            <Clock className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold">{getPeakHoursText()}</div>
            <p className="text-xs text-gray-500 mt-1">
              Highest booking activity
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Busy Days</CardTitle>
            <Calendar className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold">{getBusyDaysText()}</div>
            <p className="text-xs text-gray-500 mt-1">
              Most popular days
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Best Season</CardTitle>
            <Sun className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold">
              {seasonalData.length > 0 ? 
                seasonalData.reduce((best, current) => 
                  current.bookings > best.bookings ? current : best
                ).period : 'N/A'
              }
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Highest seasonal activity
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Average</CardTitle>
            <TrendingUp className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold">
              {monthlyData.length > 0 ? 
                Math.round(monthlyData.reduce((sum, month) => sum + month.bookings, 0) / monthlyData.length) :
                0
              }
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Bookings per month
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Hourly Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>Hourly Booking Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={hourlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="hour" />
                <YAxis />
                <Tooltip 
                  formatter={(value, name) => [value, 'Bookings']}
                  labelFormatter={(label) => `Time: ${label}`}
                />
                <Bar 
                  dataKey="bookings" 
                  fill="#3B82F6"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {kpis.peakBookingHours.map(hour => (
              <Badge key={hour} variant="secondary" className="bg-blue-100 text-blue-800">
                Peak: {hour.toString().padStart(2, '0')}:00
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Daily Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>Daily Booking Pattern</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dailyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis yAxisId="bookings" orientation="left" />
                <YAxis yAxisId="revenue" orientation="right" />
                <Tooltip 
                  formatter={(value, name) => [
                    name === 'revenue' ? formatCurrency(Number(value)) : value,
                    name === 'revenue' ? 'Revenue' : 'Bookings'
                  ]}
                />
                <Bar yAxisId="bookings" dataKey="bookings" fill="#8B5CF6" name="bookings" />
                <Bar yAxisId="revenue" dataKey="revenue" fill="#10B981" name="revenue" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {kpis.busyDays.map(day => (
              <Badge key={day} variant="secondary" className="bg-green-100 text-green-800">
                Busy: {day}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Monthly Trends */}
      <Card>
        <CardHeader>
          <CardTitle>Monthly Trends</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis yAxisId="bookings" orientation="left" />
                <YAxis yAxisId="revenue" orientation="right" />
                <Tooltip 
                  formatter={(value, name) => [
                    name === 'revenue' ? formatCurrency(Number(value)) : 
                    name === 'customers' ? `${value} customers` : 
                    `${value} bookings`,
                    name === 'revenue' ? 'Revenue' : 
                    name === 'customers' ? 'Customers' : 'Bookings'
                  ]}
                />
                <Area 
                  yAxisId="bookings" 
                  type="monotone" 
                  dataKey="bookings" 
                  stackId="1"
                  stroke="#3B82F6" 
                  fill="#3B82F6"
                  fillOpacity={0.6}
                  name="bookings"
                />
                <Line 
                  yAxisId="revenue" 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="#10B981" 
                  strokeWidth={2}
                  name="revenue"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Seasonal Analysis */}
      {seasonalData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Seasonal Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={seasonalData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="period" />
                    <YAxis />
                    <Tooltip 
                      formatter={(value, name) => [
                        name === 'revenue' ? formatCurrency(Number(value)) : value,
                        name === 'revenue' ? 'Revenue' : 'Bookings'
                      ]}
                    />
                    <Bar dataKey="bookings" fill="#F59E0B" name="bookings" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-4">
                {seasonalData.map((season, index) => (
                  <div key={season.period} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center justify-center w-8 h-8 bg-orange-100 text-orange-600 rounded-full text-sm font-medium">
                        {season.period}
                      </div>
                      <div>
                        <div className="font-medium">{season.bookings} Bookings</div>
                        <div className="text-sm text-gray-600">
                          {formatCurrency(season.revenue)}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge 
                        variant="secondary"
                        className={
                          season.bookings === Math.max(...seasonalData.map(s => s.bookings)) ?
                          'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }
                      >
                        {season.bookings === Math.max(...seasonalData.map(s => s.bookings)) ? 'Best' : 'Normal'}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Time-based Insights */}
      <Card>
        <CardHeader>
          <CardTitle>Time-based Insights</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h4 className="font-medium text-gray-900">Peak Performance</h4>
              <div className="space-y-3">
                <div className="p-3 bg-blue-50 rounded-lg">
                  <div className="text-sm font-medium">Best Hour</div>
                  <div className="text-lg">
                    {hourlyData.length > 0 ? 
                      hourlyData.reduce((best, current) => 
                        current.bookings > best.bookings ? current : best
                      ).hour : 'N/A'
                    }
                  </div>
                </div>
                <div className="p-3 bg-green-50 rounded-lg">
                  <div className="text-sm font-medium">Best Day</div>
                  <div className="text-lg">
                    {dailyData.length > 0 ? 
                      dailyData.reduce((best, current) => 
                        current.bookings > best.bookings ? current : best
                      ).day : 'N/A'
                    }
                  </div>
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <h4 className="font-medium text-gray-900">Optimization Opportunities</h4>
              <div className="space-y-3">
                <div className="p-3 bg-yellow-50 rounded-lg">
                  <div className="text-sm font-medium">Low Activity Hours</div>
                  <div className="text-sm text-gray-600">
                    {hourlyData
                      .filter(h => h.bookings === 0)
                      .map(h => h.hour)
                      .slice(0, 3)
                      .join(', ') || 'All hours have activity'
                    }
                  </div>
                </div>
                <div className="p-3 bg-orange-50 rounded-lg">
                  <div className="text-sm font-medium">Growth Potential</div>
                  <div className="text-sm text-gray-600">
                    Consider promotions during low-activity periods
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}