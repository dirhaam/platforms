import jsPDF from 'jspdf';
import QRCode from 'qrcode';
import { Buffer } from 'buffer';
import { Invoice } from '@/types/invoice';

export class InvoicePDFGenerator {
  private pdf: jsPDF;
  private pageWidth: number;
  private pageHeight: number;
  private margin: number = 20;

  constructor() {
    this.pdf = new jsPDF();
    this.pageWidth = this.pdf.internal.pageSize.getWidth();
    this.pageHeight = this.pdf.internal.pageSize.getHeight();
  }

  /**
   * Generate PDF for invoice
   */
  async generateInvoicePDF(invoice: Invoice): Promise<ArrayBuffer> {
    // Reset PDF
    this.pdf = new jsPDF();
    
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

    let currentY = yPosition;

    if (branding?.logoUrl) {
      const logo = await this.loadImageData(branding.logoUrl);
      if (logo) {
        const logoHeight = 24;
        const logoWidth = 24;
        this.pdf.addImage(logo.dataUrl, logo.format, this.margin, currentY, logoWidth, logoHeight);
        currentY += logoHeight + 5;
      }
    }

    if (branding?.headerText) {
      this.pdf.setFontSize(12);
      this.pdf.setFont('helvetica', 'bold');
      const headerLines = this.pdf.splitTextToSize(
        branding.headerText,
        this.pageWidth - 2 * this.margin
      );
      this.pdf.text(headerLines, this.pageWidth / 2, currentY, { align: 'center' });
      currentY += headerLines.length * 5 + 5;
    }

    this.pdf.setFontSize(24);
    this.pdf.setFont('helvetica', 'bold');
    this.pdf.text(tenant?.businessName || 'Business Name', this.margin, currentY);
    currentY += 10;

    this.pdf.setFontSize(10);
    this.pdf.setFont('helvetica', 'normal');
    
    if (tenant?.address) {
      this.pdf.text(tenant.address, this.margin, currentY);
      currentY += 5;
    }
    
    if (tenant?.phone) {
      this.pdf.text(`Phone: ${tenant.phone}`, this.margin, currentY);
      currentY += 5;
    }
    
    if (tenant?.email) {
      this.pdf.text(`Email: ${tenant.email}`, this.margin, currentY);
      currentY += 5;
    }

    this.pdf.setFontSize(20);
    this.pdf.setFont('helvetica', 'bold');
    this.pdf.text('INVOICE', this.pageWidth - this.margin - 30, yPosition + 15);

    return currentY + 15;
  }

  /**
   * Add invoice details
   */
  private addInvoiceDetails(invoice: Invoice, yPosition: number): number {
    this.pdf.setFontSize(10);
    this.pdf.setFont('helvetica', 'normal');

    // Invoice details on the right
    const rightX = this.pageWidth - this.margin - 60;
    
    this.pdf.text(`Invoice #: ${invoice.invoiceNumber}`, rightX, yPosition);
    yPosition += 5;
    
    this.pdf.text(`Issue Date: ${invoice.issueDate.toLocaleDateString()}`, rightX, yPosition);
    yPosition += 5;
    
    this.pdf.text(`Due Date: ${invoice.dueDate.toLocaleDateString()}`, rightX, yPosition);
    yPosition += 5;
    
    this.pdf.text(`Status: ${invoice.status.toUpperCase()}`, rightX, yPosition);

    return yPosition + 10;
  }

  /**
   * Add customer details
   */
  private addCustomerDetails(invoice: Invoice, yPosition: number): number {
    this.pdf.setFontSize(12);
    this.pdf.setFont('helvetica', 'bold');
    this.pdf.text('Bill To:', this.margin, yPosition);
    yPosition += 8;

    this.pdf.setFontSize(10);
    this.pdf.setFont('helvetica', 'normal');
    
    if (invoice.customer) {
      this.pdf.text(invoice.customer.name, this.margin, yPosition);
      yPosition += 5;
      
      if (invoice.customer.email) {
        this.pdf.text(invoice.customer.email, this.margin, yPosition);
        yPosition += 5;
      }
      
      this.pdf.text(invoice.customer.phone, this.margin, yPosition);
      yPosition += 5;
      
      if (invoice.customer.address) {
        this.pdf.text(invoice.customer.address, this.margin, yPosition);
        yPosition += 5;
      }
    }

    return yPosition + 10;
  }

