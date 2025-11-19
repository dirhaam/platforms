import { Invoice, PaymentStatus, getPaymentStatus } from '@/types/invoice';
import { maskPhoneNumberCompact } from '@/lib/utils/phone-masking';
import { JSDOM } from 'jsdom';

export class InvoiceImageGenerator {
  private formatCurrency = (value: number) => `Rp ${Number(value || 0).toLocaleString('id-ID')}`;
  private formatDate = (date?: Date) => (date ? date.toLocaleDateString('id-ID') : '-');

  async generateInvoiceImage(invoice: Invoice): Promise<Buffer> {
    const html = this.generateInvoiceHTML(invoice);
    
    try {
      const { default: html2canvas } = await import('html2canvas');
      const dom = new JSDOM(html, { url: 'http://localhost' });
      
      const element = dom.window.document.querySelector('.invoice-container');
      if (!element) {
        throw new Error('Invoice container not found');
      }
      
      const canvas = await html2canvas(element as any, {
        scale: 2,
        backgroundColor: '#ffffff',
        logging: false,
        useCORS: true,
      });
      
      return new Promise((resolve, reject) => {
        canvas.toBlob((blob) => {
          if (blob) {
            blob.arrayBuffer().then(ab => resolve(Buffer.from(ab)));
          } else {
            reject(new Error('Failed to convert canvas to blob'));
          }
        }, 'image/png');
      });
    } catch (error) {
      console.error('Failed to generate invoice image:', error);
      throw new Error('Failed to generate invoice image');
    }
  }

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
    .invoice-container {
      max-width: 300px;
      margin: 0 auto;
      background: white;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
      border-radius: 12px;
      overflow: hidden;
    }
    .invoice-header {
      background: linear-gradient(135deg, #f3f4f6 0%, #ffffff 100%);
      padding: 20px 20px 16px;
      text-align: center;
      border-bottom: 1px solid #e5e7eb;
    }
    .logo {
      height: 56px;
      width: 56px;
      border-radius: 12px;
      background: #ffffff;
      margin: 0 auto 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: bold;
      font-size: 20px;
      color: #6b7280;
      border: 2px solid #e5e7eb;
    }
    .logo img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      border-radius: 10px;
    }
    .business-name {
      font-size: 20px;
      font-weight: 700;
      color: #111827;
      margin-bottom: 4px;
    }
    .contact {
      font-size: 13px;
      color: #6b7280;
      line-height: 1.5;
    }
    .invoice-info {
      padding: 16px 20px;
      background: #f9fafb;
    }
    .info-grid {
      display: grid;
      grid-template-columns: 100px 1fr;
      gap: 8px;
      font-size: 13px;
    }
    .info-label {
      color: #6b7280;
      font-weight: 500;
    }
    .info-value {
      text-align: right;
      font-weight: 600;
      color: #111827;
    }
    .divider {
      height: 1px;
      background: #e5e7eb;
      margin: 8px 0;
    }
    .section {
      padding: 16px 20px;
    }
    .section-title {
      font-size: 14px;
      font-weight: 700;
      color: #111827;
      margin-bottom: 12px;
      border-bottom: 2px solid #f3f4f6;
      padding-bottom: 8px;
    }
    .customer-name {
      font-weight: 600;
      color: #111827;
      font-size: 16px;
    }
    .customer-phone {
      color: #6b7280;
      font-size: 14px;
      margin-top: 4px;
    }
    .items-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .item {
      padding: 12px;
      background: #f9fafb;
      border-radius: 8px;
      border-left: 3px solid #3b82f6;
    }
    .item-name {
      font-weight: 600;
      color: #111827;
      font-size: 14px;
      margin-bottom: 4px;
    }
    .item-details {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: 6px;
    }
    .item-qty {
      font-size: 12px;
      color: #6b7280;
    }
    .item-price {
      font-weight: 700;
      color: #111827;
      font-size: 15px;
    }
    .totals {
      padding: 16px 20px;
      background: #f9fafb;
    }
    .total-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 8px;
      font-size: 13px;
    }
    .total-row.main {
      margin-top: 12px;
      padding-top: 12px;
      border-top: 2px solid #e5e7eb;
      font-size: 16px;
      font-weight: 700;
      color: #111827;
    }
    .footnotes {
      font-size: 12px;
      color: #6b7280;
      margin-top: 4px;
    }
    .footer {
      text-align: center;
      padding: 16px 20px;
      border-top: 1px solid #e5e7eb;
      font-size: 12px;
      color: #6b7280;
    }
    .branding-highlight {
      background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      color: transparent;
    }
    @media print {
      body { background: white; }
      .invoice-container { box-shadow: none; }
    }
  </style>
</head>
<body>
  <div class="invoice-container">
    <!-- Header -->
    <div class="invoice-header">
      ${branding?.logoUrl ? `
        <div class="logo">
          <img src="${branding.logoUrl}" alt="Logo">
        </div>
      ` : `
        <div class="logo">
          ${branding?.headerText?.charAt(0) || 'I'}
        </div>
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
      <div class="info-grid">
        <div class="info-label">Invoice No</div>
        <div class="info-value">${invoice.invoiceNumber}</div>
      </div>
      <div class="divider"></div>
      <div class="info-grid">
        <div class="info-label">Tanggal</div>
        <div class="info-value">${this.formatDate(invoice.issueDate)}</div>
      </div>
      <div class="divider"></div>
      <div class="info-grid">
        <div class="info-label">Status</div>
        <div class="info-value">${this.getPaymentStatusLabel(invoice)}</div>
      </div>
      ${invoice.cashierName ? `
        <div class="divider"></div>
        <div class="info-grid">
          <div class="info-label">Kasir</div>
          <div class="info-value">${invoice.cashierName}</div>
        </div>
      ` : ''}
    </div>

    <!-- Customer -->
    <div class="section">
      <div class="section-title">Pelanggan</div>
      <div class="customer-name">${invoice.customer?.name}</div>
      ${invoice.customer?.phone ? `
        <div class="customer-phone">${maskPhoneNumberCompact(invoice.customer.phone)}</div>
      ` : ''}
    </div>

    <!-- Items -->
    <div class="section">
      <div class="section-title">Rincian Layanan</div>
      <div class="items-list">
        ${invoice.items.map((item) => `
          <div class="item">
            <div class="item-name">${item.description}</div>
            <div class="item-details">
              <span class="item-qty">${item.quantity} × ${this.formatCurrency(item.unitPrice)}</span>
              <span class="item-price">${this.formatCurrency(item.totalPrice)}</span>
            </div>
          </div>
        `).join('')}
      </div>
    </div>

    <!-- Totals -->
    <div class="totals">
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
          <span style="color: #dc2626">-${this.formatCurrency(invoice.discountAmount)}</span>
        </div>
      ` : ''}
      <div class="total-row main">
        <span class="branding-highlight">Total</span>
        <span class="branding-highlight">${this.formatCurrency(invoice.totalAmount)}</span>
      </div>
      ${invoice.paymentMethod ? `
        <div class="footnotes">
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
