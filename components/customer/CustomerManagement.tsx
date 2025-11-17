'use client';

import React, { useState, useEffect } from 'react';
import { Users, Search, Plus, Filter, Download, Eye, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Customer, CreateCustomerRequest, UpdateCustomerRequest } from '@/types/booking';
import { CustomerDialog } from '@/components/customer/CustomerDialog';
import { CustomerDetailsDialog } from '@/components/customer/CustomerDetailsDialog';
import { maskPhoneNumberCompact } from '@/lib/utils/phone-masking';

interface CustomerManagementProps {
  tenantId: string;
  onCustomerCreate?: (customer: Customer) => void;
  onCustomerUpdate?: (customerId: string, updates: Partial<Customer>) => void;
  onCustomerDelete?: (customerId: string) => void;
  className?: string;
}

export function CustomerManagement({
  tenantId,
  onCustomerCreate,
  onCustomerUpdate,
  onCustomerDelete,
  className = ''
}: CustomerManagementProps) {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'createdAt' | 'lastBookingAt' | 'totalBookings'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [filterBy, setFilterBy] = useState<'all' | 'hasBookings' | 'noBookings'>('all');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [stats, setStats] = useState({
    totalCustomers: 0,
    newCustomersThisMonth: 0,
    activeCustomers: 0,
    averageBookingsPerCustomer: 0
  });

  // Fetch customers
  useEffect(() => {
    fetchCustomers();
    fetchCustomerStats();
  }, [tenantId, sortBy, sortOrder]);

  // Filter customers based on search and filters
  useEffect(() => {
    let filtered = [...customers];

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(customer =>
        customer.name.toLowerCase().includes(query) ||
        customer.phone.includes(query) ||
        customer.email?.toLowerCase().includes(query) ||
        customer.whatsappNumber?.includes(query)
      );
    }

    // Apply booking filter
    if (filterBy === 'hasBookings') {
      filtered = filtered.filter(customer => customer.totalBookings > 0);
    } else if (filterBy === 'noBookings') {
      filtered = filtered.filter(customer => customer.totalBookings === 0);
    }

    setFilteredCustomers(filtered);
  }, [customers, searchQuery, filterBy]);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        sortBy,
        sortOrder,
        limit: '100'
      });

      const response = await fetch(`/api/customers?${params}`, {
        headers: {
          'x-tenant-id': tenantId
        }
      });

      if (response.ok) {
        const data = await response.json();
        setCustomers(data.customers || []);
      }
    } catch (error) {
      console.error('Error fetching customers:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomerStats = async () => {
    try {
      const response = await fetch('/api/customers/stats', {
        headers: {
          'x-tenant-id': tenantId
        }
      });

      if (response.ok) {
        const data = await response.json();
        // Ensure all values have defaults
        setStats({
          totalCustomers: data.stats?.totalCustomers ?? 0,
          newCustomersThisMonth: data.stats?.newCustomersThisMonth ?? 0,
          activeCustomers: data.stats?.activeCustomers ?? 0,
          averageBookingsPerCustomer: data.stats?.averageBookingsPerCustomer ?? 0
        });
      }
    } catch (error) {
      console.error('Error fetching customer stats:', error);
    }
  };

  const handleCustomerCreate = async (customerData: CreateCustomerRequest) => {
    try {
      const response = await fetch('/api/customers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-id': tenantId
        },
        body: JSON.stringify(customerData)
      });

      if (response.ok) {
        const data = await response.json();
        const newCustomer = data.customer;
        setCustomers(prev => [newCustomer, ...prev]);
        onCustomerCreate?.(newCustomer);
        setShowCreateDialog(false);
        fetchCustomerStats(); // Refresh stats
      }
    } catch (error) {
      console.error('Error creating customer:', error);
    }
  };

  const handleCustomerUpdate = async (customerId: string, updates: UpdateCustomerRequest) => {
    try {
      const response = await fetch(`/api/customers/${customerId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-id': tenantId
        },
        body: JSON.stringify(updates)
      });

      if (response.ok) {
        const data = await response.json();
        const updatedCustomer = data.customer;
        setCustomers(prev => prev.map(c => c.id === customerId ? updatedCustomer : c));
        onCustomerUpdate?.(customerId, updates);
        setShowEditDialog(false);
        setSelectedCustomer(null);
      }
    } catch (error) {
      console.error('Error updating customer:', error);
    }
  };

  const handleCustomerDelete = async (customerId: string) => {
    if (!confirm('Are you sure you want to delete this customer? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/customers/${customerId}`, {
        method: 'DELETE',
        headers: {
          'x-tenant-id': tenantId
        }
      });

      if (response.ok) {
        setCustomers(prev => prev.filter(c => c.id !== customerId));
        onCustomerDelete?.(customerId);
        fetchCustomerStats(); // Refresh stats
      }
    } catch (error) {
      console.error('Error deleting customer:', error);
    }
  };

  const handleExportCustomers = () => {
    // Create CSV content
    const headers = ['Name', 'Phone', 'Email', 'Total Bookings', 'Last Booking', 'Created Date'];
    const csvContent = [
      headers.join(','),
      ...filteredCustomers.map(customer => [
        `"${customer.name}"`,
        `"${maskPhoneNumberCompact(customer.phone)}"`,
        customer.totalBookings,
        customer.lastBookingAt ? new Date(customer.lastBookingAt).toLocaleDateString() : '',
        new Date(customer.createdAt).toLocaleDateString()
      ].join(','))
    ].join('\n');

    // Download CSV
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `customers-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const formatLastBooking = (date: Date | null): string => {
    if (!date) return 'Never';
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - new Date(date).getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.ceil(diffDays / 7)} weeks ago`;
    if (diffDays < 365) return `${Math.ceil(diffDays / 30)} months ago`;
    return `${Math.ceil(diffDays / 365)} years ago`;
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Users className="h-4 w-4 text-blue-600" />
              <div>
                <div className="text-2xl font-bold">{stats.totalCustomers}</div>
                <div className="text-sm text-gray-600">Total Customers</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Plus className="h-4 w-4 text-green-600" />
              <div>
                <div className="text-2xl font-bold">{stats.newCustomersThisMonth}</div>
                <div className="text-sm text-gray-600">New This Month</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Users className="h-4 w-4 text-purple-600" />
              <div>
                <div className="text-2xl font-bold">{stats.activeCustomers}</div>
                <div className="text-sm text-gray-600">Active (30 days)</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Users className="h-4 w-4 text-orange-600" />
              <div>
                <div className="text-2xl font-bold">{(stats.averageBookingsPerCustomer ?? 0).toFixed(1)}</div>
                <div className="text-sm text-gray-600">Avg Bookings</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Controls */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <Users className="h-5 w-5" />
              <span>Customer Management</span>
            </CardTitle>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportCustomers}
                disabled={filteredCustomers.length === 0}
              >
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              <Button
                size="sm"
                onClick={() => setShowCreateDialog(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Customer
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search customers by name, phone, or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Select value={filterBy} onValueChange={(value: any) => setFilterBy(value)}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Customers</SelectItem>
                  <SelectItem value="hasBookings">With Bookings</SelectItem>
                  <SelectItem value="noBookings">No Bookings</SelectItem>
                </SelectContent>
              </Select>
              <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name">Name</SelectItem>
                  <SelectItem value="createdAt">Created Date</SelectItem>
                  <SelectItem value="lastBookingAt">Last Booking</SelectItem>
                  <SelectItem value="totalBookings">Total Bookings</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              >
                {sortOrder === 'asc' ? '↑' : '↓'}
              </Button>
            </div>
          </div>

          {/* Results Summary */}
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>
              Showing {filteredCustomers.length} of {customers.length} customers
            </span>
            {searchQuery && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSearchQuery('')}
              >
                Clear search
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Customer List */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : filteredCustomers.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {searchQuery ? 'No customers found' : 'No customers yet'}
              </h3>
              <p className="text-gray-500 mb-4">
                {searchQuery 
                  ? 'Try adjusting your search terms or filters'
                  : 'Add your first customer to get started'
                }
              </p>
              {!searchQuery && (
                <Button onClick={() => setShowCreateDialog(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Customer
                </Button>
              )}
            </div>
          ) : (
            <div className="divide-y">
              {filteredCustomers.map((customer) => (
                <div key={customer.id} className="p-4 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <div className="flex-shrink-0">
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <span className="text-blue-600 font-medium">
                              {customer.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2">
                            <h3 className="text-sm font-medium text-gray-900 truncate">
                              {customer.name}
                            </h3>
                            {customer.totalBookings > 0 && (
                              <Badge variant="outline" className="text-xs">
                                {customer.totalBookings} booking{customer.totalBookings !== 1 ? 's' : ''}
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center space-x-4 mt-1">
                            <span className="text-sm text-gray-500">{maskPhoneNumberCompact(customer.phone)}</span>
                          </div>
                          <div className="text-xs text-gray-400 mt-1">
                            Last booking: {formatLastBooking(customer.lastBookingAt || null)}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedCustomer(customer);
                          setShowDetailsDialog(true);
                        }}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedCustomer(customer);
                          setShowEditDialog(true);
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCustomerDelete(customer.id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialogs */}
      <CustomerDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onSubmit={handleCustomerCreate}
        title="Add New Customer"
      />

      {selectedCustomer && (
        <>
          <CustomerDialog
            open={showEditDialog}
            onOpenChange={setShowEditDialog}
            onSubmit={(data) => handleCustomerUpdate(selectedCustomer.id, data)}
            title="Edit Customer"
            initialData={selectedCustomer}
          />

          <CustomerDetailsDialog
            open={showDetailsDialog}
            onOpenChange={setShowDetailsDialog}
            customer={selectedCustomer}
            tenantId={tenantId}
          />
        </>
      )}
    </div>
  );
}