  /**
   * Add items table
   */
  private addItemsTable(invoice: Invoice, yPosition: number): number {
    const tableStartY = yPosition;
    const rowHeight = 8;
    const colWidths = [80, 20, 30, 30]; // Description, Qty, Unit Price, Total
    const colX = [this.margin, this.margin + 80, this.margin + 100, this.margin + 130];

    // Table header
    this.pdf.setFontSize(10);
    this.pdf.setFont('helvetica', 'bold');
    
    // Header background
    this.pdf.setFillColor(240, 240, 240);
    this.pdf.rect(this.margin, yPosition, this.pageWidth - 2 * this.margin, rowHeight, 'F');
    
    // Header text
    this.pdf.text('Description', colX[0] + 2, yPosition + 5);
    this.pdf.text('Qty', colX[1] + 2, yPosition + 5);
    this.pdf.text('Unit Price', colX[2] + 2, yPosition + 5);
    this.pdf.text('Total', colX[3] + 2, yPosition + 5);
    
    yPosition += rowHeight;

    // Table rows
    this.pdf.setFont('helvetica', 'normal');
    
    invoice.items.forEach((item, index) => {
      // Alternate row background
      if (index % 2 === 1) {
        this.pdf.setFillColor(250, 250, 250);
        this.pdf.rect(this.margin, yPosition, this.pageWidth - 2 * this.margin, rowHeight, 'F');
      }
      
      this.pdf.text(item.description, colX[0] + 2, yPosition + 5);
      this.pdf.text(item.quantity.toString(), colX[1] + 2, yPosition + 5);
      this.pdf.text(`Rp ${item.unitPrice.toFixed(2)}`, colX[2] + 2, yPosition + 5);
      this.pdf.text(`Rp ${item.totalPrice.toFixed(2)}`, colX[3] + 2, yPosition + 5);
      
      yPosition += rowHeight;
    });

    // Table border
    this.pdf.setDrawColor(200, 200, 200);
    this.pdf.rect(this.margin, tableStartY, this.pageWidth - 2 * this.margin, yPosition - tableStartY);
    
    // Column separators
    colX.slice(1).forEach(x => {
      this.pdf.line(x, tableStartY, x, yPosition);
    });

    return yPosition + 10;
  }

  /**
   * Add totals section
   */
  private addTotals(invoice: Invoice, yPosition: number): number {
    const rightX = this.pageWidth - this.margin - 60;
    
    this.pdf.setFontSize(10);
    this.pdf.setFont('helvetica', 'normal');

    // Subtotal
    this.pdf.text('Subtotal:', rightX, yPosition);
    this.pdf.text(`Rp ${invoice.subtotal.toFixed(2)}`, rightX + 30, yPosition);
    yPosition += 6;

    // Tax
    if (invoice.taxAmount > 0) {
      this.pdf.text(`Tax (${(invoice.taxRate * 100).toFixed(1)}%):`, rightX, yPosition);
      this.pdf.text(`Rp ${invoice.taxAmount.toFixed(2)}`, rightX + 30, yPosition);
      yPosition += 6;
    }

    // Discount
    if (invoice.discountAmount > 0) {
      this.pdf.text('Discount:', rightX, yPosition);
      this.pdf.text(`-Rp ${invoice.discountAmount.toFixed(2)}`, rightX + 30, yPosition);
      yPosition += 6;
    }

    // Total
    this.pdf.setFont('helvetica', 'bold');
    this.pdf.setFontSize(12);
    this.pdf.text('Total:', rightX, yPosition);
    this.pdf.text(`Rp ${invoice.totalAmount.toFixed(2)}`, rightX + 30, yPosition);

    return yPosition + 15;
  }

  /**
   * Add QR code for payment
   */
  private async addQRCode(invoice: Invoice, yPosition: number): Promise<number> {
    if (!invoice.qrCodeData) {
      return yPosition;
    }

    try {
      // Generate QR code as data URL
      const qrCodeDataURL = await QRCode.toDataURL(invoice.qrCodeData, {
        width: 100,
        margin: 1
      });

      // Add QR code to PDF
      this.pdf.addImage(qrCodeDataURL, 'PNG', this.margin, yPosition, 30, 30);
      
      // Add QR code label
      this.pdf.setFontSize(10);
      this.pdf.setFont('helvetica', 'normal');
      this.pdf.text('Scan to Pay', this.margin, yPosition + 35);

      return yPosition + 45;
    } catch (error) {
      console.error('Error generating QR code:', error);
      return yPosition;
    }
  }

  /**
   * Add footer with terms and notes
   */
  private addFooter(invoice: Invoice, yPosition: number): void {
    // Notes
    if (invoice.notes) {
      this.pdf.setFontSize(10);
      this.pdf.setFont('helvetica', 'bold');
      this.pdf.text('Notes:', this.margin, yPosition);
      yPosition += 6;
      
      this.pdf.setFont('helvetica', 'normal');
      const noteLines = this.pdf.splitTextToSize(invoice.notes, this.pageWidth - 2 * this.margin);
      this.pdf.text(noteLines, this.margin, yPosition);
      yPosition += noteLines.length * 5 + 10;
    }

    // Terms
    if (invoice.terms) {
      this.pdf.setFontSize(10);
      this.pdf.setFont('helvetica', 'bold');
      this.pdf.text('Terms & Conditions:', this.margin, yPosition);
      yPosition += 6;
      
      this.pdf.setFont('helvetica', 'normal');
      const termLines = this.pdf.splitTextToSize(invoice.terms, this.pageWidth - 2 * this.margin);
      this.pdf.text(termLines, this.margin, yPosition);
    }

    // Footer
    const footerY = this.pageHeight - this.margin;
    this.pdf.setFontSize(8);
    this.pdf.setFont('helvetica', 'italic');
    const footerText = invoice.branding?.footerText?.trim() || 'Thank you for your business!';
    const footerLines = this.pdf.splitTextToSize(
      footerText,
      this.pageWidth - 2 * this.margin
    );
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