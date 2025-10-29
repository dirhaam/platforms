import jsPDF from 'jspdf';
import QRCode from 'qrcode';
import { Buffer } from 'buffer';
import { Invoice } from '@/types/invoice';

const RECEIPT_WIDTH_MM = 80;
const RECEIPT_HEIGHT_MM = 200;

export class InvoicePDFGenerator {
  private pdf: jsPDF;
  private pageWidth: number = RECEIPT_WIDTH_MM;
  private pageHeight: number = RECEIPT_HEIGHT_MM;
  private margin: number = 5;

  constructor() {
    this.pdf = this.createDocument();
    this.refreshPageSize();
  }

  private createDocument() {
    return new jsPDF({
      unit: 'mm',
      orientation: 'portrait',
      format: [RECEIPT_WIDTH_MM, RECEIPT_HEIGHT_MM],
    });
  }

  private refreshPageSize(): void {
    this.pageWidth = this.pdf.internal.pageSize.getWidth();
    this.pageHeight = this.pdf.internal.pageSize.getHeight();
  }

  private ensureSpace(currentY: number, neededHeight: number): number {
    if (currentY + neededHeight <= this.pageHeight - this.margin) {
      return currentY;
    }

    this.pdf.addPage([RECEIPT_WIDTH_MM, RECEIPT_HEIGHT_MM], 'portrait');
    this.refreshPageSize();
    return this.margin;
  }

  private drawDivider(y: number): void {
    this.pdf.setDrawColor(200, 200, 200);
    this.pdf.line(this.margin, y, this.pageWidth - this.margin, y);
    this.pdf.setDrawColor(0, 0, 0);
  }

  private formatCurrency(value: number): string {
    return `Rp ${Number(value || 0).toLocaleString('id-ID')}`;
  }

  private formatDate(date: Date | undefined): string {
    if (!date) return '-';
    return date.toLocaleDateString('id-ID');
  }

  private drawKeyValue(label: string, value: string, y: number): number {
    this.pdf.setFont('helvetica', 'normal');
    this.pdf.text(label, this.margin, y);
    this.pdf.text(value, this.pageWidth - this.margin, y, { align: 'right' });
    return y + 4;
  }

  /**
   * Generate PDF for invoice
   */
  async generateInvoicePDF(invoice: Invoice): Promise<ArrayBuffer> {
    this.pdf = this.createDocument();
    this.pageWidth = this.pdf.internal.pageSize.getWidth();
    this.pageHeight = this.pdf.internal.pageSize.getHeight();

    let yPosition = this.margin;

    // Add header with business branding
    yPosition = await this.addHeader(invoice, yPosition);
    
    // Add invoice details
    yPosition = this.addInvoiceDetails(invoice, yPosition);
    
    // Add customer details
    yPosition = this.addCustomerDetails(invoice, yPosition);
    
    // Add invoice items table
    yPosition = this.addItemsTable(invoice, yPosition);
    
    // Add totals
    yPosition = this.addTotals(invoice, yPosition);
    
    // Add QR code for payment
    yPosition = await this.addQRCode(invoice, yPosition);
    
    // Add footer with terms and notes
    this.addFooter(invoice, yPosition);

    return this.pdf.output('arraybuffer') as ArrayBuffer;
  }

  /**
   * Add header with business branding
   */
  private async addHeader(invoice: Invoice, yPosition: number): Promise<number> {
    const tenant = invoice.tenant;
    const branding = invoice.branding;

    let currentY = this.ensureSpace(yPosition, 25);

    if (branding?.logoUrl) {
      const logo = await this.loadImageData(branding.logoUrl);
      if (logo) {
        const logoWidth = 20;
        const logoHeight = 20;
        const x = (this.pageWidth - logoWidth) / 2;
        this.pdf.addImage(logo.dataUrl, logo.format, x, currentY, logoWidth, logoHeight);
        currentY += logoHeight + 3;
      }
    }

    this.pdf.setFont('helvetica', 'bold');
    this.pdf.setFontSize(12);

    if (branding?.headerText) {
      const headerLines = this.pdf.splitTextToSize(branding.headerText, this.pageWidth - 2 * this.margin);
      this.pdf.text(headerLines, this.pageWidth / 2, currentY, { align: 'center' });
      currentY += headerLines.length * 4 + 2;
    }

    this.pdf.setFontSize(14);
    this.pdf.text(tenant?.businessName || 'Business Name', this.pageWidth / 2, currentY, { align: 'center' });
    currentY += 6;

    this.pdf.setFont('helvetica', 'normal');
    this.pdf.setFontSize(9);

    const infoParts: string[] = [];
    if (tenant?.address) infoParts.push(tenant.address);
    if (tenant?.phone) infoParts.push(`Tel: ${tenant.phone}`);
    if (tenant?.email) infoParts.push(`Email: ${tenant.email}`);

    if (infoParts.length) {
      const lines = this.pdf.splitTextToSize(infoParts.join(' • '), this.pageWidth - 2 * this.margin);
      this.pdf.text(lines, this.pageWidth / 2, currentY, { align: 'center' });
      currentY += lines.length * 4;
    }

    this.pdf.setFont('helvetica', 'bold');
    this.pdf.setFontSize(10);
    this.pdf.text('INVOICE', this.pageWidth / 2, currentY + 4, { align: 'center' });
    currentY += 8;

    this.drawDivider(currentY);
    return currentY + 3;
  }

