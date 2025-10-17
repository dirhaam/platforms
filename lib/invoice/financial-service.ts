import { createClient } from '@supabase/supabase-js';
import { InvoiceStatus, InvoiceExportOptions, PaymentMethod } from '@/types/invoice';
import Decimal from 'decimal.js';
import * as XLSX from 'xlsx';

const getSupabaseClient = () => {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
};

interface InvoiceRecord {
  id: string;
  tenantId: string;
  customerId: string;
  bookingId?: string;
  invoiceNumber: string;
  status: string;
  issueDate: string;
  dueDate: string;
  paidDate?: string;
  subtotal: number | string;
  taxRate: number | string;
  taxAmount: number | string;
  discountAmount: number | string;
  totalAmount: number | string;
  paymentMethod?: string;
  paymentReference?: string;
  notes?: string;
  terms?: string;
  qrCodeData?: string;
  qrCodeUrl?: string;
  createdAt: string;
  updatedAt: string;
}

interface InvoiceItemRecord {
  id: string;
  invoiceId: string;
  description: string;
  quantity: number;
  unitPrice: number | string;
  totalPrice: number | string;
  serviceId?: string;
}

interface CustomerRecord {
  id: string;
  tenantId: string;
  name: string;
  email?: string;
  phone?: string;
  totalBookings?: number;
  createdAt: string;
}

interface ServiceRecord {
  id: string;
  tenantId: string;
  name: string;
  price: number | string;
  homeVisitSurcharge?: number | string;
}

type InvoiceItemRow = {
  item: InvoiceItemRecord;
  service: ServiceRecord | null;
};

