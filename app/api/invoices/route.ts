import { NextRequest, NextResponse } from 'next/server';
import { InvoiceService } from '@/lib/invoice/invoice-service';
import { CreateInvoiceRequest, InvoiceFilters } from '@/types/invoice';
import { getTenantFromRequest } from '@/lib/auth/tenant-auth';

export async function GET(request: NextRequest) {
  try {
    const tenant = await getTenantFromRequest(request);
    if (!tenant) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    
    // Parse filters
    const filters: InvoiceFilters = {};
    
    const status = searchParams.get('status');
    if (status) {
      filters.status = status.split(',') as any[];
    }
    
    const customerId = searchParams.get('customerId');
    if (customerId) {
      filters.customerId = customerId;
    }
    
    const dateFrom = searchParams.get('dateFrom');
    if (dateFrom) {
      filters.dateFrom = dateFrom;
    }
    
    const dateTo = searchParams.get('dateTo');
    if (dateTo) {
      filters.dateTo = dateTo;
    }
    
    const amountMin = searchParams.get('amountMin');
    if (amountMin) {
      filters.amountMin = parseFloat(amountMin);
    }
    
    const amountMax = searchParams.get('amountMax');
    if (amountMax) {
      filters.amountMax = parseFloat(amountMax);
    }

    // Parse pagination
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    const result = await InvoiceService.getInvoices(tenant.id, filters, page, limit);
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching invoices:', error);
    return NextResponse.json(
      { error: 'Failed to fetch invoices' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const tenant = await getTenantFromRequest(request);
    if (!tenant) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data: CreateInvoiceRequest = await request.json();
    
    // Validate required fields
    if (!data.customerId || !data.items || data.items.length === 0) {
      return NextResponse.json(
        { error: 'Customer ID and items are required' },
        { status: 400 }
      );
    }

    const invoice = await InvoiceService.createInvoice(tenant.id, data);
    
    return NextResponse.json(invoice, { status: 201 });
  } catch (error) {
    console.error('Error creating invoice:', error);
    return NextResponse.json(
      { error: 'Failed to create invoice' },
      { status: 500 }
    );
  }
}