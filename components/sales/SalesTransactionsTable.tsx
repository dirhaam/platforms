import { ReactNode } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

import { SalesTransaction, SalesTransactionSource, SalesTransactionStatus, SalesPaymentMethod } from '@/types/sales';

interface SalesTransactionsTableProps {
  transactions: SalesTransaction[];
  emptyMessage?: string;
  renderActions?: (transaction: SalesTransaction) => ReactNode;
}

const STATUS_VARIANTS: Record<SalesTransactionStatus, string> = {
  [SalesTransactionStatus.PENDING]: 'bg-yellow-100 text-yellow-800',
  [SalesTransactionStatus.COMPLETED]: 'bg-green-100 text-green-800',
  [SalesTransactionStatus.CANCELLED]: 'bg-red-100 text-red-800',
  [SalesTransactionStatus.REFUNDED]: 'bg-gray-100 text-gray-800',
};

const SOURCE_VARIANTS: Record<SalesTransactionSource, { label: string; className: string }> = {
  [SalesTransactionSource.ON_THE_SPOT]: {
    label: 'On-the-Spot',
    className: 'bg-blue-100 text-blue-800',
  },
  [SalesTransactionSource.FROM_BOOKING]: {
    label: 'From Booking',
    className: 'bg-purple-100 text-purple-800',
  },
};

const PAYMENT_VARIANTS: Record<SalesPaymentMethod, string> = {
  [SalesPaymentMethod.CASH]: 'bg-green-100 text-green-800',
  [SalesPaymentMethod.CARD]: 'bg-purple-100 text-purple-800',
  [SalesPaymentMethod.TRANSFER]: 'bg-blue-100 text-blue-800',
  [SalesPaymentMethod.QRIS]: 'bg-indigo-100 text-indigo-800',
};

const formatCurrency = (value: number) => `IDR ${Number(value || 0).toLocaleString()}`;

export function SalesTransactionsTable({
  transactions,
  emptyMessage = 'No transactions found',
  renderActions,
}: SalesTransactionsTableProps) {
  return (
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
          {renderActions && <TableHead className="text-right">Actions</TableHead>}
        </TableRow>
      </TableHeader>
      <TableBody>
        {transactions.length === 0 ? (
          <TableRow>
            <TableCell colSpan={renderActions ? 8 : 7} className="text-center py-8">
              <p className="text-gray-500">{emptyMessage}</p>
            </TableCell>
          </TableRow>
        ) : (
          transactions.map((transaction) => (
            <TableRow key={transaction.id}>
              <TableCell className="font-medium">{transaction.transactionNumber}</TableCell>
              <TableCell>
                {transaction.transactionDate
                  ? new Date(transaction.transactionDate).toLocaleDateString()
                  : '-'}
              </TableCell>
              <TableCell>{transaction.serviceName || 'Multiple Services'}</TableCell>
              <TableCell>
                <span className={`px-3 py-1 rounded text-xs font-bold uppercase ${SOURCE_VARIANTS[transaction.source].className}`}>
                  {SOURCE_VARIANTS[transaction.source].label}
                </span>
              </TableCell>
              <TableCell className="font-medium">{formatCurrency(transaction.totalAmount)}</TableCell>
              <TableCell>
                <span className={`px-3 py-1 rounded text-xs font-bold uppercase ${PAYMENT_VARIANTS[transaction.paymentMethod]}`}>
                  {transaction.paymentMethod.toUpperCase()}
                </span>
              </TableCell>
              <TableCell>
                <span className={`px-3 py-1 rounded text-xs font-bold uppercase ${STATUS_VARIANTS[transaction.status]}`}>
                  {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
                </span>
              </TableCell>
              {renderActions && (
                <TableCell className="text-right">
                  {renderActions(transaction)}
                </TableCell>
              )}
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );
}

export default SalesTransactionsTable;
