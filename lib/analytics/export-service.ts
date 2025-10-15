import { db } from '@/lib/database/server';
import { bookings, customers, services, tenants } from '@/lib/database/schema';
import { and, eq, gte, lte, inArray, desc } from 'drizzle-orm';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

function toNumber(value: unknown): number {
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
}

type BookingWithRelations = {
  booking: {
    id: string;
    tenantId: string;
    customerId: string;
    serviceId: string;
    scheduledAt: Date;
    duration: number;
    status: string;
    totalAmount: string | number | null;
    paymentStatus: string | null;
    isHomeVisit: boolean | null;
    homeVisitAddress: string | null;
    notes: string | null;
    createdAt: Date;
    updatedAt: Date;
  };
  customer: {
    id: string;
    name: string;
    phone: string;
    email: string | null;
    lastBookingAt: Date | null;
    whatsappNumber: string | null;
    address: string | null;
    notes: string | null;
    totalBookings: number | null;
    createdAt: Date;
    updatedAt: Date;
  } | null;
  service: {
    id: string;
    name: string;
    description: string;
    duration: number;
    price: string | number;
    category: string;
    homeVisitAvailable: boolean | null;
    homeVisitSurcharge: string | number | null;
    createdAt: Date;
    updatedAt: Date;
  } | null;
};

async function fetchBookingsWithRelations(
  tenantId: string,
  dateRange: { startDate: Date; endDate: Date },
  options: { statusFilter?: string[] } = {}
): Promise<BookingWithRelations[]> {
  const conditions = [
    eq(bookings.tenantId, tenantId),
    gte(bookings.createdAt, dateRange.startDate),
    lte(bookings.createdAt, dateRange.endDate),
  ];

  if (options.statusFilter && options.statusFilter.length > 0) {
    conditions.push(inArray(bookings.status, options.statusFilter as any));
  }

  const rows = await db
    .select({
      booking: {
        id: bookings.id,
        tenantId: bookings.tenantId,
        customerId: bookings.customerId,
        serviceId: bookings.serviceId,
        scheduledAt: bookings.scheduledAt,
        duration: bookings.duration,
        status: bookings.status,
        totalAmount: bookings.totalAmount,
        paymentStatus: bookings.paymentStatus,
        isHomeVisit: bookings.isHomeVisit,
        homeVisitAddress: bookings.homeVisitAddress,
        notes: bookings.notes,
        createdAt: bookings.createdAt,
        updatedAt: bookings.updatedAt,
      },
      customer: {
        id: customers.id,
        name: customers.name,
        phone: customers.phone,
        email: customers.email,
        lastBookingAt: customers.lastBookingAt,
        whatsappNumber: customers.whatsappNumber,
        address: customers.address,
        notes: customers.notes,
        totalBookings: customers.totalBookings,
        createdAt: customers.createdAt,
        updatedAt: customers.updatedAt,
      },
      service: {
        id: services.id,
        name: services.name,
        description: services.description,
        duration: services.duration,
        price: services.price,
        category: services.category,
        homeVisitAvailable: services.homeVisitAvailable,
        homeVisitSurcharge: services.homeVisitSurcharge,
        createdAt: services.createdAt,
        updatedAt: services.updatedAt,
      },
    })
    .from(bookings)
    .leftJoin(customers, eq(bookings.customerId, customers.id))
    .leftJoin(services, eq(bookings.serviceId, services.id))
    .where(and(...conditions))
    .orderBy(desc(bookings.createdAt));

  return rows as BookingWithRelations[];
}

type CustomerWithBookings = {
  customer: {
    id: string;
    name: string;
    phone: string;
    email: string | null;
    address: string | null;
    totalBookings: number | null;
    lastBookingAt: Date | null;
    whatsappNumber: string | null;
    notes: string | null;
    createdAt: Date;
    updatedAt: Date;
  };
  bookings: Array<{
    id: string;
    totalAmount: string | number | null;
    status: string;
    scheduledAt: Date;
  }>;
};

