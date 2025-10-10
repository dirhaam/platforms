import { prisma } from '@/lib/database';
import { 
  Invoice, 
  InvoiceStatus, 
  PaymentMethod,
  CreateInvoiceRequest, 
  UpdateInvoiceRequest,
  InvoiceSummary,
  InvoiceFilters,
  QRCodePaymentData
} from '@/types/invoice';
import { Decimal } from '@prisma/client/runtime/library';

export class InvoiceService {
  /**
   * Generate unique invoice number
   */
  private static async generateInvoiceNumber(tenantId: string): Promise<string> {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    
    // Get the count of invoices for this tenant in current month
    const count = await prisma.invoice.count({
      where: {
        tenantId,
        createdAt: {
          gte: new Date(year, now.getMonth(), 1),
          lt: new Date(year, now.getMonth() + 1, 1)
        }
      }
    });
    
    const sequence = String(count + 1).padStart(4, '0');
    return `INV-${year}${month}-${sequence}`;
  }

  /**
   * Create a new invoice
   */
  static async createInvoice(tenantId: string, data: CreateInvoiceRequest): Promise<Invoice> {
    const invoiceNumber = await this.generateInvoiceNumber(tenantId);
    
    // Calculate totals
    let subtotal = new Decimal(0);
    const items = data.items.map(item => {
      const itemTotal = new Decimal(item.unitPrice).mul(item.quantity);
      subtotal = subtotal.add(itemTotal);
      return {
        ...item,
        totalPrice: itemTotal
      };
    });
    
    const taxRate = new Decimal(data.taxRate || 0);
    const taxAmount = subtotal.mul(taxRate);
    const discountAmount = new Decimal(data.discountAmount || 0);
    const totalAmount = subtotal.add(taxAmount).sub(discountAmount);
    
    // Generate QR code data for payment
    const qrCodeData = await this.generateQRCodeData({
      invoiceId: '', // Will be set after creation
      amount: totalAmount.toNumber(),
      currency: 'IDR',
      reference: data.paymentReference || invoiceNumber,
      dueDate: data.dueDate,
      merchantInfo: {
        name: '', // Will be populated from tenant data
        account: data.paymentReference || ''
      }
    });

    const invoice = await prisma.invoice.create({
      data: {
        tenantId,
        customerId: data.customerId,
        bookingId: data.bookingId,
        invoiceNumber,
        dueDate: new Date(data.dueDate),
        subtotal,
        taxRate,
        taxAmount,
        discountAmount,
        totalAmount,
        notes: data.notes,
        terms: data.terms,
        qrCodeData: JSON.stringify(qrCodeData),
        items: {
          create: items.map(item => ({
            description: item.description,
            quantity: item.quantity,
            unitPrice: new Decimal(item.unitPrice),
            totalPrice: item.totalPrice,
            serviceId: item.serviceId
          }))
        }
      },
      include: {
        customer: true,
        booking: {
          include: {
            service: true
          }
        },
        items: {
          include: {
            service: true
          }
        },
        tenant: true
      }
    });

    return this.mapPrismaToInvoice(invoice);
  }

  /**
   * Get invoice by ID
   */
  static async getInvoiceById(tenantId: string, invoiceId: string): Promise<Invoice | null> {
    const invoice = await prisma.invoice.findFirst({
      where: {
        id: invoiceId,
        tenantId
      },
      include: {
        customer: true,
        booking: {
          include: {
            service: true
          }
        },
        items: {
          include: {
            service: true
          }
        },
        tenant: true
      }
    });

    return invoice ? this.mapPrismaToInvoice(invoice) : null;
  }

