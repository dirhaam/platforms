import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { SalesTransaction, SalesPaymentMethod } from '@/types/sales';

interface SalesTransactionDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transaction: SalesTransaction | null;
}

export function SalesTransactionDetailsDialog({
  open,
  onOpenChange,
  transaction,
}: SalesTransactionDetailsDialogProps) {
  if (!transaction) return null;

  const STATUS_VARIANTS: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800',
    completed: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800',
    refunded: 'bg-gray-100 text-gray-800',
  };

  const PAYMENT_METHOD_COLORS: Record<string, string> = {
    [SalesPaymentMethod.CASH]: 'bg-green-100 text-green-800',
    [SalesPaymentMethod.CARD]: 'bg-purple-100 text-purple-800',
    [SalesPaymentMethod.TRANSFER]: 'bg-blue-100 text-blue-800',
    [SalesPaymentMethod.QRIS]: 'bg-indigo-100 text-indigo-800',
  };

  const formatCurrency = (value?: number) => `IDR ${(value || 0).toLocaleString('id-ID')}`;
  const formatDate = (date?: Date) => date ? new Date(date).toLocaleDateString('id-ID') : '-';
  const isMultiplePayment = transaction.payments && transaction.payments.length > 1;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">Transaction Details</DialogTitle>
          <DialogDescription>
            Transaction #{transaction.transactionNumber} • {formatDate(transaction.transactionDate)}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Transaction Info */}
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs font-semibold text-gray-500 uppercase">Status</Label>
                <Badge className={`mt-2 ${STATUS_VARIANTS[transaction.status] || 'bg-gray-100'}`}>
                  {transaction.status.toUpperCase()}
                </Badge>
              </div>
              <div>
                <Label className="text-xs font-semibold text-gray-500 uppercase">Source</Label>
                <p className="mt-2 font-medium">{transaction.source.replace('_', ' ').toUpperCase()}</p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Service Info */}
          <div className="space-y-3">
            <h3 className="font-semibold text-sm">Service Information</h3>
            <div className="space-y-2 text-sm">
              {transaction.serviceName && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Service:</span>
                  <span className="font-medium">{transaction.serviceName}</span>
                </div>
              )}
              {transaction.duration && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Duration:</span>
                  <span className="font-medium">{transaction.duration} minutes</span>
                </div>
              )}
              {transaction.isHomeVisit && (
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Type:</span>
                  <Badge className="bg-blue-100 text-blue-800">Home Visit</Badge>
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Amount Breakdown */}
          <div className="space-y-3">
            <h3 className="font-semibold text-sm">Amount Breakdown</h3>
            <div className="bg-gray-50 rounded-lg p-3 space-y-2 text-sm">
              {transaction.unitPrice && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Unit Price:</span>
                  <span>{formatCurrency(transaction.unitPrice)}</span>
                </div>
              )}
              {transaction.homeVisitSurcharge && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Home Visit Surcharge:</span>
                  <span>{formatCurrency(transaction.homeVisitSurcharge)}</span>
                </div>
              )}
              {transaction.taxAmount && transaction.taxAmount > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Tax ({(transaction.taxRate * 100).toFixed(1)}%):</span>
                  <span>{formatCurrency(transaction.taxAmount)}</span>
                </div>
              )}
              {transaction.discountAmount && transaction.discountAmount > 0 && (
                <div className="flex justify-between text-orange-600">
                  <span>Discount:</span>
                  <span>-{formatCurrency(transaction.discountAmount)}</span>
                </div>
              )}
              <Separator className="my-2" />
              <div className="flex justify-between font-bold text-base">
                <span>Total Amount:</span>
                <span>{formatCurrency(transaction.totalAmount)}</span>
              </div>
            </div>
          </div>

          <Separator />

          {/* Payment Method & History */}
          <div className="space-y-3">
            <h3 className="font-semibold text-sm">Payment Information</h3>
            
            {/* Payment Method Badge */}
            <div className="flex items-center gap-3">
              <span className="text-gray-600">Method:</span>
              <Badge className={`${PAYMENT_METHOD_COLORS[transaction.paymentMethod] || 'bg-gray-100'}`}>
                {transaction.paymentMethod.toUpperCase()}
              </Badge>
              {isMultiplePayment && (
                <Badge variant="outline" className="bg-amber-50">
                  Split Payment ({transaction.payments?.length} entries)
                </Badge>
              )}
            </div>

            {/* Single or Multiple Payments */}
            {isMultiplePayment && transaction.payments ? (
              <div className="bg-blue-50 rounded-lg p-3 space-y-2 text-sm">
                <p className="font-medium text-blue-900">Payment Breakdown:</p>
                {transaction.payments.map((payment, index) => (
                  <div key={index} className="flex justify-between items-center py-2 px-2 bg-white rounded border border-blue-200">
                    <div>
                      <div className="font-medium">{payment.paymentMethod.toUpperCase()}</div>
                      <div className="text-xs text-gray-500">{formatDate(payment.paidAt)}</div>
                      {payment.paymentReference && (
                        <div className="text-xs text-gray-500">Ref: {payment.paymentReference}</div>
                      )}
                    </div>
                    <span className="font-semibold text-base">{formatCurrency(payment.paymentAmount)}</span>
                  </div>
                ))}
                <div className="flex justify-between font-bold pt-2 mt-2 border-t border-blue-200">
                  <span>Total Paid:</span>
                  <span>{formatCurrency(transaction.paidAmount)}</span>
                </div>
              </div>
            ) : (
              <div className="bg-gray-50 rounded-lg p-3 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Amount Paid:</span>
                  <span className="font-medium">{formatCurrency(transaction.paidAmount)}</span>
                </div>
                {transaction.paymentReference && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Reference:</span>
                    <span className="font-medium text-xs">{transaction.paymentReference}</span>
                  </div>
                )}
                {transaction.paidAt && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Paid Date:</span>
                    <span className="font-medium">{formatDate(transaction.paidAt)}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {transaction.notes && (
            <>
              <Separator />
              <div className="space-y-2">
                <Label className="text-xs font-semibold text-gray-500 uppercase">Notes</Label>
                <p className="text-sm text-gray-700 bg-gray-50 rounded p-3">{transaction.notes}</p>
              </div>
            </>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
