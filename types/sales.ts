// Sales transaction status enum
export enum SalesTransactionStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  REFUNDED = 'refunded'
}

// Sales transaction type enum
export enum SalesTransactionType {
  SERVICE = 'service',
  PRODUCT = 'product',
  PACKAGE = 'package',
  CONSULTATION = 'consultation',
  OTHER = 'other'
}

// Payment method enum (reusing from invoice but extending for sales)
export enum SalesPaymentMethod {
  CASH = 'cash',
  BANK_TRANSFER = 'bank_transfer',
  CREDIT_CARD = 'credit_card',
  DIGITAL_WALLET = 'digital_wallet',
  QRIS = 'qris',
  OTHER = 'other'
}

// Sales transaction interface
export interface SalesTransaction {
  id: string;
  tenantId: string;
  customerId: string;
  transactionNumber: string;
  type: SalesTransactionType;
  status: SalesTransactionStatus;
  
  // Transaction details
  description: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  discountAmount: number;
  totalAmount: number;
  notes?: string;
  
  // Payment details
  paymentMethod: SalesPaymentMethod;
  paymentStatus: 'pending' | 'paid' | 'partial' | 'refunded';
  paidAmount: number;
  paymentReference?: string;
  paidAt?: Date;
  
  // Related entities
  bookingId?: string;
  invoiceId?: string;
  serviceId?: string;
  productId?: string;
  
  // Staff information
  staffId?: string;
  staffName?: string;
  
  // Timestamps
  transactionDate: Date;
  createdAt: Date;
  updatedAt: Date;
  
  // Relations
  customer?: any; // Customer type
  booking?: any; // Booking type
  service?: any; // Service type
  staff?: any; // Staff type
}

// Sales summary interface
export interface SalesSummary {
  totalTransactions: number;
  totalRevenue: number;
  totalPaid: number;
  totalPending: number;
  averageTransactionValue: number;
  
  // Breakdown by type
  serviceRevenue: number;
  productRevenue: number;
  packageRevenue: number;
  consultationRevenue: number;
  otherRevenue: number;
  
  // Breakdown by payment method
  cashRevenue: number;
  transferRevenue: number;
  cardRevenue: number;
  digitalWalletRevenue: number;
  qrisRevenue: number;
  otherPaymentRevenue: number;
  
  // Breakdown by status
  completedTransactions: number;
  pendingTransactions: number;
  cancelledTransactions: number;
  refundedTransactions: number;
}

// Sales filters interface
export interface SalesFilters {
  dateFrom?: Date;
  dateTo?: Date;
  customerId?: string;
  staffId?: string;
  transactionType?: SalesTransactionType;
  paymentMethod?: SalesPaymentMethod;
  status?: SalesTransactionStatus;
  minAmount?: number;
  maxAmount?: number;
  searchQuery?: string;
}

// Sales analytics interface
export interface SalesAnalytics {
  dailyRevenue: Array<{
    date: string;
    revenue: number;
    transactionCount: number;
  }>;
  monthlyRevenue: Array<{
    month: string;
    revenue: number;
    transactionCount: number;
  }>;
  topServices: Array<{
    serviceId: string;
    serviceName: string;
    revenue: number;
    transactionCount: number;
  }>;
  topCustomers: Array<{
    customerId: string;
    customerName: string;
    revenue: number;
    transactionCount: number;
  }>;
  paymentMethodBreakdown: Array<{
    method: SalesPaymentMethod;
    revenue: number;
    percentage: number;
    transactionCount: number;
  }>;
}
