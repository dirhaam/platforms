import { NextRequest, NextResponse } from 'next/server';
import { salesService } from '@/lib/sales/sales-service';
import { createClient } from '@supabase/supabase-js';

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
    const { tenantId, type, ...transactionData } = body;
    
    if (!tenantId) {
      return NextResponse.json(
        { error: 'Tenant ID is required' },
        { status: 400 }
      );
    }

    // Resolve tenant subdomain to UUID if needed
    let resolvedTenantId = tenantId;
    const isUUID = tenantId.length === 36 && tenantId.includes('-');
    
    if (!isUUID) {
      // It's a subdomain, lookup the UUID
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      );
      
      const { data: tenant, error: tenantErr } = await supabase
        .from('tenants')
        .select('id')
        .eq('subdomain', tenantId)
        .single();
      
      if (!tenant || tenantErr) {
        return NextResponse.json(
          { error: `Tenant not found: ${tenantId}` },
          { status: 404 }
        );
      }
      resolvedTenantId = tenant.id;
    }

    let transaction;

    if (type === 'on_the_spot') {
      // Create on-the-spot transaction
      const requiredFields = ['customerId', 'serviceId', 'paymentMethod'];
      for (const field of requiredFields) {
        if (!transactionData[field]) {
          return NextResponse.json(
            { error: `${field} is required for on-the-spot transaction` },
            { status: 400 }
          );
        }
      }

      transaction = await salesService.createOnTheSpotTransaction({
        tenantId: resolvedTenantId,
        customerId: transactionData.customerId,
        serviceId: transactionData.serviceId,
        staffId: transactionData.staffId,
        paymentMethod: transactionData.paymentMethod,
        notes: transactionData.notes,
      });
    } else if (type === 'from_booking') {
      // Create transaction from booking
      const requiredFields = ['bookingId', 'customerId', 'serviceId', 'scheduledAt', 'totalAmount', 'paymentMethod'];
      for (const field of requiredFields) {
        if (!transactionData[field]) {
          return NextResponse.json(
            { error: `${field} is required for booking transaction` },
            { status: 400 }
          );
        }
      }

      transaction = await salesService.createTransactionFromBooking({
        tenantId: resolvedTenantId,
        bookingId: transactionData.bookingId,
        customerId: transactionData.customerId,
        serviceId: transactionData.serviceId,
        scheduledAt: new Date(transactionData.scheduledAt),
        isHomeVisit: transactionData.isHomeVisit || false,
        homeVisitAddress: transactionData.homeVisitAddress,
        homeVisitCoordinates: transactionData.homeVisitCoordinates,
        totalAmount: transactionData.totalAmount,
        paymentMethod: transactionData.paymentMethod,
        staffId: transactionData.staffId,
        notes: transactionData.notes,
      });
    } else {
      // Legacy transaction creation
      const requiredFields = ['customerId', 'serviceId', 'serviceName', 'unitPrice', 'paymentMethod'];
      for (const field of requiredFields) {
        if (!transactionData[field]) {
          return NextResponse.json(
            { error: `${field} is required` },
            { status: 400 }
          );
        }
      }

      // Calculate financial fields
      const subtotal = transactionData.unitPrice;
      const taxAmount = subtotal * (transactionData.taxRate || 0);
      const totalAmount = subtotal + taxAmount - (transactionData.discountAmount || 0);

      transaction = await salesService.createTransaction({
        ...transactionData,
        tenantId: resolvedTenantId,
        subtotal,
        taxAmount,
        totalAmount,
        paidAmount: 0,
        paymentStatus: 'pending',
        transactionDate: new Date(transactionData.transactionDate || Date.now()),
      });
    }

    return NextResponse.json({
      success: true,
      transaction,
    });
  } catch (error) {
    console.error('Error creating sales transaction:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to create transaction';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
