import { NextRequest, NextResponse } from 'next/server';
import { salesService } from '@/lib/sales/sales-service';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get('tenantId');
    
    if (!tenantId) {
      return NextResponse.json(
        { error: 'Tenant ID is required' },
        { status: 400 }
      );
    }

    // Parse filters
    const filters: any = {};
    
    if (searchParams.get('dateFrom')) {
      filters.dateFrom = new Date(searchParams.get('dateFrom')!);
    }
    
    if (searchParams.get('dateTo')) {
      filters.dateTo = new Date(searchParams.get('dateTo')!);
    }
    
    if (searchParams.get('customerId')) {
      filters.customerId = searchParams.get('customerId');
    }
    
    if (searchParams.get('staffId')) {
      filters.staffId = searchParams.get('staffId');
    }
    
    if (searchParams.get('transactionType')) {
      filters.transactionType = searchParams.get('transactionType');
    }
    
    if (searchParams.get('paymentMethod')) {
      filters.paymentMethod = searchParams.get('paymentMethod');
    }
    
    if (searchParams.get('status')) {
      filters.status = searchParams.get('status');
    }
    
    if (searchParams.get('minAmount')) {
      filters.minAmount = parseFloat(searchParams.get('minAmount')!);
    }
    
    if (searchParams.get('maxAmount')) {
      filters.maxAmount = parseFloat(searchParams.get('maxAmount')!);
    }
    
    if (searchParams.get('searchQuery')) {
      filters.searchQuery = searchParams.get('searchQuery');
    }

    const transactions = await salesService.getTransactions(tenantId, filters);
    
    return NextResponse.json({
      success: true,
      transactions,
      total: transactions.length,
    });
  } catch (error) {
    console.error('Error fetching sales transactions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch transactions' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { tenantId, ...transactionData } = body;
    
    if (!tenantId) {
      return NextResponse.json(
        { error: 'Tenant ID is required' },
        { status: 400 }
      );
    }

    // Validate required fields
    const requiredFields = ['customerId', 'type', 'description', 'quantity', 'unitPrice', 'paymentMethod'];
    for (const field of requiredFields) {
      if (!transactionData[field]) {
        return NextResponse.json(
          { error: `${field} is required` },
          { status: 400 }
        );
      }
    }

    // Calculate financial fields
    const subtotal = transactionData.quantity * transactionData.unitPrice;
    const taxAmount = subtotal * (transactionData.taxRate || 0);
    const totalAmount = subtotal + taxAmount - (transactionData.discountAmount || 0);

    const transaction = await salesService.createTransaction({
      ...transactionData,
      tenantId,
      subtotal,
      taxAmount,
      totalAmount,
      paidAmount: 0,
      paymentStatus: 'pending',
      transactionDate: new Date(transactionData.transactionDate || Date.now()),
    });

    return NextResponse.json({
      success: true,
      transaction,
    });
  } catch (error) {
    console.error('Error creating sales transaction:', error);
    return NextResponse.json(
      { error: 'Failed to create transaction' },
      { status: 500 }
    );
  }
}
