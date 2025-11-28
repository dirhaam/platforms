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

export interface HomeVisitValidationResult extends ValidationResult {
  travelTimeMinutes?: number;
  autoAssignedStaffId?: string;
  autoAssignedStaffName?: string;
}

export async function validateHomeVisit(
  tenantId: string,
  service: Service,
  scheduledAt: Date,
  staffId?: string | null,
  options?: {
    autoAssignStaff?: boolean;
    maxDailyHomeVisitsPerStaff?: number;
  }
): Promise<HomeVisitValidationResult> {
  const supabase = getSupabaseClient();
  const { autoAssignStaff = true, maxDailyHomeVisitsPerStaff = 5 } = options || {};
  
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

  // Check if service requires staff assignment
  const requiresStaff = (service as any).requires_staff_assignment || (service as any).requiresStaffAssignment;
  
  // If staff already provided, validate and return
  if (staffId) {
    return { valid: true, travelTimeMinutes };
  }

  // If requires staff and no staffId provided, try auto-assign
  if (requiresStaff && autoAssignStaff) {
    const { StaffAvailabilityService } = await import('@/lib/booking/staff-availability-service');
    
    const availableStaff = await StaffAvailabilityService.findAvailableStaffForHomeVisit(
      tenantId,
      service.id,
      scheduledAt,
      service.duration,
      travelTimeMinutes,
      maxDailyHomeVisitsPerStaff
    );

    if (!availableStaff) {
      return { 
        valid: false, 
        error: 'Tidak ada staff yang tersedia untuk home visit pada waktu ini. Silakan pilih waktu lain.' 
      };
    }

    console.log(`[validateHomeVisit] Auto-assigned staff: ${availableStaff.staff.name} (${availableStaff.staff.id})`);
    
    return { 
      valid: true, 
      travelTimeMinutes,
      autoAssignedStaffId: availableStaff.staff.id,
      autoAssignedStaffName: availableStaff.staff.name
    };
  }

  // If requires staff but auto-assign disabled and no staffId
  if (requiresStaff && !autoAssignStaff) {
    return { 
      valid: false, 
      error: 'Layanan ini memerlukan penugasan staff. Silakan pilih staff.' 
    };
  }

  return { valid: true, travelTimeMinutes };
}

export async function validateStaffAssignment(
  tenantId: string,
  staffId: string,
  _serviceId: string,
  _scheduledAt: Date,
  _serviceDuration: number,
  _travelTimeBeforeMinutes: number,
  _travelTimeAfterMinutes: number
): Promise<ValidationResult> {
  const supabase = getSupabaseClient();
  
  // SIMPLIFIED: Only check if staff exists and is active
  // No schedule checking, no service restrictions
  const { data: staffMember } = await supabase
    .from('staff')
    .select('id, is_active, name')
    .eq('id', staffId)
    .eq('tenant_id', tenantId)
    .single();

  if (!staffMember) {
    return { valid: false, error: 'Staff tidak ditemukan' };
  }

  if (!staffMember.is_active) {
    return { valid: false, error: `Staff ${staffMember.name} tidak aktif` };
  }

  return { valid: true };
}
