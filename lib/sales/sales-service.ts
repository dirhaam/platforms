import { createClient } from '@supabase/supabase-js';
import { 
  SalesTransaction, 
  SalesTransactionStatus, 
  SalesTransactionSource,
  SalesPaymentMethod,
  SalesSummary,
  SalesFilters,
  SalesAnalytics
} from '@/types/sales';
import { v4 as uuidv4 } from 'uuid';

const getSupabaseClient = () => {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
};

const mapToSalesTransaction = (dbData: any): SalesTransaction => {
  return {
    id: dbData.id,
    tenantId: dbData.tenant_id,
    customerId: dbData.customer_id,
    serviceId: dbData.service_id,
    bookingId: dbData.booking_id || undefined,
    transactionNumber: dbData.transaction_number || '',
    source: dbData.source as SalesTransactionSource,
    status: dbData.status as SalesTransactionStatus,
    serviceName: dbData.service_name,
    duration: dbData.duration,
    isHomeVisit: dbData.is_home_visit || false,
    homeVisitAddress: dbData.home_visit_address || undefined,
    homeVisitCoordinates: dbData.home_visit_coordinates || undefined,
    unitPrice: dbData.unit_price || 0,
    homeVisitSurcharge: dbData.home_visit_surcharge || 0,
    subtotal: dbData.subtotal || 0,
    taxRate: dbData.tax_rate || 0,
    taxAmount: dbData.tax_amount || 0,
    discountAmount: dbData.discount_amount || 0,
    totalAmount: dbData.total_amount,
    paymentMethod: dbData.payment_method as SalesPaymentMethod,
    paymentStatus: dbData.payment_status || 'pending',
    paidAmount: dbData.paid_amount || 0,
    paymentReference: dbData.payment_reference || undefined,
    paidAt: dbData.paid_at ? new Date(dbData.paid_at) : undefined,
    staffId: dbData.staff_id || undefined,
    notes: dbData.notes || undefined,
    scheduledAt: dbData.scheduled_at ? new Date(dbData.scheduled_at) : undefined,
    completedAt: dbData.completed_at ? new Date(dbData.completed_at) : undefined,
    transactionDate: dbData.created_at ? new Date(dbData.created_at) : new Date(),
    createdAt: dbData.created_at ? new Date(dbData.created_at) : new Date(),
    updatedAt: dbData.updated_at ? new Date(dbData.updated_at) : new Date(),
  };
};

export class SalesService {
  private static instance: SalesService;

  static getInstance(): SalesService {
    if (!SalesService.instance) {
      SalesService.instance = new SalesService();
    }
    return SalesService.instance;
  }

  private generateTransactionNumber(): string {
    const date = new Date();
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `SALE-${dateStr}-${random}`;
  }

