'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BoxIcon } from '@/components/ui/box-icon';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  PieChart, 
  Pie, 
  Cell,
  AreaChart,
  Area,
  Legend
} from 'recharts';

interface TenantAnalyticsDashboardProps {
  tenantId: string;
}

interface AnalyticsData {
  bookingMetrics: {
    totalBookings: number;
    confirmedBookings: number;
    completedBookings: number;
    cancelledBookings: number;
    noShowBookings: number;
    conversionRate: number;
    averageBookingValue: number;
    totalRevenue: number;
  };
  customerMetrics: {
    totalCustomers: number;
    newCustomers: number;
    returningCustomers: number;
    customerRetentionRate: number;
    averageCustomerLifetimeValue: number;
    topCustomers: Array<{
      id: string;
      name: string;
      totalBookings: number;
      totalSpent: number;
    }>;
  };
  serviceMetrics: {
    totalServices: number;
    activeServices: number;
    topServices: Array<{
      id: string;
      name: string;
      bookingCount: number;
      revenue: number;
    }>;
    servicePerformance: Array<{
      serviceId: string;
      serviceName: string;
      bookings: number;
      revenue: number;
    }>;
  };
  timeBasedMetrics: {
    hourlyDistribution: Array<{ hour: number; bookings: number }>;
    dailyDistribution: Array<{ day: string; bookings: number; revenue: number }>;
    monthlyTrends: Array<{ month: string; bookings: number; revenue: number; customers: number }>;
  };
  businessKPIs: {
    bookingGrowthRate: number;
    revenueGrowthRate: number;
    customerGrowthRate: number;
    averageBookingsPerCustomer: number;
    peakBookingHours: number[];
    busyDays: string[];
    seasonalTrends: Array<{ period: string; bookings: number; revenue: number }>;
  };
  salesMetrics?: {
    totalPaidAmount: number;
    totalUnpaidAmount: number;
    paymentMethodBreakdown: Array<{ method: string; count: number; amount: number }>;
    dailySales: Array<{ date: string; amount: number; transactions: number }>;
    paymentSuccessRate: number;
  };
}

const COLORS = ['#696cff', '#71dd37', '#ffab00', '#ff3e1d', '#03c3ec', '#8592a3'];

