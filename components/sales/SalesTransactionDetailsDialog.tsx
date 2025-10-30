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
import { SalesTransaction } from '@/types/sales';

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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Transaction Details</DialogTitle>
          <DialogDescription>
            View complete transaction information
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium text-gray-600">Transaction #</Label>
              <p className="mt-1 font-medium">{transaction.transactionNumber}</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-600">Date</Label>
              <p className="mt-1">
                {new Date(transaction.transactionDate).toLocaleString('id-ID')}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium text-gray-600">Amount</Label>
              <p className="mt-1 font-medium">
                IDR {transaction.totalAmount.toLocaleString('id-ID')}
              </p>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-600">Paid Amount</Label>
              <p className="mt-1 font-medium">
                IDR {transaction.paidAmount.toLocaleString('id-ID')}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium text-gray-600">Status</Label>
              <Badge className={`mt-1 ${STATUS_VARIANTS[transaction.status] || 'bg-gray-100'}`}>
                {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
              </Badge>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-600">Payment Method</Label>
              <p className="mt-1">{transaction.paymentMethod.toUpperCase()}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium text-gray-600">Source</Label>
              <p className="mt-1">{transaction.source}</p>
            </div>
            {transaction.serviceName && (
              <div>
                <Label className="text-sm font-medium text-gray-600">Service</Label>
                <p className="mt-1">{transaction.serviceName}</p>
              </div>
            )}
          </div>

          {transaction.isHomeVisit && (
            <div>
              <Label className="text-sm font-medium text-gray-600">Type</Label>
              <Badge className="mt-1 bg-blue-100 text-blue-800">Home Visit</Badge>
            </div>
          )}

          {transaction.notes && (
            <div>
              <Label className="text-sm font-medium text-gray-600">Notes</Label>
              <p className="mt-1 text-gray-700">{transaction.notes}</p>
            </div>
          )}

          <div className="border-t pt-4">
            <div className="space-y-2 text-sm">
              {transaction.unitPrice && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Unit Price:</span>
                  <span>IDR {transaction.unitPrice.toLocaleString('id-ID')}</span>
                </div>
              )}
              {transaction.homeVisitSurcharge && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Home Visit Surcharge:</span>
                  <span>IDR {transaction.homeVisitSurcharge.toLocaleString('id-ID')}</span>
                </div>
              )}
              {transaction.taxAmount && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Tax:</span>
                  <span>IDR {transaction.taxAmount.toLocaleString('id-ID')}</span>
                </div>
              )}
              {transaction.discountAmount && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Discount:</span>
                  <span>-IDR {transaction.discountAmount.toLocaleString('id-ID')}</span>
                </div>
              )}
            </div>
          </div>
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
