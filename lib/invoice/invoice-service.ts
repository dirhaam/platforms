import { db } from '@/lib/database';
import {
  invoices,
  invoiceItems,
  customers,
  bookings,
  services,
  tenants,
} from '@/lib/database/schema';
import {
  Invoice,
  InvoiceStatus,
  PaymentMethod,
  CreateInvoiceRequest,
  UpdateInvoiceRequest,
  InvoiceSummary,
  InvoiceFilters,
  QRCodePaymentData,
  type Service,
  type Customer,
  type Booking,
  type Tenant,
} from '@/types/invoice';
import { alias } from 'drizzle-orm/pg-core';
import { and, asc, desc, eq, gte, inArray, lt, lte, sql } from 'drizzle-orm';
import Decimal from 'decimal.js';
import crypto from 'crypto';

type InvoiceRecord = typeof invoices.$inferSelect;
type InvoiceItemRecord = typeof invoiceItems.$inferSelect;
type CustomerRecord = typeof customers.$inferSelect;
type BookingRecord = typeof bookings.$inferSelect;
type ServiceRecord = typeof services.$inferSelect;
type TenantRecord = typeof tenants.$inferSelect;

type InvoiceQueryRow = {
  invoice: InvoiceRecord;
  customer: CustomerRecord | null;
  booking: BookingRecord | null;
  bookingService: ServiceRecord | null;
  tenant: TenantRecord | null;
};

type InvoiceItemQueryRow = {
  item: InvoiceItemRecord;
  service: ServiceRecord | null;
};

