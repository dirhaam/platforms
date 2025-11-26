import { validateBookingTime, validateBusinessHours } from '@/lib/validation/booking-validation';
import { getSupabaseClient } from './utils';
import { Service } from './types';

export interface ValidationResult {
  valid: boolean;
  error?: string;
  data?: any;
}

export async function validateService(tenantId: string, serviceId: string): Promise<ValidationResult> {
  const supabase = getSupabaseClient();
  
  const { data: serviceData, error: serviceError } = await supabase
    .from('services')
    .select('*')
    .eq('id', serviceId)
    .eq('tenant_id', tenantId)
    .eq('is_active', true)
    .single();

  if (serviceError || !serviceData) {
    return { valid: false, error: 'Service not found or inactive' };
  }

  return { valid: true, data: serviceData };
}

export async function validateCustomer(tenantId: string, customerId: string): Promise<ValidationResult> {
  const supabase = getSupabaseClient();
  
  const { data: customerData, error: customerError } = await supabase
    .from('customers')
    .select('*')
    .eq('id', customerId)
    .eq('tenant_id', tenantId)
    .single();

  if (customerError || !customerData) {
    return { valid: false, error: 'Customer not found' };
  }

  return { valid: true, data: customerData };
}

export async function validateBookingDateTime(
  tenantId: string,
  scheduledAt: Date
): Promise<ValidationResult> {
  const supabase = getSupabaseClient();
  
  // Validate booking time
  const timeValidation = validateBookingTime(scheduledAt);
  if (!timeValidation.valid) {
    return { valid: false, error: timeValidation.message };
  }

  // Get business hours for validation
  const { data: businessHoursData, error: businessHoursError } = await supabase
    .from('businessHours')
    .select('*')
    .eq('tenant_id', tenantId)
    .single();

  const businessHoursRecord = businessHoursError ? null : businessHoursData;

  // Validate against business hours
  const hoursValidation = validateBusinessHours(scheduledAt, businessHoursRecord);
  if (!hoursValidation.valid) {
    return { valid: false, error: hoursValidation.message };
  }

  return { valid: true };
}

export async function validateHomeVisit(
  tenantId: string,
  service: Service,
  scheduledAt: Date,
  staffId?: string | null
): Promise<ValidationResult & { travelTimeMinutes?: number }> {
  const supabase = getSupabaseClient();
  
  // Validate service supports home visits
  if ((service as any).service_type === 'on_premise' || (service as any).serviceType === 'on_premise') {
    return { valid: false, error: 'This service does not support home visit bookings' };
  }

  // Get global home visit settings from tenant
  const { data: tenantConfig } = await supabase
    .from('tenants')
    .select('home_visit_config')
    .eq('id', tenantId)
    .single();

  const globalConfig = tenantConfig?.home_visit_config || { enabled: true, dailyQuota: 3 };
  
  // Check if home visit is enabled globally
  if (!globalConfig.enabled) {
    return { valid: false, error: 'Home visit bookings are not enabled' };
  }

  // Use global quota (priority) or fallback to service-level quota
  const dailyQuota = globalConfig.dailyQuota || (service as any).daily_home_visit_quota || (service as any).dailyHomeVisitQuota || 3;
  const startOfDay = new Date(scheduledAt);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(scheduledAt);
  endOfDay.setHours(23, 59, 59, 999);

  const { data: existingHomeVisits, error: hvError } = await supabase
    .from('bookings')
    .select('id')
    .eq('tenant_id', tenantId)
    .eq('is_home_visit', true)
    .gte('scheduled_at', startOfDay.toISOString())
    .lte('scheduled_at', endOfDay.toISOString())
    .in('status', ['pending', 'confirmed']);

  if (!hvError && existingHomeVisits && existingHomeVisits.length >= dailyQuota) {
    return { valid: false, error: `Home visit slots are fully booked for this date (max ${dailyQuota} per day)` };
  }

  // Get travel time buffer
  const travelTimeMinutes = (service as any).home_visit_min_buffer_minutes || (service as any).homeVisitMinBufferMinutes || 30;

  return { valid: true, travelTimeMinutes };
}

export async function validateStaffAssignment(
  tenantId: string,
  staffId: string,
  serviceId: string,
  scheduledAt: Date,
  serviceDuration: number,
  travelTimeBeforeMinutes: number,
  travelTimeAfterMinutes: number
): Promise<ValidationResult> {
  const supabase = getSupabaseClient();
  
  // Check staff exists and is active
  const { data: staffMember } = await supabase
    .from('staff')
    .select('id, is_active')
    .eq('id', staffId)
    .eq('tenant_id', tenantId)
    .single();

  if (!staffMember || !staffMember.is_active) {
    return { valid: false, error: 'Assigned staff member not found or inactive' };
  }

  // Check staff can perform this service
  const { data: staffService } = await supabase
    .from('staff_services')
    .select('id, can_perform')
    .eq('staff_id', staffId)
    .eq('service_id', serviceId)
    .single();

  if (!staffService || !staffService.can_perform) {
    return { valid: false, error: 'Selected staff member cannot perform this service' };
  }

  // Check staff availability with travel time buffer
  const { StaffAvailabilityService } = await import('@/lib/booking/staff-availability-service');
  const bookingStartWithBuffer = new Date(scheduledAt.getTime() - travelTimeBeforeMinutes * 60000);
  const bookingEndWithBuffer = new Date(scheduledAt.getTime() + (serviceDuration + travelTimeAfterMinutes) * 60000);

  const isAvailable = await StaffAvailabilityService.isStaffAvailableForSlot(
    tenantId,
    staffId,
    scheduledAt,
    bookingStartWithBuffer,
    bookingEndWithBuffer,
    0
  );

  if (!isAvailable) {
    return { valid: false, error: 'Selected staff member is not available for this time slot (including travel time)' };
  }

  return { valid: true };
}
