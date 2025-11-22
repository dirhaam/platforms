'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AdminPageHeader } from '@/components/tenant/AdminPageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  TrendingUp,
  DollarSign,
  CreditCard,
  Users,
  Plus,
  Search,
  Filter,
  Eye,
  Calendar,
  Download,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Clock,
  XCircle,
} from 'lucide-react';
import {
  SalesTransaction,
  SalesTransactionStatus,
  SalesTransactionSource,
  SalesPaymentMethod,
  SalesSummary,
  SalesFilters,
} from '@/types/sales';
import { QuickSalesPOS } from '@/components/sales/QuickSalesPOS';
import { SalesTransactionsTable } from '@/components/sales/SalesTransactionsTable';
import { SalesTransactionPanel } from '@/components/sales/SalesTransactionPanel';
import { Invoice } from '@/types/invoice';
import { InvoicePreview } from '@/components/invoice/InvoicePreview';
import { normalizeInvoiceResponse } from '@/lib/invoice/invoice-utils';
import { toast } from 'sonner';

export function SalesContent() {
  const searchParams = useSearchParams();
  const subdomain = searchParams?.get('subdomain');
  const [tenantId, setTenantId] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Data states
  const [transactions, setTransactions] = useState<SalesTransaction[]>([]);
  const [summary, setSummary] = useState<SalesSummary | null>(null);
  const [selectedTransaction, setSelectedTransaction] = useState<SalesTransaction | null>(null);
  const [invoicePreview, setInvoicePreview] = useState<Invoice | null>(null);
  const [showInvoicePreview, setShowInvoicePreview] = useState(false);
  const [invoiceGenerating, setInvoiceGenerating] = useState(false);
  const [showInvoicePrompt, setShowInvoicePrompt] = useState(false);

  // UI states
  const [activeTab, setActiveTab] = useState('transactions');
  const [searchQuery, setSearchQuery] = useState('');
  const [showNewTransactionDialog, setShowNewTransactionDialog] = useState(false);
  const [showTransactionDetailsDialog, setShowTransactionDetailsDialog] = useState(false);
  const [showFiltersDialog, setShowFiltersDialog] = useState(false);
  const [filters, setFilters] = useState<SalesFilters>({});

  // Fetch tenant information
  useEffect(() => {
    if (!subdomain) return;

    const resolveTenant = async () => {
      try {
        setError(null);
        setLoading(true);

        const tenantResponse = await fetch(`/api/tenants/${subdomain}`);
        if (!tenantResponse.ok) {
          throw new Error('Tenant not found');
        }

        const tenantData = await tenantResponse.json();
        setTenantId(tenantData.id);
      } catch (error) {
        console.error('Error resolving tenant:', error);
        setError(error instanceof Error ? error.message : 'Failed to resolve tenant');
      } finally {
        setLoading(false);
      }
    };

    resolveTenant();
  }, [subdomain]);

  // Fetch transactions
  const fetchTransactions = useCallback(async () => {
    if (!tenantId) return;

    try {
      setError(null);
      const response = await fetch(`/api/sales/transactions?tenantId=${tenantId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch transactions');
      }

      const data = await response.json();
      setTransactions(data.transactions || []);
    } catch (error) {
      console.error('Error fetching transactions:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch transactions');
    }
  }, [tenantId]);

  // Fetch summary
  const fetchSummary = useCallback(async () => {
    if (!tenantId) return;

    try {
      const response = await fetch(`/api/sales/summary?tenantId=${tenantId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch summary');
      }

      const data = await response.json();
      setSummary(data.summary);
    } catch (error) {
      console.error('Error fetching summary:', error);
    }
  }, [tenantId]);

  const createInvoiceAndPreview = useCallback(
    async (transaction: SalesTransaction) => {
      if (!tenantId || !transaction?.id) return;

      try {
        setInvoiceGenerating(true);
        const response = await fetch(
          `/api/invoices/from-sales/${transaction.id}?tenantId=${tenantId}`,
          {
            method: 'POST',
            headers: {
              'x-tenant-id': tenantId,
            },
          }
        );

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || 'Failed to create invoice');
        }

        const invoiceData = await response.json();
        const invoice = normalizeInvoiceResponse(invoiceData);
        setInvoicePreview(invoice);
        setShowInvoicePreview(false);
        setShowInvoicePrompt(true);
        toast.success('Invoice siap dicetak');
      } catch (error) {
        console.error('Error creating invoice from transaction:', error);
        toast.error(
          error instanceof Error ? error.message : 'Gagal membuat invoice dari transaksi'
        );
      } finally {
        setInvoiceGenerating(false);
      }
    },
    [tenantId]
  );

  const handleTransactionCreated = useCallback(
    async (transaction: SalesTransaction) => {
      setTransactions((prev) => [transaction, ...prev]);
      void fetchSummary();
      await createInvoiceAndPreview(transaction);
    },
    [fetchSummary, createInvoiceAndPreview]
  );

  // Initial data fetch
  useEffect(() => {
    if (tenantId) {
      fetchTransactions();
      fetchSummary();
    }
  }, [tenantId, fetchTransactions, fetchSummary]);



  // Get status badge
  const getStatusBadge = (status: SalesTransactionStatus) => {
    const variants = {
      [SalesTransactionStatus.PENDING]: 'bg-yellow-100 text-yellow-800',
      [SalesTransactionStatus.COMPLETED]: 'bg-green-100 text-green-800',
      [SalesTransactionStatus.CANCELLED]: 'bg-red-100 text-red-800',
      [SalesTransactionStatus.REFUNDED]: 'bg-gray-100 text-gray-800',
    };

    return (
      <Badge className={variants[status]}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  // Get source badge
  const getSourceBadge = (source: SalesTransactionSource) => {
    const variants = {
      [SalesTransactionSource.ON_THE_SPOT]: 'bg-blue-100 text-blue-800',
      [SalesTransactionSource.FROM_BOOKING]: 'bg-purple-100 text-purple-800',
    };

    const labels = {
      [SalesTransactionSource.ON_THE_SPOT]: 'On-the-Spot',
      [SalesTransactionSource.FROM_BOOKING]: 'From Booking',
    };

    return (
      <Badge className={variants[source]}>
        {labels[source]}
      </Badge>
    );
  };

  // Get payment method badge
  const getPaymentMethodBadge = (method: SalesPaymentMethod) => {
    const variants = {
      [SalesPaymentMethod.CASH]: 'bg-green-100 text-green-800',
      [SalesPaymentMethod.CARD]: 'bg-purple-100 text-purple-800',
      [SalesPaymentMethod.TRANSFER]: 'bg-blue-100 text-blue-800',
      [SalesPaymentMethod.QRIS]: 'bg-indigo-100 text-indigo-800',
    };

    return (
      <Badge className={variants[method]}>
        {method.toUpperCase()}
      </Badge>
    );
  };

  // Filter transactions
  const filteredTransactions = transactions.filter(transaction => {
    const serviceName = transaction.serviceName || 'Multiple Services';
    return (
      serviceName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      transaction.transactionNumber.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  if (loading) {
    return (
      <div className="space-y-6">
        <AdminPageHeader
          title="Sales"
          description="Loading sales data..."
        />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <AdminPageHeader title="Sales" />
        <Card className="border-none shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-red-600">
              <AlertCircle className="w-5 h-5" />
              <p>{error}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Sales"
        description="Manage transactions and track revenue"
      />

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-none shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                  <p className="text-2xl font-bold text-gray-900">
                    IDR {summary.totalRevenue.toLocaleString()}
                  </p>
                </div>
                <DollarSign className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Transactions</p>
                  <p className="text-2xl font-bold text-gray-900">{summary.totalTransactions}</p>
                </div>
                <TrendingUp className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Paid Amount</p>
                  <p className="text-2xl font-bold text-gray-900">
                    IDR {summary.totalPaid.toLocaleString()}
                  </p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Pending</p>
                  <p className="text-2xl font-bold text-gray-900">
                    IDR {summary.totalPending.toLocaleString()}
                  </p>
                </div>
                <Clock className="w-8 h-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="transactions">Transactions</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <div className="flex gap-2">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search transactions..."
                className="pl-8 w-64"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFiltersDialog(true)}
            >
              <Filter className="w-4 h-4 mr-2" />
              Filters
            </Button>

            {/* Filters Dialog */}
            <Dialog open={showFiltersDialog} onOpenChange={setShowFiltersDialog}>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Filter Transactions</DialogTitle>
                  <DialogDescription>
                    Filter transactions by various criteria.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label>Transaction Source</Label>
                    <Select
                      value={filters.source || ''}
                      onValueChange={(value) => setFilters(prev => ({ ...prev, source: value as any }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="All sources" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">All Sources</SelectItem>
                        <SelectItem value={SalesTransactionSource.ON_THE_SPOT}>On-the-Spot</SelectItem>
                        <SelectItem value={SalesTransactionSource.FROM_BOOKING}>From Booking</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid gap-2">
                    <Label>Payment Method</Label>
                    <Select
                      value={filters.paymentMethod || ''}
                      onValueChange={(value) => setFilters(prev => ({ ...prev, paymentMethod: value as any }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="All methods" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">All Methods</SelectItem>
                        <SelectItem value={SalesPaymentMethod.CASH}>Cash</SelectItem>
                        <SelectItem value={SalesPaymentMethod.CARD}>Card</SelectItem>
                        <SelectItem value={SalesPaymentMethod.TRANSFER}>Transfer</SelectItem>
                        <SelectItem value={SalesPaymentMethod.QRIS}>QRIS</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid gap-2">
                    <Label>Status</Label>
                    <Select
                      value={filters.status || ''}
                      onValueChange={(value) => setFilters(prev => ({ ...prev, status: value as any }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="All statuses" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">All Statuses</SelectItem>
                        <SelectItem value={SalesTransactionStatus.PENDING}>Pending</SelectItem>
                        <SelectItem value={SalesTransactionStatus.COMPLETED}>Completed</SelectItem>
                        <SelectItem value={SalesTransactionStatus.CANCELLED}>Cancelled</SelectItem>
                        <SelectItem value={SalesTransactionStatus.REFUNDED}>Refunded</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid gap-2">
                    <Label>Home Visit Only</Label>
                    <Select
                      value={filters.isHomeVisit?.toString() || ''}
                      onValueChange={(value) => setFilters(prev => ({ ...prev, isHomeVisit: value === 'true' ? true : value === 'false' ? false : undefined }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="All transactions" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">All Transactions</SelectItem>
                        <SelectItem value="true">Home Visit Only</SelectItem>
                        <SelectItem value="false">In-Store Only</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label>Min Amount</Label>
                      <Input
                        type="number"
                        min="0"
                        placeholder="0"
                        value={filters.minAmount || ''}
                        onChange={(e) => setFilters(prev => ({ ...prev, minAmount: parseFloat(e.target.value) || undefined }))}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label>Max Amount</Label>
                      <Input
                        type="number"
                        min="0"
                        placeholder="999999"
                        value={filters.maxAmount || ''}
                        onChange={(e) => setFilters(prev => ({ ...prev, maxAmount: parseFloat(e.target.value) || undefined }))}
                      />
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setFilters({});
                      setShowFiltersDialog(false);
                    }}
                  >
                    Clear Filters
                  </Button>
                  <Button
                    onClick={() => {
                      // Apply filters and refresh data
                      setShowFiltersDialog(false);
                      // TODO: Apply filters to fetchTransactions
                    }}
                  >
                    Apply Filters
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            <Button onClick={() => setShowNewTransactionDialog(true)} disabled={invoiceGenerating}>
              <Plus className="w-4 h-4 mr-2" />
              New Transaction
            </Button>

            <QuickSalesPOS
              open={showNewTransactionDialog}
              onOpenChange={setShowNewTransactionDialog}
              tenantId={tenantId}
              subdomain={subdomain || ''}
              onCreated={handleTransactionCreated}
            />
          </div>
        </div>

        {/* Transactions Tab */}
        <TabsContent value="transactions" className="space-y-6">
          <Card className="border-none shadow-sm">
            <CardHeader>
              <CardTitle>Recent Transactions</CardTitle>
            </CardHeader>
            <CardContent>
              <SalesTransactionsTable
                transactions={filteredTransactions}
                emptyMessage="No transactions found"
                renderActions={(transaction) => (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedTransaction(transaction);
                      setShowTransactionDetailsDialog(true);
                    }}
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    View
                  </Button>
                )}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          <Card className="border-none shadow-sm">
            <CardHeader>
              <CardTitle>Sales Analytics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <TrendingUp className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600">Analytics will be available here</p>
                <p className="text-gray-500 text-sm mt-2">
                  Including revenue trends, top services, and customer insights
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Transaction Details Panel - Reusable Component with Tabs */}
      <SalesTransactionPanel
        transaction={selectedTransaction}
        open={showTransactionDetailsDialog}
        onOpenChange={setShowTransactionDetailsDialog}
        onGenerateInvoice={createInvoiceAndPreview}
        isGeneratingInvoice={invoiceGenerating}
      />

      <Dialog open={showInvoicePrompt} onOpenChange={setShowInvoicePrompt}>
        <DialogContent className="sm:max-w-[560px]">
          <DialogHeader>
            <DialogTitle>Invoice berhasil dibuat</DialogTitle>
            <DialogDescription>
              Cetak atau unduh invoice sekarang untuk pelanggan Anda.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setShowInvoicePrompt(false);
                setInvoicePreview(null);
              }}
            >
              Nanti saja
            </Button>
            <Button
              onClick={() => {
                setShowInvoicePrompt(false);
                setShowInvoicePreview(true);
              }}
              disabled={!invoicePreview}
            >
              Cetak Invoice
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {invoicePreview && (
        <InvoicePreview
          open={showInvoicePreview}
          onOpenChange={(open) => {
            setShowInvoicePreview(open);
            if (!open) {
              setShowInvoicePrompt(false);
              setInvoicePreview(null);
            }
          }}
          invoice={invoicePreview}
        />
      )}
    </div>
  );
}
