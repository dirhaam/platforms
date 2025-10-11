import { db } from '@/lib/database';
import {
  invoices,
  invoiceItems,
  customers,
  services,
  tenants,
} from '@/lib/database/schema';
import { InvoiceStatus, InvoiceExportOptions, PaymentMethod } from '@/types/invoice';
import { alias } from 'drizzle-orm/pg-core';
import { and, asc, desc, eq, gte, inArray, lte } from 'drizzle-orm';
import Decimal from 'decimal.js';
import * as XLSX from 'xlsx';

import type { SQL } from 'drizzle-orm';

type InvoiceRecord = typeof invoices.$inferSelect;
type InvoiceItemRecord = typeof invoiceItems.$inferSelect;
type CustomerRecord = typeof customers.$inferSelect;
type ServiceRecord = typeof services.$inferSelect;

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

function buildWhere(conditions: SQL<unknown>[]): SQL<unknown> | undefined {
  const filtered = conditions.filter(Boolean) as SQL<unknown>[];
  if (filtered.length === 0) return undefined;
  if (filtered.length === 1) return filtered[0];
  return and(...filtered);
}

function mapCustomer(customer: CustomerRecord | null | undefined) {
  if (!customer) return undefined;
  return {
    ...customer,
    totalBookings: customer.totalBookings ?? 0,
  };
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

function mapInvoice(
  invoice: InvoiceRecord,
  customer?: CustomerRecord | null,
  items?: InvoiceItemRow[]
) {
  return {
    id: invoice.id,
    tenantId: invoice.tenantId,
    customerId: invoice.customerId,
    bookingId: invoice.bookingId ?? undefined,
    invoiceNumber: invoice.invoiceNumber,
    status: invoice.status as InvoiceStatus,
    issueDate: invoice.issueDate,
    dueDate: invoice.dueDate,
    paidDate: invoice.paidDate ?? undefined,
    subtotal: parseDecimal(invoice.subtotal),
    taxRate: parseDecimal(invoice.taxRate),
    taxAmount: parseDecimal(invoice.taxAmount),
    discountAmount: parseDecimal(invoice.discountAmount),
    totalAmount: parseDecimal(invoice.totalAmount),
    paymentMethod: invoice.paymentMethod as PaymentMethod | undefined,
    paymentReference: invoice.paymentReference ?? undefined,
    items: (items ?? []).map(({ item, service }) => ({
      id: item.id,
      invoiceId: item.invoiceId,
      description: item.description,
      quantity: item.quantity,
      unitPrice: parseDecimal(item.unitPrice),
      totalPrice: parseDecimal(item.totalPrice),
      serviceId: item.serviceId ?? undefined,
      service: mapService(service),
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    })),
    notes: invoice.notes ?? undefined,
    terms: invoice.terms ?? undefined,
    qrCodeData: invoice.qrCodeData ?? undefined,
    qrCodeUrl: invoice.qrCodeUrl ?? undefined,
    createdAt: invoice.createdAt,
    updatedAt: invoice.updatedAt,
    customer: mapCustomer(customer),
    booking: undefined,
    tenant: undefined,
  };
}

function formatDate(date?: Date | null): string {
  if (!date) return '';
  return date.toLocaleDateString();
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
  paymentRate: number; // percentage
  averagePaymentTime: number; // days
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
  /**
   * Get comprehensive financial metrics for a tenant
   */
  static async getFinancialMetrics(tenantId: string, dateFrom?: Date, dateTo?: Date): Promise<FinancialMetrics> {
    const conditions: SQL<unknown>[] = [eq(invoices.tenantId, tenantId)];
    if (dateFrom) {
      conditions.push(gte(invoices.issueDate, dateFrom));
    }
    if (dateTo) {
      conditions.push(lte(invoices.issueDate, dateTo));
    }

    const whereClause = buildWhere(conditions);

    const baseQuery = db
      .select({
        status: invoices.status,
        totalAmount: invoices.totalAmount,
        issueDate: invoices.issueDate,
        paidDate: invoices.paidDate,
      })
      .from(invoices);

    const rows = whereClause ? await baseQuery.where(whereClause) : await baseQuery;

    let totalRevenue = new Decimal(0);
    let paidRevenue = new Decimal(0);
    let pendingRevenue = new Decimal(0);
    let overdueRevenue = new Decimal(0);
    let paidInvoices = 0;
    let pendingInvoices = 0;
    let overdueInvoices = 0;
    let totalPaymentDays = 0;
    let paidInvoicesWithDates = 0;

    rows.forEach(invoice => {
      const invoiceAmount = new Decimal(parseDecimal(invoice.totalAmount));
      totalRevenue = totalRevenue.add(invoiceAmount);
      
      switch (invoice.status) {
        case InvoiceStatus.PAID:
          paidRevenue = paidRevenue.add(invoiceAmount);
          paidInvoices++;
          
          if (invoice.paidDate) {
            const paymentTime = Math.ceil(
              (invoice.paidDate.getTime() - invoice.issueDate.getTime()) / (1000 * 60 * 60 * 24)
            );
            totalPaymentDays += paymentTime;
            paidInvoicesWithDates++;
          }
          break;
        case InvoiceStatus.OVERDUE:
          overdueRevenue = overdueRevenue.add(invoiceAmount);
          overdueInvoices++;
          break;
        case InvoiceStatus.SENT:
        case InvoiceStatus.DRAFT:
          pendingRevenue = pendingRevenue.add(invoiceAmount);
          pendingInvoices++;
          break;
      }
    });

    const averageInvoiceValue = rows.length > 0
      ? totalRevenue.div(rows.length)
      : new Decimal(0);
    
    const paymentRate = rows.length > 0
      ? (paidInvoices / rows.length) * 100
      : 0;
    
    const averagePaymentTime = paidInvoicesWithDates > 0
      ? totalPaymentDays / paidInvoicesWithDates
      : 0;

    return {
      totalRevenue: totalRevenue.toNumber(),
      paidRevenue: paidRevenue.toNumber(),
      pendingRevenue: pendingRevenue.toNumber(),
      overdueRevenue: overdueRevenue.toNumber(),
      averageInvoiceValue: averageInvoiceValue.toNumber(),
      totalInvoices: rows.length,
      paidInvoices,
      pendingInvoices,
      overdueInvoices,
      paymentRate,
      averagePaymentTime,
    };
  }

  /**
   * Get monthly revenue breakdown
   */
  static async getMonthlyRevenue(tenantId: string, months: number = 12): Promise<MonthlyRevenue[]> {
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months);
    startDate.setDate(1);

    const rows = await db
      .select({
        status: invoices.status,
        totalAmount: invoices.totalAmount,
        issueDate: invoices.issueDate,
      })
      .from(invoices)
      .where(and(eq(invoices.tenantId, tenantId), gte(invoices.issueDate, startDate)));

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

    rows.forEach(invoice => {
      const issueDate = invoice.issueDate;
      const key = issueDate.getFullYear() + '-' + String(issueDate.getMonth() + 1).padStart(2, '0');
      const entry = monthlyData[key];
      if (!entry) return;

      const amount = parseDecimal(invoice.totalAmount);
      entry.totalRevenueValue += amount;
      entry.invoiceCount += 1;

      if (invoice.status === InvoiceStatus.PAID) {
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
  }

  /**
   * Get customer financial breakdown
   */
  static async getCustomerFinancials(tenantId: string): Promise<CustomerFinancials[]> {
    const rows = await db
      .select({
        customerId: customers.id,
        customerName: customers.name,
        status: invoices.status,
        totalAmount: invoices.totalAmount,
        issueDate: invoices.issueDate,
        paidDate: invoices.paidDate,
      })
      .from(customers)
      .innerJoin(invoices, eq(customers.id, invoices.customerId))
      .where(eq(customers.tenantId, tenantId));

    const customerMap = new Map<string, {
      customerId: string;
      customerName: string;
      totalInvoices: number;
      totalAmount: Decimal;
      paidAmount: Decimal;
      pendingAmount: Decimal;
      overdueAmount: Decimal;
      lastInvoiceDate: Date;
      totalPaymentDays: number;
      paidInvoicesWithDates: number;
    }>();

    rows.forEach(row => {
      if (!customerMap.has(row.customerId)) {
        customerMap.set(row.customerId, {
          customerId: row.customerId,
          customerName: row.customerName,
          totalInvoices: 0,
          totalAmount: new Decimal(0),
          paidAmount: new Decimal(0),
          pendingAmount: new Decimal(0),
          overdueAmount: new Decimal(0),
          lastInvoiceDate: new Date(0),
          totalPaymentDays: 0,
          paidInvoicesWithDates: 0,
        });
      }

      const customer = customerMap.get(row.customerId)!;
      customer.totalInvoices += 1;

      const amount = new Decimal(parseDecimal(row.totalAmount));
      customer.totalAmount = customer.totalAmount.add(amount);

      if (row.issueDate > customer.lastInvoiceDate) {
        customer.lastInvoiceDate = row.issueDate;
      }

      switch (row.status) {
        case InvoiceStatus.PAID:
          customer.paidAmount = customer.paidAmount.add(amount);
          if (row.paidDate) {
            const paymentTime = Math.ceil(
              (row.paidDate.getTime() - row.issueDate.getTime()) / (1000 * 60 * 60 * 24)
            );
            customer.totalPaymentDays += paymentTime;
            customer.paidInvoicesWithDates += 1;
          }
          break;
        case InvoiceStatus.OVERDUE:
          customer.overdueAmount = customer.overdueAmount.add(amount);
          break;
        case InvoiceStatus.SENT:
        case InvoiceStatus.DRAFT:
          customer.pendingAmount = customer.pendingAmount.add(amount);
          break;
      }
    });

    return Array.from(customerMap.values())
      .filter(customer => customer.totalInvoices > 0)
      .map(customer => ({
        customerId: customer.customerId,
        customerName: customer.customerName,
        totalInvoices: customer.totalInvoices,
        totalAmount: customer.totalAmount.toNumber(),
        paidAmount: customer.paidAmount.toNumber(),
        pendingAmount: customer.pendingAmount.toNumber(),
        overdueAmount: customer.overdueAmount.toNumber(),
        lastInvoiceDate: customer.lastInvoiceDate,
        averagePaymentTime:
          customer.paidInvoicesWithDates > 0
            ? customer.totalPaymentDays / customer.paidInvoicesWithDates
            : 0,
      }));
  }

  /**
   * Get payment status report
   */
  static async getPaymentStatusReport(tenantId: string): Promise<PaymentStatusReport[]> {
    const rows = await db
      .select({ status: invoices.status, totalAmount: invoices.totalAmount })
      .from(invoices)
      .where(eq(invoices.tenantId, tenantId));

    const statusMap: Record<string, { count: number; totalAmount: Decimal }> = {};
    let grandTotal = new Decimal(0);

    rows.forEach(invoice => {
      const statusKey = invoice.status;
      if (!statusMap[statusKey]) {
        statusMap[statusKey] = { count: 0, totalAmount: new Decimal(0) };
      }
      const amount = new Decimal(parseDecimal(invoice.totalAmount));
      statusMap[statusKey].count += 1;
      statusMap[statusKey].totalAmount = statusMap[statusKey].totalAmount.add(amount);
      grandTotal = grandTotal.add(amount);
    });

    const grandTotalNumber = grandTotal.toNumber();

    return Object.entries(statusMap).map(([status, data]) => ({
      status: status as InvoiceStatus,
      count: data.count,
      totalAmount: data.totalAmount.toNumber(),
      percentage:
        grandTotalNumber > 0 ? (data.totalAmount.toNumber() / grandTotalNumber) * 100 : 0,
    }));
  }

  /**
   * Export financial data to Excel
   */
  static async exportToExcel(tenantId: string, options: InvoiceExportOptions): Promise<Uint8Array> {
    const workbook = XLSX.utils.book_new();

    const conditions: SQL<unknown>[] = [eq(invoices.tenantId, tenantId)];

    if (options.filters?.status?.length) {
      conditions.push(inArray(invoices.status, options.filters.status));
    }

    if (options.filters?.customerId) {
      conditions.push(eq(invoices.customerId, options.filters.customerId));
    }

    if (options.dateRange?.from) {
      conditions.push(gte(invoices.issueDate, new Date(options.dateRange.from)));
    }

    if (options.dateRange?.to) {
      conditions.push(lte(invoices.issueDate, new Date(options.dateRange.to)));
    }

    const whereClause = buildWhere(conditions);

    let query = db
      .select({ invoice: invoices, customer: customers })
      .from(invoices)
      .leftJoin(customers, eq(invoices.customerId, customers.id))
      .orderBy(desc(invoices.issueDate));

    if (whereClause) {
      query = query.where(whereClause);
    }

    const rows = await query;

    const includeItems = !!options.includeItems;
    let itemsMap = new Map<string, InvoiceItemRow[]>();

    if (includeItems && rows.length > 0) {
      const invoiceIds = rows.map(row => row.invoice.id);
      const itemServices = alias(services, 'invoice_item_services_export');
      const itemRows = await db
        .select({ item: invoiceItems, service: itemServices })
        .from(invoiceItems)
        .leftJoin(itemServices, eq(invoiceItems.serviceId, itemServices.id))
        .where(inArray(invoiceItems.invoiceId, invoiceIds));

      itemsMap = itemRows.reduce((map, row) => {
        const list = map.get(row.item.invoiceId) ?? [];
        list.push(row);
        map.set(row.item.invoiceId, list);
        return map;
      }, new Map<string, InvoiceItemRow[]>());
    }

    const invoiceDatas = rows.map(row => ({
      invoice: row.invoice,
      customer: row.customer,
      items: includeItems ? itemsMap.get(row.invoice.id) ?? [] : undefined,
    }));

    const summaryData = invoiceDatas.map(({ invoice, customer }) => ({
      'Invoice Number': invoice.invoiceNumber,
      Customer: customer?.name || '',
      'Issue Date': formatDate(invoice.issueDate),
      'Due Date': formatDate(invoice.dueDate),
      Status: invoice.status.toUpperCase(),
      Subtotal: parseDecimal(invoice.subtotal),
      Tax: parseDecimal(invoice.taxAmount),
      Discount: parseDecimal(invoice.discountAmount),
      'Total Amount': parseDecimal(invoice.totalAmount),
      'Payment Method': invoice.paymentMethod || '',
      'Paid Date': formatDate(invoice.paidDate),
    }));

    const summarySheet = XLSX.utils.json_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(workbook, summarySheet, 'Invoice Summary');

    if (includeItems && invoiceDatas.some(inv => (inv.items?.length ?? 0) > 0)) {
      const itemsData: any[] = [];

      invoiceDatas.forEach(({ invoice, customer, items }) => {
        items?.forEach(item => {
          itemsData.push({
            'Invoice Number': invoice.invoiceNumber,
            Customer: customer?.name || '',
            'Item Description': item.item.description,
            Service: item.service?.name || '',
            Quantity: item.item.quantity,
            'Unit Price': parseDecimal(item.item.unitPrice),
            'Total Price': parseDecimal(item.item.totalPrice),
          });
        });
      });

      if (itemsData.length > 0) {
        const itemsSheet = XLSX.utils.json_to_sheet(itemsData);
        XLSX.utils.book_append_sheet(workbook, itemsSheet, 'Invoice Items');
      }
    }

    const metrics = await this.getFinancialMetrics(
      tenantId,
      options.dateRange ? new Date(options.dateRange.from) : undefined,
      options.dateRange ? new Date(options.dateRange.to) : undefined
    );

    const metricsData = [
      { Metric: 'Total Revenue', Value: metrics.totalRevenue },
      { Metric: 'Paid Revenue', Value: metrics.paidRevenue },
      { Metric: 'Pending Revenue', Value: metrics.pendingRevenue },
      { Metric: 'Overdue Revenue', Value: metrics.overdueRevenue },
      { 'Metric': 'Total Invoices', 'Value': metrics.totalInvoices },
      { 'Metric': 'Paid Invoices', 'Value': metrics.paidInvoices },
      { 'Metric': 'Pending Invoices', 'Value': metrics.pendingInvoices },
      { 'Metric': 'Overdue Invoices', 'Value': metrics.overdueInvoices },
      { 'Metric': 'Payment Rate (%)', 'Value': metrics.paymentRate },
      { 'Metric': 'Average Payment Time (days)', 'Value': metrics.averagePaymentTime },
      { Metric: 'Average Invoice Value', Value: metrics.averageInvoiceValue },
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
    const metrics = await this.getFinancialMetrics(
      tenantId,
      options.dateRange ? new Date(options.dateRange.from) : undefined,
      options.dateRange ? new Date(options.dateRange.to) : undefined
    );

    const monthlyRevenue = await this.getMonthlyRevenue(tenantId, 12);
    const customerFinancials = await this.getCustomerFinancials(tenantId);
    const paymentStatus = await this.getPaymentStatusReport(tenantId);

    const [tenant] = await db
      .select({ businessName: tenants.businessName })
      .from(tenants)
      .where(eq(tenants.id, tenantId))
      .limit(1);

    const reportData = {
      tenant: tenant?.businessName || 'Business',
      dateRange: options.dateRange,
      metrics,
      monthlyRevenue,
      customerFinancials: customerFinancials.slice(0, 10),
      paymentStatus,
    };

    const jsonString = JSON.stringify(reportData, null, 2);
    return new TextEncoder().encode(jsonString);
  }

  /**
   * Get overdue invoices for follow-up
   */
  static async getOverdueInvoices(tenantId: string) {
    const rows = await db
      .select({ invoice: invoices, customer: customers })
      .from(invoices)
      .leftJoin(customers, eq(invoices.customerId, customers.id))
      .where(and(eq(invoices.tenantId, tenantId), eq(invoices.status, InvoiceStatus.OVERDUE)))
      .orderBy(asc(invoices.dueDate));

    return rows.map(row => {
      const invoiceData = mapInvoice(row.invoice, row.customer ?? undefined);
      const dueDate = row.invoice.dueDate;
      const daysPastDue = dueDate
        ? Math.ceil((Date.now() - dueDate.getTime()) / (1000 * 60 * 60 * 24))
        : 0;
      return {
        ...invoiceData,
        daysPastDue,
      };
    });
  }

  /**
   * Get upcoming due invoices
   */
  static async getUpcomingDueInvoices(tenantId: string, days: number = 7) {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);

    const rows = await db
      .select({ invoice: invoices, customer: customers })
      .from(invoices)
      .leftJoin(customers, eq(invoices.customerId, customers.id))
      .where(
        and(
          eq(invoices.tenantId, tenantId),
          eq(invoices.status, InvoiceStatus.SENT),
          gte(invoices.dueDate, new Date()),
          lte(invoices.dueDate, futureDate)
        )
      )
      .orderBy(asc(invoices.dueDate));

    return rows.map(row => mapInvoice(row.invoice, row.customer ?? undefined));
  }
}
