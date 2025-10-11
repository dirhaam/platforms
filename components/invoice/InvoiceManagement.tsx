'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Invoice, InvoiceStatus, InvoiceFilters } from '@/types/invoice';
import { InvoiceDialog } from '@/components/invoice/InvoiceDialog';
import { InvoicePreview } from '@/components/invoice/InvoicePreview';
import { Plus, Search, Filter, Download, Eye, Edit, Trash2 } from 'lucide-react';

interface InvoiceManagementProps {
  tenantId: string;
}

export function InvoiceManagement({ tenantId }: InvoiceManagementProps) {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showPreviewDialog, setShowPreviewDialog] = useState(false);
  const [filters, setFilters] = useState<InvoiceFilters>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchInvoices();
  }, [filters, currentPage]);

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      
      if (filters.status?.length) {
        params.append('status', filters.status.join(','));
      }
      if (filters.customerId) {
        params.append('customerId', filters.customerId);
      }
      if (filters.dateFrom) {
        params.append('dateFrom', filters.dateFrom);
      }
      if (filters.dateTo) {
        params.append('dateTo', filters.dateTo);
      }
      if (filters.amountMin !== undefined) {
        params.append('amountMin', filters.amountMin.toString());
      }
      if (filters.amountMax !== undefined) {
        params.append('amountMax', filters.amountMax.toString());
      }
      
      params.append('page', currentPage.toString());
      params.append('limit', '20');

      const response = await fetch(`/api/invoices?${params}`);
      if (response.ok) {
        const data = await response.json();
        setInvoices(data.invoices);
        setTotalPages(data.totalPages);
      }
    } catch (error) {
      console.error('Error fetching invoices:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateInvoice = () => {
    setSelectedInvoice(null);
    setShowCreateDialog(true);
  };

  const handleEditInvoice = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setShowCreateDialog(true);
  };

  const handlePreviewInvoice = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setShowPreviewDialog(true);
  };

  const handleDownloadPDF = async (invoice: Invoice) => {
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

  const handleDeleteInvoice = async (invoice: Invoice) => {
    if (!confirm('Are you sure you want to delete this invoice?')) {
      return;
    }

    try {
      const response = await fetch(`/api/invoices/${invoice.id}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        fetchInvoices();
      }
    } catch (error) {
      console.error('Error deleting invoice:', error);
    }
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

  const filteredInvoices = invoices.filter(invoice =>
    invoice.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    invoice.customer?.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Invoice Management</h2>
        <Button onClick={handleCreateInvoice}>
          <Plus className="h-4 w-4 mr-2" />
          Create Invoice
        </Button>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search invoices..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Select
              value={filters.status?.[0] || ''}
              onValueChange={(value) => 
                setFilters(prev => ({ 
                  ...prev, 
                  status: value ? [value as InvoiceStatus] : undefined 
                }))
              }
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Statuses</SelectItem>
                <SelectItem value={InvoiceStatus.DRAFT}>Draft</SelectItem>
                <SelectItem value={InvoiceStatus.SENT}>Sent</SelectItem>
                <SelectItem value={InvoiceStatus.PAID}>Paid</SelectItem>
                <SelectItem value={InvoiceStatus.OVERDUE}>Overdue</SelectItem>
                <SelectItem value={InvoiceStatus.CANCELLED}>Cancelled</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex gap-2">
              <Input
                type="date"
                placeholder="From date"
                value={filters.dateFrom || ''}
                onChange={(e) => setFilters(prev => ({ ...prev, dateFrom: e.target.value }))}
                className="w-[150px]"
              />
              <Input
                type="date"
                placeholder="To date"
                value={filters.dateTo || ''}
                onChange={(e) => setFilters(prev => ({ ...prev, dateTo: e.target.value }))}
                className="w-[150px]"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Invoices Table */}
      <Card>
        <CardHeader>
          <CardTitle>Invoices</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading invoices...</div>
          ) : filteredInvoices.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No invoices found
            </div>
          ) : (
            <div className="space-y-4">
              {filteredInvoices.map((invoice) => (
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
                          Rp {invoice.totalAmount.toFixed(2)}
                        </p>
                      </div>
                      <div>
                        {getStatusBadge(invoice.status)}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handlePreviewInvoice(invoice)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDownloadPDF(invoice)}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEditInvoice(invoice)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteInvoice(invoice)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-6">
              <Button
                variant="outline"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(prev => prev - 1)}
              >
                Previous
              </Button>
              <span className="flex items-center px-4">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant="outline"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(prev => prev + 1)}
              >
                Next
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Invoice Dialog */}
      <InvoiceDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        invoice={selectedInvoice}
        onSuccess={() => {
          fetchInvoices();
          setShowCreateDialog(false);
        }}
      />

      {/* Preview Dialog */}
      {selectedInvoice && (
        <InvoicePreview
          open={showPreviewDialog}
          onOpenChange={setShowPreviewDialog}
          invoice={selectedInvoice}
        />
      )}
    </div>
  );
}