function parseDecimal(value: string | number | null | undefined): number {
  if (value === null || value === undefined) return 0;
  if (typeof value === 'number') return value;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export class InvoiceService {
  /**
   * Generate unique invoice number
   */
  private static async generateInvoiceNumber(tenantId: string): Promise<string> {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    
    // Get the count of invoices for this tenant in current month
    const startOfMonth = new Date(year, now.getMonth(), 1);
    const endOfMonth = new Date(year, now.getMonth() + 1, 1);
    
    const countResult = await db
      .select({ count: sql<number>`cast(count(${invoices.id}) as int)` })
      .from(invoices)
      .where(
        and(
          eq(invoices.tenantId, tenantId),
          gte(invoices.createdAt, startOfMonth),
          lt(invoices.createdAt, endOfMonth)
        )
      );

    const count = Number(countResult[0]?.count ?? 0);
    const sequence = String(count + 1).padStart(4, '0');
    return `INV-${year}${month}-${sequence}`;
  }

  /**
   * Create a new invoice
   */
  static async createInvoice(tenantId: string, data: CreateInvoiceRequest): Promise<Invoice> {
    const invoiceNumber = await this.generateInvoiceNumber(tenantId);
    const invoiceId = crypto.randomUUID();
    
    // Calculate totals
    let subtotal = new Decimal(0);
    const items = data.items.map(item => {
      const itemTotal = new Decimal(item.unitPrice).mul(item.quantity);
      subtotal = subtotal.add(itemTotal);
      return {
        description: item.description,
        quantity: item.quantity,
        unitPrice: Number(item.unitPrice),
        totalPrice: itemTotal.toNumber(),
        serviceId: item.serviceId,
      };
    });
    
    const taxRate = new Decimal(data.taxRate || 0);
    const taxAmount = subtotal.mul(taxRate);
    const discountAmount = new Decimal(data.discountAmount || 0);
    const totalAmount = subtotal.add(taxAmount).sub(discountAmount);
    const [tenantRow] = await db
      .select({ businessName: tenants.businessName })
      .from(tenants)
      .where(eq(tenants.id, tenantId))
      .limit(1);

    const qrCodeData = await this.generateQRCodeData({
      invoiceId,
      amount: totalAmount.toNumber(),
      currency: 'IDR',
      reference: data.paymentReference || invoiceNumber,
      dueDate: data.dueDate,
      merchantInfo: {
        name: tenantRow?.businessName || '',
        account: data.paymentReference || '',
      },
    });

    // Create the invoice first
    await db.insert(invoices).values({
      id: invoiceId,
      tenantId,
      customerId: data.customerId,
      bookingId: data.bookingId,
      invoiceNumber,
      status: InvoiceStatus.DRAFT,
      issueDate: new Date(),
      dueDate: new Date(data.dueDate),
      subtotal: subtotal.toNumber(),
      taxRate: taxRate.toNumber(),
      taxAmount: taxAmount.toNumber(),
      discountAmount: discountAmount.toNumber(),
      totalAmount: totalAmount.toNumber(),
      notes: data.notes,
      terms: data.terms,
      qrCodeData,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    // Create invoice items
    const itemPromises = items.map(item => 
      db.insert(invoiceItems).values({
        id: crypto.randomUUID(),
        invoiceId,
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice: item.totalPrice,
        serviceId: item.serviceId,
        createdAt: new Date(),
        updatedAt: new Date()
      }).returning()
    );
    
    await Promise.all(itemPromises);

    const [invoice] = await this.queryInvoices(
      and(eq(invoices.id, invoiceId), eq(invoices.tenantId, tenantId)),
      { limit: 1 }
    );

    if (!invoice) {
      throw new Error('Failed to load created invoice');
    }

    return invoice;
  }

  /**
   * Get invoice by ID
   */
  static async getInvoiceById(tenantId: string, invoiceId: string): Promise<Invoice | null> {
    const [invoice] = await this.queryInvoices(
      and(eq(invoices.id, invoiceId), eq(invoices.tenantId, tenantId)),
      { limit: 1 }
    );

    return invoice ?? null;
  }

  /**
   * Get invoices with filters
   */
  static async getInvoices(tenantId: string, filters?: InvoiceFilters, page = 1, limit = 20) {
    const conditions = [eq(invoices.tenantId, tenantId)];

    if (filters?.status?.length) {
      conditions.push(inArray(invoices.status, filters.status));
    }

    if (filters?.customerId) {
      conditions.push(eq(invoices.customerId, filters.customerId));
    }

    if (filters?.dateFrom) {
      conditions.push(gte(invoices.issueDate, new Date(filters.dateFrom)));
    }

    if (filters?.dateTo) {
      conditions.push(lte(invoices.issueDate, new Date(filters.dateTo)));
    }

    if (filters?.amountMin !== undefined) {
      conditions.push(gte(invoices.totalAmount, new Decimal(filters.amountMin).toFixed(2)));
    }

    if (filters?.amountMax !== undefined) {
      conditions.push(lte(invoices.totalAmount, new Decimal(filters.amountMax).toFixed(2)));
    }

    const whereClause = and(...conditions);
    const safePage = Math.max(page, 1);
    const offset = (safePage - 1) * limit;

    const [{ count: totalCount }] = await db
      .select({ count: sql<number>`cast(count(${invoices.id}) as int)` })
      .from(invoices)
      .where(whereClause);

    const results = await this.queryInvoices(whereClause, {
      limit,
      offset,
    });

    const total = Number(totalCount ?? 0);

    return {
      invoices: results,
      total,
      page: safePage,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Update invoice
   */
  static async updateInvoice(tenantId: string, invoiceId: string, data: UpdateInvoiceRequest): Promise<Invoice | null> {
    const updateData: Partial<typeof invoices.$inferInsert> = {};

    if (data.status) {
      updateData.status = data.status;
      
      // Set paid date if status is paid
      if (data.status === InvoiceStatus.PAID && data.paidDate) {
        updateData.paidDate = new Date(data.paidDate);
      }
    }

    if (data.paidDate && data.status !== InvoiceStatus.PAID) {
      updateData.paidDate = new Date(data.paidDate);
    }

    if (data.dueDate) {
      updateData.dueDate = new Date(data.dueDate);
    }

    if (data.paymentMethod) {
      updateData.paymentMethod = data.paymentMethod;
    }

    if (data.paymentReference) {
      updateData.paymentReference = data.paymentReference;
    }

    if (data.notes !== undefined) {
      updateData.notes = data.notes;
    }

    if (data.terms !== undefined) {
      updateData.terms = data.terms;
    }

    if (Object.keys(updateData).length === 0) {
      return this.getInvoiceById(tenantId, invoiceId);
    }

    await db
      .update(invoices)
      .set({
        ...updateData,
        updatedAt: new Date(),
      })
      .where(and(eq(invoices.id, invoiceId), eq(invoices.tenantId, tenantId)));

    return this.getInvoiceById(tenantId, invoiceId);
  }

  /**
   * Delete invoice
   */
  static async deleteInvoice(tenantId: string, invoiceId: string): Promise<boolean> {
    try {
      const deleted = await db
        .delete(invoices)
        .where(and(eq(invoices.id, invoiceId), eq(invoices.tenantId, tenantId)))
        .returning({ id: invoices.id });

      return deleted.length > 0;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get invoice summary for dashboard
   */
  static async getInvoiceSummary(tenantId: string): Promise<InvoiceSummary> {
    const invoiceRows = await db
      .select({ status: invoices.status, totalAmount: invoices.totalAmount })
      .from(invoices)
      .where(eq(invoices.tenantId, tenantId));

    const [{ count: overdueCount }] = await db
      .select({ count: sql<number>`cast(count(${invoices.id}) as int)` })
      .from(invoices)
      .where(and(eq(invoices.tenantId, tenantId), eq(invoices.status, InvoiceStatus.OVERDUE)));

    let totalAmount = new Decimal(0);
    let paidAmount = new Decimal(0);
    let pendingAmount = new Decimal(0);
    let overdueAmount = new Decimal(0);

    for (const row of invoiceRows) {
      const amount = new Decimal(row.totalAmount || 0);
      totalAmount = totalAmount.add(amount);

      switch (row.status as InvoiceStatus) {
        case InvoiceStatus.PAID:
          paidAmount = paidAmount.add(amount);
          break;
        case InvoiceStatus.OVERDUE:
          overdueAmount = overdueAmount.add(amount);
          break;
        case InvoiceStatus.SENT:
        case InvoiceStatus.DRAFT:
          pendingAmount = pendingAmount.add(amount);
          break;
      }
    }

    return {
      totalInvoices: invoiceRows.length,
      totalAmount: totalAmount.toNumber(),
      paidAmount: paidAmount.toNumber(),
      pendingAmount: pendingAmount.toNumber(),
      overdueAmount: overdueAmount.toNumber(),
      overdueCount: Number(overdueCount ?? 0),
    };
  }

  /**
   * Create invoice from booking
   */
  static async createInvoiceFromBooking(tenantId: string, bookingId: string): Promise<Invoice> {
    const bookingServiceAlias = alias(services, 'booking_service_for_invoice');

    const [bookingRow] = await db
      .select({
        booking: bookings,
        service: bookingServiceAlias,
      })
      .from(bookings)
      .leftJoin(bookingServiceAlias, eq(bookings.serviceId, bookingServiceAlias.id))
      .where(and(eq(bookings.id, bookingId), eq(bookings.tenantId, tenantId)))
      .limit(1);

    if (!bookingRow?.booking) {
      throw new Error('Booking not found');
    }

    const booking = bookingRow.booking;

    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 7); // Due in 7 days

    const serviceName = bookingRow.service?.name ?? 'Service';
    const bookingTotal = parseDecimal(booking.totalAmount);

    const invoiceData: CreateInvoiceRequest = {
      customerId: booking.customerId,
      bookingId: booking.id,
      dueDate: dueDate.toISOString(),
      items: [{
        description: serviceName,
        quantity: 1,
        unitPrice: bookingTotal,
        serviceId: booking.serviceId
      }],
      notes: `Invoice for booking on ${booking.scheduledAt.toLocaleDateString()}`
    };

    return this.createInvoice(tenantId, invoiceData);
  }

  /**
   * Mark overdue invoices
   */
  static async markOverdueInvoices(): Promise<void> {
    const now = new Date();

    await db
      .update(invoices)
      .set({ status: InvoiceStatus.OVERDUE, updatedAt: new Date() })
      .where(and(eq(invoices.status, InvoiceStatus.SENT), lt(invoices.dueDate, now)));
  }

  /**
   * Generate QR code data for payment
   */
  private static async generateQRCodeData(data: QRCodePaymentData): Promise<string> {
    // This is a simplified QR code data format
    // In production, you would integrate with actual payment providers
    const qrData = {
      type: 'payment',
      amount: data.amount,
      currency: data.currency,
      reference: data.reference,
      dueDate: data.dueDate,
      merchant: data.merchantInfo
    };
    
    return JSON.stringify(qrData);
  }

  /**
   * Query invoices with related entities
   */
  private static async queryInvoices(whereClause: any, options: { limit?: number; offset?: number } = {}): Promise<Invoice[]> {
    const bookingServices = alias(services, 'booking_services');
    const itemServices = alias(services, 'invoice_item_services');

    const baseRows = await db
      .select({
        invoice: invoices,
        customer: customers,
        booking: bookings,
        bookingService: bookingServices,
        tenant: tenants,
      })
      .from(invoices)
      .leftJoin(customers, eq(invoices.customerId, customers.id))
      .leftJoin(bookings, eq(invoices.bookingId, bookings.id))
      .leftJoin(bookingServices, eq(bookings.serviceId, bookingServices.id))
      .leftJoin(tenants, eq(invoices.tenantId, tenants.id))
      .where(whereClause)
      .orderBy(desc(invoices.createdAt))
      .limit(options.limit ?? undefined)
      .offset(options.offset ?? undefined);

    const invoiceIds = baseRows.map(row => row.invoice.id);
    if (invoiceIds.length === 0) {
      return [];
    }

    const itemRows = await db
      .select({
        item: invoiceItems,
        service: itemServices,
      })
      .from(invoiceItems)
      .leftJoin(itemServices, eq(invoiceItems.serviceId, itemServices.id))
      .where(inArray(invoiceItems.invoiceId, invoiceIds))
      .orderBy(asc(invoiceItems.createdAt));

    const itemsByInvoice = new Map<string, InvoiceItemQueryRow[]>();
    for (const row of itemRows) {
      const list = itemsByInvoice.get(row.item.invoiceId) ?? [];
      list.push(row);
      itemsByInvoice.set(row.item.invoiceId, list);
    }

    return baseRows.map(row => this.mapInvoiceRow(row, itemsByInvoice.get(row.invoice.id) ?? []));
  }

  private static mapInvoiceRow(row: InvoiceQueryRow, itemRows: InvoiceItemQueryRow[]): Invoice {
    const invoice = row.invoice;

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
      paymentMethod: (invoice.paymentMethod as PaymentMethod) ?? undefined,
      paymentReference: invoice.paymentReference ?? undefined,
      items: itemRows.map(rowItem => this.mapInvoiceItem(rowItem)),
      notes: invoice.notes ?? undefined,
      terms: invoice.terms ?? undefined,
      qrCodeData: invoice.qrCodeData ?? undefined,
      qrCodeUrl: invoice.qrCodeUrl ?? undefined,
      createdAt: invoice.createdAt,
      updatedAt: invoice.updatedAt,
      customer: this.mapCustomerRow(row.customer),
      booking: this.mapBookingRow(row.booking, row.bookingService),
      tenant: this.mapTenantRow(row.tenant),
    };
  }

  private static mapInvoiceItem(row: InvoiceItemQueryRow): Invoice['items'][number] {
    const item = row.item;
    return {
      id: item.id,
      invoiceId: item.invoiceId,
      description: item.description,
      quantity: item.quantity,
      unitPrice: parseDecimal(item.unitPrice),
      totalPrice: parseDecimal(item.totalPrice),
      serviceId: item.serviceId ?? undefined,
      service: this.mapServiceRow(row.service),
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    };
  }

  private static mapCustomerRow(customer: CustomerRecord | null): Customer | undefined {
    if (!customer) {
      return undefined;
    }

    return {
      ...customer,
      totalBookings: customer.totalBookings ?? 0,
    } as Customer;
  }

  private static mapBookingRow(booking: BookingRecord | null, service: ServiceRecord | null): Booking | undefined {
    if (!booking) {
      return undefined;
    }

    return {
      ...booking,
      totalAmount: parseDecimal(booking.totalAmount),
      service: this.mapServiceRow(service),
    } as Booking;
  }

  private static mapServiceRow(service: ServiceRecord | null): Service | undefined {
    if (!service) {
      return undefined;
    }

    const { price, homeVisitSurcharge, ...rest } = service;

    return {
      ...rest,
      price: parseDecimal(price),
      homeVisitSurcharge:
        homeVisitSurcharge !== null && homeVisitSurcharge !== undefined
          ? parseDecimal(homeVisitSurcharge)
          : undefined,
    } as Service;
  }

  private static mapTenantRow(tenant: TenantRecord | null): Tenant | undefined {
    return tenant ? (tenant as Tenant) : undefined;
  }
}