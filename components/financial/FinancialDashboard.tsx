'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  FinancialMetrics, 
  MonthlyRevenue, 
  CustomerFinancials, 
  PaymentStatusReport 
} from '@/lib/invoice/financial-service';
import { InvoiceExportOptions } from '@/types/invoice';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  FileText, 
  Clock, 
  AlertTriangle,
  Download,
  Calendar
} from 'lucide-react';

interface FinancialDashboardProps {
  tenantId: string;
}

export function FinancialDashboard({ tenantId }: FinancialDashboardProps) {
  const [metrics, setMetrics] = useState<FinancialMetrics | null>(null);
  const [monthlyRevenue, setMonthlyRevenue] = useState<MonthlyRevenue[]>([]);
  const [customerFinancials, setCustomerFinancials] = useState<CustomerFinancials[]>([]);
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatusReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({
    from: '',
    to: ''
  });
  const [exportLoading, setExportLoading] = useState(false);

  useEffect(() => {
    fetchFinancialData();
  }, [dateRange]);

  const fetchFinancialData = async () => {
    try {
      setLoading(true);
      
      const params = new URLSearchParams();
      if (dateRange.from) params.append('dateFrom', dateRange.from);
      if (dateRange.to) params.append('dateTo', dateRange.to);

      const [metricsRes, monthlyRes, customerRes, statusRes] = await Promise.all([
        fetch(`/api/financial/metrics?${params}`),
        fetch('/api/financial/monthly-revenue'),
        fetch('/api/financial/customer-financials'),
        fetch('/api/financial/payment-status')
      ]);

      if (metricsRes.ok) {
        const metricsData = await metricsRes.json();
        setMetrics(metricsData);
      }

      if (monthlyRes.ok) {
        const monthlyData = await monthlyRes.json();
        setMonthlyRevenue(monthlyData);
      }

      if (customerRes.ok) {
        const customerData = await customerRes.json();
        setCustomerFinancials(customerData);
      }

      if (statusRes.ok) {
        const statusData = await statusRes.json();
        setPaymentStatus(statusData);
      }
    } catch (error) {
      console.error('Error fetching financial data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (format: 'xlsx' | 'pdf') => {
    try {
      setExportLoading(true);
      
      const exportOptions: InvoiceExportOptions = {
        format,
        includeItems: true,
        dateRange: dateRange.from && dateRange.to ? dateRange : undefined
      };

      const response = await fetch('/api/financial/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(exportOptions)
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `financial-report-${new Date().toISOString().split('T')[0]}.${format}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error('Error exporting data:', error);
    } finally {
      setExportLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-8 bg-gray-200 rounded w-1/2"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Financial Dashboard</h2>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={() => handleExport('xlsx')}
            disabled={exportLoading}
          >
            <Download className="h-4 w-4 mr-2" />
            Export Excel
          </Button>
          <Button 
            variant="outline" 
            onClick={() => handleExport('pdf')}
            disabled={exportLoading}
          >
            <Download className="h-4 w-4 mr-2" />
            Export PDF
          </Button>
        </div>
      </div>

      {/* Date Range Filter */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4 items-center">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span className="text-sm font-medium">Date Range:</span>
            </div>
            <Input
              type="date"
              value={dateRange.from}
              onChange={(e) => setDateRange(prev => ({ ...prev, from: e.target.value }))}
              className="w-40"
            />
            <span>to</span>
            <Input
              type="date"
              value={dateRange.to}
              onChange={(e) => setDateRange(prev => ({ ...prev, to: e.target.value }))}
              className="w-40"
            />
            <Button 
              variant="outline" 
              onClick={() => setDateRange({ from: '', to: '' })}
            >
              Clear
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Key Metrics */}
      {metrics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Revenue</p>
                  <p className="text-2xl font-bold">{formatCurrency(metrics.totalRevenue)}</p>
                </div>
                <DollarSign className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Paid Revenue</p>
                  <p className="text-2xl font-bold">{formatCurrency(metrics.paidRevenue)}</p>
                  <p className="text-sm text-green-600">
                    {metrics.paymentRate.toFixed(1)}% payment rate
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Pending Revenue</p>
                  <p className="text-2xl font-bold">{formatCurrency(metrics.pendingRevenue)}</p>
                  <p className="text-sm text-muted-foreground">
                    {metrics.pendingInvoices} invoices
                  </p>
                </div>
                <Clock className="h-8 w-8 text-yellow-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Overdue Revenue</p>
                  <p className="text-2xl font-bold">{formatCurrency(metrics.overdueRevenue)}</p>
                  <p className="text-sm text-red-600">
                    {metrics.overdueInvoices} overdue
                  </p>
                </div>
                <AlertTriangle className="h-8 w-8 text-red-600" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Additional Metrics */}
      {metrics && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="text-center">
                <p className="text-sm font-medium text-muted-foreground">Total Invoices</p>
                <p className="text-3xl font-bold">{metrics.totalInvoices}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="text-center">
                <p className="text-sm font-medium text-muted-foreground">Average Invoice Value</p>
                <p className="text-3xl font-bold">{formatCurrency(metrics.averageInvoiceValue)}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="text-center">
                <p className="text-sm font-medium text-muted-foreground">Average Payment Time</p>
                <p className="text-3xl font-bold">{metrics.averagePaymentTime.toFixed(1)}</p>
                <p className="text-sm text-muted-foreground">days</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Detailed Reports */}
      <Tabs defaultValue="monthly" className="space-y-4">
        <TabsList>
          <TabsTrigger value="monthly">Monthly Revenue</TabsTrigger>
          <TabsTrigger value="customers">Customer Analysis</TabsTrigger>
          <TabsTrigger value="status">Payment Status</TabsTrigger>
        </TabsList>

        <TabsContent value="monthly">
          <Card>
            <CardHeader>
              <CardTitle>Monthly Revenue Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {monthlyRevenue.map((month, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <p className="font-medium">{month.month} {month.year}</p>
                      <p className="text-sm text-muted-foreground">
                        {month.invoiceCount} invoices ({month.paidCount} paid)
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">{formatCurrency(month.totalRevenue)}</p>
                      <p className="text-sm text-green-600">
                        {formatCurrency(month.paidRevenue)} paid
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="customers">
          <Card>
            <CardHeader>
              <CardTitle>Top Customers by Revenue</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {customerFinancials.slice(0, 10).map((customer, index) => (
                  <div key={customer.customerId} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <p className="font-medium">{customer.customerName}</p>
                      <p className="text-sm text-muted-foreground">
                        {customer.totalInvoices} invoices • Avg payment: {customer.averagePaymentTime.toFixed(1)} days
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">{formatCurrency(customer.totalAmount)}</p>
                      <div className="flex gap-2 text-sm">
                        <span className="text-green-600">
                          {formatCurrency(customer.paidAmount)} paid
                        </span>
                        {customer.overdueAmount > 0 && (
                          <span className="text-red-600">
                            {formatCurrency(customer.overdueAmount)} overdue
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="status">
          <Card>
            <CardHeader>
              <CardTitle>Payment Status Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {paymentStatus.map((status, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Badge variant={
                        status.status === 'paid' ? 'success' :
                        status.status === 'overdue' ? 'destructive' :
                        status.status === 'sent' ? 'default' : 'secondary'
                      }>
                        {status.status.toUpperCase()}
                      </Badge>
                      <div>
                        <p className="font-medium">{status.count} invoices</p>
                        <p className="text-sm text-muted-foreground">
                          {status.percentage.toFixed(1)}% of total
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">{formatCurrency(status.totalAmount)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}