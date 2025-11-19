import { Invoice, getPaymentStatus, PaymentStatus } from '@/types/invoice';
import { maskPhoneNumberCompact } from '@/lib/utils/phone-masking';

export class InvoicePNGGenerator {
  private formatCurrency = (value: number) => `Rp ${Number(value || 0).toLocaleString('id-ID')}`;
  private formatDate = (date?: Date) => (date ? date.toLocaleDateString('id-ID') : '-');

  generateInvoiceHTML(invoice: Invoice): string {
    const branding = invoice?.branding || {};
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: white;
            padding: 20px;
            max-width: 320px;
            margin: 0 auto;
          }
          .invoice-header {
            text-align: center;
            margin-bottom: 20px;
          }
          .logo {
            height: 48px;
            width: 48px;
            border-radius: 8px;
            background: #f3f4f6;
            margin: 0 auto 8px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: bold;
            color: #6b7280;
          }
          .business-name {
            font-size: 18px;
            font-weight: 600;
            color: #111827;
            margin-bottom: 4px;
          }
          .contact {
            font-size: 12px;
            color: #6b7280;
            line-height: 1.4;
          }
          .invoice-info {
            background: #f9fafb;
            padding: 12px;
            border-radius: 8px;
            margin-bottom: 16px;
            font-size: 13px;
          }
          .info-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 4px;
          }
          .info-row:last-child {
            margin-bottom: 0;
          }
          .info-label {
            color: #6b7280;
          }
          .info-value {
            font-weight: 500;
            color: #111827;
          }
          .customer-section {
            margin-bottom: 16px;
          }
          .section-title {
            font-size: 13px;
            font-weight: 600;
            color: #111827;
            margin-bottom: 8px;
            text-align: center;
          }
          .customer-name {
            font-weight: 600;
            color: #111827;
            font-size: 14px;
          }
          .customer-phone {
            color: #6b7280;
            font-size: 13px;
            margin-top: 2px;
          }
          .items-section {
            margin-bottom: 16px;
          }
          .item {
            margin-bottom: 12px;
            padding-bottom: 12px;
            border-bottom: 1px dashed #e5e7eb;
          }
          .item:last-child {
            margin-bottom: 0;
            padding-bottom: 0;
            border-bottom: none;
          }
          .item-name {
            font-weight: 600;
            color: #111827;
            font-size: 13px;
            margin-bottom: 2px;
          }
          .item-details {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 4px;
          }
          .item-qty {
            font-size: 11px;
            color: #6b7280;
          }
          .item-price {
            font-weight: 600;
            color: #111827;
            font-size: 13px;
          }
          .total-section {
            background: #f9fafb;
            padding: 12px;
            border-radius: 8px;
            font-size: 13px;
          }
          .total-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 4px;
          }
          .total-row:last-child {
            margin-bottom: 0;
            margin-top: 8px;
            padding-top: 8px;
            border-top: 1px dashed #e5e7eb;
            font-size: 14px;
            font-weight: 600;
            color: #111827;
          }
          .footer {
            margin-top: 20px;
            text-align: center;
            font-size: 12px;
            color: #6b7280;
            border-top: 1px dashed #e5e7eb;
            padding-top: 12px;
          }
        </style>
      </head>
      <body>
        <div class="invoice-container">
          <!-- Header -->
          <div class="invoice-header">
            ${branding?.logoUrl ? `
              <img src="${branding.logoUrl}" alt="Invoice logo" class="logo">
            ` : `
              <div class="logo">${branding?.headerText?.charAt(0) || 'I'}</div>
            `}
            ${branding?.headerText ? `
              <h1 class="business-name">${branding.headerText}</h1>
            ` : ''}
            <div class="contact">
              ${invoice.tenant?.address ? `<p>${invoice.tenant.address}</p>` : ''}
              ${invoice.tenant?.phone ? `<p>Tel: ${invoice.tenant.phone}</p>` : ''}
              ${invoice.tenant?.email ? `<p>Email: ${invoice.tenant.email}</p>` : ''}
            </div>
          </div>

          <!-- Invoice Info -->
          <div class="invoice-info">
            <div class="info-row">
              <span class="info-label">No. Invoice</span>
              <span class="info-value">${invoice.invoiceNumber}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Tanggal</span>
              <span class="info-value">${this.formatDate(invoice.issueDate)}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Status</span>
              <span class="info-value">${this.getPaymentStatusLabel(invoice)}</span>
            </div>
            ${invoice.cashierName ? `
              <div class="info-row">
                <span class="info-label">Kasir</span>
                <span class="info-value">${invoice.cashierName}</span>
              </div>
            ` : ''}
          </div>

          <!-- Customer -->
          <div class="customer-section">
            <p class="section-title">Pelanggan</p>
            <p class="customer-name">${invoice.customer?.name}</p>
            ${invoice.customer?.phone ? `
              <p class="customer-phone">${maskPhoneNumberCompact(invoice.customer.phone)}</p>
            ` : ''}
          </div>

          <!-- Items -->
          <div class="items-section">
            <p class="section-title">Rincian Layanan</p>
            ${invoice.items.map((item, index) => `
              <div class="item">
                <p class="item-name">${item.description}</p>
                <div class="item-details">
                  <span class="item-qty">${item.quantity} x ${this.formatCurrency(item.unitPrice)}</span>
                  <span class="item-price">${this.formatCurrency(item.totalPrice)}</span>
                </div>
              </div>
            `).join('')}
          </div>

          <!-- Totals -->
          <div class="total-section">
            <div class="total-row">
              <span>Subtotal</span>
              <span>${this.formatCurrency(invoice.subtotal)}</span>
            </div>
            ${Number(invoice.taxPercentage ?? 0) > 0 ? `
              <div class="total-row">
                <span>Pajak ${Number(invoice.taxPercentage).toFixed(2)}%</span>
                <span>${this.formatCurrency(Number(invoice.subtotal) * Number(invoice.taxPercentage ?? 0) / 100)}</span>
              </div>
            ` : ''}
            ${Number(invoice.serviceChargeAmount ?? 0) > 0 ? `
              <div class="total-row">
                <span>Service Charge</span>
                <span>${this.formatCurrency(Number(invoice.serviceChargeAmount ?? 0))}</span>
              </div>
            ` : ''}
            ${Number(invoice.discountAmount ?? 0) > 0 ? `
              <div class="total-row">
                <span>Diskon</span>
                <span>-${this.formatCurrency(invoice.discountAmount)}</span>
              </div>
            ` : ''}
            <div class="total-row">
              <span>Total</span>
              <span>${this.formatCurrency(invoice.totalAmount)}</span>
            </div>
            ${invoice.paymentMethod ? `
              <div style="font-size: 11px; color: #6b7280; margin-top: 4px;">
                <span>Metode: ${invoice.paymentMethod.replace('_', ' ').toUpperCase()}</span>
              </div>
            ` : ''}
          </div>

          <!-- Footer -->
          <div class="footer">
            <p>${branding?.footerText || 'Terima kasih atas kunjungan Anda!'}</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  getPaymentStatusLabel = (invoice: Invoice): string => {
    const paymentStatus = getPaymentStatus(invoice);
    const labels = {
      [PaymentStatus.UNPAID]: 'BELUM DIBAYAR',
      [PaymentStatus.PARTIAL_PAID]: 'SEBAGIAN DIBAYAR',
      [PaymentStatus.PAID]: 'LUNAS',
      [PaymentStatus.OVERDUE]: 'JATUH TEMPO'
    };
    return labels[paymentStatus];
  };
}