  /**
   * Get invoices with filters
   */
  static async getInvoices(tenantId: string, filters?: InvoiceFilters, page = 1, limit = 20) {
    const where: any = { tenantId };

    if (filters?.status?.length) {
      where.status = { in: filters.status };
    }

    if (filters?.customerId) {
      where.customerId = filters.customerId;
    }

    if (filters?.dateFrom || filters?.dateTo) {
      where.issueDate = {};
      if (filters.dateFrom) {
        where.issueDate.gte = new Date(filters.dateFrom);
      }
      if (filters.dateTo) {
        where.issueDate.lte = new Date(filters.dateTo);
      }
    }

    if (filters?.amountMin !== undefined || filters?.amountMax !== undefined) {
      where.totalAmount = {};
      if (filters.amountMin !== undefined) {
        where.totalAmount.gte = new Decimal(filters.amountMin);
      }
      if (filters.amountMax !== undefined) {
        where.totalAmount.lte = new Decimal(filters.amountMax);
      }
    }

    const [invoices, total] = await Promise.all([
      prisma.invoice.findMany({
        where,
        include: {
          customer: true,
          booking: {
            include: {
              service: true
            }
          },
          items: {
            include: {
              service: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.invoice.count({ where })
    ]);

    return {
      invoices: invoices.map(this.mapPrismaToInvoice),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  }

  /**
   * Update invoice
   */
  static async updateInvoice(tenantId: string, invoiceId: string, data: UpdateInvoiceRequest): Promise<Invoice | null> {
    const updateData: any = {};

    if (data.status) {
      updateData.status = data.status;
      
      // Set paid date if status is paid
      if (data.status === InvoiceStatus.PAID && data.paidDate) {
        updateData.paidDate = new Date(data.paidDate);
      }
    }

    if (data.dueDate) {
      updateData.dueDate = new Date(data.dueDate);
    }

    if (data.paymentMethod) {
      updateData.paymentMethod = data.paymentMethod;
    }

    if (data.paymentReference) {
      updateData.paymentReference = data.paymentReference;
    }

    if (data.notes !== undefined) {
      updateData.notes = data.notes;
    }

    if (data.terms !== undefined) {
      updateData.terms = data.terms;
    }

    const invoice = await prisma.invoice.update({
      where: {
        id: invoiceId,
        tenantId
      },
      data: updateData,
      include: {
        customer: true,
        booking: {
          include: {
            service: true
          }
        },
        items: {
          include: {
            service: true
          }
        },
        tenant: true
      }
    });

    return this.mapPrismaToInvoice(invoice);
  }

  /**
   * Delete invoice
   */
  static async deleteInvoice(tenantId: string, invoiceId: string): Promise<boolean> {
    try {
      await prisma.invoice.delete({
        where: {
          id: invoiceId,
          tenantId
        }
      });
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get invoice summary for dashboard
   */
  static async getInvoiceSummary(tenantId: string): Promise<InvoiceSummary> {
    const [invoices, overdueInvoices] = await Promise.all([
      prisma.invoice.findMany({
        where: { tenantId },
        select: {
          status: true,
          totalAmount: true,
          dueDate: true
        }
      }),
      prisma.invoice.count({
        where: {
          tenantId,
          status: InvoiceStatus.OVERDUE
        }
      })
    ]);

    let totalAmount = new Decimal(0);
    let paidAmount = new Decimal(0);
    let pendingAmount = new Decimal(0);
    let overdueAmount = new Decimal(0);

    invoices.forEach(invoice => {
      totalAmount = totalAmount.add(invoice.totalAmount);
      
      switch (invoice.status) {
        case InvoiceStatus.PAID:
          paidAmount = paidAmount.add(invoice.totalAmount);
          break;
        case InvoiceStatus.OVERDUE:
          overdueAmount = overdueAmount.add(invoice.totalAmount);
          break;
        case InvoiceStatus.SENT:
        case InvoiceStatus.DRAFT:
          pendingAmount = pendingAmount.add(invoice.totalAmount);
          break;
      }
    });

    return {
      totalInvoices: invoices.length,
      totalAmount,
      paidAmount,
      pendingAmount,
      overdueAmount,
      overdueCount: overdueInvoices
    };
  }

  /**
   * Create invoice from booking
   */
  static async createInvoiceFromBooking(tenantId: string, bookingId: string): Promise<Invoice> {
    const booking = await prisma.booking.findFirst({
      where: {
        id: bookingId,
        tenantId
      },
      include: {
        service: true,
        customer: true
      }
    });

    if (!booking) {
      throw new Error('Booking not found');
    }

    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 7); // Due in 7 days

    const invoiceData: CreateInvoiceRequest = {
      customerId: booking.customerId,
      bookingId: booking.id,
      dueDate: dueDate.toISOString(),
      items: [{
        description: booking.service.name,
        quantity: 1,
        unitPrice: booking.totalAmount.toNumber(),
        serviceId: booking.serviceId
      }],
      notes: `Invoice for booking on ${booking.scheduledAt.toLocaleDateString()}`
    };

    return this.createInvoice(tenantId, invoiceData);
  }

  /**
   * Mark overdue invoices
   */
  static async markOverdueInvoices(): Promise<void> {
    const now = new Date();
    
    await prisma.invoice.updateMany({
      where: {
        status: InvoiceStatus.SENT,
        dueDate: {
          lt: now
        }
      },
      data: {
        status: InvoiceStatus.OVERDUE
      }
    });
  }

  /**
   * Generate QR code data for payment
   */
  private static async generateQRCodeData(data: QRCodePaymentData): Promise<string> {
    // This is a simplified QR code data format
    // In production, you would integrate with actual payment providers
    const qrData = {
      type: 'payment',
      amount: data.amount,
      currency: data.currency,
      reference: data.reference,
      dueDate: data.dueDate,
      merchant: data.merchantInfo
    };
    
    return JSON.stringify(qrData);
  }

  /**
   * Map Prisma result to Invoice interface
   */
  private static mapPrismaToInvoice(prismaInvoice: any): Invoice {
    return {
      id: prismaInvoice.id,
      tenantId: prismaInvoice.tenantId,
      customerId: prismaInvoice.customerId,
      bookingId: prismaInvoice.bookingId,
      invoiceNumber: prismaInvoice.invoiceNumber,
      status: prismaInvoice.status as InvoiceStatus,
      issueDate: prismaInvoice.issueDate,
      dueDate: prismaInvoice.dueDate,
      paidDate: prismaInvoice.paidDate,
      subtotal: prismaInvoice.subtotal,
      taxRate: prismaInvoice.taxRate,
      taxAmount: prismaInvoice.taxAmount,
      discountAmount: prismaInvoice.discountAmount,
      totalAmount: prismaInvoice.totalAmount,
      paymentMethod: prismaInvoice.paymentMethod as PaymentMethod,
      paymentReference: prismaInvoice.paymentReference,
      items: prismaInvoice.items?.map((item: any) => ({
        id: item.id,
        invoiceId: item.invoiceId,
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice: item.totalPrice,
        serviceId: item.serviceId,
        service: item.service
      })) || [],
      notes: prismaInvoice.notes,
      terms: prismaInvoice.terms,
      qrCodeData: prismaInvoice.qrCodeData,
      qrCodeUrl: prismaInvoice.qrCodeUrl,
      createdAt: prismaInvoice.createdAt,
      updatedAt: prismaInvoice.updatedAt,
      customer: prismaInvoice.customer,
      booking: prismaInvoice.booking,
      tenant: prismaInvoice.tenant
    };
  }
}