'use client';

import { ReactNode } from 'react';
import { Badge } from '@/components/ui/badge';
import { Booking, BookingStatus, PaymentStatus } from '@/types/booking';
import { SalesTransaction, SalesPaymentMethod, SalesTransactionStatus } from '@/types/sales';

interface UnifiedTableProps {
  data: (Booking | SalesTransaction)[];
  type: 'booking' | 'sales';
  renderActions?: (item: Booking | SalesTransaction) => ReactNode;
}

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
  renderActions
}: UnifiedTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-gray-50">
            <th className="text-left py-3 px-4 font-semibold">ID</th>
            <th className="text-left py-3 px-4 font-semibold">Date</th>
            <th className="text-left py-3 px-4 font-semibold">Customer</th>
            {type === 'booking' && <th className="text-left py-3 px-4 font-semibold">Service</th>}
            {type === 'sales' && <th className="text-left py-3 px-4 font-semibold">Service</th>}
            <th className="text-left py-3 px-4 font-semibold">{type === 'booking' ? 'Amount' : 'Total'}</th>
            <th className="text-left py-3 px-4 font-semibold">Payment</th>
            {type === 'sales' && <th className="text-left py-3 px-4 font-semibold">Status</th>}
            {type === 'booking' && <th className="text-left py-3 px-4 font-semibold">Booking Status</th>}
            {renderActions && <th className="text-right py-3 px-4 font-semibold">Action</th>}
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr>
              <td colSpan={type === 'booking' ? (renderActions ? 8 : 7) : (renderActions ? 8 : 7)} className="text-center py-8 text-gray-500">
                {type === 'booking' ? 'No bookings found' : 'No sales found'}
              </td>
            </tr>
          ) : (
            data.map((item) => {
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
                  {type === 'sales' && (
                    <td className="py-3 px-4">
                      <Badge className={getStatusColor(item.status, type)}>
                        {String(item.status).charAt(0).toUpperCase() + String(item.status).slice(1)}
                      </Badge>
                    </td>
                  )}

                  {/* Booking Status Column */}
                  {type === 'booking' && (
                    <td className="py-3 px-4">
                      <Badge className={getStatusColor(item.status, type)}>
                        {String(item.status).charAt(0).toUpperCase() + String(item.status).slice(1)}
                      </Badge>
                    </td>
                  )}

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
    </div>
  );
}
