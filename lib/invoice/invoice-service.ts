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
  type Service,
  type Customer,
  type Booking,
  type Tenant,
} from '@/types/invoice';
import Decimal from 'decimal.js';

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

  static async createInvoice(tenantId: string, data: CreateInvoiceRequest): Promise<Invoice> {
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

      const { error } = await supabase
        .from('invoices')
        .insert({
          id: invoiceId,
          tenantId,
          customerId: data.customerId,
          bookingId: data.bookingId,
          invoiceNumber,
          status: 'draft',
          issueDate: new Date().toISOString(),
          dueDate: data.dueDate,
          subtotal: subtotal.toNumber(),
          taxRate: taxRate.toNumber(),
          taxAmount: taxAmount.toNumber(),
          discountAmount: discountAmount.toNumber(),
          totalAmount: totalAmount.toNumber(),
          notes: data.notes,
          terms: data.terms,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });

      if (error) {
        console.error('Error creating invoice:', error);
        throw error;
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
        .eq('tenantId', tenantId)
        .eq('id', invoiceId)
        .limit(1)
        .single();

      if (error || !data) {
        return null;
      }

      return {
        id: data.id,
        tenantId: data.tenantId,
        customerId: data.customerId,
        bookingId: data.bookingId,
        invoiceNumber: data.invoiceNumber,
        status: data.status as InvoiceStatus,
        issueDate: new Date(data.issueDate),
        dueDate: new Date(data.dueDate),
        paidDate: data.paidDate ? new Date(data.paidDate) : undefined,
        subtotal: parseDecimal(data.subtotal),
        taxRate: parseDecimal(data.taxRate),
        taxAmount: parseDecimal(data.taxAmount),
        discountAmount: parseDecimal(data.discountAmount),
        totalAmount: parseDecimal(data.totalAmount),
        paymentMethod: data.paymentMethod,
        paymentReference: data.paymentReference,
        items: [],
        notes: data.notes,
        terms: data.terms,
        qrCodeData: data.qrCodeData,
        qrCodeUrl: data.qrCodeUrl,
        createdAt: new Date(data.createdAt),
        updatedAt: new Date(data.updatedAt),
      } as Invoice;
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
        .eq('tenantId', tenantId);

      if (filters?.status?.length) {
        query = query.in('status', filters.status);
      }
      if (filters?.customerId) {
        query = query.eq('customerId', filters.customerId);
      }
      if (filters?.dateFrom) {
        query = query.gte('issueDate', filters.dateFrom);
      }
      if (filters?.dateTo) {
        query = query.lte('issueDate', filters.dateTo);
      }

      const { data, count, error } = await query
        .order('createdAt', { ascending: false })
        .range((page - 1) * limit, page * limit - 1);

      const invoices = (data || []).map(inv => ({
        id: inv.id,
        tenantId: inv.tenantId,
        customerId: inv.customerId,
        invoiceNumber: inv.invoiceNumber,
        status: inv.status as InvoiceStatus,
        issueDate: new Date(inv.issueDate),
        dueDate: new Date(inv.dueDate),
        totalAmount: parseDecimal(inv.totalAmount),
        items: [],
      })) as any;

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
        .eq('tenantId', tenantId);

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
        .eq('tenantId', tenantId);

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
        .select('status, totalAmount')
        .eq('tenantId', tenantId);

      let totalAmount = 0;
      let paidAmount = 0;
      let overdueCount = 0;

      (invoices || []).forEach((inv: any) => {
        const amount = parseDecimal(inv.totalAmount);
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

  static async createInvoiceFromBooking(tenantId: string, bookingId: string): Promise<Invoice> {
    try {
      const supabase = getSupabaseClient();
      const { data: booking } = await supabase
        .from('bookings')
        .select('*')
        .eq('id', bookingId)
        .eq('tenantId', tenantId)
        .limit(1)
        .single();

      if (!booking) {
        throw new Error('Booking not found');
      }

      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 7);

      const invoiceData: CreateInvoiceRequest = {
        customerId: booking.customerId,
        bookingId: booking.id,
        dueDate: dueDate.toISOString(),
        items: [{
          description: 'Service',
          quantity: 1,
          unitPrice: parseDecimal(booking.totalAmount),
          serviceId: booking.serviceId,
        }],
        notes: `Invoice for booking on ${new Date(booking.scheduledAt).toLocaleDateString()}`,
      };

      return this.createInvoice(tenantId, invoiceData);
    } catch (error) {
      console.error('Error creating invoice from booking:', error);
      throw error;
    }
  }

  static async markOverdueInvoices(): Promise<void> {
    try {
      const supabase = getSupabaseClient();
      const now = new Date().toISOString();

      await supabase
        .from('invoices')
        .update({ status: 'overdue', updatedAt: now })
        .eq('status', 'sent')
        .lt('dueDate', now);
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