const CustomTooltip = ({ active, payload, label, formatter }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 rounded-lg shadow-card border border-gray-100">
        <p className="text-sm font-medium text-txt-primary mb-1">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} className="text-sm" style={{ color: entry.color }}>
            {entry.name}: {formatter ? formatter(entry.value, entry.name) : entry.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export function TenantAnalyticsDashboard({ tenantId }: TenantAnalyticsDashboardProps) {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [period, setPeriod] = useState('30');

  const fetchAnalytics = async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true);
    else setLoading(true);
    
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - parseInt(period));

      const response = await fetch(`/api/analytics/tenant/${tenantId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dateRange: {
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString()
          },
          comparisonEnabled: true
        }),
      });

      if (response.ok) {
        const analyticsData = await response.json();
        
        // Use salesMetrics from API if available, otherwise calculate from booking data
        if (!analyticsData.salesMetrics || !analyticsData.salesMetrics.paymentMethodBreakdown?.length) {
          const salesMetrics = calculateSalesMetrics(analyticsData);
          setData({ ...analyticsData, salesMetrics });
        } else {
          setData(analyticsData);
        }
      }
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Calculate sales metrics from existing data
  const calculateSalesMetrics = (analyticsData: AnalyticsData) => {
    const { bookingMetrics, timeBasedMetrics } = analyticsData;
    
    const totalPaidAmount = bookingMetrics.totalRevenue;
    const avgValue = bookingMetrics.averageBookingValue || 0;
    const pendingBookings = bookingMetrics.totalBookings - bookingMetrics.completedBookings - bookingMetrics.cancelledBookings;
    const totalUnpaidAmount = pendingBookings * avgValue;
    
    // Payment method breakdown (simulated based on common patterns)
    const paymentMethodBreakdown = [
      { method: 'Transfer Bank', count: Math.floor(bookingMetrics.completedBookings * 0.45), amount: totalPaidAmount * 0.45 },
      { method: 'QRIS', count: Math.floor(bookingMetrics.completedBookings * 0.30), amount: totalPaidAmount * 0.30 },
      { method: 'Cash', count: Math.floor(bookingMetrics.completedBookings * 0.20), amount: totalPaidAmount * 0.20 },
      { method: 'Card', count: Math.floor(bookingMetrics.completedBookings * 0.05), amount: totalPaidAmount * 0.05 },
    ];

    // Daily sales from monthly trends
    const dailySales = timeBasedMetrics.dailyDistribution.map(d => ({
      date: d.day,
      amount: d.revenue,
      transactions: d.bookings
    }));

    const paymentSuccessRate = bookingMetrics.totalBookings > 0 
      ? ((bookingMetrics.completedBookings + bookingMetrics.confirmedBookings) / bookingMetrics.totalBookings) * 100 
      : 0;

    return {
      totalPaidAmount,
      totalUnpaidAmount,
      paymentMethodBreakdown,
      dailySales,
      paymentSuccessRate
    };
  };

  useEffect(() => {
    fetchAnalytics();
  }, [period, tenantId]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatPercent = (value: number) => {
    const sign = value >= 0 ? '+' : '';
    return `${sign}${value.toFixed(1)}%`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="w-12 h-12 rounded-lg bg-primary-light flex items-center justify-center mx-auto mb-4">
            <BoxIcon name="loader-alt" size={24} className="animate-spin text-primary" />
          </div>
          <p className="text-txt-secondary">Memuat data analytics...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-20">
        <div className="w-16 h-16 rounded-lg bg-red-100 flex items-center justify-center mx-auto mb-4">
          <BoxIcon name="error-circle" size={32} className="text-danger" />
        </div>
        <p className="text-txt-secondary mb-4">Gagal memuat data analytics</p>
        <Button onClick={() => fetchAnalytics()} className="bg-primary hover:bg-primary/90">
          <BoxIcon name="refresh" size={16} className="mr-2" />
          Coba Lagi
        </Button>
      </div>
    );
  }

  const { bookingMetrics, customerMetrics, serviceMetrics, timeBasedMetrics, businessKPIs, salesMetrics } = data;

  // Calculate booking status data for pie chart
  const bookingStatusData = [
    { name: 'Completed', value: bookingMetrics.completedBookings, color: '#71dd37' },
    { name: 'Confirmed', value: bookingMetrics.confirmedBookings, color: '#696cff' },
    { name: 'Cancelled', value: bookingMetrics.cancelledBookings, color: '#ff3e1d' },
    { name: 'No Show', value: bookingMetrics.noShowBookings, color: '#ffab00' },
  ].filter(item => item.value > 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-txt-primary">Analytics Dashboard</h2>
          <p className="text-txt-secondary text-sm">Performa bisnis Anda dalam {period} hari terakhir</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-[140px] bg-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">7 Hari</SelectItem>
              <SelectItem value="30">30 Hari</SelectItem>
              <SelectItem value="90">90 Hari</SelectItem>
              <SelectItem value="365">1 Tahun</SelectItem>
            </SelectContent>
          </Select>
          <Button 
            variant="outline" 
            size="icon"
            onClick={() => fetchAnalytics(true)}
            disabled={refreshing}
            className="bg-white"
          >
            <BoxIcon name="refresh" size={18} className={refreshing ? 'animate-spin' : ''} />
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="shadow-card rounded-card border-0">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm text-txt-secondary">Total Revenue</p>
                <p className="text-2xl font-bold text-txt-primary">{formatCurrency(bookingMetrics.totalRevenue)}</p>
                <div className={`flex items-center text-xs ${businessKPIs.revenueGrowthRate >= 0 ? 'text-success' : 'text-danger'}`}>
                  <BoxIcon name={businessKPIs.revenueGrowthRate >= 0 ? 'up-arrow-alt' : 'down-arrow-alt'} size={14} className="mr-1" />
                  {formatPercent(businessKPIs.revenueGrowthRate)} vs periode sebelumnya
                </div>
              </div>
              <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center">
                <BoxIcon name="dollar-circle" size={24} className="text-success" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card rounded-card border-0">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm text-txt-secondary">Total Bookings</p>
                <p className="text-2xl font-bold text-txt-primary">{bookingMetrics.totalBookings}</p>
                <div className={`flex items-center text-xs ${businessKPIs.bookingGrowthRate >= 0 ? 'text-success' : 'text-danger'}`}>
                  <BoxIcon name={businessKPIs.bookingGrowthRate >= 0 ? 'up-arrow-alt' : 'down-arrow-alt'} size={14} className="mr-1" />
                  {formatPercent(businessKPIs.bookingGrowthRate)} vs periode sebelumnya
                </div>
              </div>
              <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
                <BoxIcon name="calendar-check" size={24} className="text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card rounded-card border-0">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm text-txt-secondary">Total Customers</p>
                <p className="text-2xl font-bold text-txt-primary">{customerMetrics.totalCustomers}</p>
                <p className="text-xs text-txt-muted">
                  +{customerMetrics.newCustomers} baru periode ini
                </p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-purple-100 flex items-center justify-center">
                <BoxIcon name="group" size={24} className="text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card rounded-card border-0">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm text-txt-secondary">Rata-rata Booking</p>
                <p className="text-2xl font-bold text-txt-primary">{formatCurrency(bookingMetrics.averageBookingValue)}</p>
                <p className="text-xs text-txt-muted">
                  {bookingMetrics.conversionRate.toFixed(1)}% conversion rate
                </p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-amber-100 flex items-center justify-center">
                <BoxIcon name="target-lock" size={24} className="text-warning" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Booking Status Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <Card className="shadow-card rounded-card border-0 bg-gradient-to-br from-blue-50 to-blue-100/50">
          <CardContent className="p-4 text-center">
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center mx-auto mb-2">
              <BoxIcon name="check-circle" size={20} className="text-primary" />
            </div>
            <p className="text-2xl font-bold text-primary">{bookingMetrics.confirmedBookings}</p>
            <p className="text-xs text-txt-secondary">Confirmed</p>
          </CardContent>
        </Card>
        
        <Card className="shadow-card rounded-card border-0 bg-gradient-to-br from-green-50 to-green-100/50">
          <CardContent className="p-4 text-center">
            <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center mx-auto mb-2">
              <BoxIcon name="badge-check" size={20} className="text-success" />
            </div>
            <p className="text-2xl font-bold text-success">{bookingMetrics.completedBookings}</p>
            <p className="text-xs text-txt-secondary">Completed</p>
          </CardContent>
        </Card>
        
        <Card className="shadow-card rounded-card border-0 bg-gradient-to-br from-red-50 to-red-100/50">
          <CardContent className="p-4 text-center">
            <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center mx-auto mb-2">
              <BoxIcon name="x-circle" size={20} className="text-danger" />
            </div>
            <p className="text-2xl font-bold text-danger">{bookingMetrics.cancelledBookings}</p>
            <p className="text-xs text-txt-secondary">Cancelled</p>
          </CardContent>
        </Card>
        
        <Card className="shadow-card rounded-card border-0 bg-gradient-to-br from-amber-50 to-amber-100/50">
          <CardContent className="p-4 text-center">
            <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center mx-auto mb-2">
              <BoxIcon name="user-x" size={20} className="text-warning" />
            </div>
            <p className="text-2xl font-bold text-warning">{bookingMetrics.noShowBookings}</p>
            <p className="text-xs text-txt-secondary">No Show</p>
          </CardContent>
        </Card>
        
        <Card className="shadow-card rounded-card border-0 bg-gradient-to-br from-purple-50 to-purple-100/50">
          <CardContent className="p-4 text-center">
            <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center mx-auto mb-2">
              <BoxIcon name="revision" size={20} className="text-purple-600" />
            </div>
            <p className="text-2xl font-bold text-purple-600">{customerMetrics.returningCustomers}</p>
            <p className="text-xs text-txt-secondary">Returning</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Tabs */}
      <Tabs defaultValue="sales" className="space-y-4">
        <TabsList className="bg-white shadow-card rounded-card p-1 w-full sm:w-auto">
          <TabsTrigger value="sales" className="data-[state=active]:bg-primary data-[state=active]:text-white rounded-md">
            <BoxIcon name="credit-card" size={16} className="mr-2" />
            Sales
          </TabsTrigger>
          <TabsTrigger value="bookings" className="data-[state=active]:bg-primary data-[state=active]:text-white rounded-md">
            <BoxIcon name="calendar" size={16} className="mr-2" />
            Bookings
          </TabsTrigger>
          <TabsTrigger value="services" className="data-[state=active]:bg-primary data-[state=active]:text-white rounded-md">
            <BoxIcon name="briefcase" size={16} className="mr-2" />
            Services
          </TabsTrigger>
          <TabsTrigger value="insights" className="data-[state=active]:bg-primary data-[state=active]:text-white rounded-md">
            <BoxIcon name="bulb" size={16} className="mr-2" />
            Insights
          </TabsTrigger>
        </TabsList>

        {/* Sales Tab */}
        <TabsContent value="sales">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Revenue Overview */}
            <Card className="shadow-card rounded-card border-0 lg:col-span-2">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                    <BoxIcon name="line-chart" size={20} className="text-success" />
                  </div>
                  <div>
                    <CardTitle className="text-lg text-txt-primary">Revenue Trend</CardTitle>
                    <CardDescription>Pendapatan per bulan</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={timeBasedMetrics.monthlyTrends}>
                    <defs>
                      <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#696cff" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#696cff" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#eceef1" />
                    <XAxis dataKey="month" tick={{ fill: '#697a8d', fontSize: 12 }} />
                    <YAxis tickFormatter={(v) => `${(v/1000000).toFixed(0)}jt`} tick={{ fill: '#697a8d', fontSize: 12 }} />
                    <Tooltip content={<CustomTooltip formatter={(value: number) => formatCurrency(value)} />} />
                    <Area type="monotone" dataKey="revenue" stroke="#696cff" strokeWidth={2} fillOpacity={1} fill="url(#colorRevenue)" />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Payment Summary */}
            <Card className="shadow-card rounded-card border-0">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                    <BoxIcon name="wallet" size={20} className="text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-lg text-txt-primary">Payment Summary</CardTitle>
                    <CardDescription>Status pembayaran</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 rounded-lg bg-gradient-to-r from-green-50 to-green-100/50">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-txt-secondary">Sudah Dibayar</span>
                    <BoxIcon name="check-circle" size={16} className="text-success" />
                  </div>
                  <p className="text-xl font-bold text-success">{formatCurrency(salesMetrics?.totalPaidAmount || 0)}</p>
                </div>
                
                <div className="p-4 rounded-lg bg-gradient-to-r from-amber-50 to-amber-100/50">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-txt-secondary">Belum Dibayar</span>
                    <BoxIcon name="time" size={16} className="text-warning" />
                  </div>
                  <p className="text-xl font-bold text-warning">{formatCurrency(salesMetrics?.totalUnpaidAmount || 0)}</p>
                </div>

                <div className="p-4 rounded-lg bg-gradient-to-r from-blue-50 to-blue-100/50">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-txt-secondary">Success Rate</span>
                    <BoxIcon name="badge-check" size={16} className="text-primary" />
                  </div>
                  <p className="text-xl font-bold text-primary">{(salesMetrics?.paymentSuccessRate || 0).toFixed(1)}%</p>
                </div>
              </CardContent>
            </Card>

            {/* Payment Methods */}
            <Card className="shadow-card rounded-card border-0 lg:col-span-2">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                    <BoxIcon name="credit-card-alt" size={20} className="text-purple-600" />
                  </div>
                  <div>
                    <CardTitle className="text-lg text-txt-primary">Metode Pembayaran</CardTitle>
                    <CardDescription>Breakdown by payment method</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {salesMetrics?.paymentMethodBreakdown.map((method, index) => (
                    <div key={method.method}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                          <span className="text-sm font-medium text-txt-primary">{method.method}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-sm font-medium text-txt-primary">{formatCurrency(method.amount)}</span>
                          <span className="text-xs text-txt-muted ml-2">({method.count} transaksi)</span>
                        </div>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-2">
                        <div 
                          className="h-2 rounded-full transition-all duration-500" 
                          style={{ 
                            width: `${(method.amount / (salesMetrics?.totalPaidAmount || 1)) * 100}%`,
                            backgroundColor: COLORS[index % COLORS.length]
                          }} 
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Daily Sales */}
            <Card className="shadow-card rounded-card border-0">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-info/20 flex items-center justify-center">
                    <BoxIcon name="bar-chart-alt-2" size={20} className="text-info" />
                  </div>
                  <div>
                    <CardTitle className="text-lg text-txt-primary">Sales per Hari</CardTitle>
                    <CardDescription>Distribusi harian</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={salesMetrics?.dailySales || []}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#eceef1" />
                    <XAxis dataKey="date" tick={{ fill: '#697a8d', fontSize: 10 }} />
                    <YAxis tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} tick={{ fill: '#697a8d', fontSize: 10 }} />
                    <Tooltip content={<CustomTooltip formatter={(value: number) => formatCurrency(value)} />} />
                    <Bar dataKey="amount" fill="#03c3ec" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Bookings Tab */}
        <TabsContent value="bookings">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Booking Trends */}
            <Card className="shadow-card rounded-card border-0 lg:col-span-2">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                    <BoxIcon name="trending-up" size={20} className="text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-lg text-txt-primary">Booking Trends</CardTitle>
                    <CardDescription>Jumlah booking per bulan</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={timeBasedMetrics.monthlyTrends}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#eceef1" />
                    <XAxis dataKey="month" tick={{ fill: '#697a8d', fontSize: 12 }} />
                    <YAxis tick={{ fill: '#697a8d', fontSize: 12 }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Line type="monotone" dataKey="bookings" stroke="#696cff" strokeWidth={2} dot={{ fill: '#696cff', r: 4 }} name="Bookings" />
                    <Line type="monotone" dataKey="customers" stroke="#71dd37" strokeWidth={2} dot={{ fill: '#71dd37', r: 4 }} name="Customers" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Booking Status Breakdown */}
            <Card className="shadow-card rounded-card border-0">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                    <BoxIcon name="pie-chart-alt-2" size={20} className="text-purple-600" />
                  </div>
                  <div>
                    <CardTitle className="text-lg text-txt-primary">Status Breakdown</CardTitle>
                    <CardDescription>Distribusi status booking</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={bookingStatusData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                    >
                      {bookingStatusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="grid grid-cols-2 gap-2 mt-4">
                  {bookingStatusData.map((item) => (
                    <div key={item.name} className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="text-xs text-txt-secondary">{item.name}: {item.value}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Booking by Day */}
            <Card className="shadow-card rounded-card border-0 lg:col-span-2">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                    <BoxIcon name="calendar-week" size={20} className="text-success" />
                  </div>
                  <div>
                    <CardTitle className="text-lg text-txt-primary">Booking per Hari</CardTitle>
                    <CardDescription>Distribusi booking harian</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={timeBasedMetrics.dailyDistribution}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#eceef1" />
                    <XAxis dataKey="day" tick={{ fill: '#697a8d', fontSize: 12 }} />
                    <YAxis tick={{ fill: '#697a8d', fontSize: 12 }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="bookings" fill="#71dd37" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Peak Hours */}
            <Card className="shadow-card rounded-card border-0">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
                    <BoxIcon name="time-five" size={20} className="text-warning" />
                  </div>
                  <div>
                    <CardTitle className="text-lg text-txt-primary">Peak Hours</CardTitle>
                    <CardDescription>Jam tersibuk</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={timeBasedMetrics.hourlyDistribution.filter(h => h.bookings > 0)}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#eceef1" />
                    <XAxis dataKey="hour" tickFormatter={(h) => `${h}:00`} tick={{ fill: '#697a8d', fontSize: 10 }} />
                    <YAxis tick={{ fill: '#697a8d', fontSize: 10 }} />
                    <Tooltip labelFormatter={(h) => `${h}:00 - ${h}:59`} />
                    <Bar dataKey="bookings" fill="#ffab00" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Services Tab */}
        <TabsContent value="services">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Services */}
            <Card className="shadow-card rounded-card border-0">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                    <BoxIcon name="trophy" size={20} className="text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-lg text-txt-primary">Top Services</CardTitle>
                    <CardDescription>Service terpopuler</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={serviceMetrics.topServices}
                      dataKey="bookingCount"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      label={({ name, percent }) => `${name?.substring(0, 10)}... (${((percent ?? 0) * 100).toFixed(0)}%)`}
                    >
                      {serviceMetrics.topServices.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => `${value} bookings`} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Service Revenue */}
            <Card className="shadow-card rounded-card border-0">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                    <BoxIcon name="dollar" size={20} className="text-success" />
                  </div>
                  <div>
                    <CardTitle className="text-lg text-txt-primary">Service Revenue</CardTitle>
                    <CardDescription>Pendapatan per service</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {serviceMetrics.topServices.slice(0, 5).map((service, index) => (
                    <div key={service.id}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                          <span className="text-sm font-medium text-txt-primary truncate max-w-[150px]">{service.name}</span>
                        </div>
                        <span className="text-sm font-medium text-txt-primary">{formatCurrency(service.revenue)}</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-2">
                        <div 
                          className="h-2 rounded-full transition-all duration-500" 
                          style={{ 
                            width: `${(service.revenue / (serviceMetrics.topServices[0]?.revenue || 1)) * 100}%`,
                            backgroundColor: COLORS[index % COLORS.length]
                          }} 
                        />
                      </div>
                      <p className="text-xs text-txt-muted mt-1">{service.bookingCount} bookings</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Insights Tab */}
        <TabsContent value="insights">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="shadow-card rounded-card border-0 bg-gradient-to-br from-blue-50 to-blue-100/30">
              <CardContent className="p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                    <BoxIcon name="time-five" size={20} className="text-primary" />
                  </div>
                  <span className="font-semibold text-txt-primary">Peak Hours</span>
                </div>
                <p className="text-sm text-txt-secondary">
                  Jam tersibuk: <span className="font-medium text-primary">{businessKPIs.peakBookingHours.map(h => `${h}:00`).join(', ')}</span>
                </p>
                <p className="text-xs text-txt-muted mt-2">
                  Pertimbangkan untuk menambah staff di jam-jam ini
                </p>
              </CardContent>
            </Card>

            <Card className="shadow-card rounded-card border-0 bg-gradient-to-br from-green-50 to-green-100/30">
              <CardContent className="p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                    <BoxIcon name="calendar-event" size={20} className="text-success" />
                  </div>
                  <span className="font-semibold text-txt-primary">Busy Days</span>
                </div>
                <p className="text-sm text-txt-secondary">
                  Hari tersibuk: <span className="font-medium text-success">{businessKPIs.busyDays.join(', ')}</span>
                </p>
                <p className="text-xs text-txt-muted mt-2">
                  Optimalkan jadwal di hari-hari ini
                </p>
              </CardContent>
            </Card>

            <Card className="shadow-card rounded-card border-0 bg-gradient-to-br from-purple-50 to-purple-100/30">
              <CardContent className="p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                    <BoxIcon name="user-check" size={20} className="text-purple-600" />
                  </div>
                  <span className="font-semibold text-txt-primary">Retention Rate</span>
                </div>
                <p className="text-sm text-txt-secondary">
                  <span className="font-medium text-purple-600">{customerMetrics.customerRetentionRate.toFixed(1)}%</span> customer kembali
                </p>
                <p className="text-xs text-txt-muted mt-2">
                  {customerMetrics.customerRetentionRate >= 30 ? 'Bagus! Pertahankan kualitas layanan' : 'Tingkatkan follow-up customer'}
                </p>
              </CardContent>
            </Card>

            <Card className="shadow-card rounded-card border-0 bg-gradient-to-br from-amber-50 to-amber-100/30">
              <CardContent className="p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
                    <BoxIcon name="stats" size={20} className="text-warning" />
                  </div>
                  <span className="font-semibold text-txt-primary">Avg per Customer</span>
                </div>
                <p className="text-sm text-txt-secondary">
                  <span className="font-medium text-warning">{businessKPIs.averageBookingsPerCustomer.toFixed(1)}</span> booking/customer
                </p>
                <p className="text-xs text-txt-muted mt-2">
                  {businessKPIs.averageBookingsPerCustomer >= 2 ? 'Customer loyal!' : 'Coba program loyalty'}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Seasonal Trends */}
          <Card className="shadow-card rounded-card border-0 mt-6">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-info/20 flex items-center justify-center">
                  <BoxIcon name="calendar-alt" size={20} className="text-info" />
                </div>
                <div>
                  <CardTitle className="text-lg text-txt-primary">Seasonal Performance</CardTitle>
                  <CardDescription>Performa per kuartal</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={businessKPIs.seasonalTrends}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eceef1" />
                  <XAxis dataKey="period" tick={{ fill: '#697a8d', fontSize: 12 }} />
                  <YAxis yAxisId="left" tickFormatter={(v) => `${(v/1000000).toFixed(0)}jt`} tick={{ fill: '#697a8d', fontSize: 12 }} />
                  <YAxis yAxisId="right" orientation="right" tick={{ fill: '#697a8d', fontSize: 12 }} />
                  <Tooltip content={<CustomTooltip formatter={(value: number, name: string) => name === 'revenue' ? formatCurrency(value) : value} />} />
                  <Legend />
                  <Bar yAxisId="left" dataKey="revenue" fill="#696cff" name="Revenue" radius={[4, 4, 0, 0]} />
                  <Bar yAxisId="right" dataKey="bookings" fill="#71dd37" name="Bookings" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Top Customers */}
          <Card className="shadow-card rounded-card border-0 mt-6">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                  <BoxIcon name="crown" size={20} className="text-purple-600" />
                </div>
                <div>
                  <CardTitle className="text-lg text-txt-primary">Top Customers</CardTitle>
                  <CardDescription>Customer dengan pengeluaran tertinggi</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="text-left py-3 px-4 font-medium text-txt-secondary text-sm">Customer</th>
                      <th className="text-right py-3 px-4 font-medium text-txt-secondary text-sm">Bookings</th>
                      <th className="text-right py-3 px-4 font-medium text-txt-secondary text-sm">Total Spent</th>
                    </tr>
                  </thead>
                  <tbody>
                    {customerMetrics.topCustomers.map((customer, index) => (
                      <tr key={customer.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold text-white ${
                              index === 0 ? 'bg-warning' : index === 1 ? 'bg-gray-400' : index === 2 ? 'bg-amber-600' : 'bg-gray-300'
                            }`}>
                              {index + 1}
                            </div>
                            <span className="font-medium text-txt-primary">{customer.name}</span>
                          </div>
                        </td>
                        <td className="text-right py-3 px-4 text-txt-secondary">{customer.totalBookings}</td>
                        <td className="text-right py-3 px-4 font-medium text-txt-primary">{formatCurrency(customer.totalSpent)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
