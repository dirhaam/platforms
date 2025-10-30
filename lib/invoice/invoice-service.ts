import { createClient } from '@supabase/supabase-js';
import {
  Invoice,
  InvoiceStatus,
  PaymentMethod,
  CreateInvoiceRequest,
  UpdateInvoiceRequest,
  InvoiceSummary,
  InvoiceFilters,
  QRCodePaymentData,
  type Customer,
  type Booking,
  type Tenant,
  type InvoiceItem,
} from '@/types/invoice';
import Decimal from 'decimal.js';
import { InvoiceBrandingService } from './invoice-branding-service';

const getSupabaseClient = () => {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
};

const randomUUID = () => {
  if (typeof globalThis.crypto?.randomUUID === 'function') {
    return globalThis.crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2);
};

function parseDecimal(value: string | number | null | undefined): number {
  if (value === null || value === undefined) return 0;
  if (typeof value === 'number') return value;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export class InvoiceService {
  private static async generateInvoiceNumber(tenantId: string): Promise<string> {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const sequence = String(Math.floor(Math.random() * 10000)).padStart(4, '0');
    return `INV-${year}${month}-${sequence}`;
  }

  static async createInvoice(tenantId: string, data: CreateInvoiceRequest, initialStatus?: string, paidAmount?: number): Promise<Invoice> {
    try {
      const supabase = getSupabaseClient();
      const invoiceNumber = await this.generateInvoiceNumber(tenantId);
      const invoiceId = randomUUID();

      let subtotal = new Decimal(0);
      (data.items || []).forEach(item => {
        subtotal = subtotal.add(new Decimal(item.unitPrice).mul(item.quantity));
      });

      const taxRate = new Decimal(data.taxRate || 0);
      const taxAmount = subtotal.mul(taxRate);
      const discountAmount = new Decimal(data.discountAmount || 0);
      const totalAmount = subtotal.add(taxAmount).sub(discountAmount);

      const nowIso = new Date().toISOString();

      const insertData: any = {
        id: invoiceId,
        tenant_id: tenantId,
        customer_id: data.customerId,
        booking_id: data.bookingId,
        invoice_number: invoiceNumber,
        status: initialStatus || 'draft',
        issue_date: nowIso,
        due_date: data.dueDate,
        subtotal: subtotal.toNumber(),
        tax_rate: taxRate.toNumber(),
        tax_amount: taxAmount.toNumber(),
        discount_amount: discountAmount.toNumber(),
        total_amount: totalAmount.toNumber(),
        notes: data.notes,
        terms: data.terms,
        created_at: nowIso,
        updated_at: nowIso,
      };

      // Add paid_amount only if provided (requires migration 0010)
      if (paidAmount !== undefined && paidAmount > 0) {
        insertData.paid_amount = paidAmount;
      }

      const { error } = await supabase
        .from('invoices')
        .insert(insertData);

      if (error) {
        console.error('[InvoiceService] Error inserting invoice into database:', {
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint,
          fullError: error
        });
        throw new Error(`Failed to create invoice: ${error.message || 'Database error'}`);
      }

      const items = (data.items || []).map(item => ({
        id: randomUUID(),
        invoice_id: invoiceId,
        description: item.description,
        quantity: item.quantity,
        unit_price: Number(item.unitPrice),
        total_price: Number(item.unitPrice) * item.quantity,
        service_id: item.serviceId ?? null,
        created_at: nowIso,
        updated_at: nowIso,
      }));

      if (items.length) {
        const { error: itemsError } = await supabase
          .from('invoice_items')
          .insert(items);

        if (itemsError) {
          console.error('Error creating invoice items:', itemsError);
          throw itemsError;
        }
      }

      return this.getInvoiceById(tenantId, invoiceId) as Promise<Invoice>;
    } catch (error) {
      console.error('Error creating invoice:', error);
      throw error;
    }
  }

  static async getInvoiceById(tenantId: string, invoiceId: string): Promise<Invoice | null> {
    try {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from('invoices')
        .select('*')
        .eq('tenant_id', tenantId)
        .eq('id', invoiceId)
        .limit(1)
        .single();

      if (error || !data) {
        return null;
      }

      const baseInvoice: Invoice = {
        id: data.id,
        tenantId: data.tenantId ?? data.tenant_id,
        customerId: data.customerId ?? data.customer_id,
        bookingId: data.bookingId ?? data.booking_id,
        invoiceNumber: data.invoiceNumber ?? data.invoice_number,
        status: (data.status as InvoiceStatus) ?? InvoiceStatus.DRAFT,
        issueDate: new Date(data.issueDate ?? data.issue_date),
        dueDate: new Date(data.dueDate ?? data.due_date),
        paidDate: data.paidDate ? new Date(data.paidDate) : data.paid_date ? new Date(data.paid_date) : undefined,
        subtotal: parseDecimal(data.subtotal),
        taxRate: parseDecimal(data.taxRate ?? data.tax_rate),
        taxAmount: parseDecimal(data.taxAmount ?? data.tax_amount),
        discountAmount: parseDecimal(data.discountAmount ?? data.discount_amount),
        totalAmount: parseDecimal(data.totalAmount ?? data.total_amount),
        paidAmount: parseDecimal(data.paidAmount ?? data.paid_amount),
        paymentMethod: data.paymentMethod ?? data.payment_method,
        paymentReference: data.paymentReference ?? data.payment_reference,
        items: [],
        notes: data.notes,
        terms: data.terms,
        qrCodeData: data.qrCodeData ?? data.qr_code_data,
        qrCodeUrl: data.qrCodeUrl ?? data.qr_code_url,
        createdAt: new Date(data.createdAt ?? data.created_at),
        updatedAt: new Date(data.updatedAt ?? data.updated_at),
      } as Invoice;

      const [itemsResult, customerResult, tenantResult, paymentsResult] = await Promise.all([
        supabase
          .from('invoice_items')
          .select('*')
          .eq('invoice_id', invoiceId),
        data.customerId || data.customer_id
          ? supabase
              .from('customers')
              .select('*')
              .eq('id', data.customerId ?? data.customer_id)
              .limit(1)
              .single()
          : Promise.resolve({ data: null, error: null } as { data: any; error: any }),
        supabase
          .from('tenants')
          .select('*')
          .eq('id', tenantId)
          .limit(1)
          .single(),
        // Query payments from sales_transaction_payments (if this invoice is from a sales transaction)
        Promise.resolve(
          supabase
            .from('sales_transactions')
            .select('id')
            .eq('invoice_id', invoiceId)
            .limit(1)
            .single()
        )
          .then(async (transResult) => {
            if (transResult.data?.id) {
              return supabase
                .from('sales_transaction_payments')
                .select('*')
                .eq('sales_transaction_id', transResult.data.id)
                .order('paid_at', { ascending: true });
            }
            return { data: null, error: null };
          })
          .catch(() => ({ data: null, error: null })),
      ]);

      if (!itemsResult.error && Array.isArray(itemsResult.data)) {
        baseInvoice.items = itemsResult.data.map(this.mapInvoiceItem);
      } else if (itemsResult.error) {
        console.error('Error fetching invoice items:', itemsResult.error);
      }

      if (!customerResult.error && customerResult.data) {
        baseInvoice.customer = this.mapCustomer(customerResult.data);
      } else if (customerResult.error) {
        console.error('Error fetching customer:', customerResult.error);
      }

      if (!tenantResult.error && tenantResult.data) {
        baseInvoice.tenant = this.mapTenant(tenantResult.data);
      } else if (tenantResult.error) {
        console.error('Error fetching tenant:', tenantResult.error);
      }

      // Process payment history
      if (paymentsResult && Array.isArray(paymentsResult.data)) {
        baseInvoice.paymentHistory = paymentsResult.data.map((payment: any) => ({
          id: payment.id,
          invoiceId,
          paymentAmount: parseDecimal(payment.payment_amount),
          paymentMethod: payment.payment_method,
          paymentReference: payment.payment_reference,
          notes: payment.notes,
          paidAt: new Date(payment.paid_at),
          createdAt: new Date(payment.created_at),
          updatedAt: new Date(payment.updated_at),
        }));

        // Calculate total paid amount from payment history
        const totalPaid = baseInvoice.paymentHistory.reduce(
          (sum, payment) => sum + payment.paymentAmount,
          0
        );
        baseInvoice.paidAmount = totalPaid;
        baseInvoice.remainingBalance = baseInvoice.totalAmount - totalPaid;
      } else {
        baseInvoice.remainingBalance = baseInvoice.totalAmount - (baseInvoice.paidAmount || 0);
      }

      baseInvoice.branding = await InvoiceBrandingService.getSettings(tenantId);

      return baseInvoice;
    } catch (error) {
      console.error('Error fetching invoice:', error);
      return null;
    }
  }

  static async getInvoices(tenantId: string, filters?: InvoiceFilters, page = 1, limit = 20) {
    try {
      const supabase = getSupabaseClient();
      let query = supabase
        .from('invoices')
        .select('*', { count: 'exact' })
        .eq('tenant_id', tenantId);

      if (filters?.status?.length) {
        query = query.in('status', filters.status);
      }
      if (filters?.customerId) {
        query = query.eq('customer_id', filters.customerId);
      }
      if (filters?.dateFrom) {
        query = query.gte('issue_date', filters.dateFrom);
      }
      if (filters?.dateTo) {
        query = query.lte('issue_date', filters.dateTo);
      }
      if (filters?.amountMin !== undefined) {
        query = query.gte('total_amount', filters.amountMin);
      }
      if (filters?.amountMax !== undefined) {
        query = query.lte('total_amount', filters.amountMax);
      }

      const { data, count, error } = await query
        .order('createdAt', { ascending: false })
        .range((page - 1) * limit, page * limit - 1);

      const rows = data || [];

      const customerIds = Array.from(
        new Set(
          rows
            .map(inv => inv.customerId ?? inv.customer_id)
            .filter((id): id is string => Boolean(id))
        )
      );

      const customersMap = new Map<string, Customer>();

      if (customerIds.length) {
        const { data: customersData, error: customersError } = await supabase
          .from('customers')
          .select('*')
          .in('id', customerIds);

        if (customersError) {
          console.error('Error fetching invoice customers:', customersError);
        } else if (Array.isArray(customersData)) {
          customersData.forEach(customer => {
            const mapped = this.mapCustomer(customer);
            customersMap.set(mapped.id, mapped);
          });
        }
      }

      const invoices = rows.map(inv => {
        const tenantIdentifier = inv.tenantId ?? inv.tenant_id;
        const customerIdentifier = inv.customerId ?? inv.customer_id;
        const mappedCustomer = customersMap.get(customerIdentifier);

        return {
          id: inv.id,
          tenantId: tenantIdentifier,
          customerId: customerIdentifier,
          invoiceNumber: inv.invoiceNumber ?? inv.invoice_number,
          status: (inv.status as InvoiceStatus) ?? InvoiceStatus.DRAFT,
          issueDate: new Date(inv.issueDate ?? inv.issue_date),
          dueDate: new Date(inv.dueDate ?? inv.due_date),
          totalAmount: parseDecimal(inv.totalAmount ?? inv.total_amount),
          paidAmount: parseDecimal(inv.paidAmount ?? inv.paid_amount),
          items: [],
          customer: mappedCustomer,
        };
      });

      return {
        invoices,
        total: count || 0,
        page,
        limit,
        totalPages: Math.ceil((count || 0) / limit),
      };
    } catch (error) {
      console.error('Error fetching invoices:', error);
      return {
        invoices: [],
        total: 0,
        page,
        limit,
        totalPages: 0,
      };
    }
  }

  static async updateInvoice(tenantId: string, invoiceId: string, data: UpdateInvoiceRequest): Promise<Invoice | null> {
    try {
      const supabase = getSupabaseClient();
      const updateData: any = {};

      if (data.status) {
        updateData.status = data.status;
        if (data.status === 'paid' && data.paidDate) {
          updateData.paidDate = data.paidDate;
        }
      }
      if (data.dueDate) {
        updateData.dueDate = data.dueDate;
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

      updateData.updatedAt = new Date().toISOString();

      const { error } = await supabase
        .from('invoices')
        .update(updateData)
        .eq('id', invoiceId)
        .eq('tenant_id', tenantId);

      if (error) {
        console.error('Error updating invoice:', error);
        return null;
      }

      return this.getInvoiceById(tenantId, invoiceId);
    } catch (error) {
      console.error('Error updating invoice:', error);
      return null;
    }
  }

  static async deleteInvoice(tenantId: string, invoiceId: string): Promise<boolean> {
    try {
      const supabase = getSupabaseClient();
      const { error } = await supabase
        .from('invoices')
        .delete()
        .eq('id', invoiceId)
        .eq('tenant_id', tenantId);

      return !error;
    } catch (error) {
      console.error('Error deleting invoice:', error);
      return false;
    }
  }

  static async getInvoiceSummary(tenantId: string): Promise<InvoiceSummary> {
    try {
      const supabase = getSupabaseClient();
      const { data: invoices } = await supabase
        .from('invoices')
        .select('status, total_amount')
        .eq('tenant_id', tenantId);

      let totalAmount = 0;
      let paidAmount = 0;
      let overdueCount = 0;

      (invoices || []).forEach((inv: any) => {
        const amount = parseDecimal(inv.total_amount ?? inv.totalAmount);
        totalAmount += amount;
        if (inv.status === 'paid') {
          paidAmount += amount;
        }
        if (inv.status === 'overdue') {
          overdueCount++;
        }
      });

      return {
        totalInvoices: invoices?.length || 0,
        totalAmount,
        paidAmount,
        pendingAmount: totalAmount - paidAmount,
        overdueAmount: 0,
        overdueCount,
      };
    } catch (error) {
      console.error('Error fetching invoice summary:', error);
      return {
        totalInvoices: 0,
        totalAmount: 0,
        paidAmount: 0,
        pendingAmount: 0,
        overdueAmount: 0,
        overdueCount: 0,
      };
    }
  }

  private static mapInvoiceItem(item: any): InvoiceItem {
    const quantity = Number(item.quantity ?? item.qty ?? 0);
    const unitPrice = parseDecimal(item.unitPrice ?? item.unit_price);
    const totalPrice = parseDecimal(
      item.totalPrice ?? item.total_price ?? quantity * unitPrice
    );

    return {
      id: item.id,
      invoiceId: item.invoiceId ?? item.invoice_id,
      description: item.description ?? '',
      quantity,
      unitPrice,
      totalPrice,
      serviceId: item.serviceId ?? item.service_id ?? undefined,
    } as InvoiceItem;
  }

  private static mapCustomer(customer: any): Customer {
    return {
      id: customer.id,
      tenantId: customer.tenantId ?? customer.tenant_id,
      name: customer.name,
      email: customer.email ?? undefined,
      phone: customer.phone ?? '',
      address: customer.address ?? undefined,
      notes: customer.notes ?? undefined,
      totalBookings: Number(customer.totalBookings ?? customer.total_bookings ?? 0),
      lastBookingAt: this.parseDate(customer.lastBookingAt ?? customer.last_booking_at) ?? undefined,
      whatsappNumber: customer.whatsappNumber ?? customer.whatsapp_number ?? undefined,
      createdAt: this.parseDate(customer.createdAt ?? customer.created_at) ?? new Date(),
      updatedAt: this.parseDate(customer.updatedAt ?? customer.updated_at) ?? new Date(),
      bookings: customer.bookings,
    } as Customer;
  }

  private static mapTenant(tenant: any): Tenant {
    return {
      id: tenant.id,
      subdomain: tenant.subdomain,
      emoji: tenant.emoji ?? '🏢',
      businessName: tenant.businessName ?? tenant.business_name ?? '',
      businessCategory: tenant.businessCategory ?? tenant.business_category ?? '',
      ownerName: tenant.ownerName ?? tenant.owner_name ?? '',
      email: tenant.email ?? '',
      phone: tenant.phone ?? '',
      address: tenant.address ?? undefined,
      businessDescription: tenant.businessDescription ?? tenant.business_description ?? undefined,
      logo: tenant.logo ?? undefined,
      brandColors: tenant.brandColors ?? tenant.brand_colors ?? null,
      whatsappEnabled: Boolean(tenant.whatsappEnabled ?? tenant.whatsapp_enabled ?? false),
      homeVisitEnabled: Boolean(tenant.homeVisitEnabled ?? tenant.home_visit_enabled ?? false),
      analyticsEnabled: Boolean(tenant.analyticsEnabled ?? tenant.analytics_enabled ?? false),
      customTemplatesEnabled: Boolean(tenant.customTemplatesEnabled ?? tenant.custom_templates_enabled ?? false),
      multiStaffEnabled: Boolean(tenant.multiStaffEnabled ?? tenant.multi_staff_enabled ?? false),
      subscriptionPlan: tenant.subscriptionPlan ?? tenant.subscription_plan ?? 'basic',
      subscriptionStatus: tenant.subscriptionStatus ?? tenant.subscription_status ?? 'active',
      subscriptionExpiresAt: this.parseDate(tenant.subscriptionExpiresAt ?? tenant.subscription_expires_at),
      passwordHash: tenant.passwordHash ?? tenant.password_hash ?? null,
      lastLoginAt: this.parseDate(tenant.lastLoginAt ?? tenant.last_login_at),
      loginAttempts: Number(tenant.loginAttempts ?? tenant.login_attempts ?? 0),
      lockedUntil: this.parseDate(tenant.lockedUntil ?? tenant.locked_until),
      passwordResetToken: tenant.passwordResetToken ?? tenant.password_reset_token ?? null,
      passwordResetExpires: this.parseDate(tenant.passwordResetExpires ?? tenant.password_reset_expires),
      createdAt: this.parseDate(tenant.createdAt ?? tenant.created_at) ?? new Date(),
      updatedAt: this.parseDate(tenant.updatedAt ?? tenant.updated_at) ?? new Date(),
    } as Tenant;
  }

  private static parseDate(value: any): Date | null {
    if (!value) {
      return null;
    }

    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  static async createInvoiceFromBooking(tenantId: string, bookingId: string): Promise<Invoice> {
    try {
      const supabase = getSupabaseClient();
      const { data: booking } = await supabase
        .from('bookings')
        .select('*')
        .eq('id', bookingId)
        .eq('tenant_id', tenantId)
        .limit(1)
        .single();

      if (!booking) {
        throw new Error('Booking not found');
      }

      const customerId = booking.customer_id;
      const serviceId = booking.service_id;
      const totalAmount = parseDecimal(booking.total_amount);

      let serviceName = 'Service';
      if (serviceId) {
        const { data: service } = await supabase
          .from('services')
          .select('name')
          .eq('id', serviceId)
          .single();
        if (service?.name) {
          serviceName = service.name;
        }
      }

      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 7);

      const invoiceData: CreateInvoiceRequest = {
        customerId,
        bookingId: booking.id,
        dueDate: dueDate.toISOString(),
        items: [{
          description: serviceName,
          quantity: 1,
          unitPrice: totalAmount,
          serviceId,
        }],
        notes: booking.scheduled_at
          ? `Invoice for booking on ${new Date(booking.scheduled_at).toLocaleDateString()}`
          : undefined,
      };

      return this.createInvoice(tenantId, invoiceData);
    } catch (error) {
      console.error('Error creating invoice from booking:', error);
      throw error;
    }
  }

  static async createInvoiceFromSalesTransaction(tenantId: string, transactionId: string): Promise<Invoice> {
    try {
      const supabase = getSupabaseClient();
      const { data: transaction, error: transactionError } = await supabase
        .from('sales_transactions')
        .select('*')
        .eq('id', transactionId)
        .eq('tenant_id', tenantId)
        .limit(1)
        .single();

      if (transactionError || !transaction) {
        throw new Error(`Sales transaction not found: ${transactionError?.message || 'Unknown error'}`);
      }

      if (transaction.invoice_id) {
        const existingInvoice = await this.getInvoiceById(tenantId, transaction.invoice_id);
        if (existingInvoice) {
          return existingInvoice;
        }
      }

      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 7);

      let items: CreateInvoiceRequest['items'] = [];

      // Check if this is a multi-service transaction (has items in sales_transaction_items)
      if (!transaction.service_id && transaction.id) {
        const { data: transactionItems, error: itemsError } = await supabase
          .from('sales_transaction_items')
          .select('*')
          .eq('sales_transaction_id', transaction.id);

        if (!itemsError && Array.isArray(transactionItems) && transactionItems.length > 0) {
          // Multi-service transaction
          items = transactionItems.map(item => ({
            description: item.service_name ?? 'Service',
            quantity: item.quantity ?? 1,
            unitPrice: parseDecimal(item.unit_price ?? 0),
            serviceId: item.service_id ?? undefined,
          }));
        }
      }

      // Single service transaction
      if (items.length === 0) {
        const baseItemPrice = parseDecimal(
          transaction.unit_price ?? transaction.subtotal ?? transaction.total_amount ?? 0
        );

        items = [
          {
            description: transaction.service_name ?? 'Service',
            quantity: 1,
            unitPrice: baseItemPrice,
            serviceId: transaction.service_id ?? undefined,
          },
        ];

        const homeVisitSurcharge = parseDecimal(transaction.home_visit_surcharge ?? 0);
        if (homeVisitSurcharge > 0) {
          items.push({
            description: 'Home Visit Surcharge',
            quantity: 1,
            unitPrice: homeVisitSurcharge,
          });
        }
      }

      const invoiceData: CreateInvoiceRequest = {
        customerId: transaction.customer_id,
        bookingId: transaction.booking_id ?? undefined,
        dueDate: dueDate.toISOString(),
        items,
        taxRate: parseDecimal(transaction.tax_rate ?? 0),
        discountAmount: parseDecimal(transaction.discount_amount ?? 0),
        notes: transaction.transaction_number
          ? `Invoice generated from sales transaction ${transaction.transaction_number}`
          : undefined,
      };

      // Map transaction payment status to invoice status
      let invoiceStatus = 'draft';
      let invoicePaidAmount = 0;
      
      if (transaction.payment_status === 'paid') {
        invoiceStatus = 'paid';
        invoicePaidAmount = parseDecimal(transaction.total_amount ?? 0);
      } else if (transaction.payment_status === 'partial') {
        invoiceStatus = 'sent';
        invoicePaidAmount = parseDecimal(transaction.paid_amount ?? 0);
      }

      const invoice = await this.createInvoice(tenantId, invoiceData, invoiceStatus, invoicePaidAmount);

      await supabase
        .from('sales_transactions')
        .update({ invoice_id: invoice.id, updated_at: new Date().toISOString() })
        .eq('id', transactionId)
        .eq('tenant_id', tenantId);

      return invoice;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      const stack = error instanceof Error ? error.stack : '';
      console.error('[InvoiceService] Error creating invoice from sales transaction:', {
        message: errorMsg,
        stack,
        error
      });
      throw error;
    }
  }

  static async markOverdueInvoices(): Promise<void> {
    try {
      const supabase = getSupabaseClient();
      const now = new Date().toISOString();

      await supabase
        .from('invoices')
        .update({ status: 'overdue', updated_at: now })
        .eq('status', 'sent')
        .lt('due_date', now);
    } catch (error) {
      console.error('Error marking overdue invoices:', error);
    }
  }

  private static async generateQRCodeData(data: QRCodePaymentData): Promise<string> {
    const qrData = {
      type: 'payment',
      amount: data.amount,
      currency: data.currency,
      reference: data.reference,
      dueDate: data.dueDate,
      merchant: data.merchantInfo,
    };
    return JSON.stringify(qrData);
  }
}
