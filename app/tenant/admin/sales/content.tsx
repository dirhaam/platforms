'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
  DialogTrigger,
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  TrendingUp,
  DollarSign,
  CreditCard,
  Users,
  Plus,
  Search,
  Filter,
  MoreVertical,
  Edit,
  Trash2,
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

interface NewOnTheSpotTransactionData {
  customerId: string;
  serviceId: string;
  paymentMethod: SalesPaymentMethod;
  notes?: string;
}

interface NewTransactionFromBookingData {
  bookingId: string;
  customerId: string;
  serviceId: string;
  scheduledAt: string;
  isHomeVisit: boolean;
  homeVisitAddress?: string;
  totalAmount: number;
  paymentMethod: SalesPaymentMethod;
  notes?: string;
}

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

  // UI states
  const [activeTab, setActiveTab] = useState('transactions');
  const [searchQuery, setSearchQuery] = useState('');
  const [showNewTransactionDialog, setShowNewTransactionDialog] = useState(false);
  const [showTransactionDetailsDialog, setShowTransactionDetailsDialog] = useState(false);
  const [showFiltersDialog, setShowFiltersDialog] = useState(false);
  const [filters, setFilters] = useState<SalesFilters>({});
  const [transactionType, setTransactionType] = useState<'on_the_spot' | 'from_booking'>('on_the_spot');

  // Data states
  const [customers, setCustomers] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);

  // Form states
  const [newOnTheSpotTransaction, setNewOnTheSpotTransaction] = useState<NewOnTheSpotTransactionData>({
    customerId: '',
    serviceId: '',
    paymentMethod: SalesPaymentMethod.CASH,
    notes: '',
  });

  const [newTransactionFromBooking, setNewTransactionFromBooking] = useState<NewTransactionFromBookingData>({
    bookingId: '',
    customerId: '',
    serviceId: '',
    scheduledAt: '',
    isHomeVisit: false,
    totalAmount: 0,
    paymentMethod: SalesPaymentMethod.CASH,
    notes: '',
  });

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

  // Fetch customers
  const fetchCustomers = useCallback(async () => {
    if (!tenantId) return;

    try {
      const response = await fetch(`/api/customers?tenantId=${tenantId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch customers');
      }

      const data = await response.json();
      setCustomers(data.customers || []);
    } catch (error) {
      console.error('Error fetching customers:', error);
    }
  }, [tenantId]);

  // Fetch services
  const fetchServices = useCallback(async () => {
    if (!tenantId) return;

    try {
      const response = await fetch(`/api/services?tenantId=${tenantId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch services');
      }

      const data = await response.json();
      setServices(data.services || []);
    } catch (error) {
      console.error('Error fetching services:', error);
    }
  }, [tenantId]);

  // Fetch bookings
  const fetchBookings = useCallback(async () => {
    if (!tenantId) return;

    try {
      const response = await fetch(`/api/bookings?tenantId=${tenantId}&status=completed`);
      if (!response.ok) {
        throw new Error('Failed to fetch bookings');
      }

      const data = await response.json();
      setBookings(data.bookings || []);
    } catch (error) {
      console.error('Error fetching bookings:', error);
    }
  }, [tenantId]);

  // Initial data fetch
  useEffect(() => {
    if (tenantId) {
      fetchTransactions();
      fetchSummary();
      fetchCustomers();
      fetchServices();
      fetchBookings();
    }
  }, [tenantId, fetchTransactions, fetchSummary, fetchCustomers, fetchServices, fetchBookings]);

  // Create new transaction
  const handleCreateTransaction = async () => {
    if (!tenantId) return;

    try {
      setError(null);
      
      let requestBody;
      
      if (transactionType === 'on_the_spot') {
        requestBody = {
          type: 'on_the_spot',
          ...newOnTheSpotTransaction,
          tenantId,
        };
      } else {
        requestBody = {
          type: 'from_booking',
          ...newTransactionFromBooking,
          tenantId,
        };
      }

      const response = await fetch('/api/sales/transactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.error || 'Failed to create transaction');
      }

      const data = await response.json();
      setTransactions([data.transaction, ...transactions]);
      setShowNewTransactionDialog(false);
      
      // Reset form based on type
      if (transactionType === 'on_the_spot') {
        setNewOnTheSpotTransaction({
          customerId: '',
          serviceId: '',
          paymentMethod: SalesPaymentMethod.CASH,
          notes: '',
        });
      } else {
        setNewTransactionFromBooking({
          bookingId: '',
          customerId: '',
          serviceId: '',
          scheduledAt: '',
          isHomeVisit: false,
          totalAmount: 0,
          paymentMethod: SalesPaymentMethod.CASH,
          notes: '',
        });
      }
      
      await fetchSummary();
    } catch (error) {
      console.error('Error creating transaction:', error);
      setError(error instanceof Error ? error.message : 'Failed to create transaction');
    }
  };

  // Delete transaction
  const handleDeleteTransaction = async (transactionId: string) => {
    if (!tenantId) return;

    if (!confirm('Are you sure you want to delete this transaction?')) return;

    try {
      setError(null);
      const response = await fetch(`/api/sales/transactions/${transactionId}?tenantId=${tenantId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete transaction');
      }

      setTransactions(transactions.filter(t => t.id !== transactionId));
      await fetchSummary();
    } catch (error) {
      console.error('Error deleting transaction:', error);
      setError(error instanceof Error ? error.message : 'Failed to delete transaction');
    }
  };

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
  const filteredTransactions = transactions.filter(transaction =>
    transaction.serviceName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    transaction.transactionNumber.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Sales</h1>
          <p className="text-gray-600 mt-2">Loading sales data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Sales</h1>
        </div>
        <Card>
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
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Sales</h1>
        <p className="text-gray-600 mt-2">Manage transactions and track revenue</p>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
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

          <Card>
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

          <Card>
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

          <Card>
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

            <Dialog open={showNewTransactionDialog} onOpenChange={setShowNewTransactionDialog}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  New Transaction
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Create New Transaction</DialogTitle>
                  <DialogDescription>
                    Choose transaction type and enter details below.
                  </DialogDescription>
                </DialogHeader>
                
                {/* Transaction Type Selection */}
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label>Transaction Type</Label>
                    <Select
                      value={transactionType}
                      onValueChange={(value) => setTransactionType(value as 'on_the_spot' | 'from_booking')}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select transaction type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="on_the_spot">On-the-Spot Transaction</SelectItem>
                        <SelectItem value="from_booking">From Booking</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {transactionType === 'on_the_spot' ? (
                    // On-the-spot transaction form
                    <>
                      <div className="grid gap-2">
                        <Label htmlFor="customerId">Customer</Label>
                        <Select
                          value={newOnTheSpotTransaction.customerId}
                          onValueChange={(value) => setNewOnTheSpotTransaction(prev => ({ ...prev, customerId: value }))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select customer" />
                          </SelectTrigger>
                          <SelectContent>
                            {customers.map(customer => (
                              <SelectItem key={customer.id} value={customer.id}>
                                {customer.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="grid gap-2">
                        <Label htmlFor="serviceId">Service</Label>
                        <Select
                          value={newOnTheSpotTransaction.serviceId}
                          onValueChange={(value) => setNewOnTheSpotTransaction(prev => ({ ...prev, serviceId: value }))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select service" />
                          </SelectTrigger>
                          <SelectContent>
                            {services.map(service => (
                              <SelectItem key={service.id} value={service.id}>
                                {service.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="grid gap-2">
                        <Label htmlFor="paymentMethod">Payment Method</Label>
                        <Select
                          value={newOnTheSpotTransaction.paymentMethod}
                          onValueChange={(value) => setNewOnTheSpotTransaction(prev => ({ ...prev, paymentMethod: value as SalesPaymentMethod }))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select payment method" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value={SalesPaymentMethod.CASH}>Cash</SelectItem>
                            <SelectItem value={SalesPaymentMethod.CARD}>Card</SelectItem>
                            <SelectItem value={SalesPaymentMethod.TRANSFER}>Transfer</SelectItem>
                            <SelectItem value={SalesPaymentMethod.QRIS}>QRIS</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="grid gap-2">
                        <Label htmlFor="notes">Notes (Optional)</Label>
                        <Textarea
                          id="notes"
                          value={newOnTheSpotTransaction.notes}
                          onChange={(e) => setNewOnTheSpotTransaction(prev => ({ ...prev, notes: e.target.value }))}
                          placeholder="Add any notes..."
                        />
                      </div>
                    </>
                  ) : (
                    // From booking transaction form
                    <>
                      <div className="grid gap-2">
                        <Label htmlFor="bookingId">Booking</Label>
                        <Select
                          value={newTransactionFromBooking.bookingId}
                          onValueChange={(value) => setNewTransactionFromBooking(prev => ({ ...prev, bookingId: value }))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select booking" />
                          </SelectTrigger>
                          <SelectContent>
                            {bookings.map(booking => (
                              <SelectItem key={booking.id} value={booking.id}>
                                {booking.customer?.name || 'Unknown'} - {booking.service?.name || 'Unknown Service'}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="grid gap-2">
                        <Label htmlFor="scheduledAt">Scheduled Date</Label>
                        <Input
                          id="scheduledAt"
                          type="datetime-local"
                          value={newTransactionFromBooking.scheduledAt}
                          onChange={(e) => setNewTransactionFromBooking(prev => ({ ...prev, scheduledAt: e.target.value }))}
                        />
                      </div>

                      <div className="grid gap-2">
                        <Label htmlFor="totalAmount">Total Amount</Label>
                        <Input
                          id="totalAmount"
                          type="number"
                          min="0"
                          value={newTransactionFromBooking.totalAmount}
                          onChange={(e) => setNewTransactionFromBooking(prev => ({ ...prev, totalAmount: parseFloat(e.target.value) || 0 }))}
                        />
                      </div>

                      <div className="grid gap-2">
                        <Label htmlFor="paymentMethod">Payment Method</Label>
                        <Select
                          value={newTransactionFromBooking.paymentMethod}
                          onValueChange={(value) => setNewTransactionFromBooking(prev => ({ ...prev, paymentMethod: value as SalesPaymentMethod }))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select payment method" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value={SalesPaymentMethod.CASH}>Cash</SelectItem>
                            <SelectItem value={SalesPaymentMethod.CARD}>Card</SelectItem>
                            <SelectItem value={SalesPaymentMethod.TRANSFER}>Transfer</SelectItem>
                            <SelectItem value={SalesPaymentMethod.QRIS}>QRIS</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="grid gap-2">
                        <Label htmlFor="notes">Notes (Optional)</Label>
                        <Textarea
                          id="notes"
                          value={newTransactionFromBooking.notes}
                          onChange={(e) => setNewTransactionFromBooking(prev => ({ ...prev, notes: e.target.value }))}
                          placeholder="Add any notes..."
                        />
                      </div>
                    </>
                  )}
                </div>
                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowNewTransactionDialog(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    onClick={handleCreateTransaction}
                    disabled={
                      transactionType === 'on_the_spot' 
                        ? (!newOnTheSpotTransaction.customerId || !newOnTheSpotTransaction.serviceId)
                        : (!newTransactionFromBooking.bookingId || !newTransactionFromBooking.totalAmount)
                    }
                  >
                    Create Transaction
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Transactions Tab */}
        <TabsContent value="transactions" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Recent Transactions</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Transaction #</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Service</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Payment</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTransactions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8">
                        <p className="text-gray-500">No transactions found</p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredTransactions.map((transaction) => (
                      <TableRow key={transaction.id}>
                        <TableCell className="font-medium">
                          {transaction.transactionNumber}
                        </TableCell>
                        <TableCell>
                          {new Date(transaction.transactionDate).toLocaleDateString()}
                        </TableCell>
                        <TableCell>{transaction.serviceName}</TableCell>
                        <TableCell>
                          {getSourceBadge(transaction.source)}
                        </TableCell>
                        <TableCell className="font-medium">
                          IDR {transaction.totalAmount.toLocaleString()}
                        </TableCell>
                        <TableCell>
                          {getPaymentMethodBadge(transaction.paymentMethod)}
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(transaction.status)}
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreVertical className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => {
                                  setSelectedTransaction(transaction);
                                  setShowTransactionDetailsDialog(true);
                                }}
                              >
                                <Eye className="w-4 h-4 mr-2" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Edit className="w-4 h-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleDeleteTransaction(transaction.id)}
                                className="text-red-600"
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          <Card>
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

      {/* Transaction Details Dialog */}
      <Dialog open={showTransactionDetailsDialog} onOpenChange={setShowTransactionDetailsDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Transaction Details</DialogTitle>
          </DialogHeader>
          {selectedTransaction && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-600">Transaction #</Label>
                  <p className="mt-1">{selectedTransaction.transactionNumber}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Date</Label>
                  <p className="mt-1">
                    {new Date(selectedTransaction.transactionDate).toLocaleString()}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-600">Service</Label>
                  <p className="mt-1">{selectedTransaction.serviceName}</p>
                  <p className="text-xs text-gray-500">Duration: {selectedTransaction.duration} minutes</p>
                  {selectedTransaction.isHomeVisit && (
                    <p className="text-xs text-blue-600">Home Visit</p>
                  )}
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Source</Label>
                  <p className="mt-1">{getSourceBadge(selectedTransaction.source)}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-600">Status</Label>
                  <p className="mt-1">{getStatusBadge(selectedTransaction.status)}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Payment Method</Label>
                  <p className="mt-1">{getPaymentMethodBadge(selectedTransaction.paymentMethod)}</p>
                </div>
              </div>

              <div className="border-t pt-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Unit Price:</span>
                    <span>IDR {selectedTransaction.unitPrice.toLocaleString()}</span>
                  </div>
                  {selectedTransaction.homeVisitSurcharge && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Home Visit Surcharge:</span>
                      <span>IDR {selectedTransaction.homeVisitSurcharge.toLocaleString()}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-600">Subtotal:</span>
                    <span>IDR {selectedTransaction.subtotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tax:</span>
                    <span>IDR {selectedTransaction.taxAmount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Discount:</span>
                    <span>-IDR {selectedTransaction.discountAmount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between font-bold text-lg">
                    <span>Total:</span>
                    <span>IDR {selectedTransaction.totalAmount.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-600">Payment Method</Label>
                  <p className="mt-1">{getPaymentMethodBadge(selectedTransaction.paymentMethod)}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Paid Amount</Label>
                  <p className="mt-1">IDR {selectedTransaction.paidAmount.toLocaleString()}</p>
                </div>
              </div>

              {selectedTransaction.scheduledAt && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Scheduled At</Label>
                    <p className="mt-1">
                      {new Date(selectedTransaction.scheduledAt).toLocaleString()}
                    </p>
                  </div>
                </div>
              )}

              {selectedTransaction.completedAt && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Completed At</Label>
                    <p className="mt-1">
                      {new Date(selectedTransaction.completedAt).toLocaleString()}
                    </p>
                  </div>
                </div>
              )}

              {selectedTransaction.notes && (
                <div>
                  <Label className="text-sm font-medium text-gray-600">Notes</Label>
                  <p className="mt-1 text-gray-700">{selectedTransaction.notes}</p>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowTransactionDetailsDialog(false)}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
