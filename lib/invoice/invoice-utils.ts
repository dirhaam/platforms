import { Invoice, InvoiceItem, InvoiceStatus } from '@/types/invoice';

const toDate = (value: any, fallback?: Date): Date => {
  if (!value) {
    return fallback ?? new Date();
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return fallback ?? new Date();
  }

  return date;
};

const toOptionalDate = (value: any): Date | undefined => {
  if (!value) {
    return undefined;
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date;
};

const mapInvoiceItem = (item: any, invoiceId: string): InvoiceItem => {
  const quantity = Number(item?.quantity ?? item?.qty ?? 0);
  const unitPrice = Number(item?.unitPrice ?? item?.unit_price ?? 0);
  const totalPriceSource = item?.totalPrice ?? item?.total_price;

  return {
    id:
      item?.id ??
      item?.invoiceItemId ??
      item?.invoice_item_id ??
      `${invoiceId}-item-${Math.random().toString(36).slice(2, 10)}`,
    invoiceId: item?.invoiceId ?? item?.invoice_id ?? invoiceId,
    description: item?.description ?? '',
    quantity,
    unitPrice,
    totalPrice: Number(totalPriceSource ?? quantity * unitPrice),
    serviceId: item?.serviceId ?? item?.service_id ?? undefined,
  } satisfies InvoiceItem;
};

export const normalizeInvoiceResponse = (data: any): Invoice => {
  const invoiceId = data?.id ?? '';
  const tenantId = data?.tenantId ?? data?.tenant_id ?? '';

  const invoice: Invoice = {
    ...(data ?? {}),
    id: invoiceId,
    tenantId,
    customerId: data?.customerId ?? data?.customer_id ?? '',
    bookingId: data?.bookingId ?? data?.booking_id ?? undefined,
    invoiceNumber: data?.invoiceNumber ?? data?.invoice_number ?? '',
    status: (data?.status as InvoiceStatus) ?? InvoiceStatus.DRAFT,
    issueDate: toDate(data?.issueDate ?? data?.issue_date),
    dueDate: toDate(data?.dueDate ?? data?.due_date),
    paidDate: toOptionalDate(data?.paidDate ?? data?.paid_date),
    subtotal: Number(data?.subtotal ?? data?.subtotal ?? 0),
    taxRate: Number(data?.taxRate ?? data?.tax_rate ?? 0),
    taxAmount: Number(data?.taxAmount ?? data?.tax_amount ?? 0),
    discountAmount: Number(data?.discountAmount ?? data?.discount_amount ?? 0),
    totalAmount: Number(data?.totalAmount ?? data?.total_amount ?? 0),
    paymentMethod: data?.paymentMethod ?? data?.payment_method ?? undefined,
    paymentReference: data?.paymentReference ?? data?.payment_reference ?? undefined,
    items: Array.isArray(data?.items)
      ? data.items.map((item: any) => mapInvoiceItem(item, invoiceId))
      : [],
    notes: data?.notes ?? undefined,
    terms: data?.terms ?? undefined,
    qrCodeData: data?.qrCodeData ?? data?.qr_code_data ?? undefined,
    qrCodeUrl: data?.qrCodeUrl ?? data?.qr_code_url ?? undefined,
    createdAt: toDate(data?.createdAt ?? data?.created_at),
    updatedAt: toDate(data?.updatedAt ?? data?.updated_at),
    customer: data?.customer
      ? {
          ...data.customer,
          id: data.customer.id ?? '',
          tenantId: data.customer.tenantId ?? data.customer.tenant_id ?? tenantId,
          name: data.customer.name ?? '',
          email: data.customer.email ?? undefined,
          phone: data.customer.phone ?? '',
          address: data.customer.address ?? undefined,
          notes: data.customer.notes ?? undefined,
          totalBookings: Number(data.customer.totalBookings ?? data.customer.total_bookings ?? 0),
          lastBookingAt: toOptionalDate(data.customer.lastBookingAt ?? data.customer.last_booking_at),
          whatsappNumber: data.customer.whatsappNumber ?? data.customer.whatsapp_number ?? undefined,
          createdAt: toDate(data.customer.createdAt ?? data.customer.created_at),
          updatedAt: toDate(data.customer.updatedAt ?? data.customer.updated_at),
          bookings: data.customer.bookings,
        }
      : undefined,
    booking: data?.booking
      ? {
          ...data.booking,
          id: data.booking.id ?? '',
          tenantId: data.booking.tenantId ?? data.booking.tenant_id ?? tenantId,
          bookingNumber: data.booking.bookingNumber ?? data.booking.booking_number ?? '',
          customerId: data.booking.customerId ?? data.booking.customer_id ?? '',
          serviceId: data.booking.serviceId ?? data.booking.service_id ?? '',
          status: data.booking.status,
          scheduledAt: toDate(data.booking.scheduledAt ?? data.booking.scheduled_at),
          duration: Number(data.booking.duration ?? 0),
          isHomeVisit: Boolean(data.booking.isHomeVisit ?? data.booking.is_home_visit ?? false),
          homeVisitAddress: data.booking.homeVisitAddress ?? data.booking.home_visit_address ?? undefined,
          homeVisitCoordinates: data.booking.homeVisitCoordinates ?? data.booking.home_visit_coordinates ?? undefined,
          notes: data.booking.notes ?? undefined,
          totalAmount: Number(data.booking.totalAmount ?? data.booking.total_amount ?? 0),
          paymentStatus: data.booking.paymentStatus ?? data.booking.payment_status ?? 'pending',
          paymentMethod: data.booking.paymentMethod ?? data.booking.payment_method ?? undefined,
          remindersSent: Array.isArray(data.booking.remindersSent ?? data.booking.reminders_sent)
            ? (data.booking.remindersSent ?? data.booking.reminders_sent).map((value: any) => toDate(value))
            : [],
          createdAt: toDate(data.booking.createdAt ?? data.booking.created_at),
          updatedAt: toDate(data.booking.updatedAt ?? data.booking.updated_at),
          customer: data.booking.customer,
          service: data.booking.service,
        }
      : undefined,
    tenant: data?.tenant
      ? {
          ...data.tenant,
          id: data.tenant.id ?? tenantId,
          subdomain: data.tenant.subdomain ?? data.tenant.slug ?? '',
          emoji: data.tenant.emoji ?? '🏢',
          businessName: data.tenant.businessName ?? data.tenant.business_name ?? '',
          businessCategory: data.tenant.businessCategory ?? data.tenant.business_category ?? '',
          ownerName: data.tenant.ownerName ?? data.tenant.owner_name ?? '',
          email: data.tenant.email ?? '',
          phone: data.tenant.phone ?? '',
          address: data.tenant.address ?? undefined,
          businessDescription: data.tenant.businessDescription ?? data.tenant.business_description ?? undefined,
          logo: data.tenant.logo ?? undefined,
          brandColors: data.tenant.brandColors ?? data.tenant.brand_colors ?? null,
          whatsappEnabled: Boolean(data.tenant.whatsappEnabled ?? data.tenant.whatsapp_enabled ?? false),
          homeVisitEnabled: Boolean(data.tenant.homeVisitEnabled ?? data.tenant.home_visit_enabled ?? false),
          analyticsEnabled: Boolean(data.tenant.analyticsEnabled ?? data.tenant.analytics_enabled ?? false),
          customTemplatesEnabled: Boolean(data.tenant.customTemplatesEnabled ?? data.tenant.custom_templates_enabled ?? false),
          multiStaffEnabled: Boolean(data.tenant.multiStaffEnabled ?? data.tenant.multi_staff_enabled ?? false),
          subscriptionPlan: data.tenant.subscriptionPlan ?? data.tenant.subscription_plan ?? 'basic',
          subscriptionStatus: data.tenant.subscriptionStatus ?? data.tenant.subscription_status ?? 'active',
          subscriptionExpiresAt: toOptionalDate(
            data.tenant.subscriptionExpiresAt ?? data.tenant.subscription_expires_at
          ),
          createdAt: toDate(data.tenant.createdAt ?? data.tenant.created_at),
          updatedAt: toDate(data.tenant.updatedAt ?? data.tenant.updated_at),
        }
      : undefined,
    branding: data?.branding ?? undefined,
  } as Invoice;

  return invoice;
};

export default normalizeInvoiceResponse;
