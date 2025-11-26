'use client';

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BoxIcon } from '@/components/ui/box-icon';
import { Customer, Booking, BookingStatus } from '@/types/booking';
import { SalesTransaction } from '@/types/sales';

interface CustomerDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customer: Customer;
  tenantId: string;
}

export function CustomerDetailsDialog({
  open,
  onOpenChange,
  customer,
  tenantId
}: CustomerDetailsDialogProps) {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [transactions, setTransactions] = useState<SalesTransaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingTransactions, setLoadingTransactions] = useState(false);
  const [realTenantId, setRealTenantId] = useState<string>('');
  const [stats, setStats] = useState({
    totalSpent: 0,
    averageBookingValue: 0,
    completedBookings: 0,
    cancelledBookings: 0,
    noShowBookings: 0,
    totalTransactionAmount: 0
  });

  // Resolve real tenant ID from subdomain
  useEffect(() => {
    if (open && tenantId && !realTenantId) {
      resolveTenantId();
    }
  }, [open, tenantId]);

  const resolveTenantId = async () => {
    try {
      const response = await fetch(`/api/tenants/${tenantId}`);
      if (response.ok) {
        const data = await response.json();
        setRealTenantId(data.id);
      }
    } catch (error) {
      console.error('Error resolving tenant ID:', error);
    }
  };

  // Fetch customer bookings and transactions when dialog opens
  useEffect(() => {
    if (open && customer.id && realTenantId) {
      fetchCustomerBookings();
      fetchCustomerTransactions();
    }
  }, [open, customer.id, realTenantId]);

  const fetchCustomerBookings = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/bookings?customerId=${customer.id}`, {
        headers: {
          'x-tenant-id': tenantId
        }
      });

      if (response.ok) {
        const data = await response.json();
        const customerBookings = data.bookings || [];
        setBookings(customerBookings);
        calculateStats(customerBookings);
      }
    } catch (error) {
      console.error('Error fetching customer bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomerTransactions = async () => {
    setLoadingTransactions(true);
    try {
      const response = await fetch(`/api/sales/transactions?customerId=${customer.id}&tenantId=${realTenantId}`);

      if (response.ok) {
        const data = await response.json();
        const customerTransactions = data.transactions || [];
        setTransactions(customerTransactions);
        
        // Calculate total transaction amount
        const totalTransactionAmount = customerTransactions.reduce((sum: number, t: SalesTransaction) => sum + t.totalAmount, 0);
        setStats(prev => ({ ...prev, totalTransactionAmount }));
      }
    } catch (error) {
      console.error('Error fetching customer transactions:', error);
    } finally {
      setLoadingTransactions(false);
    }
  };

  const calculateStats = (bookings: Booking[]) => {
    const completedBookings = bookings.filter(b => b.status === BookingStatus.COMPLETED);
    const cancelledBookings = bookings.filter(b => b.status === BookingStatus.CANCELLED);
    const noShowBookings = bookings.filter(b => b.status === BookingStatus.NO_SHOW);
    
    const totalSpent = completedBookings
      .filter(b => b.paymentStatus === 'paid')
      .reduce((sum, b) => sum + Number(b.totalAmount), 0);
    
    const averageBookingValue = completedBookings.length > 0 
      ? totalSpent / completedBookings.length 
      : 0;

    setStats({
      totalSpent,
      averageBookingValue,
      completedBookings: completedBookings.length,
      cancelledBookings: cancelledBookings.length,
      noShowBookings: noShowBookings.length,
      totalTransactionAmount: 0
    });
  };

  const getStatusColor = (status: BookingStatus): string => {
    switch (status) {
      case BookingStatus.PENDING:
        return 'bg-yellow-100 text-yellow-800';
      case BookingStatus.CONFIRMED:
        return 'bg-blue-100 text-blue-800';
      case BookingStatus.COMPLETED:
        return 'bg-green-100 text-green-800';
      case BookingStatus.CANCELLED:
        return 'bg-red-100 text-red-800';
      case BookingStatus.NO_SHOW:
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (date: Date | string): string => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTime = (date: Date | string): string => {
    return new Date(date).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const getCustomerSince = (): string => {
    const createdDate = new Date(customer.createdAt);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - createdDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 30) return `${diffDays} days`;
    if (diffDays < 365) return `${Math.ceil(diffDays / 30)} months`;
    return `${Math.ceil(diffDays / 365)} years`;
  };

  // Sort bookings by date (most recent first)
  const sortedBookings = [...bookings].sort((a, b) => 
    new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime()
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[85vh] overflow-y-auto p-0">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary to-primary/80 p-6 text-white">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-card bg-white/20 backdrop-blur flex items-center justify-center">
              <span className="text-2xl font-bold">{customer.name.charAt(0).toUpperCase()}</span>
            </div>
            <div>
              <DialogHeader className="p-0">
                <DialogTitle className="text-white text-xl font-bold">{customer?.name || 'Customer Details'}</DialogTitle>
                <DialogDescription className="text-white/80 text-sm">
                  Customer since {getCustomerSince()} ago
                </DialogDescription>
              </DialogHeader>
            </div>
          </div>
        </div>

        <div className="p-6">
          <Tabs defaultValue="overview" className="space-y-4">
            <TabsList className="grid w-full grid-cols-4 bg-gray-100 p-1 rounded-md">
              <TabsTrigger value="overview" className="text-sm data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm rounded">Overview</TabsTrigger>
              <TabsTrigger value="bookings" className="text-sm data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm rounded">Bookings</TabsTrigger>
              <TabsTrigger value="transactions" className="text-sm data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm rounded">Transactions</TabsTrigger>
              <TabsTrigger value="stats" className="text-sm data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm rounded">Statistics</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              {/* Customer Info */}
              <div className="bg-gray-50 rounded-card p-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 p-3 bg-white rounded-md">
                      <div className="w-8 h-8 rounded bg-blue-100 flex items-center justify-center text-info">
                        <BoxIcon name="phone" size={16} />
                      </div>
                      <div>
                        <p className="text-xs text-txt-muted">Phone</p>
                        <p className="text-sm font-medium text-txt-primary">{customer.phone}</p>
                      </div>
                    </div>
                    
                    {customer.email && (
                      <div className="flex items-center gap-3 p-3 bg-white rounded-md">
                        <div className="w-8 h-8 rounded bg-green-100 flex items-center justify-center text-success">
                          <BoxIcon name="envelope" size={16} />
                        </div>
                        <div>
                          <p className="text-xs text-txt-muted">Email</p>
                          <p className="text-sm font-medium text-txt-primary">{customer.email}</p>
                        </div>
                      </div>
                    )}
                    
                    {customer.whatsappNumber && (
                      <div className="flex items-center gap-3 p-3 bg-white rounded-md">
                        <div className="w-8 h-8 rounded bg-green-100 flex items-center justify-center text-green-600">
                          <BoxIcon name="whatsapp" type="logos" size={16} />
                        </div>
                        <div>
                          <p className="text-xs text-txt-muted">WhatsApp</p>
                          <p className="text-sm font-medium text-txt-primary">{customer.whatsappNumber}</p>
                        </div>
                      </div>
                    )}
                    
                    {customer.address && (
                      <div className="flex items-center gap-3 p-3 bg-white rounded-md">
                        <div className="w-8 h-8 rounded bg-orange-100 flex items-center justify-center text-warning">
                          <BoxIcon name="map" size={16} />
                        </div>
                        <div>
                          <p className="text-xs text-txt-muted">Address</p>
                          <p className="text-sm font-medium text-txt-primary">{customer.address}</p>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 p-3 bg-white rounded-md">
                      <div className="w-8 h-8 rounded bg-purple-100 flex items-center justify-center text-purple-600">
                        <BoxIcon name="calendar" size={16} />
                      </div>
                      <div>
                        <p className="text-xs text-txt-muted">Total Bookings</p>
                        <p className="text-sm font-medium text-txt-primary">{customer.totalBookings} bookings</p>
                      </div>
                    </div>
                    
                    {customer.lastBookingAt && (
                      <div className="flex items-center gap-3 p-3 bg-white rounded-md">
                        <div className="w-8 h-8 rounded bg-blue-100 flex items-center justify-center text-info">
                          <BoxIcon name="time" size={16} />
                        </div>
                        <div>
                          <p className="text-xs text-txt-muted">Last Booking</p>
                          <p className="text-sm font-medium text-txt-primary">{formatDate(customer.lastBookingAt)}</p>
                        </div>
                      </div>
                    )}
                    
                    {customer.notes && (
                      <div className="flex items-start gap-3 p-3 bg-yellow-50 rounded-md border border-yellow-100">
                        <div className="w-8 h-8 rounded bg-yellow-100 flex items-center justify-center text-warning flex-shrink-0">
                          <BoxIcon name="note" size={16} />
                        </div>
                        <div>
                          <p className="text-xs text-txt-muted">Notes</p>
                          <p className="text-sm text-txt-secondary">{customer.notes}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-white shadow-card rounded-card p-4 text-center">
                  <div className="w-10 h-10 rounded bg-green-100 flex items-center justify-center text-success mx-auto mb-2">
                    <BoxIcon name="wallet" size={20} />
                  </div>
                  <div className="text-lg font-bold text-success">{formatCurrency(stats.totalSpent)}</div>
                  <div className="text-xs text-txt-muted">Total Spent</div>
                </div>
                
                <div className="bg-white shadow-card rounded-card p-4 text-center">
                  <div className="w-10 h-10 rounded bg-blue-100 flex items-center justify-center text-info mx-auto mb-2">
                    <BoxIcon name="check-circle" size={20} />
                  </div>
                  <div className="text-lg font-bold text-info">{stats.completedBookings}</div>
                  <div className="text-xs text-txt-muted">Completed</div>
                </div>
                
                <div className="bg-white shadow-card rounded-card p-4 text-center">
                  <div className="w-10 h-10 rounded bg-orange-100 flex items-center justify-center text-warning mx-auto mb-2">
                    <BoxIcon name="x-circle" size={20} />
                  </div>
                  <div className="text-lg font-bold text-warning">{stats.cancelledBookings}</div>
                  <div className="text-xs text-txt-muted">Cancelled</div>
                </div>
                
                <div className="bg-white shadow-card rounded-card p-4 text-center">
                  <div className="w-10 h-10 rounded bg-purple-100 flex items-center justify-center text-purple-600 mx-auto mb-2">
                    <BoxIcon name="trending-up" size={20} />
                  </div>
                  <div className="text-lg font-bold text-purple-600">{formatCurrency(stats.averageBookingValue)}</div>
                  <div className="text-xs text-txt-muted">Avg Value</div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="bookings" className="space-y-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded bg-primary-light flex items-center justify-center text-primary">
                  <BoxIcon name="history" size={20} />
                </div>
                <h5 className="text-lg font-semibold text-txt-primary">Booking History</h5>
              </div>
              
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <BoxIcon name="loader-alt" size={32} className="animate-spin text-primary" />
                </div>
              ) : sortedBookings.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-card">
                  <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                    <BoxIcon name="calendar" size={32} className="text-txt-muted" />
                  </div>
                  <p className="text-txt-muted">No bookings found</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[300px] overflow-y-auto">
                  {sortedBookings.map((booking) => (
                    <div
                      key={booking.id}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-md hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-sm text-txt-primary">{booking.service?.name}</span>
                          <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase ${getStatusColor(booking.status)}`}>
                            {booking.status}
                          </span>
                          {booking.isHomeVisit && (
                            <span className="bg-primary-light text-primary px-2 py-0.5 rounded text-xs font-bold">
                              Home Visit
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-txt-muted">
                          <BoxIcon name="calendar" size={12} />
                          <span>{formatDate(booking.scheduledAt)} at {formatTime(booking.scheduledAt)}</span>
                          <span className="text-txt-muted">•</span>
                          <span>{booking.duration} min</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-sm text-txt-primary">{formatCurrency(Number(booking.totalAmount))}</div>
                        <span className={`text-xs font-bold uppercase ${
                          booking.paymentStatus === 'paid' ? 'text-success' : booking.paymentStatus === 'pending' ? 'text-warning' : 'text-danger'
                        }`}>{booking.paymentStatus}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="transactions" className="space-y-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded bg-green-100 flex items-center justify-center text-success">
                  <BoxIcon name="receipt" size={20} />
                </div>
                <h5 className="text-lg font-semibold text-txt-primary">Sales Transactions</h5>
              </div>

              {loadingTransactions ? (
                <div className="flex items-center justify-center py-12">
                  <BoxIcon name="loader-alt" size={32} className="animate-spin text-primary" />
                </div>
              ) : transactions.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-card">
                  <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                    <BoxIcon name="receipt" size={32} className="text-txt-muted" />
                  </div>
                  <p className="text-txt-muted">No transactions found</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[300px] overflow-y-auto">
                  {transactions.map((transaction) => (
                    <div
                      key={transaction.id}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-md hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-sm text-txt-primary">{transaction.serviceName}</span>
                          <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase ${
                            transaction.status === 'completed' ? 'bg-green-100 text-success' : transaction.status === 'pending' ? 'bg-yellow-100 text-warning' : 'bg-red-100 text-danger'
                          }`}>{transaction.status}</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-txt-muted">
                          <BoxIcon name="calendar" size={12} />
                          <span>{formatDate(transaction.transactionDate)}</span>
                          <span className="text-txt-muted">•</span>
                          <span>Ref: {transaction.transactionNumber}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-sm text-txt-primary">{formatCurrency(transaction.totalAmount)}</div>
                        <span className="text-xs text-txt-muted capitalize">{transaction.paymentMethod}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="stats" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-card p-5">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded bg-green-100 flex items-center justify-center text-success">
                      <BoxIcon name="wallet" size={20} />
                    </div>
                    <h5 className="font-semibold text-txt-primary">Financial Summary</h5>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between p-3 bg-white rounded-md">
                      <span className="text-sm text-txt-muted">Total Spent</span>
                      <span className="font-semibold text-sm text-success">{formatCurrency(stats.totalSpent)}</span>
                    </div>
                    <div className="flex justify-between p-3 bg-white rounded-md">
                      <span className="text-sm text-txt-muted">Average Value</span>
                      <span className="font-semibold text-sm text-txt-primary">{formatCurrency(stats.averageBookingValue)}</span>
                    </div>
                    <div className="flex justify-between p-3 bg-white rounded-md">
                      <span className="text-sm text-txt-muted">Total Bookings</span>
                      <span className="font-semibold text-sm text-txt-primary">{customer.totalBookings}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-card p-5">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded bg-purple-100 flex items-center justify-center text-purple-600">
                      <BoxIcon name="bar-chart" size={20} />
                    </div>
                    <h5 className="font-semibold text-txt-primary">Booking Breakdown</h5>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between p-3 bg-white rounded-md">
                      <span className="text-sm text-txt-muted">Completed</span>
                      <span className="font-semibold text-sm text-success">{stats.completedBookings}</span>
                    </div>
                    <div className="flex justify-between p-3 bg-white rounded-md">
                      <span className="text-sm text-txt-muted">Cancelled</span>
                      <span className="font-semibold text-sm text-danger">{stats.cancelledBookings}</span>
                    </div>
                    <div className="flex justify-between p-3 bg-white rounded-md">
                      <span className="text-sm text-txt-muted">No Shows</span>
                      <span className="font-semibold text-sm text-txt-secondary">{stats.noShowBookings}</span>
                    </div>
                    <div className="flex justify-between p-3 bg-primary-light rounded-md">
                      <span className="text-sm text-primary font-medium">Success Rate</span>
                      <span className="font-bold text-sm text-primary">
                        {customer.totalBookings > 0 ? Math.round((stats.completedBookings / customer.totalBookings) * 100) : 0}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}