// Sales transaction status enum
export enum SalesTransactionStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  REFUNDED = 'refunded'
}

// Sales transaction source enum
export enum SalesTransactionSource {
  ON_THE_SPOT = 'on_the_spot',
  FROM_BOOKING = 'from_booking'
}

// Payment method enum (aligned with booking)
export enum SalesPaymentMethod {
  CASH = 'cash',
  CARD = 'card',
  TRANSFER = 'transfer',
  QRIS = 'qris'
}

// Sales transaction item interface (for multiple services)
export interface SalesTransactionItem {
  id: string;
  salesTransactionId: string;
  serviceId: string;
  serviceName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  createdAt: Date;
  updatedAt: Date;
}

// Sales transaction payment interface (for split/partial payments)
export interface SalesTransactionPayment {
  id: string;
  salesTransactionId: string;
  paymentAmount: number;
  paymentMethod: SalesPaymentMethod;
  paymentReference?: string;
  paidAt: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Sales transaction interface
export interface SalesTransaction {
  id: string;
  tenantId: string;
  customerId: string;
  transactionNumber: string;
  source: SalesTransactionSource;
  status: SalesTransactionStatus;
  
  // Service details (for backward compatibility with old schema)
  serviceId?: string;
  serviceName?: string;
  duration?: number; // minutes
  isHomeVisit: boolean;
  homeVisitAddress?: string;
  homeVisitCoordinates?: {
    lat: number;
    lng: number;
  };
  
  // Pricing details
  unitPrice?: number;
  homeVisitSurcharge?: number;
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  discountAmount: number;
  totalAmount: number;
  
  // Payment details
  paymentMethod: SalesPaymentMethod;
  paymentStatus: 'pending' | 'paid' | 'partial' | 'refunded';
  paidAmount: number;
  paymentAmount?: number; // Initial payment amount (can be less than total for split payment)
  paymentReference?: string;
  paidAt?: Date;
  
  // Related entities
  bookingId?: string;
  invoiceId?: string;
  
  // Staff information
  staffId?: string;
  staffName?: string;
  
  // Transaction details
  notes?: string;
  scheduledAt?: Date; // For transactions from booking
  completedAt?: Date; // For on-the-spot transactions
  
  // Timestamps
  transactionDate: Date;
  createdAt: Date;
  updatedAt: Date;
  
  // Relations
  customer?: any; // Customer type
  booking?: any; // Booking type
  service?: any; // Service type
  staff?: any; // Staff type
  items?: SalesTransactionItem[]; // Multiple services (new)
  payments?: SalesTransactionPayment[]; // Payment history (new)
}

// Sales summary interface
export interface SalesSummary {
  totalTransactions: number;
  totalRevenue: number;
  totalPaid: number;
  totalPending: number;
  averageTransactionValue: number;
  
  // Breakdown by source
  onTheSpotRevenue: number;
  fromBookingRevenue: number;
  onTheSpotTransactions: number;
  fromBookingTransactions: number;
  
  // Breakdown by service type
  serviceRevenue: number;
  homeVisitRevenue: number;
  
  // Breakdown by payment method
  cashRevenue: number;
  cardRevenue: number;
  transferRevenue: number;
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
  source?: SalesTransactionSource;
  serviceId?: string;
  paymentMethod?: SalesPaymentMethod;
  status?: SalesTransactionStatus;
  isHomeVisit?: boolean;
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
    onTheSpotCount: number;
    fromBookingCount: number;
  }>;
  monthlyRevenue: Array<{
    month: string;
    revenue: number;
    transactionCount: number;
    onTheSpotCount: number;
    fromBookingCount: number;
  }>;
  topServices: Array<{
    serviceId: string;
    serviceName: string;
    revenue: number;
    transactionCount: number;
    homeVisitCount: number;
  }>;
  topCustomers: Array<{
    customerId: string;
    customerName: string;
    revenue: number;
    transactionCount: number;
    onTheSpotCount: number;
    fromBookingCount: number;
  }>;
  sourceBreakdown: Array<{
    source: SalesTransactionSource;
    revenue: number;
    percentage: number;
    transactionCount: number;
  }>;
  paymentMethodBreakdown: Array<{
    method: SalesPaymentMethod;
    revenue: number;
    percentage: number;
    transactionCount: number;
  }>;
}