  async createOnTheSpotTransaction(transactionData: {
    tenantId: string;
    customerId: string;
    serviceId: string;
    staffId?: string;
    paymentMethod: SalesPaymentMethod;
    notes?: string;
  }): Promise<SalesTransaction> {
    try {
      const supabase = getSupabaseClient();

      // Fetch service details
      const { data: serviceData, error: serviceError } = await supabase
        .from('services')
        .select('id, name, price, duration, home_visit_surcharge')
        .eq('id', transactionData.serviceId)
        .eq('tenant_id', transactionData.tenantId)
        .single();

      if (serviceError || !serviceData) {
        console.error('Service query error:', {
          serviceId: transactionData.serviceId,
          tenantId: transactionData.tenantId,
          error: serviceError?.message,
          message: serviceError?.message
        });
        throw new Error(`Service not found: ${transactionData.serviceId} for tenant ${transactionData.tenantId}`);
      }

      const unitPrice = serviceData.price || 0;
      const homeVisitSurcharge = 0;
      const subtotal = unitPrice + homeVisitSurcharge;
      const taxAmount = 0;
      const totalAmount = subtotal + taxAmount;

      const newTransaction = {
        id: uuidv4(),
        tenant_id: transactionData.tenantId,
        customer_id: transactionData.customerId,
        service_id: transactionData.serviceId,
        booking_id: null,
        transaction_number: this.generateTransactionNumber(),
        source: SalesTransactionSource.ON_THE_SPOT,
        status: SalesTransactionStatus.COMPLETED,
        service_name: serviceData.name,
        duration: serviceData.duration || 60,
        is_home_visit: false,
        home_visit_address: null,
        home_visit_coordinates: null,
        unit_price: unitPrice,
        home_visit_surcharge: homeVisitSurcharge,
        subtotal,
        tax_rate: 0,
        tax_amount: taxAmount,
        discount_amount: 0,
        total_amount: totalAmount,
        payment_method: transactionData.paymentMethod,
        payment_status: 'paid',
        paid_amount: totalAmount,
        payment_reference: null,
        paid_at: new Date().toISOString(),
        staff_id: transactionData.staffId || null,
        scheduled_at: null,
        completed_at: new Date().toISOString(),
        notes: transactionData.notes || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('sales_transactions')
        .insert(newTransaction)
        .select()
        .single();

      if (error || !data) {
        console.error('Database error:', error);
        throw new Error('Failed to save transaction to database');
      }

      return mapToSalesTransaction(data);
    } catch (error) {
      console.error('Error creating on-the-spot transaction:', error);
      throw error;
    }
  }

  async createTransactionFromBooking(bookingData: {
    tenantId: string;
    bookingId: string;
    customerId: string;
    serviceId: string;
    scheduledAt: Date;
    isHomeVisit: boolean;
    homeVisitAddress?: string;
    homeVisitCoordinates?: { lat: number; lng: number };
    totalAmount: number;
    paymentMethod: SalesPaymentMethod;
    staffId?: string;
    notes?: string;
  }): Promise<SalesTransaction> {
    try {
      const supabase = getSupabaseClient();

      // Fetch service details
      const { data: serviceData, error: serviceError } = await supabase
        .from('services')
        .select('id, name, price, duration, home_visit_surcharge')
        .eq('id', bookingData.serviceId)
        .eq('tenant_id', bookingData.tenantId)
        .single();

      if (serviceError || !serviceData) {
        throw new Error(`Service not found: ${bookingData.serviceId}`);
      }

      const unitPrice = serviceData.price || 0;
      const homeVisitSurcharge = bookingData.isHomeVisit ? (serviceData.home_visit_surcharge || 0) : 0;
      const subtotal = unitPrice + homeVisitSurcharge;
      const taxAmount = 0;

      const newTransaction = {
        id: uuidv4(),
        tenant_id: bookingData.tenantId,
        customer_id: bookingData.customerId,
        service_id: bookingData.serviceId,
        booking_id: bookingData.bookingId,
        transaction_number: this.generateTransactionNumber(),
        source: SalesTransactionSource.FROM_BOOKING,
        status: SalesTransactionStatus.PENDING,
        service_name: serviceData.name,
        duration: serviceData.duration || 60,
        is_home_visit: bookingData.isHomeVisit,
        home_visit_address: bookingData.homeVisitAddress || null,
        home_visit_coordinates: bookingData.homeVisitCoordinates || null,
        unit_price: unitPrice,
        home_visit_surcharge: homeVisitSurcharge,
        subtotal,
        tax_rate: 0,
        tax_amount: taxAmount,
        discount_amount: 0,
        total_amount: bookingData.totalAmount,
        payment_method: bookingData.paymentMethod,
        payment_status: 'pending',
        paid_amount: 0,
        payment_reference: null,
        paid_at: null,
        staff_id: bookingData.staffId || null,
        scheduled_at: bookingData.scheduledAt.toISOString(),
        completed_at: null,
        notes: bookingData.notes || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('sales_transactions')
        .insert(newTransaction)
        .select()
        .single();

      if (error || !data) {
        console.error('Database error:', error);
        throw new Error('Failed to save transaction to database');
      }

      return mapToSalesTransaction(data);
    } catch (error) {
      console.error('Error creating transaction from booking:', error);
      throw error;
    }
  }

  async createTransaction(transactionData: Omit<SalesTransaction, 'id' | 'transactionNumber' | 'createdAt' | 'updatedAt'>): Promise<SalesTransaction> {
    try {
      const supabase = getSupabaseClient();

      const newTransaction = {
        id: uuidv4(),
        tenant_id: transactionData.tenantId,
        customer_id: transactionData.customerId,
        service_id: transactionData.serviceId,
        booking_id: transactionData.bookingId || null,
        transaction_number: this.generateTransactionNumber(),
        source: transactionData.source,
        status: transactionData.status,
        service_name: transactionData.serviceName,
        duration: transactionData.duration,
        is_home_visit: transactionData.isHomeVisit,
        home_visit_address: transactionData.homeVisitAddress || null,
        home_visit_coordinates: transactionData.homeVisitCoordinates || null,
        unit_price: transactionData.unitPrice || 0,
        home_visit_surcharge: transactionData.homeVisitSurcharge || 0,
        subtotal: transactionData.subtotal || 0,
        tax_rate: transactionData.taxRate || 0,
        tax_amount: transactionData.taxAmount || 0,
        discount_amount: transactionData.discountAmount || 0,
        total_amount: transactionData.totalAmount,
        payment_method: transactionData.paymentMethod,
        payment_status: transactionData.paymentStatus || 'pending',
        paid_amount: transactionData.paidAmount || 0,
        payment_reference: transactionData.paymentReference || null,
        paid_at: transactionData.paidAt?.toISOString() || null,
        staff_id: transactionData.staffId || null,
        scheduled_at: transactionData.scheduledAt?.toISOString() || null,
        completed_at: transactionData.completedAt?.toISOString() || null,
        notes: transactionData.notes || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('sales_transactions')
        .insert(newTransaction)
        .select()
        .single();

      if (error || !data) {
        console.error('Database error:', error);
        throw new Error('Failed to save transaction to database');
      }

      return mapToSalesTransaction(data);
    } catch (error) {
      console.error('Error creating sales transaction:', error);
      throw error;
    }
  }

  async getTransaction(transactionId: string, tenantId: string): Promise<SalesTransaction | null> {
    try {
      const supabase = getSupabaseClient();

      const { data, error } = await supabase
        .from('sales_transactions')
        .select()
        .eq('id', transactionId)
        .eq('tenant_id', tenantId)
        .single();

      if (error || !data) {
        return null;
      }

      return mapToSalesTransaction(data);
    } catch (error) {
      console.error('Error getting transaction:', error);
      return null;
    }
  }

  async getTransactions(tenantId: string, filters?: SalesFilters): Promise<SalesTransaction[]> {
    try {
      const supabase = getSupabaseClient();
      let query = supabase.from('sales_transactions').select();

      query = query.eq('tenant_id', tenantId);

      if (filters?.customerId) {
        query = query.eq('customer_id', filters.customerId);
      }
      if (filters?.status) {
        query = query.eq('status', filters.status);
      }
      if (filters?.source) {
        query = query.eq('source', filters.source);
      }
      if (filters?.paymentMethod) {
        query = query.eq('payment_method', filters.paymentMethod);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error || !data) {
        console.error('Database error:', error);
        return [];
      }

      return data.map(mapToSalesTransaction);
    } catch (error) {
      console.error('Error getting transactions:', error);
      return [];
    }
  }

  async updateTransaction(transactionId: string, tenantId: string, updates: Partial<SalesTransaction>): Promise<SalesTransaction> {
    try {
      const supabase = getSupabaseClient();

      const updateData: any = {};
      if (updates.status) updateData.status = updates.status;
      if (updates.notes !== undefined) updateData.notes = updates.notes;
      if (updates.totalAmount !== undefined) updateData.total_amount = updates.totalAmount;

      const { data, error } = await supabase
        .from('sales_transactions')
        .update({ ...updateData, updated_at: new Date().toISOString() })
        .eq('id', transactionId)
        .eq('tenant_id', tenantId)
        .select()
        .single();

      if (error || !data) {
        throw new Error('Failed to update transaction');
      }

      return mapToSalesTransaction(data);
    } catch (error) {
      console.error('Error updating transaction:', error);
      throw error;
    }
  }

  async deleteTransaction(transactionId: string, tenantId: string): Promise<void> {
    try {
      const supabase = getSupabaseClient();

      const { error } = await supabase
        .from('sales_transactions')
        .delete()
        .eq('id', transactionId)
        .eq('tenant_id', tenantId);

      if (error) {
        throw new Error('Failed to delete transaction');
      }
    } catch (error) {
      console.error('Error deleting transaction:', error);
      throw error;
    }
  }

  async getSalesSummary(tenantId: string, filters?: SalesFilters): Promise<SalesSummary> {
    try {
      const supabase = getSupabaseClient();

      const { data, error } = await supabase
        .from('sales_transactions')
        .select()
        .eq('tenant_id', tenantId);

      if (error || !data) {
        return this.getEmptySummary();
      }

      const transactions = data.map(mapToSalesTransaction);
      
      const summary: SalesSummary = {
        totalTransactions: transactions.length,
        totalRevenue: transactions.reduce((sum, t) => sum + t.totalAmount, 0),
        totalPaid: transactions.filter(t => t.status === SalesTransactionStatus.COMPLETED).reduce((sum, t) => sum + t.totalAmount, 0),
        totalPending: transactions.filter(t => t.status === SalesTransactionStatus.PENDING).reduce((sum, t) => sum + t.totalAmount, 0),
        averageTransactionValue: transactions.length > 0 ? transactions.reduce((sum, t) => sum + t.totalAmount, 0) / transactions.length : 0,
        onTheSpotRevenue: transactions.filter(t => t.source === SalesTransactionSource.ON_THE_SPOT).reduce((sum, t) => sum + t.totalAmount, 0),
        fromBookingRevenue: transactions.filter(t => t.source === SalesTransactionSource.FROM_BOOKING).reduce((sum, t) => sum + t.totalAmount, 0),
        onTheSpotTransactions: transactions.filter(t => t.source === SalesTransactionSource.ON_THE_SPOT).length,
        fromBookingTransactions: transactions.filter(t => t.source === SalesTransactionSource.FROM_BOOKING).length,
        serviceRevenue: 0,
        homeVisitRevenue: transactions.filter(t => t.isHomeVisit).reduce((sum, t) => sum + t.totalAmount, 0),
        cashRevenue: transactions.filter(t => t.paymentMethod === SalesPaymentMethod.CASH).reduce((sum, t) => sum + t.totalAmount, 0),
        cardRevenue: transactions.filter(t => t.paymentMethod === SalesPaymentMethod.CARD).reduce((sum, t) => sum + t.totalAmount, 0),
        transferRevenue: transactions.filter(t => t.paymentMethod === SalesPaymentMethod.TRANSFER).reduce((sum, t) => sum + t.totalAmount, 0),
        qrisRevenue: transactions.filter(t => t.paymentMethod === SalesPaymentMethod.QRIS).reduce((sum, t) => sum + t.totalAmount, 0),
        otherPaymentRevenue: 0,
        completedTransactions: transactions.filter(t => t.status === SalesTransactionStatus.COMPLETED).length,
        pendingTransactions: transactions.filter(t => t.status === SalesTransactionStatus.PENDING).length,
        cancelledTransactions: transactions.filter(t => t.status === SalesTransactionStatus.CANCELLED).length,
        refundedTransactions: transactions.filter(t => t.status === SalesTransactionStatus.REFUNDED).length,
      };

      return summary;
    } catch (error) {
      console.error('Error getting sales summary:', error);
      return this.getEmptySummary();
    }
  }

  private getEmptySummary(): SalesSummary {
    return {
      totalTransactions: 0,
      totalRevenue: 0,
      totalPaid: 0,
      totalPending: 0,
      averageTransactionValue: 0,
      onTheSpotRevenue: 0,
      fromBookingRevenue: 0,
      onTheSpotTransactions: 0,
      fromBookingTransactions: 0,
      serviceRevenue: 0,
      homeVisitRevenue: 0,
      cashRevenue: 0,
      cardRevenue: 0,
      transferRevenue: 0,
      qrisRevenue: 0,
      otherPaymentRevenue: 0,
      completedTransactions: 0,
      pendingTransactions: 0,
      cancelledTransactions: 0,
      refundedTransactions: 0,
    };
  }

  async getSalesAnalytics(tenantId: string, filters?: SalesFilters): Promise<SalesAnalytics> {
    return {
      dailyRevenue: [],
      monthlyRevenue: [],
      topServices: [],
      topCustomers: [],
      sourceBreakdown: [],
      paymentMethodBreakdown: [],
    };
  }

  async processPayment(transactionId: string, tenantId: string, paymentData: {
    paymentMethod: SalesPaymentMethod;
    paidAmount: number;
    paymentReference?: string;
  }): Promise<SalesTransaction> {
    const transaction = await this.getTransaction(transactionId, tenantId);
    if (!transaction) {
      throw new Error('Transaction not found');
    }

    return await this.updateTransaction(transactionId, tenantId, {
      status: SalesTransactionStatus.COMPLETED,
      paymentMethod: paymentData.paymentMethod,
    });
  }

  async refundTransaction(transactionId: string, tenantId: string, refundAmount: number, reason?: string): Promise<SalesTransaction> {
    const transaction = await this.getTransaction(transactionId, tenantId);
    if (!transaction) {
      throw new Error('Transaction not found');
    }

    return await this.updateTransaction(transactionId, tenantId, {
      status: SalesTransactionStatus.REFUNDED,
    });
  }

  async getTransactionsByCustomer(customerId: string, tenantId: string): Promise<SalesTransaction[]> {
    return await this.getTransactions(tenantId, { customerId });
  }

  async getTransactionsByStaff(staffId: string, tenantId: string): Promise<SalesTransaction[]> {
    return await this.getTransactions(tenantId, { staffId });
  }

  async searchTransactions(tenantId: string, query: string, filters?: SalesFilters): Promise<SalesTransaction[]> {
    return await this.getTransactions(tenantId, { ...filters, searchQuery: query });
  }

  // NEW: Create transaction with multiple items and split payment support
  async createTransactionWithItems(transactionData: {
    tenantId: string;
    customerId: string;
    items: Array<{ serviceId: string; quantity: number; unitPrice: number }>;
    totalAmount: number;
    paymentAmount: number; // Amount paid now (can be partial)
    paymentMethod: SalesPaymentMethod;
    paymentReference?: string;
    taxRate?: number;
    discountAmount?: number;
    notes?: string;
    bookingId?: string;
  }): Promise<SalesTransaction> {
    try {
      const supabase = getSupabaseClient();

      // Calculate totals
      const subtotal = transactionData.items.reduce(
        (sum, item) => sum + item.quantity * item.unitPrice,
        0
      );
      const taxRate = transactionData.taxRate || 0;
      const taxAmount = subtotal * taxRate;
      const discountAmount = transactionData.discountAmount || 0;
      const totalAmount = subtotal + taxAmount - discountAmount;

      // Determine payment status
      let paymentStatus: 'paid' | 'partial' | 'pending' = 'pending';
      if (transactionData.paymentAmount >= totalAmount) {
        paymentStatus = 'paid';
      } else if (transactionData.paymentAmount > 0) {
        paymentStatus = 'partial';
      }

      // Create transaction
      const transactionId = uuidv4();
      const newTransaction = {
        id: transactionId,
        tenant_id: transactionData.tenantId,
        customer_id: transactionData.customerId,
        booking_id: transactionData.bookingId || null,
        transaction_number: this.generateTransactionNumber(),
        source: SalesTransactionSource.ON_THE_SPOT,
        status: SalesTransactionStatus.COMPLETED,
        service_id: null,
        service_name: null,
        duration: null,
        is_home_visit: false,
        home_visit_address: null,
        unit_price: null,
        home_visit_surcharge: 0,
        subtotal,
        tax_rate: taxRate,
        tax_amount: taxAmount,
        discount_amount: discountAmount,
        total_amount: totalAmount,
        payment_method: transactionData.paymentMethod,
        payment_status: paymentStatus,
        paid_amount: transactionData.paymentAmount,
        payment_amount: transactionData.paymentAmount, // NEW: track initial payment
        payment_reference: transactionData.paymentReference || null,
        paid_at: transactionData.paymentAmount > 0 ? new Date().toISOString() : null,
        staff_id: null,
        scheduled_at: null,
        completed_at: new Date().toISOString(),
        notes: transactionData.notes || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { data: savedTransaction, error: transactionError } = await supabase
        .from('sales_transactions')
        .insert(newTransaction)
        .select()
        .single();

      if (transactionError || !savedTransaction) {
        throw new Error('Failed to create transaction');
      }

      // Insert items
      const items = transactionData.items.map(item => ({
        id: uuidv4(),
        sales_transaction_id: transactionId,
        service_id: item.serviceId,
        service_name: item.serviceId, // Will be replaced with actual service name
        quantity: item.quantity,
        unit_price: item.unitPrice,
        total_price: item.quantity * item.unitPrice,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }));

      const { error: itemsError } = await supabase
        .from('sales_transaction_items')
        .insert(items);

      if (itemsError) {
        throw new Error('Failed to create transaction items');
      }

      // Record initial payment if any
      if (transactionData.paymentAmount > 0) {
        const { error: paymentError } = await supabase
          .from('sales_transaction_payments')
          .insert({
            id: uuidv4(),
            sales_transaction_id: transactionId,
            payment_amount: transactionData.paymentAmount,
            payment_method: transactionData.paymentMethod,
            payment_reference: transactionData.paymentReference || null,
            paid_at: new Date().toISOString(),
            notes: 'Initial payment',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });

        if (paymentError) {
          throw new Error('Failed to record payment');
        }
      }

      return mapToSalesTransaction(savedTransaction);
    } catch (error) {
      console.error('Error creating transaction with items:', error);
      throw error;
    }
  }

  // NEW: Record additional payment for split payment transactions
  async recordPayment(transactionId: string, tenantId: string, paymentData: {
    paymentAmount: number;
    paymentMethod: SalesPaymentMethod;
    paymentReference?: string;
    notes?: string;
  }): Promise<SalesTransaction> {
    try {
      const supabase = getSupabaseClient();

      // Get current transaction
      const { data: transaction, error: fetchError } = await supabase
        .from('sales_transactions')
        .select('*')
        .eq('id', transactionId)
        .eq('tenant_id', tenantId)
        .single();

      if (fetchError || !transaction) {
        throw new Error('Transaction not found');
      }

      // Record payment
      const { error: paymentError } = await supabase
        .from('sales_transaction_payments')
        .insert({
          id: uuidv4(),
          sales_transaction_id: transactionId,
          payment_amount: paymentData.paymentAmount,
          payment_method: paymentData.paymentMethod,
          payment_reference: paymentData.paymentReference || null,
          paid_at: new Date().toISOString(),
          notes: paymentData.notes || null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });

      if (paymentError) {
        throw new Error('Failed to record payment');
      }

      // Calculate new totals
      const newPaidAmount = transaction.paid_amount + paymentData.paymentAmount;
      const totalAmount = transaction.total_amount;

      // Determine new payment status
      let newPaymentStatus: 'paid' | 'partial' | 'pending' = 'pending';
      if (newPaidAmount >= totalAmount) {
        newPaymentStatus = 'paid';
      } else if (newPaidAmount > 0) {
        newPaymentStatus = 'partial';
      }

      // Update transaction
      const { data: updatedTransaction, error: updateError } = await supabase
        .from('sales_transactions')
        .update({
          paid_amount: newPaidAmount,
          payment_status: newPaymentStatus,
          updated_at: new Date().toISOString(),
        })
        .eq('id', transactionId)
        .select()
        .single();

      if (updateError || !updatedTransaction) {
        throw new Error('Failed to update transaction');
      }

      return mapToSalesTransaction(updatedTransaction);
    } catch (error) {
      console.error('Error recording payment:', error);
      throw error;
    }
  }
}

export const salesService = SalesService.getInstance();
