'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Invoice, InvoiceStatus } from '@/types/invoice';
import { Download, Printer } from 'lucide-react';

interface InvoicePreviewProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoice: Invoice;
}

export function InvoicePreview({ open, onOpenChange, invoice }: InvoicePreviewProps) {
  const handleDownloadPDF = async () => {
    try {
      const response = await fetch(`/api/invoices/${invoice.id}/pdf`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `invoice-${invoice.invoiceNumber}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error('Error downloading PDF:', error);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const getStatusBadge = (status: InvoiceStatus) => {
    const variants = {
      [InvoiceStatus.DRAFT]: 'secondary',
      [InvoiceStatus.SENT]: 'default',
      [InvoiceStatus.PAID]: 'success',
      [InvoiceStatus.OVERDUE]: 'destructive',
      [InvoiceStatus.CANCELLED]: 'outline'
    } as const;

    return (
      <Badge variant={variants[status] as any}>
        {status.replace('_', ' ').toUpperCase()}
      </Badge>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex justify-between items-center">
            <DialogTitle>Invoice Preview</DialogTitle>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handlePrint}>
                <Printer className="h-4 w-4 mr-2" />
                Print
              </Button>
              <Button variant="outline" size="sm" onClick={handleDownloadPDF}>
                <Download className="h-4 w-4 mr-2" />
                Download PDF
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="invoice-preview bg-white p-8 border rounded-lg">
          {/* Header */}
          <div className="flex justify-between items-start mb-8">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {invoice.tenant?.businessName || 'Business Name'}
              </h1>
              <div className="mt-2 text-sm text-gray-600">
                {invoice.tenant?.address && (
                  <p>{invoice.tenant.address}</p>
                )}
                {invoice.tenant?.phone && (
                  <p>Phone: {invoice.tenant.phone}</p>
                )}
                {invoice.tenant?.email && (
                  <p>Email: {invoice.tenant.email}</p>
                )}
              </div>
            </div>
            <div className="text-right">
              <h2 className="text-xl font-bold text-gray-900">INVOICE</h2>
              <div className="mt-2 text-sm">
                <p><strong>Invoice #:</strong> {invoice.invoiceNumber}</p>
                <p><strong>Issue Date:</strong> {invoice.issueDate.toLocaleDateString()}</p>
                <p><strong>Due Date:</strong> {invoice.dueDate.toLocaleDateString()}</p>
                <div className="mt-2">
                  {getStatusBadge(invoice.status)}
                </div>
              </div>
            </div>
          </div>

          {/* Customer Details */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Bill To:</h3>
            <div className="text-sm text-gray-600">
              <p className="font-medium">{invoice.customer?.name}</p>
              {invoice.customer?.email && <p>{invoice.customer.email}</p>}
              <p>{invoice.customer?.phone}</p>
              {invoice.customer?.address && <p>{invoice.customer.address}</p>}
            </div>
          </div>

          {/* Invoice Items */}
          <div className="mb-8">
            <table className="w-full border-collapse border border-gray-300">
              <thead>
                <tr className="bg-gray-50">
                  <th className="border border-gray-300 px-4 py-2 text-left">Description</th>
                  <th className="border border-gray-300 px-4 py-2 text-center">Qty</th>
                  <th className="border border-gray-300 px-4 py-2 text-right">Unit Price</th>
                  <th className="border border-gray-300 px-4 py-2 text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {invoice.items.map((item, index) => (
                  <tr key={index} className={index % 2 === 1 ? 'bg-gray-25' : ''}>
                    <td className="border border-gray-300 px-4 py-2">{item.description}</td>
                    <td className="border border-gray-300 px-4 py-2 text-center">{item.quantity}</td>
                    <td className="border border-gray-300 px-4 py-2 text-right">
                      Rp {item.unitPrice.toFixed(2)}
                    </td>
                    <td className="border border-gray-300 px-4 py-2 text-right">
                      Rp {item.totalPrice.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div className="flex justify-end mb-8">
            <div className="w-64">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>Rp {invoice.subtotal.toFixed(2)}</span>
                </div>
                {invoice.taxAmount.toNumber() > 0 && (
                  <div className="flex justify-between">
                    <span>Tax ({(invoice.taxRate.toNumber() * 100).toFixed(1)}%):</span>
                    <span>Rp {invoice.taxAmount.toFixed(2)}</span>
                  </div>
                )}
                {invoice.discountAmount.toNumber() > 0 && (
                  <div className="flex justify-between">
                    <span>Discount:</span>
                    <span>-Rp {invoice.discountAmount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-lg border-t pt-2">
                  <span>Total:</span>
                  <span>Rp {invoice.totalAmount.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Payment Information */}
          {(invoice.paymentMethod || invoice.paymentReference) && (
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Payment Information:</h3>
              <div className="text-sm text-gray-600">
                {invoice.paymentMethod && (
                  <p><strong>Payment Method:</strong> {invoice.paymentMethod.replace('_', ' ').toUpperCase()}</p>
                )}
                {invoice.paymentReference && (
                  <p><strong>Reference:</strong> {invoice.paymentReference}</p>
                )}
                {invoice.paidDate && (
                  <p><strong>Paid Date:</strong> {invoice.paidDate.toLocaleDateString()}</p>
                )}
              </div>
            </div>
          )}

          {/* QR Code */}
          {invoice.qrCodeData && (
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Scan to Pay:</h3>
              <div className="flex items-center gap-4">
                <div className="w-24 h-24 bg-gray-100 border rounded flex items-center justify-center">
                  <span className="text-xs text-gray-500">QR Code</span>
                </div>
                <div className="text-sm text-gray-600">
                  <p>Scan this QR code with your mobile banking app</p>
                  <p>or digital wallet to make payment</p>
                </div>
              </div>
            </div>
          )}

          {/* Notes */}
          {invoice.notes && (
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Notes:</h3>
              <p className="text-sm text-gray-600">{invoice.notes}</p>
            </div>
          )}

          {/* Terms */}
          {invoice.terms && (
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Terms & Conditions:</h3>
              <p className="text-sm text-gray-600">{invoice.terms}</p>
            </div>
          )}

          {/* Footer */}
          <div className="text-center text-sm text-gray-500 border-t pt-4">
            <p>Thank you for your business!</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}