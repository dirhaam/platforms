"use client";

import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Search, Filter } from 'lucide-react';
import { BookingStatus, PaymentStatus } from '@/types/booking';

interface BookingFiltersProps {
  searchTerm: string;
  onSearchChange: (v: string) => void;
  statusFilter: string;
  onStatusChange: (v: string) => void;
  paymentFilter: string;
  onPaymentChange: (v: string) => void;
  onRefresh: () => void;
}

export function BookingFilters({
  searchTerm,
  onSearchChange,
  statusFilter,
  onStatusChange,
  paymentFilter,
  onPaymentChange,
  onRefresh,
}: BookingFiltersProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Search by name, service..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10"
        />
      </div>

      <Select value={statusFilter} onValueChange={onStatusChange}>
        <SelectTrigger>
          <SelectValue placeholder="Filter by status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Status</SelectItem>
          <SelectItem value={BookingStatus.PENDING}>Pending</SelectItem>
          <SelectItem value={BookingStatus.CONFIRMED}>Confirmed</SelectItem>
          <SelectItem value={BookingStatus.COMPLETED}>Completed</SelectItem>
          <SelectItem value={BookingStatus.CANCELLED}>Cancelled</SelectItem>
        </SelectContent>
      </Select>

      <Select value={paymentFilter} onValueChange={onPaymentChange}>
        <SelectTrigger>
          <SelectValue placeholder="Filter by payment" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Payments</SelectItem>
          <SelectItem value={PaymentStatus.PENDING}>Pending</SelectItem>
          <SelectItem value={PaymentStatus.PAID}>Paid</SelectItem>
          <SelectItem value={PaymentStatus.REFUNDED}>Refunded</SelectItem>
        </SelectContent>
      </Select>

      <Button variant="outline" onClick={onRefresh}>
        <Filter className="h-4 w-4 mr-2" />
        Refresh
      </Button>
    </div>
  );
}
