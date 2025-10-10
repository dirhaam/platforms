'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CustomerMetrics } from '@/types/analytics';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Users, UserPlus, Repeat, DollarSign } from 'lucide-react';

interface CustomerAnalyticsProps {
  data: CustomerMetrics;
  comparisonData?: CustomerMetrics;
}

export function CustomerAnalytics({ data, comparisonData }: CustomerAnalyticsProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  // Customer segmentation data
  const customerSegmentData = [
    { name: 'New Customers', value: data.newCustomers, color: '#3B82F6' },
    { name: 'Returning Customers', value: data.returningCustomers, color: '#10B981' }
  ];

  // Top customers data for chart
  const topCustomersChart = data.topCustomers.map(customer => ({
    name: customer.name.length > 15 ? customer.name.substring(0, 15) + '...' : customer.name,
    bookings: customer.totalBookings,
    spent: customer.totalSpent
  }));

  const getChangeIndicator = (current: number, previous?: number) => {
    if (!previous || !comparisonData) return null;
    
    const change = ((current - previous) / previous) * 100;
    const isPositive = change > 0;
    
    return (
      <span className={`text-sm ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
        {isPositive ? '+' : ''}{change.toFixed(1)}%
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Customer Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.totalCustomers}</div>
            {comparisonData && (
              <div className="flex items-center space-x-2 mt-1">
                <span className="text-xs text-gray-500">vs previous period</span>
                {getChangeIndicator(data.totalCustomers, comparisonData.totalCustomers)}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">New Customers</CardTitle>
            <UserPlus className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.newCustomers}</div>
            {comparisonData && (
              <div className="flex items-center space-x-2 mt-1">
                <span className="text-xs text-gray-500">vs previous period</span>
                {getChangeIndicator(data.newCustomers, comparisonData.newCustomers)}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Retention Rate</CardTitle>
            <Repeat className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.customerRetentionRate.toFixed(1)}%</div>
            {comparisonData && (
              <div className="flex items-center space-x-2 mt-1">
                <span className="text-xs text-gray-500">vs previous period</span>
                {getChangeIndicator(data.customerRetentionRate, comparisonData.customerRetentionRate)}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Lifetime Value</CardTitle>
            <DollarSign className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(data.averageCustomerLifetimeValue)}
            </div>
            {comparisonData && (
              <div className="flex items-center space-x-2 mt-1">
                <span className="text-xs text-gray-500">vs previous period</span>
                {getChangeIndicator(data.averageCustomerLifetimeValue, comparisonData.averageCustomerLifetimeValue)}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Customer Segmentation and Top Customers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Customer Segmentation</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={customerSegmentData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {customerSegmentData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [value, 'Customers']} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-wrap gap-4 mt-4">
              {customerSegmentData.map((item, index) => (
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
            <CardTitle>Customer Insights</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">New vs Returning</span>
                  <Badge variant="secondary">
                    {((data.returningCustomers / data.totalCustomers) * 100).toFixed(1)}% returning
                  </Badge>
                </div>
                <div className="mt-2 text-xs text-gray-600">
                  {data.returningCustomers} returning out of {data.totalCustomers} total customers
                </div>
              </div>

              <div className="p-4 bg-green-50 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Customer Growth</span>
                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                    {data.newCustomers} new
                  </Badge>
                </div>
                <div className="mt-2 text-xs text-gray-600">
                  New customers acquired in this period
                </div>
              </div>

              <div className="p-4 bg-purple-50 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Retention Health</span>
                  <Badge 
                    variant="secondary" 
                    className={`${
                      data.customerRetentionRate > 50 
                        ? 'bg-green-100 text-green-800' 
                        : data.customerRetentionRate > 25 
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {data.customerRetentionRate > 50 ? 'Good' : 
                     data.customerRetentionRate > 25 ? 'Fair' : 'Needs Improvement'}
                  </Badge>
                </div>
                <div className="mt-2 text-xs text-gray-600">
                  {data.customerRetentionRate.toFixed(1)}% of customers return for multiple bookings
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Customers */}
      <Card>
        <CardHeader>
          <CardTitle>Top Customers by Revenue</CardTitle>
        </CardHeader>
        <CardContent>
          {data.topCustomers.length > 0 ? (
            <div className="space-y-4">
              {data.topCustomers.map((customer, index) => (
                <div key={customer.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-600 rounded-full text-sm font-medium">
                      {index + 1}
                    </div>
                    <div>
                      <div className="font-medium">{customer.name}</div>
                      <div className="text-sm text-gray-600">
                        {customer.totalBookings} booking{customer.totalBookings !== 1 ? 's' : ''}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">{formatCurrency(customer.totalSpent)}</div>
                    <div className="text-sm text-gray-600">
                      {formatCurrency(customer.totalSpent / customer.totalBookings)} avg
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No customer data available for this period</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Top Customers Chart */}
      {topCustomersChart.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Top Customers - Bookings vs Spending</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topCustomersChart} layout="horizontal">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" width={100} />
                  <Tooltip 
                    formatter={(value, name) => [
                      name === 'spent' ? formatCurrency(Number(value)) : value,
                      name === 'spent' ? 'Total Spent' : 'Bookings'
                    ]}
                  />
                  <Bar dataKey="bookings" fill="#3B82F6" name="bookings" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}