  /**
   * Add invoice details
   */
  private addInvoiceDetails(invoice: Invoice, yPosition: number): number {
    let currentY = this.ensureSpace(yPosition, 20);
    this.pdf.setFont('helvetica', 'bold');
    this.pdf.setFontSize(10);
    this.pdf.text('Detail Invoice', this.pageWidth / 2, currentY, { align: 'center' });
    currentY += 5;

    this.pdf.setFont('helvetica', 'normal');
    this.pdf.setFontSize(9);
    currentY = this.drawKeyValue('Invoice', invoice.invoiceNumber, currentY);
    currentY = this.drawKeyValue('Tanggal', this.formatDate(invoice.issueDate), currentY);
    currentY = this.drawKeyValue('Jatuh Tempo', this.formatDate(invoice.dueDate), currentY);
    currentY = this.drawKeyValue('Status', invoice.status.toUpperCase(), currentY);

    currentY += 2;
    this.drawDivider(currentY);
    return currentY + 3;
  }

  /**
   * Add customer details
   */
  private addCustomerDetails(invoice: Invoice, yPosition: number): number {
    let currentY = this.ensureSpace(yPosition, 15);
    this.pdf.setFont('helvetica', 'bold');
    this.pdf.setFontSize(10);
    this.pdf.text('Pelanggan', this.pageWidth / 2, currentY, { align: 'center' });
    currentY += 5;

    this.pdf.setFont('helvetica', 'normal');
    this.pdf.setFontSize(9);

    if (invoice.customer) {
      const lines: string[] = [invoice.customer.name];
      if (invoice.customer.phone) lines.push(invoice.customer.phone);
      if (invoice.customer.email) lines.push(invoice.customer.email);
      if (invoice.customer.address) {
        const addressLines = this.pdf.splitTextToSize(
          invoice.customer.address,
          this.pageWidth - 2 * this.margin
        );
        lines.push(...addressLines);
      }

      lines.forEach((line) => {
        currentY = this.ensureSpace(currentY, 4);
        this.pdf.text(line, this.margin, currentY);
        currentY += 4;
      });
    }

    currentY += 1;
    this.drawDivider(currentY);
    return currentY + 3;
  }

  /**
   * Add items table
   */
  private addItemsTable(invoice: Invoice, yPosition: number): number {
    let currentY = this.ensureSpace(yPosition, 10);
    this.pdf.setFont('helvetica', 'bold');
    this.pdf.setFontSize(10);
    this.pdf.text('Rincian Layanan', this.pageWidth / 2, currentY, { align: 'center' });
    currentY += 5;

    this.pdf.setFont('helvetica', 'normal');
    this.pdf.setFontSize(9);

    invoice.items.forEach((item, index) => {
      currentY = this.ensureSpace(currentY, 10);
      const descLines = this.pdf.splitTextToSize(item.description, this.pageWidth - 2 * this.margin);
      this.pdf.text(descLines, this.margin, currentY);
      currentY += descLines.length * 4;

      const detailLine = `${item.quantity} x ${this.formatCurrency(item.unitPrice)} = ${this.formatCurrency(item.totalPrice)}`;
      this.pdf.text(detailLine, this.margin, currentY);
      currentY += 5;

      if (index !== invoice.items.length - 1) {
        this.drawDivider(currentY - 2);
      }
    });

    currentY += 2;
    this.drawDivider(currentY);
    return currentY + 3;
  }

  /**
   * Add totals section
   */
  private addTotals(invoice: Invoice, yPosition: number): number {
    let currentY = this.ensureSpace(yPosition, 20);
    this.pdf.setFont('helvetica', 'normal');
    this.pdf.setFontSize(9);

    currentY = this.drawKeyValue('Subtotal', this.formatCurrency(invoice.subtotal), currentY);

    if (invoice.taxAmount > 0) {
      currentY = this.drawKeyValue(
        `Pajak ${(invoice.taxRate * 100).toFixed(1)}%`,
        this.formatCurrency(invoice.taxAmount),
        currentY,
      );
    }

    if (invoice.discountAmount > 0) {
      currentY = this.drawKeyValue('Diskon', `- ${this.formatCurrency(invoice.discountAmount)}`, currentY);
    }

    this.pdf.setFont('helvetica', 'bold');
    this.pdf.setFontSize(10);
    currentY = this.drawKeyValue('TOTAL', this.formatCurrency(invoice.totalAmount), currentY);

    if (invoice.paymentMethod) {
      this.pdf.setFont('helvetica', 'normal');
      currentY = this.drawKeyValue('Metode Bayar', invoice.paymentMethod.toUpperCase(), currentY);
    }

    currentY += 2;
    this.drawDivider(currentY);
    return currentY + 3;
  }