async function fetchCustomersWithBookings(
  tenantId: string,
  dateRange: { startDate: Date; endDate: Date }
): Promise<CustomerWithBookings[]> {
  const customerRowsRaw = await db
    .select({
      id: customers.id,
      tenantId: customers.tenantId,
      name: customers.name,
      phone: customers.phone,
      email: customers.email,
      address: customers.address,
      totalBookings: customers.totalBookings,
      lastBookingAt: customers.lastBookingAt,
      whatsappNumber: customers.whatsappNumber,
      notes: customers.notes,
      createdAt: customers.createdAt,
      updatedAt: customers.updatedAt,
    })
    .from(customers)
    .where(
      and(
        eq(customers.tenantId, tenantId),
        gte(customers.createdAt, dateRange.startDate),
        lte(customers.createdAt, dateRange.endDate)
      )
    )
    .orderBy(desc(customers.createdAt));

  const customerRows = customerRowsRaw.map(row => ({
    ...row,
    createdAt: row.createdAt ?? new Date(),
    updatedAt: row.updatedAt ?? new Date(),
  }));

  if (customerRows.length === 0) {
    return [];
  }

  const customerIds = customerRows.map(c => c.id);

  const bookingRowsRaw = await db
    .select({
      id: bookings.id,
      customerId: bookings.customerId,
      totalAmount: bookings.totalAmount,
      status: bookings.status,
      scheduledAt: bookings.scheduledAt,
    })
    .from(bookings)
    .where(
      and(
        eq(bookings.tenantId, tenantId),
        inArray(bookings.customerId, customerIds),
        gte(bookings.createdAt, dateRange.startDate),
        lte(bookings.createdAt, dateRange.endDate)
      )
    );

  const bookingRows = bookingRowsRaw.map(row => ({
    ...row,
    scheduledAt: row.scheduledAt ?? new Date(),
  }));

  const bookingsByCustomer = new Map<string, CustomerWithBookings['bookings']>();
  for (const booking of bookingRows) {
    const list = bookingsByCustomer.get(booking.customerId) || [];
    list.push({
      id: booking.id,
      totalAmount: booking.totalAmount,
      status: booking.status ?? 'pending',
      scheduledAt: booking.scheduledAt,
    });
    bookingsByCustomer.set(booking.customerId, list);
  }

  return customerRows.map(customer => ({
    customer: {
      id: customer.id,
      name: customer.name,
      phone: customer.phone,
      email: customer.email,
      address: customer.address,
      totalBookings: customer.totalBookings,
      lastBookingAt: customer.lastBookingAt,
      whatsappNumber: customer.whatsappNumber,
      notes: customer.notes,
      createdAt: customer.createdAt,
      updatedAt: customer.updatedAt,
    },
    bookings: bookingsByCustomer.get(customer.id) || [],
  }));
}

type ServiceWithBookings = {
  service: {
    id: string;
    name: string;
    description: string;
    duration: number;
    price: string | number;
    category: string;
    isActive: boolean;
    homeVisitAvailable: boolean | null;
    homeVisitSurcharge: string | number | null;
    createdAt: Date;
    updatedAt: Date;
  };
  bookings: Array<{
    id: string;
    totalAmount: string | number | null;
    createdAt: Date;
    status: string;
  }>;
};

