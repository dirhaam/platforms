import { 
  SalesTransaction, 
  SalesTransactionStatus, 
  SalesTransactionType,
  SalesPaymentMethod,
  SalesSummary,
  SalesFilters,
  SalesAnalytics
} from '@/types/sales';
import { v4 as uuidv4 } from 'uuid';

export class SalesService {
  private static instance: SalesService;

  static getInstance(): SalesService {
    if (!SalesService.instance) {
      SalesService.instance = new SalesService();
    }
    return SalesService.instance;
  }

  // Generate unique transaction number
  private generateTransactionNumber(tenantId: string): string {
    const date = new Date();
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `SALE-${dateStr}-${random}`;
  }

  // Create a new sales transaction
  async createTransaction(transactionData: Omit<SalesTransaction, 'id' | 'transactionNumber' | 'createdAt' | 'updatedAt'>): Promise<SalesTransaction> {
    try {
      const transaction: SalesTransaction = {
        ...transactionData,
        id: uuidv4(),
        transactionNumber: this.generateTransactionNumber(transactionData.tenantId),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // TODO: Save to database
      console.log('Creating sales transaction:', transaction);
      
      return transaction;
    } catch (error) {
      console.error('Error creating sales transaction:', error);
      throw new Error('Failed to create sales transaction');
    }
  }

  // Get transaction by ID
  async getTransaction(transactionId: string, tenantId: string): Promise<SalesTransaction | null> {
    try {
      // TODO: Fetch from database
      console.log('Getting transaction:', transactionId);
      
      // Mock data for now
      return null;
    } catch (error) {
      console.error('Error getting transaction:', error);
      throw new Error('Failed to get transaction');
    }
  }

  // Get all transactions for a tenant with filters
  async getTransactions(tenantId: string, filters?: SalesFilters): Promise<SalesTransaction[]> {
    try {
      // TODO: Fetch from database with filters
      console.log('Getting transactions for tenant:', tenantId, filters);
      
      // Mock data for now
      return [];
    } catch (error) {
      console.error('Error getting transactions:', error);
      throw new Error('Failed to get transactions');
    }
  }

  // Update transaction
  async updateTransaction(transactionId: string, tenantId: string, updates: Partial<SalesTransaction>): Promise<SalesTransaction> {
    try {
      // TODO: Update in database
      console.log('Updating transaction:', transactionId, updates);
      
      // Mock data for now
      const existingTransaction = await this.getTransaction(transactionId, tenantId);
      if (!existingTransaction) {
        throw new Error('Transaction not found');
      }

      const updatedTransaction: SalesTransaction = {
        ...existingTransaction,
        ...updates,
        updatedAt: new Date(),
      };

      return updatedTransaction;
    } catch (error) {
      console.error('Error updating transaction:', error);
      throw new Error('Failed to update transaction');
    }
  }

  // Delete transaction
  async deleteTransaction(transactionId: string, tenantId: string): Promise<void> {
    try {
      // TODO: Delete from database
      console.log('Deleting transaction:', transactionId);
    } catch (error) {
      console.error('Error deleting transaction:', error);
      throw new Error('Failed to delete transaction');
    }
  }

  // Get sales summary
  async getSalesSummary(tenantId: string, filters?: SalesFilters): Promise<SalesSummary> {
    try {
      // TODO: Calculate from database
      console.log('Getting sales summary for tenant:', tenantId, filters);
      
      // Mock data for now
      return {
        totalTransactions: 0,
        totalRevenue: 0,
        totalPaid: 0,
        totalPending: 0,
        averageTransactionValue: 0,
        serviceRevenue: 0,
        productRevenue: 0,
        packageRevenue: 0,
        consultationRevenue: 0,
        otherRevenue: 0,
        cashRevenue: 0,
        transferRevenue: 0,
        cardRevenue: 0,
        digitalWalletRevenue: 0,
        qrisRevenue: 0,
        otherPaymentRevenue: 0,
        completedTransactions: 0,
        pendingTransactions: 0,
        cancelledTransactions: 0,
        refundedTransactions: 0,
      };
    } catch (error) {
      console.error('Error getting sales summary:', error);
      throw new Error('Failed to get sales summary');
    }
  }

  // Get sales analytics
  async getSalesAnalytics(tenantId: string, filters?: SalesFilters): Promise<SalesAnalytics> {
    try {
      // TODO: Calculate from database
      console.log('Getting sales analytics for tenant:', tenantId, filters);
      
      // Mock data for now
      return {
        dailyRevenue: [],
        monthlyRevenue: [],
        topServices: [],
        topCustomers: [],
        paymentMethodBreakdown: [],
      };
    } catch (error) {
      console.error('Error getting sales analytics:', error);
      throw new Error('Failed to get sales analytics');
    }
  }

  // Process payment
  async processPayment(transactionId: string, tenantId: string, paymentData: {
    paymentMethod: SalesPaymentMethod;
    paidAmount: number;
    paymentReference?: string;
  }): Promise<SalesTransaction> {
    try {
      const transaction = await this.getTransaction(transactionId, tenantId);
      if (!transaction) {
        throw new Error('Transaction not found');
      }

      const updatedPaymentStatus = paymentData.paidAmount >= transaction.totalAmount ? 'paid' : 
                                   paymentData.paidAmount > 0 ? 'partial' : 'pending';

      return await this.updateTransaction(transactionId, tenantId, {
        paymentMethod: paymentData.paymentMethod,
        paidAmount: paymentData.paidAmount,
        paymentReference: paymentData.paymentReference,
        paymentStatus: updatedPaymentStatus,
        paidAt: paymentData.paidAmount > 0 ? new Date() : undefined,
        status: updatedPaymentStatus === 'paid' ? SalesTransactionStatus.COMPLETED : transaction.status,
      });
    } catch (error) {
      console.error('Error processing payment:', error);
      throw new Error('Failed to process payment');
    }
  }

  // Refund transaction
  async refundTransaction(transactionId: string, tenantId: string, refundAmount: number, reason?: string): Promise<SalesTransaction> {
    try {
      const transaction = await this.getTransaction(transactionId, tenantId);
      if (!transaction) {
        throw new Error('Transaction not found');
      }

      if (refundAmount > transaction.paidAmount) {
        throw new Error('Refund amount cannot exceed paid amount');
      }

      return await this.updateTransaction(transactionId, tenantId, {
        status: SalesTransactionStatus.REFUNDED,
        paymentStatus: 'refunded',
        paidAmount: transaction.paidAmount - refundAmount,
        updatedAt: new Date(),
      });
    } catch (error) {
      console.error('Error refunding transaction:', error);
      throw new Error('Failed to refund transaction');
    }
  }

  // Get transactions by customer
  async getTransactionsByCustomer(customerId: string, tenantId: string): Promise<SalesTransaction[]> {
    try {
      return await this.getTransactions(tenantId, { customerId });
    } catch (error) {
      console.error('Error getting customer transactions:', error);
      throw new Error('Failed to get customer transactions');
    }
  }

  // Get transactions by staff
  async getTransactionsByStaff(staffId: string, tenantId: string): Promise<SalesTransaction[]> {
    try {
      return await this.getTransactions(tenantId, { staffId });
    } catch (error) {
      console.error('Error getting staff transactions:', error);
      throw new Error('Failed to get staff transactions');
    }
  }

  // Search transactions
  async searchTransactions(tenantId: string, query: string, filters?: SalesFilters): Promise<SalesTransaction[]> {
    try {
      return await this.getTransactions(tenantId, { ...filters, searchQuery: query });
    } catch (error) {
      console.error('Error searching transactions:', error);
      throw new Error('Failed to search transactions');
    }
  }
}

export const salesService = SalesService.getInstance();
