'use client';

import React, { useState } from 'react';
import { SalesTransaction, SalesPaymentMethod } from '@/types/sales';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertCircle, Printer, Calendar, MapPin } from 'lucide-react';

interface SalesTransactionPanelProps {
  transaction: SalesTransaction | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onGenerateInvoice?: (transaction: SalesTransaction) => Promise<void>;
  isGeneratingInvoice?: boolean;
}

export function SalesTransactionPanel({
  transaction,
  open,
  onOpenChange,
  onGenerateInvoice,
  isGeneratingInvoice,
}: SalesTransactionPanelProps) {
  const [activeTab, setActiveTab] = useState('summary');
  const [localGenerating, setLocalGenerating] = useState(false);

  if (!transaction) return null;

  const handleGenerateInvoice = async () => {
    if (!onGenerateInvoice || !transaction) return;
    
    try {
      setLocalGenerating(true);
      await onGenerateInvoice(transaction);
    } catch (error) {
      console.error('Error generating invoice:', error);
    } finally {
      setLocalGenerating(false);
    }
  };

  const isLoading = localGenerating || isGeneratingInvoice;

  const formatCurrency = (value?: number) => `Rp ${(value || 0).toLocaleString('id-ID')}`;
  const formatDate = (date?: Date | string) => {
    if (!date) return '-';
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString('id-ID');
  };

  const isMultiplePayment = transaction.payments && transaction.payments.length > 1;

  const STATUS_VARIANTS: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800',
    completed: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800',
    refunded: 'bg-gray-100 text-gray-800',
  };

  const paymentStatusColor = transaction.paymentStatus === 'paid'
    ? 'bg-green-100 text-green-800'
    : 'bg-orange-100 text-orange-800';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0 sm:rounded-lg">
        <DialogHeader className="sticky top-0 bg-white z-10 border-b px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-2xl">Sales Transaction</DialogTitle>
              <DialogDescription>
                {transaction.transactionNumber} • {formatDate(transaction.transactionDate)}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="px-6 py-4 space-y-6">
          {/* Header Card */}
          <Card className="border-2">
            <CardContent className="pt-6">
              <div className="space-y-4">
                {/* Title Row */}
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-2xl font-bold">{transaction.transactionNumber}</h2>
                    <p className="text-sm text-gray-600 mt-1">
                      {transaction.customer?.name} • {transaction.serviceName}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Badge className={STATUS_VARIANTS[transaction.status] || 'bg-gray-100'}>
                      {transaction.status.toUpperCase()}
                    </Badge>
                    <Badge className={paymentStatusColor}>
                      {transaction.paymentStatus?.toUpperCase() || 'PENDING'}
                    </Badge>
                  </div>
                </div>

                {/* Transaction Details Row */}
                <div className="flex items-center gap-6 text-sm text-gray-600 flex-wrap">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    {formatDate(transaction.transactionDate)}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Rp {formatCurrency(transaction.totalAmount)}</span>
                  </div>
                  {transaction.isHomeVisit && (
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      <span>Home Visit</span>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tabs Card */}
          <Card>
            <CardContent className="pt-6">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="summary">Summary</TabsTrigger>
                  <TabsTrigger value="payment">Payment</TabsTrigger>
                  <TabsTrigger value="invoice">Invoice</TabsTrigger>
                </TabsList>

                {/* Summary Tab */}
                <TabsContent value="summary" className="space-y-4 mt-4">
                  <div className="grid grid-cols-2 gap-4">
                    {/* Transaction Info */}
                    <div>
                      <Label className="text-gray-600 text-xs font-semibold uppercase">Status</Label>
                      <Badge className={`mt-2 ${STATUS_VARIANTS[transaction.status] || 'bg-gray-100'}`}>
                        {transaction.status.toUpperCase()}
                      </Badge>
                    </div>
                    <div>
                      <Label className="text-gray-600 text-xs font-semibold uppercase">Source</Label>
                      <p className="mt-2 font-medium">{transaction.source?.replace('_', ' ').toUpperCase()}</p>
                    </div>
                  </div>

                  {/* Service Info */}
                  <div className="space-y-2">
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

                  {/* Customer Info */}
                  {transaction.customer && (
                    <div className="space-y-2">
                      <h3 className="font-semibold text-sm">Customer Information</h3>
                      <div className="space-y-2 text-sm">
                        {transaction.customer.name && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">Name:</span>
                            <span className="font-medium">{transaction.customer.name}</span>
                          </div>
                        )}
                        {transaction.customer.email && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">Email:</span>
                            <span className="font-medium text-xs">{transaction.customer.email}</span>
                          </div>
                        )}
                        {transaction.customer.phone && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">Phone:</span>
                            <span className="font-medium">{transaction.customer.phone}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Amount Breakdown */}
                  <div className="space-y-2">
                    <h3 className="font-semibold text-sm">Amount Breakdown</h3>
                    <div className="bg-gray-50 rounded-lg p-3 space-y-2 text-sm">
                      {transaction.subtotal !== undefined && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Subtotal:</span>
                          <span>{formatCurrency(transaction.subtotal)}</span>
                        </div>
                      )}
                      {transaction.taxRate && transaction.taxRate > 0 && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Tax ({transaction.taxRate}%):</span>
                          <span>{formatCurrency(transaction.taxAmount)}</span>
                        </div>
                      )}
                      {transaction.discountAmount && transaction.discountAmount > 0 && (
                        <div className="flex justify-between text-orange-600">
                          <span>Discount:</span>
                          <span>-{formatCurrency(transaction.discountAmount)}</span>
                        </div>
                      )}
                      <div className="border-t pt-2 flex justify-between font-bold">
                        <span>Total:</span>
                        <span>{formatCurrency(transaction.totalAmount)}</span>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                {/* Payment Tab */}
                <TabsContent value="payment" className="space-y-4 mt-4">
                  {/* Payment Status */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-gray-600 text-xs font-semibold uppercase">Status</Label>
                      <Badge className={`mt-2 ${paymentStatusColor}`}>
                        {transaction.paymentStatus?.toUpperCase() || 'PENDING'}
                      </Badge>
                    </div>
                    <div>
                      <Label className="text-gray-600 text-xs font-semibold uppercase">Total Amount</Label>
                      <p className="mt-2 font-medium">{formatCurrency(transaction.totalAmount)}</p>
                    </div>
                  </div>

                  {/* Payment Progress */}
                  {transaction.paidAmount !== undefined && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Paid Amount:</span>
                        <span className="font-medium text-green-600">{formatCurrency(transaction.paidAmount)}</span>
                      </div>
                      {transaction.totalAmount > (transaction.paidAmount || 0) && (
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Remaining:</span>
                          <span className="font-medium text-orange-600">
                            {formatCurrency((transaction.totalAmount || 0) - (transaction.paidAmount || 0))}
                          </span>
                        </div>
                      )}
                      {/* Progress Bar */}
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-green-500 h-2 rounded-full transition-all"
                          style={{ width: `${((transaction.paidAmount || 0) / transaction.totalAmount) * 100}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Payment Breakdown */}
                  {isMultiplePayment && transaction.payments ? (
                    <div className="space-y-2">
                      <h3 className="font-semibold text-sm">Payment Breakdown</h3>
                      <div className="bg-blue-50 rounded-lg p-3 space-y-2">
                        {transaction.payments.map((payment, index) => {
                          const methodLabels: Record<string, string> = {
                            'cash': '💵 Cash',
                            'card': '💳 Card',
                            'transfer': '🏦 Transfer',
                            'qris': '📱 QRIS'
                          };
                          const methodLabel = methodLabels[payment.paymentMethod] || payment.paymentMethod;
                          
                          return (
                            <div key={index} className="flex justify-between items-center py-2 px-2 bg-white rounded border border-blue-200 text-sm">
                              <div>
                                <div className="font-medium">{methodLabel}</div>
                                {payment.paymentReference && (
                                  <div className="text-xs text-gray-500">Ref: {payment.paymentReference}</div>
                                )}
                              </div>
                              <span className="font-semibold">{formatCurrency(payment.paymentAmount)}</span>
                            </div>
                          );
                        })}
                        <div className="flex justify-between font-bold pt-2 mt-2 border-t border-blue-200 text-sm">
                          <span>Total Paid:</span>
                          <span>{formatCurrency(transaction.paidAmount)}</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <h3 className="font-semibold text-sm">Payment Method</h3>
                      {transaction.paymentMethod && (
                        <div className="bg-gray-50 rounded-lg p-3 space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Method:</span>
                            <span className="font-medium">{transaction.paymentMethod.toUpperCase()}</span>
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
                  )}
                </TabsContent>

                {/* Invoice Tab */}
                <TabsContent value="invoice" className="space-y-4 mt-4">
                  <Card>
                    <CardContent className="pt-6 text-center">
                      <AlertCircle className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-600">Invoices will appear here after generation</p>
                    </CardContent>
                  </Card>

                  {onGenerateInvoice && (
                    <Button
                      onClick={handleGenerateInvoice}
                      disabled={isLoading}
                      className="w-full gap-2"
                    >
                      <Printer className="w-4 h-4" />
                      {isLoading ? 'Generating...' : 'Generate Invoice'}
                    </Button>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}