async function fetchServicesWithBookings(
  tenantId: string,
  dateRange: { startDate: Date; endDate: Date },
  options: { statusFilter?: string[] } = {}
): Promise<ServiceWithBookings[]> {
  const serviceRowsRaw = await db
    .select({
      id: services.id,
      tenantId: services.tenantId,
      name: services.name,
      description: services.description,
      duration: services.duration,
      price: services.price,
      category: services.category,
      isActive: services.isActive,
      homeVisitAvailable: services.homeVisitAvailable,
      homeVisitSurcharge: services.homeVisitSurcharge,
      createdAt: services.createdAt,
      updatedAt: services.updatedAt,
    })
    .from(services)
    .where(eq(services.tenantId, tenantId))
    .orderBy(desc(services.createdAt));

  const serviceRows = serviceRowsRaw.map(row => ({
    ...row,
    createdAt: row.createdAt ?? new Date(),
    updatedAt: row.updatedAt ?? new Date(),
  }));

  if (serviceRows.length === 0) {
    return [];
  }

  const serviceIds = serviceRows.map(service => service.id);

  const conditions = [
    eq(bookings.tenantId, tenantId),
    inArray(bookings.serviceId, serviceIds),
    gte(bookings.createdAt, dateRange.startDate),
    lte(bookings.createdAt, dateRange.endDate),
  ];

  if (options.statusFilter && options.statusFilter.length > 0) {
    conditions.push(inArray(bookings.status, options.statusFilter as any));
  }

  const bookingRowsRaw = await db
    .select({
      id: bookings.id,
      serviceId: bookings.serviceId,
      totalAmount: bookings.totalAmount,
      createdAt: bookings.createdAt,
      status: bookings.status,
    })
    .from(bookings)
    .where(and(...conditions));
  const bookingRows = bookingRowsRaw.map(row => ({
    ...row,
    createdAt: row.createdAt ?? new Date(),
  }));

  const bookingsByService = new Map<string, ServiceWithBookings['bookings']>();
  for (const booking of bookingRows) {
    const list = bookingsByService.get(booking.serviceId) || [];
    list.push({
      id: booking.id,
      totalAmount: booking.totalAmount,
      createdAt: booking.createdAt,
      status: booking.status ?? 'pending',
    });
    bookingsByService.set(booking.serviceId, list);
  }

  return serviceRows.map(service => ({
    service: {
      id: service.id,
      name: service.name,
      description: service.description,
      duration: service.duration,
      price: service.price,
      category: service.category,
      isActive: service.isActive ?? false,
      homeVisitAvailable: service.homeVisitAvailable ?? false,
      homeVisitSurcharge: service.homeVisitSurcharge,
      createdAt: service.createdAt,
      updatedAt: service.updatedAt,
    },
    bookings: bookingsByService.get(service.id) || [],
  }));
}

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
  static async exportBookings(tenantId: string, options: ExportOptions): Promise<Uint8Array> {
    const rows = await fetchBookingsWithRelations(tenantId, options.dateRange);

    const exportData = rows.map(({ booking, customer, service }) => ({
      'Booking ID': booking.id,
      'Customer Name': customer?.name || 'Unknown',
      'Customer Phone': customer?.phone || '',
      'Customer Email': customer?.email || '',
      'Service Name': service?.name || 'Unknown',
      'Scheduled Date': booking.scheduledAt.toLocaleDateString(),
      'Scheduled Time': booking.scheduledAt.toLocaleTimeString(),
      'Duration (minutes)': booking.duration,
      'Status': booking.status,
      'Total Amount': toNumber(booking.totalAmount),
      'Payment Status': booking.paymentStatus || '',
      'Is Home Visit': booking.isHomeVisit ? 'Yes' : 'No',
      'Home Visit Address': booking.homeVisitAddress || '',
      'Notes': booking.notes || '',
      'Created Date': booking.createdAt.toLocaleDateString(),
      'Updated Date': booking.updatedAt.toLocaleDateString(),
    }));

    return this.generateExport(exportData, options.format, 'Bookings Export');
  }

  // Export customers data
  static async exportCustomers(tenantId: string, options: ExportOptions): Promise<Uint8Array> {
    const rows = await fetchCustomersWithBookings(tenantId, options.dateRange);

    const exportData = rows.map(({ customer, bookings }) => ({
      'Customer ID': customer.id,
      'Name': customer.name,
      'Phone': customer.phone,
      'Email': customer.email || '',
      'Address': customer.address || '',
      'Total Bookings': customer.totalBookings ?? bookings.length,
      'Total Spent': bookings.reduce((sum, booking) => sum + toNumber(booking.totalAmount), 0),
      'Last Booking': customer.lastBookingAt?.toLocaleDateString() || 'Never',
      'WhatsApp Number': customer.whatsappNumber || '',
      'Notes': customer.notes || '',
      'Created Date': customer.createdAt.toLocaleDateString(),
      'Updated Date': customer.updatedAt.toLocaleDateString(),
    }));

    return this.generateExport(exportData, options.format, 'Customers Export');
  }

  // Export services data
  static async exportServices(tenantId: string, options: ExportOptions): Promise<Uint8Array> {
    const rows = await fetchServicesWithBookings(tenantId, options.dateRange, {
      statusFilter: ['completed', 'confirmed'],
    });

    const exportData = rows.map(({ service, bookings }) => ({
      'Service ID': service.id,
      'Name': service.name,
      'Description': service.description,
      'Duration (minutes)': service.duration,
      'Price': toNumber(service.price),
      'Category': service.category,
      'Is Active': service.isActive ? 'Yes' : 'No',
      'Home Visit Available': service.homeVisitAvailable ? 'Yes' : 'No',
      'Home Visit Surcharge': service.homeVisitSurcharge ? toNumber(service.homeVisitSurcharge) : 0,
      'Total Bookings (Period)': bookings.length,
      'Total Revenue (Period)': bookings.reduce((sum, booking) => sum + toNumber(booking.totalAmount), 0),
      'Created Date': service.createdAt.toLocaleDateString(),
      'Updated Date': service.updatedAt.toLocaleDateString(),
    }));

    return this.generateExport(exportData, options.format, 'Services Export');
  }

  // Export financial data
  static async exportFinancialData(tenantId: string, options: ExportOptions): Promise<Uint8Array> {
    const rows = await fetchBookingsWithRelations(tenantId, options.dateRange, {
      statusFilter: ['completed', 'confirmed'],
    });

    const exportData = rows.map(({ booking, customer, service }) => {
      const amount = toNumber(booking.totalAmount);
      return {
        'Date': booking.scheduledAt.toLocaleDateString(),
        'Booking ID': booking.id,
        'Customer': customer?.name || 'Unknown',
        'Service': service?.name || 'Unknown',
        'Amount': amount,
        'Payment Status': booking.paymentStatus || '',
        'Status': booking.status,
        'Payment Method': 'Manual',
        'Tax Amount': amount * 0.1,
        'Net Amount': amount * 0.9,
        'Month': booking.scheduledAt.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
      };
    });

    return this.generateExport(exportData, options.format, 'Financial Report');
  }

  // Generate comprehensive business report
  static async generateBusinessReport(tenantId: string, config: ReportConfig): Promise<Uint8Array> {
    const { startDate, endDate } = config.dateRange;

    // Fetch all necessary data
    const [bookingRows, customerRows, serviceRows] = await Promise.all([
      fetchBookingsWithRelations(tenantId, { startDate, endDate }),
      db
        .select({
          id: customers.id,
          name: customers.name,
          createdAt: customers.createdAt,
        })
        .from(customers)
        .where(
          and(
            eq(customers.tenantId, tenantId),
            gte(customers.createdAt, startDate),
            lte(customers.createdAt, endDate)
          )
        ),
      fetchServicesWithBookings(tenantId, { startDate, endDate }, { statusFilter: ['completed', 'confirmed'] }),
    ]);

    // Calculate metrics
    const totalBookings = bookingRows.length;
    const completedBookings = bookingRows.filter(b => b.booking.status === 'completed').length;
    const totalRevenue = bookingRows
      .filter(b => ['completed', 'confirmed'].includes(b.booking.status))
      .reduce((sum, b) => sum + toNumber(b.booking.totalAmount), 0);
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
      ['Total Customers', customerRows.length.toString()],
      ['Active Services', serviceRows.filter(s => s.service.isActive).length.toString()]
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

    const topServices = serviceRows
      .map(({ service, bookings }) => ({
        name: service.name,
        bookings: bookings.length,
        revenue: bookings.reduce((sum, b) => sum + toNumber(b.totalAmount), 0)
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

    const arrayBuffer = doc.output('arraybuffer') as ArrayBuffer;
    return new Uint8Array(arrayBuffer);
  }

  // Generate platform-wide analytics report (for admin)
  static async generatePlatformReport(config: ReportConfig): Promise<Uint8Array> {
    const { startDate, endDate } = config.dateRange;

    const tenantRows = await db
      .select({
        id: tenants.id,
        businessName: tenants.businessName,
      })
      .from(tenants);

    const bookingRows = await db
      .select({
        id: bookings.id,
        tenantId: bookings.tenantId,
        totalAmount: bookings.totalAmount,
        status: bookings.status,
      })
      .from(bookings)
      .where(
        and(
          gte(bookings.createdAt, startDate),
          lte(bookings.createdAt, endDate),
          inArray(bookings.status, ['completed', 'confirmed'])
        )
      );

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

    const totalRevenue = bookingRows.reduce((sum, b) => sum + toNumber(b.totalAmount), 0);
    const bookingsByTenant = new Map<string, number>();
    const revenueByTenant = new Map<string, number>();

    for (const booking of bookingRows) {
      bookingsByTenant.set(booking.tenantId, (bookingsByTenant.get(booking.tenantId) || 0) + 1);
      revenueByTenant.set(booking.tenantId, (revenueByTenant.get(booking.tenantId) || 0) + toNumber(booking.totalAmount));
    }

    const activeTenants = bookingsByTenant.size;

    const platformData = [
      ['Total Tenants', tenantRows.length.toString()],
      ['Active Tenants', activeTenants.toString()],
      ['Total Bookings', bookingRows.length.toString()],
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

    const topTenants = tenantRows
      .map(tenant => ({
        businessName: tenant.businessName,
        bookings: bookingsByTenant.get(tenant.id) || 0,
        revenue: revenueByTenant.get(tenant.id) || 0
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

    const arrayBuffer = doc.output('arraybuffer') as ArrayBuffer;
    return new Uint8Array(arrayBuffer);
  }

  // Helper method to generate exports in different formats
  private static generateExport(data: any[], format: ExportOptions['format'], filename: string): Uint8Array {
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

  private static generateXLSX(data: any[], filename: string): Uint8Array {
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Data');

    const arrayBuffer = XLSX.write(workbook, { type: 'array', bookType: 'xlsx' }) as ArrayBuffer;
    return new Uint8Array(arrayBuffer);
  }

  private static generateCSV(data: any[]): Uint8Array {
    if (data.length === 0) return new Uint8Array();
    
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

    return new TextEncoder().encode(csvContent);
  }

  private static generatePDF(data: any[], filename: string): Uint8Array {
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

    const arrayBuffer = doc.output('arraybuffer') as ArrayBuffer;
    return new Uint8Array(arrayBuffer);
  }
}