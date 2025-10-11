import { prisma } from '@/lib/database';
import { InvoiceStatus, InvoiceExportOptions } from '@/types/invoice';
import { Decimal } from '@prisma/client/runtime/library';
import * as XLSX from 'xlsx';
import { InvoicePDFGenerator } from './pdf-generator';

export interface FinancialMetrics {
  totalRevenue: Decimal;
  paidRevenue: Decimal;
  pendingRevenue: Decimal;
  overdueRevenue: Decimal;
  averageInvoiceValue: Decimal;
  totalInvoices: number;
  paidInvoices: number;
  pendingInvoices: number;
  overdueInvoices: number;
  paymentRate: number; // percentage
  averagePaymentTime: number; // days
}

export interface MonthlyRevenue {
  month: string;
  year: number;
  totalRevenue: Decimal;
  paidRevenue: Decimal;
  invoiceCount: number;
  paidCount: number;
}

export interface CustomerFinancials {
  customerId: string;
  customerName: string;
  totalInvoices: number;
  totalAmount: Decimal;
  paidAmount: Decimal;
  pendingAmount: Decimal;
  overdueAmount: Decimal;
  lastInvoiceDate: Date;
  averagePaymentTime: number;
}

export interface PaymentStatusReport {
  status: InvoiceStatus;
  count: number;
  totalAmount: Decimal;
  percentage: number;
}

export class FinancialService {
  /**
   * Get comprehensive financial metrics for a tenant
   */
  static async getFinancialMetrics(tenantId: string, dateFrom?: Date, dateTo?: Date): Promise<FinancialMetrics> {
    const whereClause: any = { tenantId };
    
    if (dateFrom || dateTo) {
      whereClause.issueDate = {};
      if (dateFrom) whereClause.issueDate.gte = dateFrom;
      if (dateTo) whereClause.issueDate.lte = dateTo;
    }

    const invoices = await prisma.invoice.findMany({
      where: whereClause,
      select: {
        status: true,
        totalAmount: true,
        issueDate: true,
        paidDate: true
      }
    });

    let totalRevenue = new Decimal(0);
    let paidRevenue = new Decimal(0);
    let pendingRevenue = new Decimal(0);
    let overdueRevenue = new Decimal(0);
    let paidInvoices = 0;
    let pendingInvoices = 0;
    let overdueInvoices = 0;
    let totalPaymentDays = 0;
    let paidInvoicesWithDates = 0;

    invoices.forEach(invoice => {
      totalRevenue = totalRevenue.add(invoice.totalAmount);
      
      switch (invoice.status) {
        case InvoiceStatus.PAID:
          paidRevenue = paidRevenue.add(invoice.totalAmount);
          paidInvoices++;
          
          // Calculate payment time
          if (invoice.paidDate) {
            const paymentTime = Math.ceil(
              (invoice.paidDate.getTime() - invoice.issueDate.getTime()) / (1000 * 60 * 60 * 24)
            );
            totalPaymentDays += paymentTime;
            paidInvoicesWithDates++;
          }
          break;
        case InvoiceStatus.OVERDUE:
          overdueRevenue = overdueRevenue.add(invoice.totalAmount);
          overdueInvoices++;
          break;
        case InvoiceStatus.SENT:
        case InvoiceStatus.DRAFT:
          pendingRevenue = pendingRevenue.add(invoice.totalAmount);
          pendingInvoices++;
          break;
      }
    });

    const averageInvoiceValue = invoices.length > 0 
      ? totalRevenue.div(invoices.length) 
      : new Decimal(0);
    
    const paymentRate = invoices.length > 0 
      ? (paidInvoices / invoices.length) * 100 
      : 0;
    
    const averagePaymentTime = paidInvoicesWithDates > 0 
      ? totalPaymentDays / paidInvoicesWithDates 
      : 0;

    return {
      totalRevenue,
      paidRevenue,
      pendingRevenue,
      overdueRevenue,
      averageInvoiceValue,
      totalInvoices: invoices.length,
      paidInvoices,
      pendingInvoices,
      overdueInvoices,
      paymentRate,
      averagePaymentTime
    };
  }

