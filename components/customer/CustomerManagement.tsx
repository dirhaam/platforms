'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BoxIcon } from '@/components/ui/box-icon';
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
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
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
    setCurrentPage(1);
  }, [customers, searchQuery, filterBy]);

  // Pagination
  const totalPages = Math.ceil(filteredCustomers.length / itemsPerPage);
  const paginatedCustomers = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredCustomers.slice(start, start + itemsPerPage);
  }, [filteredCustomers, currentPage]);

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
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white shadow-card rounded-card p-5 hover:-translate-y-1 transition-all duration-300">
          <div className="w-10 h-10 rounded bg-blue-100 flex items-center justify-center text-info mb-3">
            <BoxIcon name="group" size={20} />
          </div>
          <span className="block text-txt-muted text-sm mb-1">Total Customers</span>
          <h3 className="text-2xl font-bold text-txt-primary">{stats.totalCustomers}</h3>
        </div>

        <div className="bg-white shadow-card rounded-card p-5 hover:-translate-y-1 transition-all duration-300">
          <div className="w-10 h-10 rounded bg-green-100 flex items-center justify-center text-success mb-3">
            <BoxIcon name="user-plus" size={20} />
          </div>
          <span className="block text-txt-muted text-sm mb-1">New This Month</span>
          <h3 className="text-2xl font-bold text-txt-primary">{stats.newCustomersThisMonth}</h3>
        </div>

        <div className="bg-white shadow-card rounded-card p-5 hover:-translate-y-1 transition-all duration-300">
          <div className="w-10 h-10 rounded bg-purple-100 flex items-center justify-center text-purple-600 mb-3">
            <BoxIcon name="user-check" size={20} />
          </div>
          <span className="block text-txt-muted text-sm mb-1">Active (30 days)</span>
          <h3 className="text-2xl font-bold text-txt-primary">{stats.activeCustomers}</h3>
        </div>

        <div className="bg-white shadow-card rounded-card p-5 hover:-translate-y-1 transition-all duration-300">
          <div className="w-10 h-10 rounded bg-orange-100 flex items-center justify-center text-warning mb-3">
            <BoxIcon name="calendar-check" size={20} />
          </div>
          <span className="block text-txt-muted text-sm mb-1">Avg Bookings</span>
          <h3 className="text-2xl font-bold text-txt-primary">{(stats.averageBookingsPerCustomer ?? 0).toFixed(1)}</h3>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-white shadow-card rounded-card">
        <div className="p-5 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded bg-primary-light flex items-center justify-center text-primary">
              <BoxIcon name="group" size={20} />
            </div>
            <h5 className="text-lg font-semibold text-txt-primary">Customer Management</h5>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportCustomers}
              disabled={filteredCustomers.length === 0}
              className="border-gray-300 text-txt-secondary hover:bg-gray-50"
            >
              <BoxIcon name="download" size={16} className="mr-2" />
              Export
            </Button>
            <Button
              size="sm"
              onClick={() => setShowCreateDialog(true)}
              className="bg-primary hover:bg-primary-dark text-white shadow-md shadow-primary/30"
            >
              <BoxIcon name="plus" size={16} className="mr-2" />
              Add Customer
            </Button>
          </div>
        </div>
        <div className="p-5 space-y-4">
          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <BoxIcon name="search" size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-txt-muted" />
                <Input
                  placeholder="Search customers by name, phone, or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-gray-50 border-transparent focus:bg-white focus:border-primary"
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Select value={filterBy} onValueChange={(value: any) => setFilterBy(value)}>
                <SelectTrigger className="w-40 bg-gray-50 border-transparent">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Customers</SelectItem>
                  <SelectItem value="hasBookings">With Bookings</SelectItem>
                  <SelectItem value="noBookings">No Bookings</SelectItem>
                </SelectContent>
              </Select>
              <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                <SelectTrigger className="w-40 bg-gray-50 border-transparent">
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
                className="border-gray-300"
              >
                <BoxIcon name={sortOrder === 'asc' ? 'sort-up' : 'sort-down'} size={16} />
              </Button>
            </div>
          </div>

          {/* Results Summary */}
          <div className="flex items-center justify-between text-sm text-txt-muted">
            <span>
              Showing {paginatedCustomers.length} of {filteredCustomers.length} customers
            </span>
            {searchQuery && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSearchQuery('')}
                className="text-txt-muted hover:text-primary"
              >
                <BoxIcon name="x" size={14} className="mr-1" />
                Clear search
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Customer List */}
      <div className="bg-white shadow-card rounded-card overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <BoxIcon name="loader-alt" size={32} className="animate-spin text-primary" />
          </div>
        ) : filteredCustomers.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
              <BoxIcon name="group" size={32} className="text-txt-muted" />
            </div>
            <h5 className="text-lg font-semibold text-txt-primary mb-2">
              {searchQuery ? 'No customers found' : 'No customers yet'}
            </h5>
            <p className="text-txt-muted text-sm mb-4">
              {searchQuery 
                ? 'Try adjusting your search terms or filters'
                : 'Add your first customer to get started'
              }
            </p>
            {!searchQuery && (
              <Button onClick={() => setShowCreateDialog(true)} className="bg-primary hover:bg-primary-dark text-white">
                <BoxIcon name="plus" size={16} className="mr-2" />
                Add Customer
              </Button>
            )}
          </div>
        ) : (
          <>
            <div className="divide-y divide-gray-100">
              {paginatedCustomers.map((customer) => (
                <div key={customer.id} className="p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <div className="flex-shrink-0">
                          <div className="w-10 h-10 bg-primary-light rounded-full flex items-center justify-center">
                            <span className="text-primary font-semibold">
                              {customer.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h6 className="text-sm font-semibold text-txt-primary truncate">
                              {customer.name}
                            </h6>
                            {customer.totalBookings > 0 && (
                              <span className="bg-primary-light text-primary px-2 py-0.5 rounded text-xs font-bold">
                                {customer.totalBookings} booking{customer.totalBookings !== 1 ? 's' : ''}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-3 mt-1">
                            <span className="text-sm text-txt-secondary flex items-center gap-1">
                              <BoxIcon name="phone" size={14} className="text-txt-muted" />
                              {maskPhoneNumberCompact(customer.phone)}
                            </span>
                            {customer.email && (
                              <span className="text-sm text-txt-secondary flex items-center gap-1 hidden sm:flex">
                                <BoxIcon name="envelope" size={14} className="text-txt-muted" />
                                {customer.email}
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-txt-muted mt-1 flex items-center gap-1">
                            <BoxIcon name="time" size={12} />
                            Last booking: {formatLastBooking(customer.lastBookingAt || null)}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedCustomer(customer);
                          setShowDetailsDialog(true);
                        }}
                        className="text-txt-muted hover:text-primary hover:bg-primary-light/50"
                      >
                        <BoxIcon name="show" size={18} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedCustomer(customer);
                          setShowEditDialog(true);
                        }}
                        className="text-txt-muted hover:text-info hover:bg-blue-50"
                      >
                        <BoxIcon name="edit" size={18} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCustomerDelete(customer.id)}
                        className="text-txt-muted hover:text-danger hover:bg-red-50"
                      >
                        <BoxIcon name="trash" size={18} />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-4 border-t border-gray-100">
                <div className="text-sm text-txt-muted">
                  Page {currentPage} of {totalPages}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(1)}
                    disabled={currentPage === 1}
                    className="h-8 px-2"
                  >
                    <BoxIcon name="chevrons-left" size={16} />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="h-8 px-2"
                  >
                    <BoxIcon name="chevron-left" size={16} />
                  </Button>
                  
                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }
                      return (
                        <Button
                          key={pageNum}
                          variant={currentPage === pageNum ? "default" : "outline"}
                          size="sm"
                          onClick={() => setCurrentPage(pageNum)}
                          className={`h-8 w-8 ${currentPage === pageNum ? 'bg-primary text-white' : ''}`}
                        >
                          {pageNum}
                        </Button>
                      );
                    })}
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="h-8 px-2"
                  >
                    <BoxIcon name="chevron-right" size={16} />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(totalPages)}
                    disabled={currentPage === totalPages}
                    className="h-8 px-2"
                  >
                    <BoxIcon name="chevrons-right" size={16} />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

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