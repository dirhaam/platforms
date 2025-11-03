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
  showBusinessName?: boolean;
  showHeaderText?: boolean;
}

// Payment record for invoice
export interface InvoicePayment {
  id: string;
  invoiceId: string;
  paymentAmount: number;
  paymentMethod: PaymentMethod;
  paymentReference?: string;
  notes?: string;
  paidAt: Date;
  createdAt: Date;
  updatedAt: Date;
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
  taxPercentage?: number;
  serviceChargeAmount?: number;
  additionalFeesAmount?: number;
  totalAmount: number;
  paidAmount?: number;
  remainingBalance?: number; // totalAmount - paidAmount
  
  // Payment details
  paymentMethod?: PaymentMethod;
  paymentReference?: string;
  paymentHistory?: InvoicePayment[]; // List of all payments
  
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

// Helper function to calculate payment status based on actual payment records
export function getPaymentStatus(invoice: Invoice): PaymentStatus {
  const totalAmount = invoice.totalAmount || 0;
  const paidAmount = invoice.paidAmount || 0;
  
  // If fully paid
  if (paidAmount >= totalAmount && paidAmount > 0) {
    return PaymentStatus.PAID;
  }
  
  // If partial payment
  if (paidAmount > 0 && paidAmount < totalAmount) {
    return PaymentStatus.PARTIAL_PAID;
  }
  
  // If no payment recorded, check if overdue
  if (paidAmount === 0) {
    const now = new Date();
    const dueDate = new Date(invoice.dueDate);
    if (now > dueDate) {
      return PaymentStatus.OVERDUE;
    }
    return PaymentStatus.UNPAID;
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
  dueDate?: string; // ISO string - optional now
  items: CreateInvoiceItemRequest[];
  taxRate?: number;
  discountAmount?: number;
  notes?: string;
  terms?: string;
  paymentReference?: string;
  // Pre-calculated tax/fees (to prevent double calculation when creating invoice from booking)
  preTaxPercentage?: number;
  preServiceChargeAmount?: number;
  preAdditionalFeesAmount?: number;
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