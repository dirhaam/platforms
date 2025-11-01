'use client';

import { useRef } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Invoice, InvoiceStatus, PaymentStatus, getPaymentStatus } from '@/types/invoice';
import jsPDF from 'jspdf';
import { Download, ImageDown, Printer } from 'lucide-react';

interface InvoicePreviewProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoice: Invoice;
}

export function InvoicePreview({ open, onOpenChange, invoice }: InvoicePreviewProps) {
  const printAreaRef = useRef<HTMLDivElement>(null);

  const captureReceiptCanvas = async () => {
    if (!printAreaRef.current) return null;

    try {
      const html2canvas = (await import('html2canvas')).default;
      const container = printAreaRef.current;
      const elements = Array.from(container.querySelectorAll<HTMLElement>('*'));
      elements.unshift(container);

      const originalInlineStyles = new Map<HTMLElement, Partial<CSSStyleDeclaration>>();

      const sanitizeColor = (value: string, fallback: string): string => {
        if (!value) return fallback;
        if (value.startsWith('oklch') || value.startsWith('oklab') || value.startsWith('lch') || value.startsWith('lab')) {
          return fallback;
        }
        if (value.includes('oklch') || value.includes('oklab') || value.includes('lch(') || value.includes('lab(')) {
          return value.replace(/oklch\([^)]+\)/g, fallback).replace(/oklab\([^)]+\)/g, fallback).replace(/lch\([^)]+\)/g, fallback).replace(/lab\([^)]+\)/g, fallback);
        }
        return value;
      };

      elements.forEach(element => {
        originalInlineStyles.set(element, {
          color: element.style.color,
          backgroundColor: element.style.backgroundColor,
          borderColor: element.style.borderColor,
          borderTopColor: element.style.borderTopColor,
          borderRightColor: element.style.borderRightColor,
          borderBottomColor: element.style.borderBottomColor,
          borderLeftColor: element.style.borderLeftColor,
          boxShadow: element.style.boxShadow,
          textShadow: element.style.textShadow,
          outline: element.style.outline,
        });

        const computed = window.getComputedStyle(element);
        const colorFallback = '#111827';
        const bgFallback = '#ffffff';
        const borderFallback = '#d1d5db';

        element.style.color = sanitizeColor(computed.color, colorFallback) || colorFallback;
        element.style.backgroundColor = sanitizeColor(computed.backgroundColor, bgFallback) || bgFallback;
        element.style.borderColor = sanitizeColor(computed.borderColor, borderFallback) || borderFallback;
        element.style.borderTopColor = sanitizeColor(computed.borderTopColor, borderFallback) || borderFallback;
        element.style.borderRightColor = sanitizeColor(computed.borderRightColor, borderFallback) || borderFallback;
        element.style.borderBottomColor = sanitizeColor(computed.borderBottomColor, borderFallback) || borderFallback;
        element.style.borderLeftColor = sanitizeColor(computed.borderLeftColor, borderFallback) || borderFallback;
        element.style.outline = sanitizeColor(computed.outline, 'none') || 'none';
        element.style.boxShadow = 'none';
        element.style.textShadow = 'none';
      });

      elements.forEach(element => {
        const styleAttr = element.getAttribute('style');
        if (styleAttr && (styleAttr.includes('oklch') || styleAttr.includes('oklab') || styleAttr.includes('lch(') || styleAttr.includes('lab('))) {
          let sanitized = styleAttr.replace(/oklch\([^)]*\)/g, '#ffffff');
          sanitized = sanitized.replace(/oklab\([^)]*\)/g, '#ffffff');
          sanitized = sanitized.replace(/lch\([^)]*\)/g, '#ffffff');
          sanitized = sanitized.replace(/lab\([^)]*\)/g, '#ffffff');
          element.setAttribute('style', sanitized);
        }
      });

      const styleOverride = document.createElement('style');
      styleOverride.textContent = `
        :root, .dark {
          --background: #ffffff !important;
          --foreground: #111827 !important;
          --card: #ffffff !important;
          --card-foreground: #111827 !important;
          --popover: #ffffff !important;
          --popover-foreground: #111827 !important;
          --primary: #353538 !important;
          --primary-foreground: #fafbfc !important;
          --secondary: #f6f6f7 !important;
          --secondary-foreground: #353538 !important;
          --muted: #f6f6f7 !important;
          --muted-foreground: #8d8d91 !important;
          --accent: #f6f6f7 !important;
          --accent-foreground: #353538 !important;
          --destructive: #f44336 !important;
          --border: #d1d5db !important;
          --input: #d1d5db !important;
          --ring: #b4b8b8 !important;
        }
      `;
      document.head.appendChild(styleOverride);

      const canvas = await html2canvas(printAreaRef.current, {
        scale: 1.5,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
      });

      document.head.removeChild(styleOverride);

      elements.forEach(element => {
        const original = originalInlineStyles.get(element);
        if (!original) return;
        element.style.color = original.color ?? '';
        element.style.backgroundColor = original.backgroundColor ?? '';
        element.style.borderColor = original.borderColor ?? '';
        element.style.borderTopColor = original.borderTopColor ?? '';
        element.style.borderRightColor = original.borderRightColor ?? '';
        element.style.borderBottomColor = original.borderBottomColor ?? '';
        element.style.borderLeftColor = original.borderLeftColor ?? '';
        element.style.outline = original.outline ?? '';
        element.style.boxShadow = original.boxShadow ?? '';
        element.style.textShadow = original.textShadow ?? '';
      });

      return canvas;
    } catch (error) {
      console.error('Error capturing receipt canvas:', error);
      return null;
    }
  };

  const handleDownloadPDF = async () => {
    const canvas = await captureReceiptCanvas();
    if (!canvas) return;

    try {
      const imgData = canvas.toDataURL('image/png', 0.85);
      const pdfWidth = 80; // mm
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      const pdf = new jsPDF({ unit: 'mm', format: [pdfWidth, pdfHeight], orientation: 'portrait' });
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`invoice-${invoice.invoiceNumber}.pdf`);
    } catch (error) {
      console.error('Error downloading PDF:', error);
    }
  };

  const handleDownloadImage = async () => {
    const canvas = await captureReceiptCanvas();
    if (!canvas) return;

    try {
      const imgData = canvas.toDataURL('image/png', 0.85);
      const link = document.createElement('a');
      link.href = imgData;
      link.download = `invoice-${invoice.invoiceNumber}.png`;
      link.click();
    } catch (error) {
      console.error('Error downloading image:', error);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const getPaymentStatusBadge = (invoice: Invoice) => {
    const paymentStatus = getPaymentStatus(invoice);
    const variants = {
      [PaymentStatus.UNPAID]: 'destructive',
      [PaymentStatus.PARTIAL_PAID]: 'secondary',
      [PaymentStatus.PAID]: 'success',
      [PaymentStatus.OVERDUE]: 'destructive'
    } as const;

    const labels = {
      [PaymentStatus.UNPAID]: 'UNPAID',
      [PaymentStatus.PARTIAL_PAID]: 'PARTIAL PAID',
      [PaymentStatus.PAID]: 'PAID',
      [PaymentStatus.OVERDUE]: 'OVERDUE'
    };

    return (
      <Badge variant={variants[paymentStatus]}>
        {labels[paymentStatus]}
      </Badge>
    );
  };

  const getPaymentHistoryNotes = (invoice: Invoice): string => {
    const paymentStatus = getPaymentStatus(invoice);

    if (paymentStatus === PaymentStatus.PAID) {
      let note = `Payment Complete: Rp ${invoice.totalAmount.toLocaleString('id-ID')}`;
      if (invoice.paidDate) note += ` | Paid on ${invoice.paidDate.toLocaleDateString('id-ID')}`;
      if (invoice.paymentMethod) note += ` | Via ${invoice.paymentMethod.replace('_', ' ').toUpperCase()}`;
      if (invoice.paymentReference) note += ` | Ref: ${invoice.paymentReference}`;
      return note;
    }

    if (paymentStatus === PaymentStatus.OVERDUE) {
      return `Overdue: Rp ${invoice.totalAmount.toLocaleString('id-ID')}`;
    }

    return `Unpaid: Rp ${invoice.totalAmount.toLocaleString('id-ID')}`;
  };

  const branding = invoice.branding;

  const formatCurrency = (value: number) => `Rp ${Number(value || 0).toLocaleString('id-ID')}`;
  const formatDate = (date?: Date) => (date ? date.toLocaleDateString('id-ID') : '-');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="invoice-dialog w-full max-w-4xl max-h-[90vh] overflow-y-auto p-6">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b pb-4">
            <div>
              <DialogTitle className="text-2xl">Invoice Preview</DialogTitle>
              <DialogDescription className="mt-1">
                Pratinjau struk sebelum dicetak atau diunduh
              </DialogDescription>
            </div>
            <div className="flex flex-wrap gap-2 w-full sm:w-auto">
              <Button variant="outline" size="sm" onClick={handlePrint} className="flex-1 sm:flex-none">
                <Printer className="h-4 w-4 mr-2" />
                Print
              </Button>
              <Button variant="outline" size="sm" onClick={handleDownloadPDF} className="flex-1 sm:flex-none">
                <Download className="h-4 w-4 mr-2" />
                PDF
              </Button>
              <Button variant="outline" size="sm" onClick={handleDownloadImage} className="flex-1 sm:flex-none">
                <ImageDown className="h-4 w-4 mr-2" />
                PNG
              </Button>
            </div>
          </div>

          {/* Invoice Preview */}
          <div className="invoice-print-wrapper flex justify-center overflow-x-auto bg-gray-50 rounded-lg p-4">
          <div
            className="invoice-preview invoice-print-area bg-white border border-dashed border-gray-300 rounded-lg px-4 py-6 text-sm space-y-4"
            style={{ width: '80mm' }}
            ref={printAreaRef}
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
                {branding?.showBusinessName !== false && (
                  <>
                    <h1 className="text-lg font-semibold text-gray-900">
                      {invoice.tenant?.businessName || 'Business Name'}
                    </h1>
                    <div className="text-xs text-gray-600 space-y-1">
                      {invoice.tenant?.address && <p>{invoice.tenant.address}</p>}
                      {invoice.tenant?.phone && <p>Tel: {invoice.tenant.phone}</p>}
                      {invoice.tenant?.email && <p>Email: {invoice.tenant.email}</p>}
                    </div>
                  </>
                )}
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
              <div className="flex justify-between items-center">
                <span>Payment Status</span>
                <span>{getPaymentStatusBadge(invoice)}</span>
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
                <div className="w-28 h-28 mx-auto bg-gray-100 border border-dashed border-gray-300 rounded flex items-center justify-center text-[10px] text-gray-500">
                  QR CODE
                </div>
                <p className="mt-2 text-[11px] text-gray-600">Scan untuk membayar</p>
              </div>
            )}

            <div className="border-t border-dashed border-gray-300 pt-3 text-xs text-gray-700 space-y-3">
              <p className="font-semibold text-center">Riwayat Pembayaran</p>
              
              {invoice.paymentHistory && invoice.paymentHistory.length > 0 ? (
                <div>
                  {invoice.paymentHistory.map((payment, index) => {
                    const paidDate = payment.paidAt instanceof Date ? payment.paidAt : new Date(payment.paidAt);
                    return (
                    <div key={index} className="space-y-1">
                      <div className="flex justify-between gap-2">
                        <span className="font-medium text-gray-900">{payment.paymentMethod.replace('_', ' ').toUpperCase()}</span>
                        <span className="font-medium">{formatCurrency(payment.paymentAmount)}</span>
                      </div>
                      <div className="flex justify-between text-[11px] text-gray-500">
                        {paidDate && (
                          <span>{paidDate.toLocaleDateString('id-ID')}</span>
                        )}
                        {payment.paymentReference && (
                          <span>Ref: {payment.paymentReference}</span>
                        )}
                      </div>
                      {index !== (invoice.paymentHistory?.length ?? 0) - 1 && (
                        <div className="border-b border-dashed border-gray-200" />
                      )}
                    </div>
                    );
                  })}
                  <div className="flex justify-between font-semibold pt-2 mt-2 border-t border-dashed border-gray-200">
                    <span>Total Dibayar</span>
                    <span>{formatCurrency(invoice.paidAmount || 0)}</span>
                  </div>
                  {invoice.remainingBalance && invoice.remainingBalance > 0 && (
                    <div className="flex justify-between text-orange-600 pt-1">
                      <span>Sisa</span>
                      <span>{formatCurrency(invoice.remainingBalance)}</span>
                    </div>
                  )}
                </div>
              ) : (
                <p>{getPaymentHistoryNotes(invoice)}</p>
              )}
            </div>

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