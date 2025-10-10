import { prisma } from '@/lib/database';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

export interface ExportOptions {
  format: 'xlsx' | 'csv' | 'pdf';
  dateRange: {
    startDate: Date;
    endDate: Date;
  };
  includeFields?: string[];
}

export interface ReportConfig {
  title: string;
  description?: string;
  dateRange: {
    startDate: Date;
    endDate: Date;
  };
  sections: ReportSection[];
}

export interface ReportSection {
  title: string;
  type: 'table' | 'chart' | 'metrics';
  data: any[];
  columns?: string[];
}

export class ExportService {
  // Export bookings data
  static async exportBookings(tenantId: string, options: ExportOptions): Promise<Buffer> {
    const bookings = await prisma.booking.findMany({
      where: {
        tenantId,
        createdAt: {
          gte: options.dateRange.startDate,
          lte: options.dateRange.endDate
        }
      },
      include: {
        customer: true,
        service: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    const exportData = bookings.map(booking => ({
      'Booking ID': booking.id,
      'Customer Name': booking.customer.name,
      'Customer Phone': booking.customer.phone,
      'Customer Email': booking.customer.email || '',
      'Service Name': booking.service.name,
      'Scheduled Date': booking.scheduledAt.toLocaleDateString(),
      'Scheduled Time': booking.scheduledAt.toLocaleTimeString(),
      'Duration (minutes)': booking.duration,
      'Status': booking.status,
      'Total Amount': booking.totalAmount,
      'Payment Status': booking.paymentStatus,
      'Is Home Visit': booking.isHomeVisit ? 'Yes' : 'No',
      'Home Visit Address': booking.homeVisitAddress || '',
      'Notes': booking.notes || '',
      'Created Date': booking.createdAt.toLocaleDateString(),
      'Updated Date': booking.updatedAt.toLocaleDateString()
    }));

    return this.generateExport(exportData, options.format, 'Bookings Export');
  }

  // Export customers data
  static async exportCustomers(tenantId: string, options: ExportOptions): Promise<Buffer> {
    const customers = await prisma.customer.findMany({
      where: {
        tenantId,
        createdAt: {
          gte: options.dateRange.startDate,
          lte: options.dateRange.endDate
        }
      },
      include: {
        bookings: {
          where: {
            status: { in: ['completed', 'confirmed'] }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    const exportData = customers.map(customer => ({
      'Customer ID': customer.id,
      'Name': customer.name,
      'Phone': customer.phone,
      'Email': customer.email || '',
      'Address': customer.address || '',
      'Total Bookings': customer.totalBookings,
      'Total Spent': customer.bookings.reduce((sum, booking) => sum + Number(booking.totalAmount), 0),
      'Last Booking': customer.lastBookingAt?.toLocaleDateString() || 'Never',
      'WhatsApp Number': customer.whatsappNumber || '',
      'Notes': customer.notes || '',
      'Created Date': customer.createdAt.toLocaleDateString(),
      'Updated Date': customer.updatedAt.toLocaleDateString()
    }));

    return this.generateExport(exportData, options.format, 'Customers Export');
  }

  // Export services data
  static async exportServices(tenantId: string, options: ExportOptions): Promise<Buffer> {
    const services = await prisma.service.findMany({
      where: {
        tenantId
      },
      include: {
        bookings: {
          where: {
            createdAt: {
              gte: options.dateRange.startDate,
              lte: options.dateRange.endDate
            },
            status: { in: ['completed', 'confirmed'] }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    const exportData = services.map(service => ({
      'Service ID': service.id,
      'Name': service.name,
      'Description': service.description,
      'Duration (minutes)': service.duration,
      'Price': service.price,
      'Category': service.category,
      'Is Active': service.isActive ? 'Yes' : 'No',
      'Home Visit Available': service.homeVisitAvailable ? 'Yes' : 'No',
      'Home Visit Surcharge': service.homeVisitSurcharge || 0,
      'Total Bookings (Period)': service.bookings.length,
      'Total Revenue (Period)': service.bookings.reduce((sum, booking) => sum + Number(booking.totalAmount), 0),
      'Created Date': service.createdAt.toLocaleDateString(),
      'Updated Date': service.updatedAt.toLocaleDateString()
    }));

    return this.generateExport(exportData, options.format, 'Services Export');
  }

  // Export financial data
  static async exportFinancialData(tenantId: string, options: ExportOptions): Promise<Buffer> {
    const bookings = await prisma.booking.findMany({
      where: {
        tenantId,
        createdAt: {
          gte: options.dateRange.startDate,
          lte: options.dateRange.endDate
        },
        status: { in: ['completed', 'confirmed'] }
      },
      include: {
        customer: true,
        service: true
      },
      orderBy: {
        scheduledAt: 'desc'
      }
    });

    const exportData = bookings.map(booking => ({
      'Date': booking.scheduledAt.toLocaleDateString(),
      'Booking ID': booking.id,
      'Customer': booking.customer.name,
      'Service': booking.service.name,
      'Amount': Number(booking.totalAmount),
      'Payment Status': booking.paymentStatus,
      'Status': booking.status,
      'Payment Method': 'Manual', // Placeholder for future payment integration
      'Tax Amount': Number(booking.totalAmount) * 0.1, // Assuming 10% tax
      'Net Amount': Number(booking.totalAmount) * 0.9,
      'Month': booking.scheduledAt.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    }));

    return this.generateExport(exportData, options.format, 'Financial Report');
  }

  // Generate comprehensive business report
  static async generateBusinessReport(tenantId: string, config: ReportConfig): Promise<Buffer> {
    const { startDate, endDate } = config.dateRange;

    // Fetch all necessary data
    const [bookings, customers, services] = await Promise.all([
      prisma.booking.findMany({
        where: {
          tenantId,
          createdAt: { gte: startDate, lte: endDate }
        },
        include: { customer: true, service: true }
      }),
      prisma.customer.findMany({
        where: {
          tenantId,
          createdAt: { gte: startDate, lte: endDate }
        }
      }),
      prisma.service.findMany({
        where: { tenantId },
        include: {
          bookings: {
            where: {
              createdAt: { gte: startDate, lte: endDate },
              status: { in: ['completed', 'confirmed'] }
            }
          }
        }
      })
    ]);

    // Calculate metrics
    const totalBookings = bookings.length;
    const completedBookings = bookings.filter(b => b.status === 'completed').length;
    const totalRevenue = bookings
      .filter(b => ['completed', 'confirmed'].includes(b.status))
      .reduce((sum, b) => sum + Number(b.totalAmount), 0);
    const averageBookingValue = completedBookings > 0 ? totalRevenue / completedBookings : 0;

    // Create PDF report
    const doc = new jsPDF();
    let yPosition = 20;

    // Header
    doc.setFontSize(20);
    doc.text(config.title, 20, yPosition);
    yPosition += 10;

    doc.setFontSize(12);
    doc.text(`Report Period: ${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`, 20, yPosition);
    yPosition += 20;

    // Executive Summary
    doc.setFontSize(16);
    doc.text('Executive Summary', 20, yPosition);
    yPosition += 10;

    doc.setFontSize(12);
    const summaryData = [
      ['Total Bookings', totalBookings.toString()],
      ['Completed Bookings', completedBookings.toString()],
      ['Total Revenue', `IDR ${totalRevenue.toLocaleString()}`],
      ['Average Booking Value', `IDR ${averageBookingValue.toLocaleString()}`],
      ['Total Customers', customers.length.toString()],
      ['Active Services', services.filter(s => s.isActive).length.toString()]
    ];

    (doc as any).autoTable({
      startY: yPosition,
      head: [['Metric', 'Value']],
      body: summaryData,
      theme: 'grid'
    });

    yPosition = (doc as any).lastAutoTable.finalY + 20;

    // Top Services
    if (yPosition > 250) {
      doc.addPage();
      yPosition = 20;
    }

    doc.setFontSize(16);
    doc.text('Top Performing Services', 20, yPosition);
    yPosition += 10;

    const topServices = services
      .map(service => ({
        name: service.name,
        bookings: service.bookings.length,
        revenue: service.bookings.reduce((sum, b) => sum + Number(b.totalAmount), 0)
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);

    const servicesData = topServices.map(service => [
      service.name,
      service.bookings.toString(),
      `IDR ${service.revenue.toLocaleString()}`
    ]);

    (doc as any).autoTable({
      startY: yPosition,
      head: [['Service Name', 'Bookings', 'Revenue']],
      body: servicesData,
      theme: 'grid'
    });

    return Buffer.from(doc.output('arraybuffer'));
  }

  // Generate platform-wide analytics report (for admin)
  static async generatePlatformReport(config: ReportConfig): Promise<Buffer> {
    const { startDate, endDate } = config.dateRange;

    const [tenants, allBookings] = await Promise.all([
      prisma.tenant.findMany({
        include: {
          bookings: {
            where: {
              createdAt: { gte: startDate, lte: endDate },
              status: { in: ['completed', 'confirmed'] }
            }
          }
        }
      }),
      prisma.booking.findMany({
        where: {
          createdAt: { gte: startDate, lte: endDate },
          status: { in: ['completed', 'confirmed'] }
        }
      })
    ]);

    const doc = new jsPDF();
    let yPosition = 20;

    // Header
    doc.setFontSize(20);
    doc.text('Platform Analytics Report', 20, yPosition);
    yPosition += 10;

    doc.setFontSize(12);
    doc.text(`Report Period: ${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`, 20, yPosition);
    yPosition += 20;

    // Platform Overview
    doc.setFontSize(16);
    doc.text('Platform Overview', 20, yPosition);
    yPosition += 10;

    const totalRevenue = allBookings.reduce((sum, b) => sum + Number(b.totalAmount), 0);
    const activeTenants = tenants.filter(t => t.bookings.length > 0).length;

    const platformData = [
      ['Total Tenants', tenants.length.toString()],
      ['Active Tenants', activeTenants.toString()],
      ['Total Bookings', allBookings.length.toString()],
      ['Total Platform Revenue', `IDR ${totalRevenue.toLocaleString()}`],
      ['Average Revenue per Tenant', `IDR ${(totalRevenue / Math.max(activeTenants, 1)).toLocaleString()}`]
    ];

    (doc as any).autoTable({
      startY: yPosition,
      head: [['Metric', 'Value']],
      body: platformData,
      theme: 'grid'
    });

    yPosition = (doc as any).lastAutoTable.finalY + 20;

    // Top Performing Tenants
    if (yPosition > 250) {
      doc.addPage();
      yPosition = 20;
    }

    doc.setFontSize(16);
    doc.text('Top Performing Tenants', 20, yPosition);
    yPosition += 10;

    const topTenants = tenants
      .map(tenant => ({
        businessName: tenant.businessName,
        bookings: tenant.bookings.length,
        revenue: tenant.bookings.reduce((sum, b) => sum + Number(b.totalAmount), 0)
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);

    const tenantsData = topTenants.map(tenant => [
      tenant.businessName,
      tenant.bookings.toString(),
      `IDR ${tenant.revenue.toLocaleString()}`
    ]);

    (doc as any).autoTable({
      startY: yPosition,
      head: [['Business Name', 'Bookings', 'Revenue']],
      body: tenantsData,
      theme: 'grid'
    });

    return Buffer.from(doc.output('arraybuffer'));
  }

  // Helper method to generate exports in different formats
  private static generateExport(data: any[], format: string, filename: string): Buffer {
    switch (format) {
      case 'xlsx':
        return this.generateXLSX(data, filename);
      case 'csv':
        return this.generateCSV(data);
      case 'pdf':
        return this.generatePDF(data, filename);
      default:
        throw new Error(`Unsupported export format: ${format}`);
    }
  }

  private static generateXLSX(data: any[], filename: string): Buffer {
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Data');
    
    return Buffer.from(XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' }));
  }

  private static generateCSV(data: any[]): Buffer {
    if (data.length === 0) return Buffer.from('');
    
    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row => 
        headers.map(header => {
          const value = row[header];
          // Escape commas and quotes in CSV
          if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value;
        }).join(',')
      )
    ].join('\n');
    
    return Buffer.from(csvContent, 'utf-8');
  }

  private static generatePDF(data: any[], filename: string): Buffer {
    const doc = new jsPDF();
    
    doc.setFontSize(16);
    doc.text(filename, 20, 20);
    
    if (data.length > 0) {
      const headers = Object.keys(data[0]);
      const rows = data.map(row => headers.map(header => row[header]));
      
      (doc as any).autoTable({
        startY: 30,
        head: [headers],
        body: rows,
        theme: 'grid',
        styles: { fontSize: 8 }
      });
    }
    
    return Buffer.from(doc.output('arraybuffer'));
  }
}