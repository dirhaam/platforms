import { NextRequest, NextResponse } from 'next/server';
import { InvoiceService } from '@/lib/invoice/invoice-service';
import { InvoicePDFGenerator } from '@/lib/invoice/pdf-generator';
import { getTenantFromRequest } from '@/lib/auth/tenant-auth';

function toArrayBuffer(view: Uint8Array): ArrayBuffer {
  const buffer = new ArrayBuffer(view.byteLength);
  new Uint8Array(buffer).set(view);
  return buffer;
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const tenant = await getTenantFromRequest(request);
    if (!tenant) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const invoice = await InvoiceService.getInvoiceById(tenant.id, id);
    
    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    // Generate PDF
    const pdfGenerator = new InvoicePDFGenerator();
    const pdfData = await pdfGenerator.generateInvoicePDF(invoice);
    const payload = new Uint8Array(pdfData);

    // Return PDF as response
    const arrayBuffer = toArrayBuffer(payload);

    return new NextResponse(arrayBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="invoice-${invoice.invoiceNumber}.pdf"`,
        'Content-Length': arrayBuffer.byteLength.toString()
      }
    });
  } catch (error) {
    console.error('Error generating invoice PDF:', error);
    return NextResponse.json(
      { error: 'Failed to generate PDF' },
      { status: 500 }
    );
  }
}