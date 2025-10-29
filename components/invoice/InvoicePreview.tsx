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
      const pdfUrl = new URL(`/api/invoices/${invoice.id}/pdf`, window.location.origin);
      if (invoice.tenantId) {
        pdfUrl.searchParams.set('tenantId', invoice.tenantId);
      }

      const response = await fetch(pdfUrl.toString());
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
      <Badge variant={variants[status]}>
        {status.replace('_', ' ').toUpperCase()}
      </Badge>
    );
  };

  const branding = invoice.branding;

  const formatCurrency = (value: number) => `Rp ${Number(value || 0).toLocaleString('id-ID')}`;
  const formatDate = (date?: Date) => (date ? date.toLocaleDateString('id-ID') : '-');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="invoice-dialog max-w-md max-h-[90vh] overflow-y-auto">
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

        <div className="invoice-print-wrapper flex justify-center">
          <div
            className="invoice-preview invoice-print-area bg-white border rounded-lg px-4 py-6 text-sm space-y-4"
            style={{ width: '80mm' }}
          >
            <div className="flex flex-col items-center text-center gap-2">
              {branding?.logoUrl ? (
                <img
                  src={branding.logoUrl}
                  alt="Invoice logo"
                  className="h-12 w-12 rounded border bg-white object-contain"
                />
              ) : null}
              <div className="space-y-1">
                {branding?.headerText && (
                  <p className="text-[11px] uppercase tracking-wide text-gray-600">
                    {branding.headerText}
                  </p>
                )}
                <h1 className="text-lg font-semibold text-gray-900">
                  {invoice.tenant?.businessName || 'Business Name'}
                </h1>
                <div className="text-xs text-gray-600 space-y-1">
                  {invoice.tenant?.address && <p>{invoice.tenant.address}</p>}
                  {invoice.tenant?.phone && <p>Tel: {invoice.tenant.phone}</p>}
                  {invoice.tenant?.email && <p>Email: {invoice.tenant.email}</p>}
                </div>
              </div>
            </div>

            <div className="border-t border-dashed border-gray-300 pt-3 space-y-1 text-xs text-gray-700">
              <div className="flex justify-between">
                <span>No. Invoice</span>
                <span className="font-medium">{invoice.invoiceNumber}</span>
              </div>
              <div className="flex justify-between">
                <span>Tanggal</span>
                <span>{formatDate(invoice.issueDate)}</span>
              </div>
              <div className="flex justify-between">
                <span>Jatuh Tempo</span>
                <span>{formatDate(invoice.dueDate)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Status</span>
                <span>{getStatusBadge(invoice.status)}</span>
              </div>
            </div>

            <div className="border-t border-dashed border-gray-300 pt-3 text-xs text-gray-700">
              <p className="font-semibold text-center mb-2">Pelanggan</p>
              <div className="space-y-1">
                <p className="font-medium text-gray-900">{invoice.customer?.name}</p>
                {invoice.customer?.phone && <p>{invoice.customer.phone}</p>}
                {invoice.customer?.email && <p>{invoice.customer.email}</p>}
                {invoice.customer?.address && <p>{invoice.customer.address}</p>}
              </div>
            </div>

            <div className="border-t border-dashed border-gray-300 pt-3 text-xs text-gray-700 space-y-3">
              <p className="font-semibold text-center">Rincian Layanan</p>
              {invoice.items.map((item, index) => (
                <div key={index} className="space-y-1">
                  <div className="flex justify-between gap-2">
                    <span className="font-medium text-gray-900">{item.description}</span>
                    <span>{formatCurrency(item.totalPrice)}</span>
                  </div>
                  <div className="flex justify-between text-[11px] text-gray-500">
                    <span>{item.quantity} x {formatCurrency(item.unitPrice)}</span>
                    <span>= {formatCurrency(item.totalPrice)}</span>
                  </div>
                  {index !== invoice.items.length - 1 && (
                    <div className="border-b border-dashed border-gray-200" />
                  )}
                </div>
              ))}
            </div>

            <div className="border-t border-dashed border-gray-300 pt-3 text-xs text-gray-700 space-y-1">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>{formatCurrency(invoice.subtotal)}</span>
              </div>
              {Number(invoice.taxAmount ?? 0) > 0 && (
                <div className="flex justify-between">
                  <span>Pajak {(Number(invoice.taxRate ?? 0) * 100).toFixed(1)}%</span>
                  <span>{formatCurrency(invoice.taxAmount)}</span>
                </div>
              )}
              {Number(invoice.discountAmount ?? 0) > 0 && (
                <div className="flex justify-between">
                  <span>Diskon</span>
                  <span>-{formatCurrency(invoice.discountAmount)}</span>
                </div>
              )}
              <div className="flex justify-between font-semibold text-base text-gray-900">
                <span>Total</span>
                <span>{formatCurrency(invoice.totalAmount)}</span>
              </div>
              {invoice.paymentMethod && (
                <div className="flex justify-between text-[11px] text-gray-500">
                  <span>Metode</span>
                  <span>{invoice.paymentMethod.replace('_', ' ').toUpperCase()}</span>
                </div>
              )}
              {invoice.paymentReference && (
                <div className="flex justify-between text-[11px] text-gray-500">
                  <span>Referensi</span>
                  <span>{invoice.paymentReference}</span>
                </div>
              )}
              {invoice.paidDate && (
                <div className="flex justify-between text-[11px] text-gray-500">
                  <span>Tgl Bayar</span>
                  <span>{formatDate(invoice.paidDate)}</span>
                </div>
              )}
            </div>

            {invoice.qrCodeData && (
              <div className="border-t border-dashed border-gray-300 pt-3 text-center">
                <div className="w-28 h-28 mx-auto bg-gray-100 border rounded flex items-center justify-center text-[10px] text-gray-500">
                  QR CODE
                </div>
                <p className="mt-2 text-[11px] text-gray-600">Scan untuk membayar</p>
              </div>
            )}

            {invoice.notes && (
              <div className="border-t border-dashed border-gray-300 pt-3 text-xs text-gray-600">
                <p className="font-semibold mb-1">Catatan</p>
                <p>{invoice.notes}</p>
              </div>
            )}

            {invoice.terms && (
              <div className="border-t border-dashed border-gray-300 pt-3 text-xs text-gray-600">
                <p className="font-semibold mb-1">Ketentuan</p>
                <p>{invoice.terms}</p>
              </div>
            )}

            <div className="border-t border-dashed border-gray-300 pt-3 text-center text-xs text-gray-500">
              <p>{branding?.footerText || 'Terima kasih atas kunjungan Anda!'}</p>
            </div>
          </div>
        </div>
      </DialogContent>
      <style jsx global>{`
        @media print {
          body {
            margin: 0;
            padding: 0;
            background: white;
          }
          .invoice-dialog {
            box-shadow: none !important;
            padding: 0;
            background: none;
          }
          .invoice-dialog > *:not(.invoice-print-wrapper) {
            display: none !important;
          }
          .invoice-print-wrapper {
            display: block !important;
          }
          .invoice-print-area {
            width: 80mm !important;
            margin: 0 auto;
            box-shadow: none !important;
            border: none;
          }
          @page {
            size: 80mm auto;
            margin: 0;
          }
        }
      `}</style>
    </Dialog>
  );
}