  /**
   * Add QR code for payment
   */
  private async addQRCode(invoice: Invoice, yPosition: number): Promise<number> {
    if (!invoice.qrCodeData) {
      return yPosition;
    }

    try {
      let currentY = this.ensureSpace(yPosition, 40);

      const qrCodeDataURL = await QRCode.toDataURL(invoice.qrCodeData, {
        width: 256,
        margin: 1
      });

      const size = 30;
      const x = (this.pageWidth - size) / 2;
      this.pdf.addImage(qrCodeDataURL, 'PNG', x, currentY, size, size);
      currentY += size + 4;

      this.pdf.setFontSize(9);
      this.pdf.setFont('helvetica', 'normal');
      this.pdf.text('Scan untuk membayar', this.pageWidth / 2, currentY, { align: 'center' });

      currentY += 3;
      this.drawDivider(currentY);
      return currentY + 3;
    } catch (error) {
      console.error('Error generating QR code:', error);
      return yPosition;
    }
  }

  /**
   * Add footer with terms and notes
   */
  private addFooter(invoice: Invoice, yPosition: number): void {
    let currentY = this.ensureSpace(yPosition, 10);
    this.pdf.setFont('helvetica', 'normal');
    this.pdf.setFontSize(8);

    if (invoice.notes) {
      this.pdf.setFont('helvetica', 'bold');
      this.pdf.text('Catatan', this.margin, currentY);
      currentY += 4;

      this.pdf.setFont('helvetica', 'normal');
      const noteLines = this.pdf.splitTextToSize(invoice.notes, this.pageWidth - 2 * this.margin);
      this.pdf.text(noteLines, this.margin, currentY);
      currentY += noteLines.length * 4 + 2;
    }

    if (invoice.terms) {
      this.pdf.setFont('helvetica', 'bold');
      this.pdf.text('Ketentuan', this.margin, currentY);
      currentY += 4;

      this.pdf.setFont('helvetica', 'normal');
      const termLines = this.pdf.splitTextToSize(invoice.terms, this.pageWidth - 2 * this.margin);
      this.pdf.text(termLines, this.margin, currentY);
      currentY += termLines.length * 4 + 2;
    }

    const footerText = invoice.branding?.footerText?.trim() || 'Terima kasih atas kunjungan Anda!';
    const footerLines = this.pdf.splitTextToSize(footerText, this.pageWidth - 2 * this.margin);
    const footerY = Math.max(currentY, this.pageHeight - this.margin - footerLines.length * 4);
    this.pdf.setFont('helvetica', 'italic');
    this.pdf.text(footerLines, this.pageWidth / 2, footerY, { align: 'center' });
  }

  private async loadImageData(
    url: string
  ): Promise<{ dataUrl: string; format: 'PNG' | 'JPEG' } | null> {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        return null;
      }

      const contentType = response.headers.get('content-type') || 'image/png';
      const format: 'PNG' | 'JPEG' = contentType.includes('jpeg') || contentType.includes('jpg')
        ? 'JPEG'
        : 'PNG';

      if (typeof window === 'undefined') {
        const arrayBuffer = await response.arrayBuffer();
        const base64 = Buffer.from(arrayBuffer).toString('base64');
        return {
          dataUrl: `data:${contentType};base64,${base64}`,
          format,
        };
      }

      const blob = await response.blob();
      return await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onerror = () => reject(new Error('Failed to read logo blob'));
        reader.onload = () => {
          resolve({
            dataUrl: reader.result as string,
            format,
          });
        };
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      console.error('[InvoiceBranding] Failed to load logo image:', error);
      return null;
    }
  }

  /**
   * Generate and download PDF
   */
  async downloadInvoicePDF(invoice: Invoice, filename?: string): Promise<void> {
    await this.generateInvoicePDF(invoice);
    const fileName = filename || `invoice-${invoice.invoiceNumber}.pdf`;
    this.pdf.save(fileName);
  }

  /**
   * Generate PDF as blob for preview
   */
  async generateInvoiceBlob(invoice: Invoice): Promise<Blob> {
    const pdfData = await this.generateInvoicePDF(invoice);
    return new Blob([pdfData], { type: 'application/pdf' });
  }
}