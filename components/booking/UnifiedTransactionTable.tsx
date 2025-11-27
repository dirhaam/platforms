'use client';

import { ReactNode, useState, useMemo } from 'react';

import { Button } from '@/components/ui/button';
import { Booking, BookingStatus, PaymentStatus } from '@/types/booking';
import { SalesTransaction, SalesPaymentMethod, SalesTransactionStatus } from '@/types/sales';

interface UnifiedTableProps {
  data: (Booking | SalesTransaction)[];
  type: 'booking' | 'sales';
  renderActions?: (item: Booking | SalesTransaction) => ReactNode;
  itemsPerPage?: number;
}

type SortField = 'date' | 'payment' | 'status';
type SortDirection = 'asc' | 'desc';

const formatCurrency = (value: number) => {
  return `Rp ${(value || 0).toLocaleString('id-ID')}`;
};

const formatDateTime = (date: Date | string) => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleString('id-ID', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const getStatusColor = (status: string, type: 'booking' | 'sales') => {
  if (type === 'booking') {
    const bookingStatus = status as BookingStatus;
    switch (bookingStatus) {
      case BookingStatus.CONFIRMED:
        return 'bg-green-100 text-green-800';
      case BookingStatus.PENDING:
        return 'bg-yellow-100 text-yellow-800';
      case BookingStatus.COMPLETED:
        return 'bg-blue-100 text-blue-800';
      case BookingStatus.CANCELLED:
        return 'bg-red-100 text-red-800';
      case BookingStatus.NO_SHOW:
        return 'bg-red-200 text-red-900';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  } else {
    const salesStatus = status as SalesTransactionStatus;
    switch (salesStatus) {
      case SalesTransactionStatus.COMPLETED:
        return 'bg-green-100 text-green-800';
      case SalesTransactionStatus.PENDING:
        return 'bg-yellow-100 text-yellow-800';
      case SalesTransactionStatus.CANCELLED:
        return 'bg-red-100 text-red-800';
      case SalesTransactionStatus.REFUNDED:
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }
};

const getPaymentStatusColor = (status: string | undefined) => {
  const normalizedStatus = status?.toLowerCase();
  switch (normalizedStatus) {
    case 'paid':
      return 'bg-green-100 text-green-800';
    case 'partial':
      return 'bg-blue-100 text-blue-800';
    case 'pending':
      return 'bg-orange-100 text-orange-800';
    case 'refunded':
      return 'bg-gray-100 text-gray-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

const getPaymentMethodColor = (method: string) => {
  switch (method?.toUpperCase()) {
    case 'CASH':
      return 'bg-green-100 text-green-800';
    case 'CARD':
      return 'bg-purple-100 text-purple-800';
    case 'TRANSFER':
      return 'bg-blue-100 text-blue-800';
    case 'QRIS':
      return 'bg-indigo-100 text-indigo-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

const getPaymentMethodEmoji = (method: string) => {
  switch (method?.toLowerCase()) {
    case 'cash':
      return '💵';
    case 'card':
      return '💳';
    case 'transfer':
      return '🏦';
    case 'qris':
      return '📱';
    default:
      return '💰';
  }
};

const isBooking = (item: Booking | SalesTransaction): item is Booking => {
  return 'bookingNumber' in item;
};

const isSales = (item: Booking | SalesTransaction): item is SalesTransaction => {
  return 'transactionNumber' in item;
};

export function UnifiedTransactionTable({
  data,
  type,
  renderActions,
  itemsPerPage = 10
}: UnifiedTableProps) {
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [currentPage, setCurrentPage] = useState(1);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
    setCurrentPage(1);
  };

  const getPaymentStatusValue = (item: Booking | SalesTransaction) => {
    if ((item.paidAmount || 0) >= item.totalAmount) return 2;
    if ((item.paidAmount || 0) > 0) return 1;
    return 0;
  };

  const sortedData = useMemo(() => {
    const sorted = [...data].sort((a, b) => {
      let comparison = 0;

      switch (sortField) {
        case 'date':
          const dateA = isBooking(a) ? new Date(a.scheduledAt) : new Date(a.transactionDate);
          const dateB = isBooking(b) ? new Date(b.scheduledAt) : new Date(b.transactionDate);
          comparison = dateA.getTime() - dateB.getTime();
          break;
        case 'payment':
          comparison = getPaymentStatusValue(a) - getPaymentStatusValue(b);
          break;
        case 'status':
          comparison = String(a.status).localeCompare(String(b.status));
          break;
      }

      return sortDirection === 'asc' ? comparison : -comparison;
    });
    return sorted;
  }, [data, sortField, sortDirection]);

  const totalPages = Math.ceil(sortedData.length / itemsPerPage);
  const paginatedData = sortedData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const SortIcon = ({ field }: { field: SortField }) => (
    <span className="inline-flex flex-col ml-1">
      <i className={`bx bx-chevron-up text-xs -mb-1 ${sortField === field && sortDirection === 'asc' ? 'text-primary' : 'text-gray-300'}`}></i>
      <i className={`bx bx-chevron-down text-xs -mt-1 ${sortField === field && sortDirection === 'desc' ? 'text-primary' : 'text-gray-300'}`}></i>
    </span>
  );

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-gray-50">
            <th className="text-left py-3 px-4 font-semibold">ID</th>
            <th 
              className="text-left py-3 px-4 font-semibold cursor-pointer hover:bg-gray-100 select-none"
              onClick={() => handleSort('date')}
            >
              <span className="flex items-center">
                Date
                <SortIcon field="date" />
              </span>
            </th>
            <th className="text-left py-3 px-4 font-semibold">Customer</th>
            <th className="text-left py-3 px-4 font-semibold">Service</th>
            <th className="text-left py-3 px-4 font-semibold">{type === 'booking' ? 'Amount' : 'Total'}</th>
            <th 
              className="text-left py-3 px-4 font-semibold cursor-pointer hover:bg-gray-100 select-none"
              onClick={() => handleSort('payment')}
            >
              <span className="flex items-center">
                Payment
                <SortIcon field="payment" />
              </span>
            </th>
            <th 
              className="text-left py-3 px-4 font-semibold cursor-pointer hover:bg-gray-100 select-none"
              onClick={() => handleSort('status')}
            >
              <span className="flex items-center">
                {type === 'booking' ? 'Booking Status' : 'Status'}
                <SortIcon field="status" />
              </span>
            </th>
            {renderActions && <th className="text-right py-3 px-4 font-semibold">Action</th>}
          </tr>
        </thead>
        <tbody>
          {paginatedData.length === 0 ? (
            <tr>
              <td colSpan={renderActions ? 8 : 7} className="text-center py-8 text-gray-500">
                {type === 'booking' ? 'No bookings found' : 'No sales found'}
              </td>
            </tr>
          ) : (
            paginatedData.map((item) => {
              const isBookingItem = isBooking(item);
              const isSalesItem = isSales(item);

              return (
                <tr key={item.id} className="border-b hover:bg-gray-50">
                  {/* ID Column */}
                  <td className="py-3 px-4 font-medium text-sm">
                    {isBookingItem ? item.bookingNumber : item.transactionNumber}
                  </td>

                  {/* Date Column */}
                  <td className="py-3 px-4 text-sm">
                    {formatDateTime(isBookingItem ? item.scheduledAt : item.transactionDate)}
                  </td>

                  {/* Customer Column */}
                  <td className="py-3 px-4 text-sm">
                    {isBookingItem ? item.customer?.name : item.customer?.name || '-'}
                  </td>

                  {/* Service Column */}
                  <td className="py-3 px-4 text-sm">
                    {isBookingItem ? item.service?.name : item.serviceName}
                  </td>

                  {/* Amount / Total Column */}
                  <td className="py-3 px-4 font-medium text-sm">
                    {formatCurrency(item.totalAmount)}
                  </td>

                  {/* Payment Status Column */}
                  <td className="py-3 px-4">
                    {type === 'booking' ? (
                      <div className={`px-3 py-1 rounded-md text-sm font-medium text-center inline-block ${
                        (item.paidAmount || 0) >= item.totalAmount
                          ? 'bg-green-100 text-green-800'
                          : (item.paidAmount || 0) > 0 ? 'bg-blue-100 text-blue-800'
                          : 'bg-orange-100 text-orange-800'
                      }`}>
                        {(item.paidAmount || 0) >= item.totalAmount 
                          ? 'Lunas' 
                          : (item.paidAmount || 0) > 0 
                          ? 'Partial' 
                          : 'Pending'}
                      </div>
                    ) : (
                      <div className={`px-3 py-1 rounded-md text-sm font-medium text-center inline-block ${
                        (item.paidAmount || 0) >= item.totalAmount
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {(item.paidAmount || 0) >= item.totalAmount ? 'Lunas' : 'Kurang Bayar'}
                      </div>
                    )}
                  </td>

                  {/* Status Column */}
                  <td className="py-3 px-4">
                    <div className={`px-3 py-1 rounded text-xs font-bold uppercase text-center inline-block ${getStatusColor(item.status, type)}`}>
                      {String(item.status).charAt(0).toUpperCase() + String(item.status).slice(1)}
                    </div>
                  </td>

                  {/* Action Column */}
                  {renderActions && (
                    <td className="py-3 px-4 text-right">
                      {renderActions(item)}
                    </td>
                  )}
                </tr>
              );
            })
          )}
        </tbody>
      </table>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-4 border-t border-gray-100">
          <div className="text-sm text-txt-muted">
            Showing {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, sortedData.length)} of {sortedData.length}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
              className="h-8 px-2"
            >
              <i className='bx bx-chevrons-left'></i>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="h-8 px-2"
            >
              <i className='bx bx-chevron-left'></i>
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
              <i className='bx bx-chevron-right'></i>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages}
              className="h-8 px-2"
            >
              <i className='bx bx-chevrons-right'></i>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