function parseDecimal(value: string | number | null | undefined): number {
  if (value === null || value === undefined) return 0;
  if (typeof value === 'number') return value;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function mapService(service: ServiceRecord | null | undefined) {
  if (!service) return undefined;
  const { price, homeVisitSurcharge, ...rest } = service;
  return {
    ...rest,
    price: parseDecimal(price),
    homeVisitSurcharge:
      homeVisitSurcharge !== null && homeVisitSurcharge !== undefined
        ? parseDecimal(homeVisitSurcharge)
        : undefined,
  };
}

function formatDate(date?: Date | string | null): string {
  if (!date) return '';
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString();
}

export interface FinancialMetrics {
  totalRevenue: number;
  paidRevenue: number;
  pendingRevenue: number;
  overdueRevenue: number;
  averageInvoiceValue: number;
  totalInvoices: number;
  paidInvoices: number;
  pendingInvoices: number;
  overdueInvoices: number;
  paymentRate: number;
  averagePaymentTime: number;
}

export interface MonthlyRevenue {
  month: string;
  year: number;
  totalRevenue: number;
  paidRevenue: number;
  invoiceCount: number;
  paidCount: number;
}

export interface CustomerFinancials {
  customerId: string;
  customerName: string;
  totalInvoices: number;
  totalAmount: number;
  paidAmount: number;
  pendingAmount: number;
  overdueAmount: number;
  lastInvoiceDate: Date;
  averagePaymentTime: number;
}

export interface PaymentStatusReport {
  status: InvoiceStatus;
  count: number;
  totalAmount: number;
  percentage: number;
}

export class FinancialService {
  static async getFinancialMetrics(tenantId: string, dateFrom?: Date, dateTo?: Date): Promise<FinancialMetrics> {
    try {
      const supabase = getSupabaseClient();
      
      let query = supabase
        .from('invoices')
        .select('status, totalAmount, issueDate, paidDate')
        .eq('tenantId', tenantId);

      if (dateFrom) {
        query = query.gte('issueDate', dateFrom.toISOString());
      }
      if (dateTo) {
        query = query.lte('issueDate', dateTo.toISOString());
      }

      const { data: invoices, error } = await query;

      if (error) {
        console.error('Error fetching financial metrics:', error);
        return {
          totalRevenue: 0,
          paidRevenue: 0,
          pendingRevenue: 0,
          overdueRevenue: 0,
          averageInvoiceValue: 0,
          totalInvoices: 0,
          paidInvoices: 0,
          pendingInvoices: 0,
          overdueInvoices: 0,
          paymentRate: 0,
          averagePaymentTime: 0,
        };
      }

      let totalRevenue = 0;
      let paidRevenue = 0;
      let paidInvoices = 0;
      let totalPaymentDays = 0;
      let paidWithDates = 0;

      (invoices || []).forEach((inv: any) => {
        const amount = parseDecimal(inv.totalAmount);
        totalRevenue += amount;
        
        if (inv.status === 'paid') {
          paidRevenue += amount;
          paidInvoices++;
          
          if (inv.paidDate && inv.issueDate) {
            const paymentDays = Math.ceil(
              (new Date(inv.paidDate).getTime() - new Date(inv.issueDate).getTime()) / (1000 * 60 * 60 * 24)
            );
            totalPaymentDays += paymentDays;
            paidWithDates++;
          }
        }
      });

      const totalInvoices = invoices?.length || 0;
      const averageInvoiceValue = totalInvoices > 0 ? totalRevenue / totalInvoices : 0;
      const paymentRate = totalInvoices > 0 ? (paidInvoices / totalInvoices) * 100 : 0;
      const averagePaymentTime = paidWithDates > 0 ? totalPaymentDays / paidWithDates : 0;

      return {
        totalRevenue,
        paidRevenue,
        pendingRevenue: totalRevenue - paidRevenue,
        overdueRevenue: 0,
        averageInvoiceValue,
        totalInvoices,
        paidInvoices,
        pendingInvoices: totalInvoices - paidInvoices,
        overdueInvoices: 0,
        paymentRate,
        averagePaymentTime,
      };
    } catch (error) {
      console.error('Error fetching financial metrics:', error);
      return {
        totalRevenue: 0,
        paidRevenue: 0,
        pendingRevenue: 0,
        overdueRevenue: 0,
        averageInvoiceValue: 0,
        totalInvoices: 0,
        paidInvoices: 0,
        pendingInvoices: 0,
        overdueInvoices: 0,
        paymentRate: 0,
        averagePaymentTime: 0,
      };
    }
  }

  static async getMonthlyRevenue(tenantId: string, months: number = 12): Promise<MonthlyRevenue[]> {
    try {
      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() - months);
      startDate.setDate(1);

      const supabase = getSupabaseClient();
      const { data: invoices, error } = await supabase
        .from('invoices')
        .select('status, totalAmount, issueDate')
        .eq('tenantId', tenantId)
        .gte('issueDate', startDate.toISOString());

      if (error) {
        console.error('Error fetching monthly revenue:', error);
        return [];
      }

      const monthlyData: Record<string, MonthlyRevenue & { totalRevenueValue: number; paidRevenueValue: number }> = {};

      for (let i = 0; i < months; i++) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        const key = date.getFullYear() + '-' + String(date.getMonth() + 1).padStart(2, '0');
        monthlyData[key] = {
          month: date.toLocaleString('default', { month: 'long' }),
          year: date.getFullYear(),
          totalRevenue: 0,
          paidRevenue: 0,
          invoiceCount: 0,
          paidCount: 0,
          totalRevenueValue: 0,
          paidRevenueValue: 0,
        };
      }

      (invoices || []).forEach((inv: any) => {
        const issueDate = new Date(inv.issueDate);
        const key = issueDate.getFullYear() + '-' + String(issueDate.getMonth() + 1).padStart(2, '0');
        const entry = monthlyData[key];
        if (!entry) return;

        const amount = parseDecimal(inv.totalAmount);
        entry.totalRevenueValue += amount;
        entry.invoiceCount += 1;

        if (inv.status === 'paid') {
          entry.paidRevenueValue += amount;
          entry.paidCount += 1;
        }
      });

      return Object.values(monthlyData)
        .reverse()
        .map(({ totalRevenueValue, paidRevenueValue, ...rest }) => ({
          ...rest,
          totalRevenue: totalRevenueValue,
          paidRevenue: paidRevenueValue,
        }));
    } catch (error) {
      console.error('Error fetching monthly revenue:', error);
      return [];
    }
  }

  static async getCustomerFinancials(tenantId: string): Promise<CustomerFinancials[]> {
    try {
      const supabase = getSupabaseClient();
      const { data: customers, error } = await supabase
        .from('customers')
        .select('id, name')
        .eq('tenantId', tenantId);

      if (error) {
        console.error('Error fetching customer financials:', error);
        return [];
      }

      const result: CustomerFinancials[] = [];

      for (const customer of customers || []) {
        const { data: invoices } = await supabase
          .from('invoices')
          .select('status, totalAmount, issueDate, paidDate')
          .eq('customerId', customer.id);

        if (!invoices || invoices.length === 0) continue;

        let totalAmount = 0;
        let paidAmount = 0;
        let totalPaymentDays = 0;
        let paidWithDates = 0;

        invoices.forEach((inv: any) => {
          const amount = parseDecimal(inv.totalAmount);
          totalAmount += amount;

          if (inv.status === 'paid') {
            paidAmount += amount;
            if (inv.paidDate && inv.issueDate) {
              const paymentDays = Math.ceil(
                (new Date(inv.paidDate).getTime() - new Date(inv.issueDate).getTime()) / (1000 * 60 * 60 * 24)
              );
              totalPaymentDays += paymentDays;
              paidWithDates++;
            }
          }
        });

        result.push({
          customerId: customer.id,
          customerName: customer.name || 'Unknown',
          totalInvoices: invoices.length,
          totalAmount,
          paidAmount,
          pendingAmount: totalAmount - paidAmount,
          overdueAmount: 0,
          lastInvoiceDate: invoices.length > 0 ? new Date(invoices[invoices.length - 1].issueDate) : new Date(),
          averagePaymentTime: paidWithDates > 0 ? totalPaymentDays / paidWithDates : 0,
        });
      }

      return result;
    } catch (error) {
      console.error('Error fetching customer financials:', error);
      return [];
    }
  }

  static async getPaymentStatusReport(tenantId: string): Promise<PaymentStatusReport[]> {
    try {
      const supabase = getSupabaseClient();
      const { data: invoices, error } = await supabase
        .from('invoices')
        .select('status, totalAmount')
        .eq('tenantId', tenantId);

      if (error) {
        console.error('Error fetching payment status:', error);
        return [];
      }

      const statusMap: Record<string, { count: number; totalAmount: number }> = {};
      let grandTotal = 0;

      (invoices || []).forEach((inv: any) => {
        const status = (inv.status || 'draft') as string;
        if (!statusMap[status]) {
          statusMap[status] = { count: 0, totalAmount: 0 };
        }
        const amount = parseDecimal(inv.totalAmount);
        statusMap[status].count += 1;
        statusMap[status].totalAmount += amount;
        grandTotal += amount;
      });

      return Object.entries(statusMap).map(([status, data]) => ({
        status: status as InvoiceStatus,
        count: data.count,
        totalAmount: data.totalAmount,
        percentage: grandTotal > 0 ? (data.totalAmount / grandTotal) * 100 : 0,
      }));
    } catch (error) {
      console.error('Error fetching payment status:', error);
      return [];
    }
  }

  static async exportToExcel(tenantId: string, options: InvoiceExportOptions): Promise<Uint8Array> {
    try {
      const workbook = XLSX.utils.book_new();
      
      const supabase = getSupabaseClient();
      let query = supabase
        .from('invoices')
        .select('invoiceNumber, customerId, issueDate, dueDate, status, subtotal, taxAmount, discountAmount, totalAmount, paymentMethod, paidDate')
        .eq('tenantId', tenantId);

      if (options.filters?.status?.length) {
        query = query.in('status', options.filters.status);
      }
      if (options.filters?.customerId) {
        query = query.eq('customerId', options.filters.customerId);
      }
      if (options.dateRange?.from) {
        query = query.gte('issueDate', options.dateRange.from);
      }
      if (options.dateRange?.to) {
        query = query.lte('issueDate', options.dateRange.to);
      }

      const { data: invoiceData } = await query;

      const summaryData = (invoiceData || []).map((inv: any) => ({
        'Invoice Number': inv.invoiceNumber,
        'Issue Date': formatDate(inv.issueDate),
        'Due Date': formatDate(inv.dueDate),
        Status: (inv.status || 'pending').toUpperCase(),
        Subtotal: parseDecimal(inv.subtotal),
        Tax: parseDecimal(inv.taxAmount),
        Discount: parseDecimal(inv.discountAmount),
        'Total Amount': parseDecimal(inv.totalAmount),
        'Payment Method': inv.paymentMethod || '',
        'Paid Date': formatDate(inv.paidDate),
      }));

      const summarySheet = XLSX.utils.json_to_sheet(summaryData);
      XLSX.utils.book_append_sheet(workbook, summarySheet, 'Invoice Summary');

      const metrics = await this.getFinancialMetrics(
        tenantId,
        options.dateRange?.from ? new Date(options.dateRange.from) : undefined,
        options.dateRange?.to ? new Date(options.dateRange.to) : undefined
      );

      const metricsData = [
        { Metric: 'Total Revenue', Value: metrics.totalRevenue },
        { Metric: 'Paid Revenue', Value: metrics.paidRevenue },
        { Metric: 'Total Invoices', Value: metrics.totalInvoices },
        { Metric: 'Paid Invoices', Value: metrics.paidInvoices },
        { Metric: 'Payment Rate (%)', Value: metrics.paymentRate },
      ];

      const metricsSheet = XLSX.utils.json_to_sheet(metricsData);
      XLSX.utils.book_append_sheet(workbook, metricsSheet, 'Financial Metrics');

      const arrayBuffer = XLSX.write(workbook, { type: 'array', bookType: 'xlsx' }) as ArrayBuffer;
      return new Uint8Array(arrayBuffer);
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      return new Uint8Array();
    }
  }

  static async exportToPDF(tenantId: string, options: InvoiceExportOptions): Promise<Uint8Array> {
    try {
      const metrics = await this.getFinancialMetrics(
        tenantId,
        options.dateRange?.from ? new Date(options.dateRange.from) : undefined,
        options.dateRange?.to ? new Date(options.dateRange.to) : undefined
      );

      const monthlyRevenue = await this.getMonthlyRevenue(tenantId, 12);
      const paymentStatus = await this.getPaymentStatusReport(tenantId);

      const reportData = {
        dateRange: options.dateRange,
        metrics,
        monthlyRevenue,
        paymentStatus,
      };

      const jsonString = JSON.stringify(reportData, null, 2);
      return new TextEncoder().encode(jsonString);
    } catch (error) {
      console.error('Error exporting to PDF:', error);
      return new Uint8Array();
    }
  }

  static async getOverdueInvoices(tenantId: string) {
    try {
      const supabase = getSupabaseClient();
      const { data: invoices } = await supabase
        .from('invoices')
        .select('*')
        .eq('tenantId', tenantId)
        .eq('status', 'overdue')
        .order('dueDate', { ascending: true });

      return (invoices || []).map(inv => ({
        ...inv,
        daysPastDue: inv.dueDate ? Math.ceil((Date.now() - new Date(inv.dueDate).getTime()) / (1000 * 60 * 60 * 24)) : 0,
      }));
    } catch (error) {
      console.error('Error fetching overdue invoices:', error);
      return [];
    }
  }

  static async getUpcomingDueInvoices(tenantId: string, days: number = 7) {
    try {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + days);

      const supabase = getSupabaseClient();
      const { data: invoices } = await supabase
        .from('invoices')
        .select('*')
        .eq('tenantId', tenantId)
        .eq('status', 'sent')
        .gte('dueDate', new Date().toISOString())
        .lte('dueDate', futureDate.toISOString())
        .order('dueDate', { ascending: true });

      return invoices || [];
    } catch (error) {
      console.error('Error fetching upcoming due invoices:', error);
      return [];
    }
  }
}
