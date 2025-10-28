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

    const body: SendInvoiceWhatsAppPayload = await request.json().catch(() => ({}));

    const targetPhone = body.phoneNumber?.trim() || invoice.customer?.whatsappNumber || invoice.customer?.phone;

    if (!targetPhone) {
      return NextResponse.json({ error: 'Phone number is required' }, { status: 400 });
    }

    const pdfGenerator = new InvoicePDFGenerator();
    const pdfData = await pdfGenerator.generateInvoicePDF(invoice);
    const pdfBytes = new Uint8Array(pdfData);

    const devices = await whatsappService.getTenantDevices(tenant.id);
    const activeDevice = devices.find((device) => device.status === 'connected') || devices[0];

    if (!activeDevice) {
      return NextResponse.json(
        { error: 'No WhatsApp devices available for this tenant' },
        { status: 503 }
      );
    }

    const messageText = body.message?.trim() || `Invoice ${invoice.invoiceNumber}`;

    const sentMessage = await whatsappService.sendMessage(
      tenant.id,
      activeDevice.id,
      targetPhone,
      {
        type: 'document',
        content: messageText,
        caption: messageText,
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
