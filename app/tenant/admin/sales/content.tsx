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
  SalesTransactionType,
  SalesPaymentMethod,
  SalesSummary,
} from '@/types/sales';

interface NewTransactionData {
  customerId: string;
  type: SalesTransactionType;
  description: string;
  quantity: number;
  unitPrice: number;
  taxRate: number;
  discountAmount: number;
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

  // Form states
  const [newTransaction, setNewTransaction] = useState<NewTransactionData>({
    customerId: '',
    type: SalesTransactionType.SERVICE,
    description: '',
    quantity: 1,
    unitPrice: 0,
    taxRate: 0,
    discountAmount: 0,
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

  // Initial data fetch
  useEffect(() => {
    if (tenantId) {
      fetchTransactions();
      fetchSummary();
    }
  }, [tenantId, fetchTransactions, fetchSummary]);

  // Create new transaction
  const handleCreateTransaction = async () => {
    if (!tenantId) return;

    try {
      setError(null);
      const response = await fetch('/api/sales/transactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...newTransaction,
          tenantId,
          transactionDate: new Date().toISOString(),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.error || 'Failed to create transaction');
      }

      const data = await response.json();
      setTransactions([data.transaction, ...transactions]);
      setShowNewTransactionDialog(false);
      setNewTransaction({
        customerId: '',
        type: SalesTransactionType.SERVICE,
        description: '',
        quantity: 1,
        unitPrice: 0,
        taxRate: 0,
        discountAmount: 0,
        paymentMethod: SalesPaymentMethod.CASH,
        notes: '',
      });
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

  // Get payment method badge
  const getPaymentMethodBadge = (method: SalesPaymentMethod) => {
    const variants = {
      [SalesPaymentMethod.CASH]: 'bg-green-100 text-green-800',
      [SalesPaymentMethod.BANK_TRANSFER]: 'bg-blue-100 text-blue-800',
      [SalesPaymentMethod.CREDIT_CARD]: 'bg-purple-100 text-purple-800',
      [SalesPaymentMethod.DIGITAL_WALLET]: 'bg-orange-100 text-orange-800',
      [SalesPaymentMethod.QRIS]: 'bg-indigo-100 text-indigo-800',
      [SalesPaymentMethod.OTHER]: 'bg-gray-100 text-gray-800',
    };

    return (
      <Badge className={variants[method]}>
        {method.replace('_', ' ').toUpperCase()}
      </Badge>
    );
  };

  // Filter transactions
  const filteredTransactions = transactions.filter(transaction =>
    transaction.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
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
                    Enter the transaction details below.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="type">Transaction Type</Label>
                    <Select
                      value={newTransaction.type}
                      onValueChange={(value) => setNewTransaction(prev => ({ ...prev, type: value as SalesTransactionType }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={SalesTransactionType.SERVICE}>Service</SelectItem>
                        <SelectItem value={SalesTransactionType.PRODUCT}>Product</SelectItem>
                        <SelectItem value={SalesTransactionType.PACKAGE}>Package</SelectItem>
                        <SelectItem value={SalesTransactionType.CONSULTATION}>Consultation</SelectItem>
                        <SelectItem value={SalesTransactionType.OTHER}>Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="description">Description</Label>
                    <Input
                      id="description"
                      value={newTransaction.description}
                      onChange={(e) => setNewTransaction(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Enter description"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="quantity">Quantity</Label>
                      <Input
                        id="quantity"
                        type="number"
                        min="1"
                        value={newTransaction.quantity}
                        onChange={(e) => setNewTransaction(prev => ({ ...prev, quantity: parseInt(e.target.value) || 1 }))}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="unitPrice">Unit Price</Label>
                      <Input
                        id="unitPrice"
                        type="number"
                        min="0"
                        value={newTransaction.unitPrice}
                        onChange={(e) => setNewTransaction(prev => ({ ...prev, unitPrice: parseFloat(e.target.value) || 0 }))}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="taxRate">Tax Rate (%)</Label>
                      <Input
                        id="taxRate"
                        type="number"
                        min="0"
                        max="100"
                        step="0.1"
                        value={newTransaction.taxRate}
                        onChange={(e) => setNewTransaction(prev => ({ ...prev, taxRate: parseFloat(e.target.value) || 0 }))}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="discountAmount">Discount</Label>
                      <Input
                        id="discountAmount"
                        type="number"
                        min="0"
                        value={newTransaction.discountAmount}
                        onChange={(e) => setNewTransaction(prev => ({ ...prev, discountAmount: parseFloat(e.target.value) || 0 }))}
                      />
                    </div>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="paymentMethod">Payment Method</Label>
                    <Select
                      value={newTransaction.paymentMethod}
                      onValueChange={(value) => setNewTransaction(prev => ({ ...prev, paymentMethod: value as SalesPaymentMethod }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select payment method" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={SalesPaymentMethod.CASH}>Cash</SelectItem>
                        <SelectItem value={SalesPaymentMethod.BANK_TRANSFER}>Bank Transfer</SelectItem>
                        <SelectItem value={SalesPaymentMethod.CREDIT_CARD}>Credit Card</SelectItem>
                        <SelectItem value={SalesPaymentMethod.DIGITAL_WALLET}>Digital Wallet</SelectItem>
                        <SelectItem value={SalesPaymentMethod.QRIS}>QRIS</SelectItem>
                        <SelectItem value={SalesPaymentMethod.OTHER}>Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="notes">Notes (Optional)</Label>
                    <Textarea
                      id="notes"
                      value={newTransaction.notes}
                      onChange={(e) => setNewTransaction(prev => ({ ...prev, notes: e.target.value }))}
                      placeholder="Add any notes..."
                    />
                  </div>
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
                    disabled={!newTransaction.description || !newTransaction.customerId}
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
                    <TableHead>Description</TableHead>
                    <TableHead>Type</TableHead>
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
                        <TableCell>{transaction.description}</TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {transaction.type}
                          </Badge>
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

              <div>
                <Label className="text-sm font-medium text-gray-600">Description</Label>
                <p className="mt-1">{selectedTransaction.description}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-600">Type</Label>
                  <p className="mt-1">
                    <Badge variant="outline">{selectedTransaction.type}</Badge>
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Status</Label>
                  <p className="mt-1">{getStatusBadge(selectedTransaction.status)}</p>
                </div>
              </div>

              <div className="border-t pt-4">
                <div className="space-y-2">
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