  /**
   * Get monthly revenue breakdown
   */
  static async getMonthlyRevenue(tenantId: string, months: number = 12): Promise<MonthlyRevenue[]> {
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months);
    startDate.setDate(1);

    const invoices = await prisma.invoice.findMany({
      where: {
        tenantId,
        issueDate: {
          gte: startDate
        }
      },
      select: {
        status: true,
        totalAmount: true,
        issueDate: true
      }
    });

    const monthlyData: { [key: string]: MonthlyRevenue } = {};

    // Initialize months
    for (let i = 0; i < months; i++) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      monthlyData[key] = {
        month: date.toLocaleString('default', { month: 'long' }),
        year: date.getFullYear(),
        totalRevenue: new Decimal(0),
        paidRevenue: new Decimal(0),
        invoiceCount: 0,
        paidCount: 0
      };
    }

    // Populate with actual data
    invoices.forEach(invoice => {
      const key = `${invoice.issueDate.getFullYear()}-${String(invoice.issueDate.getMonth() + 1).padStart(2, '0')}`;
      
      if (monthlyData[key]) {
        monthlyData[key].totalRevenue = monthlyData[key].totalRevenue.add(invoice.totalAmount);
        monthlyData[key].invoiceCount++;
        
        if (invoice.status === InvoiceStatus.PAID) {
          monthlyData[key].paidRevenue = monthlyData[key].paidRevenue.add(invoice.totalAmount);
          monthlyData[key].paidCount++;
        }
      }
    });

    return Object.values(monthlyData).reverse();
  }

  /**
   * Get customer financial breakdown
   */
  static async getCustomerFinancials(tenantId: string): Promise<CustomerFinancials[]> {
    const customers = await prisma.customer.findMany({
      where: { tenantId },
      include: {
        invoices: {
          select: {
            status: true,
            totalAmount: true,
            issueDate: true,
            paidDate: true
          }
        }
      }
    });

    return customers.map(customer => {
      let totalAmount = new Decimal(0);
      let paidAmount = new Decimal(0);
      let pendingAmount = new Decimal(0);
      let overdueAmount = new Decimal(0);
      let totalPaymentDays = 0;
      let paidInvoicesWithDates = 0;
      let lastInvoiceDate = new Date(0);

      customer.invoices.forEach(invoice => {
        totalAmount = totalAmount.add(invoice.totalAmount);
        
        if (invoice.issueDate > lastInvoiceDate) {
          lastInvoiceDate = invoice.issueDate;
        }

        switch (invoice.status) {
          case InvoiceStatus.PAID:
            paidAmount = paidAmount.add(invoice.totalAmount);
            if (invoice.paidDate) {
              const paymentTime = Math.ceil(
                (invoice.paidDate.getTime() - invoice.issueDate.getTime()) / (1000 * 60 * 60 * 24)
              );
              totalPaymentDays += paymentTime;
              paidInvoicesWithDates++;
            }
            break;
          case InvoiceStatus.OVERDUE:
            overdueAmount = overdueAmount.add(invoice.totalAmount);
            break;
          case InvoiceStatus.SENT:
          case InvoiceStatus.DRAFT:
            pendingAmount = pendingAmount.add(invoice.totalAmount);
            break;
        }
      });

      const averagePaymentTime = paidInvoicesWithDates > 0 
        ? totalPaymentDays / paidInvoicesWithDates 
        : 0;

      return {
        customerId: customer.id,
        customerName: customer.name,
        totalInvoices: customer.invoices.length,
        totalAmount,
        paidAmount,
        pendingAmount,
        overdueAmount,
        lastInvoiceDate,
        averagePaymentTime
      };
    }).filter(customer => customer.totalInvoices > 0);
  }

  /**
   * Get payment status report
   */
  static async getPaymentStatusReport(tenantId: string): Promise<PaymentStatusReport[]> {
    const invoices = await prisma.invoice.findMany({
      where: { tenantId },
      select: {
        status: true,
        totalAmount: true
      }
    });

    const statusMap: { [key: string]: { count: number; totalAmount: Decimal } } = {};
    let grandTotal = new Decimal(0);

    invoices.forEach(invoice => {
      if (!statusMap[invoice.status]) {
        statusMap[invoice.status] = { count: 0, totalAmount: new Decimal(0) };
      }
      
      statusMap[invoice.status].count++;
      statusMap[invoice.status].totalAmount = statusMap[invoice.status].totalAmount.add(invoice.totalAmount);
      grandTotal = grandTotal.add(invoice.totalAmount);
    });

    return Object.entries(statusMap).map(([status, data]) => ({
      status: status as InvoiceStatus,
      count: data.count,
      totalAmount: data.totalAmount,
      percentage: grandTotal.toNumber() > 0 
        ? (data.totalAmount.toNumber() / grandTotal.toNumber()) * 100 
        : 0
    }));
  }

  /**
   * Export financial data to Excel
   */
  static async exportToExcel(tenantId: string, options: InvoiceExportOptions): Promise<Uint8Array> {
    const workbook = XLSX.utils.book_new();

    // Get invoices based on filters
    const whereClause: any = { tenantId };
    
    if (options.filters?.status?.length) {
      whereClause.status = { in: options.filters.status };
    }
    
    if (options.filters?.customerId) {
      whereClause.customerId = options.filters.customerId;
    }
    
    if (options.dateRange) {
      whereClause.issueDate = {
        gte: new Date(options.dateRange.from),
        lte: new Date(options.dateRange.to)
      };
    }

    const invoices = await prisma.invoice.findMany({
      where: whereClause,
      include: {
        customer: true,
        items: options.includeItems ? {
          include: {
            service: true
          }
        } : false
      },
      orderBy: { issueDate: 'desc' }
    });

    // Invoice summary sheet
    const summaryData = invoices.map(invoice => ({
      'Invoice Number': invoice.invoiceNumber,
      'Customer': invoice.customer?.name || '',
      'Issue Date': invoice.issueDate.toLocaleDateString(),
      'Due Date': invoice.dueDate.toLocaleDateString(),
      'Status': invoice.status.toUpperCase(),
      'Subtotal': invoice.subtotal.toNumber(),
      'Tax': invoice.taxAmount.toNumber(),
      'Discount': invoice.discountAmount.toNumber(),
      'Total Amount': invoice.totalAmount.toNumber(),
      'Payment Method': invoice.paymentMethod || '',
      'Paid Date': invoice.paidDate?.toLocaleDateString() || ''
    }));

    const summarySheet = XLSX.utils.json_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(workbook, summarySheet, 'Invoice Summary');

    // Invoice items sheet (if requested)
    if (options.includeItems && invoices.some(inv => inv.items)) {
      const itemsData: any[] = [];
      
      invoices.forEach(invoice => {
        if (invoice.items) {
          invoice.items.forEach((item: any) => {
            itemsData.push({
              'Invoice Number': invoice.invoiceNumber,
              'Customer': invoice.customer?.name || '',
              'Item Description': item.description,
              'Service': item.service?.name || '',
              'Quantity': item.quantity,
              'Unit Price': item.unitPrice.toNumber(),
              'Total Price': item.totalPrice.toNumber()
            });
          });
        }
      });

      if (itemsData.length > 0) {
        const itemsSheet = XLSX.utils.json_to_sheet(itemsData);
        XLSX.utils.book_append_sheet(workbook, itemsSheet, 'Invoice Items');
      }
    }

    // Financial metrics sheet
    const metrics = await this.getFinancialMetrics(
      tenantId,
      options.dateRange ? new Date(options.dateRange.from) : undefined,
      options.dateRange ? new Date(options.dateRange.to) : undefined
    );

    const metricsData = [
      { 'Metric': 'Total Revenue', 'Value': metrics.totalRevenue.toNumber() },
      { 'Metric': 'Paid Revenue', 'Value': metrics.paidRevenue.toNumber() },
      { 'Metric': 'Pending Revenue', 'Value': metrics.pendingRevenue.toNumber() },
      { 'Metric': 'Overdue Revenue', 'Value': metrics.overdueRevenue.toNumber() },
      { 'Metric': 'Total Invoices', 'Value': metrics.totalInvoices },
      { 'Metric': 'Paid Invoices', 'Value': metrics.paidInvoices },
      { 'Metric': 'Pending Invoices', 'Value': metrics.pendingInvoices },
      { 'Metric': 'Overdue Invoices', 'Value': metrics.overdueInvoices },
      { 'Metric': 'Payment Rate (%)', 'Value': metrics.paymentRate },
      { 'Metric': 'Average Payment Time (days)', 'Value': metrics.averagePaymentTime },
      { 'Metric': 'Average Invoice Value', 'Value': metrics.averageInvoiceValue.toNumber() }
    ];

    const metricsSheet = XLSX.utils.json_to_sheet(metricsData);
    XLSX.utils.book_append_sheet(workbook, metricsSheet, 'Financial Metrics');

    const arrayBuffer = XLSX.write(workbook, { type: 'array', bookType: 'xlsx' }) as ArrayBuffer;
    return new Uint8Array(arrayBuffer);
  }

  /**
   * Export financial data to PDF report
   */
  static async exportToPDF(tenantId: string, options: InvoiceExportOptions): Promise<Uint8Array> {
    // Get financial metrics
    const metrics = await this.getFinancialMetrics(
      tenantId,
      options.dateRange ? new Date(options.dateRange.from) : undefined,
      options.dateRange ? new Date(options.dateRange.to) : undefined
    );

    // Get monthly revenue
    const monthlyRevenue = await this.getMonthlyRevenue(tenantId, 12);

    // Get customer financials
    const customerFinancials = await this.getCustomerFinancials(tenantId);

    // Get payment status report
    const paymentStatus = await this.getPaymentStatusReport(tenantId);

    // Get tenant info
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId }
    });

    // Create a comprehensive financial report (simplified version)
    // In a real implementation, you would create a proper PDF report
    // For now, we'll return a simple buffer
    const reportData = {
      tenant: tenant?.businessName || 'Business',
      dateRange: options.dateRange,
      metrics,
      monthlyRevenue,
      customerFinancials: customerFinancials.slice(0, 10), // Top 10 customers
      paymentStatus
    };

    const jsonString = JSON.stringify(reportData, null, 2);
    return new TextEncoder().encode(jsonString);
  }

  /**
   * Get overdue invoices for follow-up
   */
  static async getOverdueInvoices(tenantId: string) {
    const overdueInvoices = await prisma.invoice.findMany({
      where: {
        tenantId,
        status: InvoiceStatus.OVERDUE
      },
      include: {
        customer: true
      },
      orderBy: {
        dueDate: 'asc'
      }
    });

    return overdueInvoices.map(invoice => ({
      ...invoice,
      daysPastDue: Math.ceil(
        (new Date().getTime() - invoice.dueDate.getTime()) / (1000 * 60 * 60 * 24)
      )
    }));
  }

  /**
   * Get upcoming due invoices
   */
  static async getUpcomingDueInvoices(tenantId: string, days: number = 7) {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);

    return await prisma.invoice.findMany({
      where: {
        tenantId,
        status: InvoiceStatus.SENT,
        dueDate: {
          gte: new Date(),
          lte: futureDate
        }
      },
      include: {
        customer: true
      },
      orderBy: {
        dueDate: 'asc'
      }
    });
  }
}