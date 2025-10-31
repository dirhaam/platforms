import React, { useState, useEffect } from 'react';
import { SalesTransaction } from '@/types/sales';
import { Invoice, InvoiceStatus } from '@/types/invoice';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  Download, Send, AlertCircle, CheckCircle, RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';

interface SalesTransactionPanelProps {
  transaction: SalesTransaction | null;
  tenantId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SalesTransactionPanel({
  transaction,
  tenantId,
  open,
  onOpenChange,
}: SalesTransactionPanelProps) {
  const [activeTab, setActiveTab] = useState('summary');
  const [loading, setLoading] = useState(false);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [paymentHistory, setPaymentHistory] = useState<any[]>([]);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [showInvoicePreview, setShowInvoicePreview] = useState(false);

  if (!transaction) return null;

  useEffect(() => {
    if (open) {
      fetchRelatedData();
    }
  }, [transaction?.id, open]);

  const fetchRelatedData = async () => {
    try {
      setLoading(true);

      // Fetch invoices
      // Note: Invoices from sales transactions are not directly linked back to the transaction
      // They will appear here once generated from this transaction
      const invoicesUrl = new URL('/api/invoices', window.location.origin);
      invoicesUrl.searchParams.set('tenantId', tenantId);
      const invoicesRes = await fetch(invoicesUrl.toString());
      if (invoicesRes.ok) {
        const invoicesData = await invoicesRes.json();
        // For now, just set empty - invoices will be fetched/shown when generated
        setInvoices([]);
      }

      // Use payment data from transaction (sales_transaction_payments already fetched)
      if (transaction.payments && Array.isArray(transaction.payments)) {
        const mappedPayments = transaction.payments.map((p: any) => ({
          id: p.id,
          paymentAmount: p.paymentAmount,
          paymentMethod: p.paymentMethod,
          paymentReference: p.paymentReference,
          notes: p.notes,
          paidAt: p.paidAt,
          createdAt: p.createdAt
        }));
        setPaymentHistory(mappedPayments);
      }
    } catch (error) {
      console.error('Error fetching related data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateInvoice = async () => {
    try {
      setLoading(true);
      const url = new URL(`/api/invoices/from-sales/${transaction.id}`, window.location.origin);
      if (tenantId) {
        url.searchParams.set('tenantId', tenantId);
      }

      const response = await fetch(url.toString(), {
        method: 'POST',
        headers: {
          'x-tenant-id': tenantId,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to generate invoice (${response.status})`);
      }

      toast.success('Invoice generated successfully');
      await fetchRelatedData();
    } catch (error) {
      console.error('Error generating invoice:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to generate invoice');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadInvoicePDF = async (invoiceId: string, invoiceNumber: string) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/invoices/${invoiceId}/pdf`, {
        headers: {
          'x-tenant-id': tenantId
        }
      });

      if (!response.ok) {
        throw new Error('Failed to download invoice');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${invoiceNumber}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading PDF:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to download invoice');
    } finally {
      setLoading(false);
    }
  };

  const handleSendInvoiceWhatsApp = async (invoiceId: string) => {
    try {
      setLoading(true);
      const url = new URL(`/api/invoices/${invoiceId}/whatsapp`, window.location.origin);
      if (tenantId) {
        url.searchParams.set('tenantId', tenantId);
      }

      const response = await fetch(url.toString(), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-id': tenantId,
        },
        body: JSON.stringify({
          customerId: transaction.customerId,
          invoiceId
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to send invoice (${response.status})`);
      }

      toast.success('Invoice sent via WhatsApp');
      await fetchRelatedData();
    } catch (error) {
      console.error('Error sending invoice:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to send invoice');
    } finally {
      setLoading(false);
    }
  };

  const handlePreviewInvoice = async (invoice: Invoice) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/invoices/${invoice.id}`, {
        headers: { 'x-tenant-id': tenantId }
      });
      if (response.ok) {
        const fullInvoice = await response.json();
        setSelectedInvoice(fullInvoice);
        setShowInvoicePreview(true);
      } else {
        toast.error('Failed to load invoice');
      }
    } catch (error) {
      console.error('Error fetching invoice:', error);
      toast.error('Failed to load invoice');
    } finally {
      setLoading(false);
    }
  };

  const isMultiplePayment = transaction.payments && transaction.payments.length > 1;
  const formatCurrency = (value?: number) => `Rp ${(value || 0).toLocaleString('id-ID')}`;
  const formatDate = (date?: Date | string) => {
    if (!date) return '-';
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString('id-ID');
  };

  const STATUS_VARIANTS: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800',
    completed: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800',
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">Transaction Details</DialogTitle>
          <DialogDescription>
            {transaction.transactionNumber} • {formatDate(transaction.transactionDate)}
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="summary">Summary</TabsTrigger>
            <TabsTrigger value="payment">Payment</TabsTrigger>
            <TabsTrigger value="invoice">Invoice</TabsTrigger>
          </TabsList>

          {/* Summary Tab */}
          <TabsContent value="summary" className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold">Transaction Info</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Number:</span>
                    <span className="font-medium">{transaction.transactionNumber}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Date:</span>
                    <span className="font-medium">{formatDate(transaction.transactionDate)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Status:</span>
                    <Badge className={`${STATUS_VARIANTS[transaction.status] || 'bg-gray-100'}`}>
                      {transaction.status.toUpperCase()}
                    </Badge>
                  </div>
                  {transaction.source && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Source:</span>
                      <span className="font-medium">{transaction.source.replace('_', ' ').toUpperCase()}</span>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold">Service Info</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Service:</span>
                    <span className="font-medium">{transaction.serviceName}</span>
                  </div>
                  {transaction.duration && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Duration:</span>
                      <span className="font-medium">{transaction.duration} min</span>
                    </div>
                  )}
                  {transaction.isHomeVisit && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Type:</span>
                      <Badge className="bg-blue-100 text-blue-800">Home Visit</Badge>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {transaction.customer && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold">Customer Info</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {transaction.customer.name && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Name:</span>
                      <span className="font-medium">{transaction.customer.name}</span>
                    </div>
                  )}
                  {transaction.customer.email && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Email:</span>
                      <span className="font-medium text-xs">{transaction.customer.email}</span>
                    </div>
                  )}
                  {transaction.customer.phone && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Phone:</span>
                      <span className="font-medium">{transaction.customer.phone}</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold">Amount Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal:</span>
                  <span className="font-medium">{formatCurrency(transaction.subtotal)}</span>
                </div>
                {transaction.taxRate && transaction.taxRate > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Tax ({transaction.taxRate}%):</span>
                    <span className="font-medium">{formatCurrency(transaction.taxAmount)}</span>
                  </div>
                )}
                {transaction.discountAmount && transaction.discountAmount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Discount:</span>
                    <span className="font-medium">-{formatCurrency(transaction.discountAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm font-semibold border-t pt-2">
                  <span>Total Amount:</span>
                  <span className="text-lg">{formatCurrency(transaction.totalAmount)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Paid Amount:</span>
                  <span className={`font-medium ${transaction.paidAmount === transaction.totalAmount ? 'text-green-600' : 'text-orange-600'}`}>
                    {formatCurrency(transaction.paidAmount)}
                  </span>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Payment Tab */}
          <TabsContent value="payment" className="space-y-4 mt-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold">Payment Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Payment Status:</span>
                  <Badge className={transaction.paymentStatus === 'paid' ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'}>
                    {transaction.paymentStatus?.toUpperCase() || 'PENDING'}
                  </Badge>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Total Amount:</span>
                  <span className="font-medium">{formatCurrency(transaction.totalAmount)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Paid Amount:</span>
                  <span className="font-medium text-green-600">{formatCurrency(transaction.paidAmount)}</span>
                </div>
                {transaction.totalAmount > (transaction.paidAmount || 0) && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Remaining:</span>
                    <span className="font-medium text-orange-600">{formatCurrency((transaction.totalAmount || 0) - (transaction.paidAmount || 0))}</span>
                  </div>
                )}
              </CardContent>
            </Card>

            {isMultiplePayment && transaction.payments ? (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold">Payment Breakdown</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {transaction.payments.map((payment, index) => (
                    <div key={index} className="flex justify-between items-center py-2 px-2 bg-blue-50 rounded border border-blue-200">
                      <div>
                        <div className="font-medium text-sm">{payment.paymentMethod?.toUpperCase() || 'Unknown'}</div>
                        <div className="text-xs text-gray-500">{formatDate(payment.paidAt)}</div>
                        {payment.paymentReference && (
                          <div className="text-xs text-gray-500">Ref: {payment.paymentReference}</div>
                        )}
                      </div>
                      <span className="font-semibold">{formatCurrency(payment.paymentAmount)}</span>
                    </div>
                  ))}
                  <div className="flex justify-between font-bold pt-2 mt-2 border-t border-blue-200">
                    <span>Total Paid:</span>
                    <span>{formatCurrency(transaction.paidAmount)}</span>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold">Payment Info</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Amount Paid:</span>
                    <span className="font-medium">{formatCurrency(transaction.paidAmount)}</span>
                  </div>
                  {transaction.paymentMethod && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Method:</span>
                      <span className="font-medium">{transaction.paymentMethod.toUpperCase()}</span>
                    </div>
                  )}
                  {transaction.paymentReference && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Reference:</span>
                      <span className="font-medium text-xs">{transaction.paymentReference}</span>
                    </div>
                  )}
                  {transaction.paidAt && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Paid Date:</span>
                      <span className="font-medium">{formatDate(transaction.paidAt)}</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Invoice Tab */}
          <TabsContent value="invoice" className="space-y-4 mt-4">
            {invoices.length > 0 ? (
              <div className="space-y-3">
                {invoices.map((invoice) => (
                  <Card key={invoice.id}>
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="font-semibold">{invoice.invoiceNumber}</div>
                          <div className="text-xs text-gray-500 mt-1">
                            {invoice.status && (
                              <Badge className={invoice.status === InvoiceStatus.PAID ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}>
                                {invoice.status.toUpperCase()}
                              </Badge>
                            )}
                            <span className="ml-2">{formatCurrency(invoice.totalAmount)}</span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handlePreviewInvoice(invoice)}
                            disabled={loading}
                          >
                            <CheckCircle className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDownloadInvoicePDF(invoice.id, invoice.invoiceNumber)}
                            disabled={loading}
                          >
                            <Download className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleSendInvoiceWhatsApp(invoice.id)}
                            disabled={loading}
                          >
                            <Send className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="pt-6 text-center">
                  <AlertCircle className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">No invoices yet</p>
                </CardContent>
              </Card>
            )}

            {invoices.length === 0 && (
              <Button
                onClick={handleGenerateInvoice}
                disabled={loading}
                className="w-full"
              >
                {loading ? 'Generating...' : 'Generate Invoice'}
              </Button>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>

      {/* Invoice Preview Dialog */}
      {showInvoicePreview && selectedInvoice && (
        <Dialog open={showInvoicePreview} onOpenChange={setShowInvoicePreview}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Invoice Preview</DialogTitle>
            </DialogHeader>
            {/* Invoice preview content would go here */}
            <div className="text-sm text-gray-600">
              Invoice: {selectedInvoice.invoiceNumber}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </Dialog>
  );
}
