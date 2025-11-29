import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { randomUUID as cryptoRandomUUID } from 'crypto';
import { Booking } from './types';

let supabaseInstance: SupabaseClient | null = null;

export const getSupabaseClient = (): SupabaseClient => {
  if (!supabaseInstance) {
    supabaseInstance = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
  }
  return supabaseInstance;
};

export const randomUUID = (): string => {
  try {
    return cryptoRandomUUID();
  } catch {
    try {
      if (typeof globalThis.crypto?.randomUUID === 'function') {
        return globalThis.crypto.randomUUID();
      }
    } catch {
      console.warn('[randomUUID] Falling back to generated UUID-like string');
    }
    return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}-${Math.random().toString(36).substring(2, 15)}`;
  }
};

export const generateBookingNumber = (): string => {
  const now = new Date();
  return `BK-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
};

export const mapToBooking = (dbData: any): Booking => {
  const dpAmount = dbData.dp_amount || 0;
  const paidAmount = dbData.paid_amount || 0;
  const totalAmount = dbData.total_amount || 0;
  const remainingBalance = totalAmount - paidAmount;

  return {
    id: dbData.id,
    bookingNumber: dbData.booking_number || `BK-${Date.now()}`,
    tenantId: dbData.tenant_id,
    customerId: dbData.customer_id,
    serviceId: dbData.service_id,
    staffId: dbData.staff_id,
    status: dbData.status,
    scheduledAt: new Date(dbData.scheduled_at),
    duration: dbData.duration,
    isHomeVisit: dbData.is_home_visit,
    homeVisitAddress: dbData.home_visit_address,
    homeVisitCoordinates: dbData.home_visit_coordinates,
    homeVisitLatitude: dbData.home_visit_latitude,
    homeVisitLongitude: dbData.home_visit_longitude,
    notes: dbData.notes,
    totalAmount,
    taxPercentage: dbData.tax_percentage,
    serviceChargeAmount: dbData.service_charge_amount,
    additionalFeesAmount: dbData.additional_fees_amount,
    travelSurchargeAmount: dbData.travel_surcharge_amount,
    travelDistance: dbData.travel_distance,
    travelDuration: dbData.travel_duration,
    travelTimeMinutesBefore: dbData.travel_time_minutes_before,
    travelTimeMinutesAfter: dbData.travel_time_minutes_after,
    paymentStatus: dbData.payment_status,
    remindersSent: dbData.reminders_sent,
    createdAt: new Date(dbData.created_at),
    updatedAt: new Date(dbData.updated_at),
    dpAmount,
    paidAmount,
    paymentReference: dbData.payment_reference,
    paymentMethod: dbData.payment_method,
    remainingBalance,
    // Include related data
    customer: dbData.customer || null,
    service: dbData.service || null,
    staff: dbData.staff || null,
    // Also map flat names for backward compatibility
    customerName: dbData.customer?.name || null,
    customerPhone: dbData.customer?.phone || null,
    serviceName: dbData.service?.name || null,
    staffName: dbData.staff?.name || null,
  };
};

export const getDayKey = (date: Date): string => {
  const dayOfWeek = date.getDay();
  const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  return dayNames[dayOfWeek];
};

export const getDayHours = (schedule: any, dayKey: string): any => {
  let dayHours = schedule[dayKey];
  
  if (!dayHours) {
    const capitalizedKey = dayKey.charAt(0).toUpperCase() + dayKey.slice(1);
    dayHours = schedule[capitalizedKey];
  }
  
  if (!dayHours) {
    const matchKey = Object.keys(schedule).find(key => key.toLowerCase() === dayKey.toLowerCase());
    dayHours = matchKey ? schedule[matchKey] : null;
  }
  
  return dayHours || { isOpen: true, openTime: '08:00', closeTime: '17:00' };
};

export const timezoneOffsets: Record<string, number> = {
  'Asia/Jakarta': 7,
  'Asia/Bangkok': 7,
  'Asia/Ho_Chi_Minh': 7,
  'UTC': 0,
  'America/New_York': -5,
  'America/Chicago': -6,
  'America/Los_Angeles': -8,
  'Europe/London': 0,
  'Europe/Paris': 1,
};
