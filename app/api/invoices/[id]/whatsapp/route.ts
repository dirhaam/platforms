export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { getTenantFromRequest } from '@/lib/auth/tenant-auth';
import { InvoiceService } from '@/lib/invoice/invoice-service';
import { InvoicePDFGenerator } from '@/lib/invoice/pdf-generator';
import { whatsappService } from '@/lib/whatsapp/whatsapp-service';

interface SendInvoiceWhatsAppPayload {
  phoneNumber?: string;
  message?: string;
}

export async function POST(
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

    const contentType = request.headers.get('content-type') || '';
    let targetPhone: string | undefined;
    let messageText: string | undefined;
    let pdfBytes: Uint8Array | undefined;

    if (contentType.includes('multipart/form-data')) {
      // Client-side generated PDF (from canvas capture)
      const formData = await request.formData();
      const pdfFile = formData.get('pdfFile') as File | null;
      targetPhone = (formData.get('phoneNumber') as string)?.trim();
      messageText = (formData.get('message') as string)?.trim();

      if (pdfFile) {
        const arrayBuffer = await pdfFile.arrayBuffer();
        pdfBytes = new Uint8Array(arrayBuffer);
      }
    } else {
      // Fallback to server-side PDF generation for backward compatibility
      const body: SendInvoiceWhatsAppPayload = await request.json().catch(() => ({}));
      targetPhone = body.phoneNumber?.trim();
      messageText = body.message?.trim();

      // Generate PDF server-side as fallback
      const pdfGenerator = new InvoicePDFGenerator();
      const pdfData = await pdfGenerator.generateInvoicePDF(invoice);
      pdfBytes = new Uint8Array(pdfData);
    }

    if (!targetPhone) {
      targetPhone = invoice.customer?.whatsappNumber || invoice.customer?.phone;
    }

    if (!targetPhone) {
      return NextResponse.json({ error: 'Phone number is required' }, { status: 400 });
    }

    if (!pdfBytes) {
      return NextResponse.json({ error: 'PDF file is required' }, { status: 400 });
    }

    const devices = await whatsappService.getTenantDevices(tenant.id);
    const activeDevice = devices.find((device) => device.status === 'connected') || devices[0];

    if (!activeDevice) {
      return NextResponse.json(
        { error: 'No WhatsApp devices available for this tenant' },
        { status: 503 }
      );
    }

    if (!messageText) {
      messageText = `Invoice ${invoice.invoiceNumber}`;
    }

    const sentMessage = await whatsappService.sendMessage(
      tenant.id,
      activeDevice.id,
      targetPhone,
      {
        type: 'document',
        content: messageText,
        filename: `invoice-${invoice.invoiceNumber}.pdf`,
        mimeType: 'application/pdf',
        fileData: pdfBytes,
      }
    );

    return NextResponse.json({ success: true, messageId: sentMessage.id });
  } catch (error) {
    console.error('Error sending invoice via WhatsApp:', error);
    const message = error instanceof Error ? error.message : 'Failed to send invoice via WhatsApp';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
