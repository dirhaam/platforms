// Invoice status enum
export enum InvoiceStatus {
  DRAFT = 'draft',
  SENT = 'sent',
  PAID = 'paid',
  OVERDUE = 'overdue',
  CANCELLED = 'cancelled'
}

// Payment status enum
export enum PaymentStatus {
  UNPAID = 'unpaid',
  PARTIAL_PAID = 'partial_paid',
  PAID = 'paid',
  OVERDUE = 'overdue'
}

// Payment method enum
export enum PaymentMethod {
  CASH = 'cash',
  BANK_TRANSFER = 'bank_transfer',
  CREDIT_CARD = 'credit_card',
  DIGITAL_WALLET = 'digital_wallet',
  OTHER = 'other'
}

// Invoice interface
export interface InvoiceBranding {
  logoUrl?: string;
  headerText?: string;
  footerText?: string;
}

export interface Invoice {
  id: string;
  tenantId: string;
  customerId: string;
  bookingId?: string;
  invoiceNumber: string;
  status: InvoiceStatus;
  issueDate: Date;
  dueDate: Date;
  paidDate?: Date;
  
  // Financial details
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  discountAmount: number;
  totalAmount: number;
  paidAmount?: number;
  
  // Payment details
  paymentMethod?: PaymentMethod;
  paymentReference?: string;
  
  // Invoice content
  items: InvoiceItem[];
  notes?: string;
  terms?: string;
  
  // QR code for payment
  qrCodeData?: string;
  qrCodeUrl?: string;
  
  createdAt: Date;
  updatedAt: Date;
  
  // Relations
  customer?: Customer;
  booking?: Booking;
  tenant?: Tenant;
  branding?: InvoiceBranding;
}

// Helper function to calculate payment status based on payment records
export function getPaymentStatus(invoice: Invoice): PaymentStatus {
  // Check if payment has been recorded (via reference or paid date)
  const hasPaymentRecord = invoice.paymentReference || invoice.paidDate;
  
  // If payment record exists (reference or paid date) → PAID
  if (hasPaymentRecord) {
    return PaymentStatus.PAID;
  }
  
  // Check if overdue (no payment record + past due date)
  const now = new Date();
  const isOverdue = now > invoice.dueDate;
  
  if (isOverdue) {
    return PaymentStatus.OVERDUE;
  }
  
  // Default: unpaid
  return PaymentStatus.UNPAID;
}

// Invoice item interface
export interface InvoiceItem {
  id: string;
  invoiceId: string;
  description: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  serviceId?: string;
  
  // Relations
  service?: Service;
}

// Create invoice request
export interface CreateInvoiceRequest {
  customerId: string;
  bookingId?: string;
  dueDate: string; // ISO string
  items: CreateInvoiceItemRequest[];
  taxRate?: number;
  discountAmount?: number;
  notes?: string;
  terms?: string;
  paymentReference?: string;
}

// Create invoice item request
export interface CreateInvoiceItemRequest {
  description: string;
  quantity: number;
  unitPrice: number;
  serviceId?: string;
}

// Update invoice request
export interface UpdateInvoiceRequest {
  status?: InvoiceStatus;
  dueDate?: string;
  paymentMethod?: PaymentMethod;
  paymentReference?: string;
  paidDate?: string;
  notes?: string;
  terms?: string;
}

// Invoice summary for dashboard
export interface InvoiceSummary {
  totalInvoices: number;
  totalAmount: number;
  paidAmount: number;
  pendingAmount: number;
  overdueAmount: number;
  overdueCount: number;
}

// Invoice filters
export interface InvoiceFilters {
  status?: InvoiceStatus[];
  customerId?: string;
  dateFrom?: string;
  dateTo?: string;
  amountMin?: number;
  amountMax?: number;
}

// Invoice export options
export interface InvoiceExportOptions {
  format: 'pdf' | 'xlsx';
  filters?: InvoiceFilters;
  includeItems?: boolean;
  dateRange?: {
    from: string;
    to: string;
  };
}

// QR code payment data
export interface QRCodePaymentData {
  invoiceId: string;
  amount: number;
  currency: string;
  reference: string;
  dueDate: string;
  merchantInfo?: {
    name: string;
    account: string;
    bank?: string;
  };
}

// Import Customer, Booking, Service, Tenant types
import type { Customer, Booking, Service } from './booking';
import type { Tenant } from './database';

export type { Customer, Booking, Service, Tenant };