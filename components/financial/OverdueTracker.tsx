'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Invoice } from '@/types/invoice';
import { AlertTriangle, Clock, Phone, Mail, Eye } from 'lucide-react';

interface OverdueInvoice extends Invoice {
  daysPastDue: number;
}

interface OverdueTrackerProps {
  tenantId: string;
}

export function OverdueTracker({ tenantId }: OverdueTrackerProps) {
  const [overdueInvoices, setOverdueInvoices] = useState<OverdueInvoice[]>([]);
  const [upcomingDue, setUpcomingDue] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOverdueData();
  }, []);

  const fetchOverdueData = async () => {
    try {
      setLoading(true);
      
      const [overdueRes, upcomingRes] = await Promise.all([
        fetch('/api/financial/overdue'),
        fetch('/api/invoices?status=sent&dueWithin=7')
      ]);

      if (overdueRes.ok) {
        const overdueData = await overdueRes.json();
        setOverdueInvoices(overdueData);
      }

      if (upcomingRes.ok) {
        const upcomingData = await upcomingRes.json();
        setUpcomingDue(upcomingData.invoices || []);
      }
    } catch (error) {
      console.error('Error fetching overdue data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleContactCustomer = (invoice: Invoice, method: 'phone' | 'email') => {
    if (method === 'phone' && invoice.customer?.phone) {
      window.open(`tel:${invoice.customer.phone}`);
    } else if (method === 'email' && invoice.customer?.email) {
      const subject = `Payment Reminder - Invoice ${invoice.invoiceNumber}`;
      const body = `Dear ${invoice.customer.name},\n\nThis is a friendly reminder that your invoice ${invoice.invoiceNumber} is now overdue. Please arrange payment at your earliest convenience.\n\nThank you for your business.`;
      window.open(`mailto:${invoice.customer.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`);
    }
  };

  const handleViewInvoice = (invoice: Invoice) => {
    window.open(`/api/invoices/${invoice.id}/pdf`, '_blank');
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const getUrgencyBadge = (daysPastDue: number) => {
    if (daysPastDue > 30) {
      return <Badge variant="destructive">Critical ({daysPastDue} days)</Badge>;
    } else if (daysPastDue > 14) {
      return <Badge variant="destructive">High ({daysPastDue} days)</Badge>;
    } else if (daysPastDue > 7) {
      return <Badge variant="secondary">Medium ({daysPastDue} days)</Badge>;
    } else {
      return <Badge variant="outline">Low ({daysPastDue} days)</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const totalOverdueAmount = overdueInvoices.reduce(
    (sum, invoice) => sum + invoice.totalAmount,
    0
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Payment Tracking</h2>
        <Button onClick={fetchOverdueData} variant="outline">
          Refresh
        </Button>
      </div>

      {/* Summary Alert */}
      {overdueInvoices.length > 0 && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            You have {overdueInvoices.length} overdue invoices totaling {formatCurrency(totalOverdueAmount)}. 
            Consider following up with customers to improve cash flow.
          </AlertDescription>
        </Alert>
      )}

      {/* Overdue Invoices */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            Overdue Invoices ({overdueInvoices.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {overdueInvoices.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No overdue invoices. Great job!
            </div>
          ) : (
            <div className="space-y-4">
              {overdueInvoices.map((invoice) => (
                <div
                  key={invoice.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-4">
                      <div>
                        <p className="font-medium">{invoice.invoiceNumber}</p>
                        <p className="text-sm text-muted-foreground">
                          {invoice.customer?.name}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm">
                          Due: {invoice.dueDate.toLocaleDateString()}
                        </p>
                        <p className="text-sm font-medium">
                          {formatCurrency(invoice.totalAmount)}
                        </p>
                      </div>
                      <div>
                        {getUrgencyBadge(invoice.daysPastDue)}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleViewInvoice(invoice)}
                      title="View Invoice"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    
                    {invoice.customer?.phone && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleContactCustomer(invoice, 'phone')}
                        title="Call Customer"
                      >
                        <Phone className="h-4 w-4" />
                      </Button>
                    )}
                    
                    {invoice.customer?.email && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleContactCustomer(invoice, 'email')}
                        title="Email Customer"
                      >
                        <Mail className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Upcoming Due Invoices */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-yellow-600" />
            Due Soon (Next 7 Days) ({upcomingDue.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {upcomingDue.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No invoices due in the next 7 days.
            </div>
          ) : (
            <div className="space-y-4">
              {upcomingDue.map((invoice) => {
                const daysUntilDue = Math.ceil(
                  (invoice.dueDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
                );
                
                return (
                  <div
                    key={invoice.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-4">
                        <div>
                          <p className="font-medium">{invoice.invoiceNumber}</p>
                          <p className="text-sm text-muted-foreground">
                            {invoice.customer?.name}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm">
                            Due: {invoice.dueDate.toLocaleDateString()}
                          </p>
                        <p className="text-sm font-medium">
                          {formatCurrency(invoice.totalAmount)}
                        </p>
                        </div>
                        <div>
                          <Badge variant={daysUntilDue <= 2 ? "destructive" : "secondary"}>
                            {daysUntilDue === 0 ? 'Due Today' : 
                             daysUntilDue === 1 ? 'Due Tomorrow' : 
                             `Due in ${daysUntilDue} days`}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleViewInvoice(invoice)}
                        title="View Invoice"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      
                      {invoice.customer?.phone && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleContactCustomer(invoice, 'phone')}
                          title="Call Customer"
                        >
                          <Phone className="h-4 w-4" />
                        </Button>
                      )}
                      
                      {invoice.customer?.email && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleContactCustomer(invoice, 'email')}
                          title="Email Customer"
                        >
                          <Mail className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}