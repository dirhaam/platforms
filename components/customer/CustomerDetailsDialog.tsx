'use client';

import React, { useState, useEffect } from 'react';
import { 
  User, Phone, Mail, MapPin, MessageSquare, FileText, 
  Calendar, Clock, DollarSign, TrendingUp, History 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Customer, Booking, BookingStatus } from '@/types/booking';

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
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    totalSpent: 0,
    averageBookingValue: 0,
    completedBookings: 0,
    cancelledBookings: 0,
    noShowBookings: 0
  });

  // Fetch customer bookings when dialog opens
  useEffect(() => {
    if (open && customer.id) {
      fetchCustomerBookings();
    }
  }, [open, customer.id]);

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
      noShowBookings: noShowBookings.length
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
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
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
      <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <User className="h-5 w-5" />
            <span>Customer Details</span>
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="bookings">Bookings</TabsTrigger>
            <TabsTrigger value="stats">Statistics</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            {/* Customer Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">{customer.name}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <Phone className="h-4 w-4 text-gray-500" />
                      <span className="text-sm">{customer.phone}</span>
                    </div>
                    
                    {customer.email && (
                      <div className="flex items-center space-x-2">
                        <Mail className="h-4 w-4 text-gray-500" />
                        <span className="text-sm">{customer.email}</span>
                      </div>
                    )}
                    
                    {customer.whatsappNumber && (
                      <div className="flex items-center space-x-2">
                        <MessageSquare className="h-4 w-4 text-gray-500" />
                        <span className="text-sm">{customer.whatsappNumber}</span>
                      </div>
                    )}
                    
                    {customer.address && (
                      <div className="flex items-start space-x-2">
                        <MapPin className="h-4 w-4 text-gray-500 mt-0.5" />
                        <span className="text-sm">{customer.address}</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4 text-gray-500" />
                      <span className="text-sm">Customer since {getCustomerSince()} ago</span>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <TrendingUp className="h-4 w-4 text-gray-500" />
                      <span className="text-sm">{customer.totalBookings} total bookings</span>
                    </div>
                    
                    {customer.lastBookingAt && (
                      <div className="flex items-center space-x-2">
                        <Clock className="h-4 w-4 text-gray-500" />
                        <span className="text-sm">
                          Last booking: {formatDate(customer.lastBookingAt)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                
                {customer.notes && (
                  <div className="pt-4 border-t">
                    <div className="flex items-start space-x-2">
                      <FileText className="h-4 w-4 text-gray-500 mt-0.5" />
                      <div>
                        <div className="text-sm font-medium mb-1">Notes</div>
                        <div className="text-sm text-gray-600">{customer.notes}</div>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {formatCurrency(stats.totalSpent)}
                  </div>
                  <div className="text-sm text-gray-600">Total Spent</div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {stats.completedBookings}
                  </div>
                  <div className="text-sm text-gray-600">Completed</div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-orange-600">
                    {stats.cancelledBookings}
                  </div>
                  <div className="text-sm text-gray-600">Cancelled</div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {formatCurrency(stats.averageBookingValue)}
                  </div>
                  <div className="text-sm text-gray-600">Avg Value</div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="bookings" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <History className="h-5 w-5" />
                  <span>Booking History</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                ) : sortedBookings.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>No bookings found</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {sortedBookings.map((booking) => (
                      <div
                        key={booking.id}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                      >
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <span className="font-medium">{booking.service?.name}</span>
                            <Badge className={getStatusColor(booking.status)}>
                              {booking.status}
                            </Badge>
                            {booking.isHomeVisit && (
                              <Badge variant="outline" className="text-xs">
                                Home Visit
                              </Badge>
                            )}
                          </div>
                          <div className="text-sm text-gray-600">
                            {formatDate(booking.scheduledAt)} at {formatTime(booking.scheduledAt)}
                          </div>
                          <div className="text-sm text-gray-500">
                            Duration: {booking.duration} minutes
                          </div>
                          {booking.notes && (
                            <div className="text-sm text-gray-500 mt-1">
                              Note: {booking.notes}
                            </div>
                          )}
                        </div>
                        <div className="text-right">
                          <div className="font-medium">
                            {formatCurrency(Number(booking.totalAmount))}
                          </div>
                          <div className={`text-xs ${
                            booking.paymentStatus === 'paid' 
                              ? 'text-green-600' 
                              : booking.paymentStatus === 'pending'
                              ? 'text-yellow-600'
                              : 'text-red-600'
                          }`}>
                            {booking.paymentStatus}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="stats" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <DollarSign className="h-5 w-5" />
                    <span>Financial Summary</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between">
                    <span>Total Spent:</span>
                    <span className="font-medium">{formatCurrency(stats.totalSpent)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Average Booking Value:</span>
                    <span className="font-medium">{formatCurrency(stats.averageBookingValue)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Bookings:</span>
                    <span className="font-medium">{customer.totalBookings}</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <TrendingUp className="h-5 w-5" />
                    <span>Booking Breakdown</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between">
                    <span>Completed:</span>
                    <span className="font-medium text-green-600">{stats.completedBookings}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Cancelled:</span>
                    <span className="font-medium text-red-600">{stats.cancelledBookings}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>No Shows:</span>
                    <span className="font-medium text-gray-600">{stats.noShowBookings}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Success Rate:</span>
                    <span className="font-medium">
                      {customer.totalBookings > 0 
                        ? Math.round((stats.completedBookings / customer.totalBookings) * 100)
                        : 0
                      }%
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}