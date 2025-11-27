import { createClient } from '@supabase/supabase-js';
import { Staff, StaffSchedule, StaffLeave } from '@/types/booking';

const getSupabaseClient = () => {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
};

export class StaffAvailabilityService {
  /**
   * Get staff members who can perform a specific service
   */
  static async getStaffForService(tenantId: string, serviceId: string): Promise<Staff[]> {
    const supabase = getSupabaseClient();

    try {
      const { data, error } = await supabase
        .from('staff_services')
        .select(`
          id,
          can_perform,
          staff!inner(id, tenant_id, name, email, phone, role, is_active, created_at, updated_at)
        `)
        .eq('service_id', serviceId)
        .eq('can_perform', true)
        .eq('staff.tenant_id', tenantId)
        .eq('staff.is_active', true);

      if (error) throw error;

      return data?.map((record: any) => ({
        id: record.staff.id,
        tenantId: record.staff.tenant_id,
        name: record.staff.name,
        email: record.staff.email,
        phone: record.staff.phone,
        role: record.staff.role,
        isActive: record.staff.is_active,
        createdAt: new Date(record.staff.created_at),
        updatedAt: new Date(record.staff.updated_at)
      })) || [];
    } catch (error) {
      console.error('Error fetching staff for service:', error);
      return [];
    }
  }

  /**
   * Check if staff member can work on a specific date
   */
  static async isStaffAvailableOnDate(staffId: string, date: Date): Promise<boolean> {
    const supabase = getSupabaseClient();
    const dateStr = date.toISOString().split('T')[0];

    try {
      // Check staff leave/vacation
      const { data: leave, error: leaveError } = await supabase
        .from('staff_leave')
        .select('*')
        .eq('staff_id', staffId)
        .lte('date_start', dateStr)
        .gte('date_end', dateStr)
        .limit(1);

      if (leaveError) throw leaveError;

      // If staff is on leave, not available
      if (leave && leave.length > 0) {
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error checking staff availability on date:', error);
      return true; // Default to available if error
    }
  }

  /**
   * Get staff working hours for a specific day (uses custom schedule or business hours as fallback)
   */
  static async getStaffWorkingHours(
    staffId: string,
    dayOfWeek: number,
    businessHours?: { openTime: string; closeTime: string }
  ): Promise<{ startTime: string; endTime: string; isAvailable: boolean }> {
    const supabase = getSupabaseClient();

    try {
      // First, try to get custom staff schedule
      const { data: customSchedule, error } = await supabase
        .from('staff_schedule')
        .select('*')
        .eq('staff_id', staffId)
        .eq('day_of_week', dayOfWeek)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error; // 'PGRST116' means no rows found, which is expected
      }

      // If custom schedule exists, use it
      if (customSchedule) {
        return {
          startTime: customSchedule.start_time,
          endTime: customSchedule.end_time,
          isAvailable: customSchedule.is_available
        };
      }

      // Otherwise use business hours or default
      const defaultHours = businessHours || { openTime: '08:00', closeTime: '17:00' };
      return {
        startTime: defaultHours.openTime,
        endTime: defaultHours.closeTime,
        isAvailable: true
      };
    } catch (error) {
      console.error('Error fetching staff working hours:', error);
      // Fallback to business hours or default
      const defaultHours = businessHours || { openTime: '08:00', closeTime: '17:00' };
      return {
        startTime: defaultHours.openTime,
        endTime: defaultHours.closeTime,
        isAvailable: true
      };
    }
  }

  /**
   * Get count of confirmed bookings for staff on a specific date
   */
  static async getStaffBookingCountOnDate(
    tenantId: string,
    staffId: string,
    date: Date
  ): Promise<number> {
    const supabase = getSupabaseClient();

    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    try {
      const { data, error } = await supabase
        .from('bookings')
        .select('id')
        .eq('tenant_id', tenantId)
        .eq('staff_id', staffId)
        .eq('status', 'confirmed')
        .gte('scheduled_at', startOfDay.toISOString())
        .lte('scheduled_at', endOfDay.toISOString());

      if (error) throw error;

      return data?.length || 0;
    } catch (error) {
      console.error('Error fetching staff booking count:', error);
      return 0;
    }
  }

  /**
   * Get confirmed bookings for staff on a specific date
   */
  static async getStaffBookingsOnDate(
    tenantId: string,
    staffId: string,
    date: Date
  ): Promise<any[]> {
    const supabase = getSupabaseClient();

    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    try {
      const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .eq('tenant_id', tenantId)
        .eq('staff_id', staffId)
        .eq('status', 'confirmed')
        .gte('scheduled_at', startOfDay.toISOString())
        .lte('scheduled_at', endOfDay.toISOString())
        .order('scheduled_at', { ascending: true });

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('Error fetching staff bookings:', error);
      return [];
    }
  }

  /**
   * Check if staff can perform a specific service
   */
  static async canStaffPerformService(staffId: string, serviceId: string): Promise<boolean> {
    const supabase = getSupabaseClient();

    try {
      const { data, error } = await supabase
        .from('staff_services')
        .select('can_perform')
        .eq('staff_id', staffId)
        .eq('service_id', serviceId)
        .single();

      if (error && error.code === 'PGRST116') {
        // No mapping exists, staff might be able to do it (depends on business logic)
        return true;
      }

      if (error) throw error;

      return data?.can_perform || false;
    } catch (error) {
      console.error('Error checking if staff can perform service:', error);
      return true; // Default to allowed
    }
  }

  /**
   * Get all active staff for a tenant
   */
  static async getActiveStaffForTenant(tenantId: string): Promise<Staff[]> {
    const supabase = getSupabaseClient();

    try {
      const { data, error } = await supabase
        .from('staff')
        .select('*')
        .eq('tenant_id', tenantId)
        .eq('is_active', true);

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('Error fetching active staff:', error);
      return [];
    }
  }

  /**
   * Check if staff is available for a specific time slot
   */
  static async isStaffAvailableForSlot(
    tenantId: string,
    staffId: string,
    date: Date,
    startTime: Date,
    endTime: Date,
    bufferMinutes: number = 0
  ): Promise<boolean> {
    const bookings = await this.getStaffBookingsOnDate(tenantId, staffId, date);

    for (const booking of bookings) {
      const bookingStart = new Date(booking.scheduled_at);
      const bookingEnd = new Date(bookingStart.getTime() + booking.duration * 60000);

      // Apply buffer
      const bookingStartWithBuffer = new Date(bookingStart.getTime() - bufferMinutes * 60000);
      const bookingEndWithBuffer = new Date(bookingEnd.getTime() + bufferMinutes * 60000);

      // Check overlap
      // Slot: [startTime, endTime]
      // Booking: [bookingStartWithBuffer, bookingEndWithBuffer]
      if (startTime < bookingEndWithBuffer && endTime > bookingStartWithBuffer) {
        return false;
      }
    }

    return true;
  }

  /**
   * Find best available staff member for a time slot
   * Prioritizes: least booked today, then available, then any
   */
  static async findBestAvailableStaff(
    tenantId: string,
    serviceId: string,
    date: Date,
    startTime: Date,
    endTime: Date,
    bufferMinutes: number = 0
  ): Promise<Staff | null> {
    const qualifiedStaff = await this.getStaffForService(tenantId, serviceId);

    if (qualifiedStaff.length === 0) {
      return null;
    }

    // Check availability and booking count for each staff
    const staffScores: { staff: Staff; score: number; bookingCount: number }[] = [];

    for (const staff of qualifiedStaff) {
      // 1. Check general availability (leave, etc)
      const isAvailableDate = await this.isStaffAvailableOnDate(staff.id, date);
      if (!isAvailableDate) continue;

      // 2. Check specific slot availability
      const isAvailableSlot = await this.isStaffAvailableForSlot(
        tenantId,
        staff.id,
        date,
        startTime,
        endTime,
        bufferMinutes
      );
      if (!isAvailableSlot) continue;

      const bookingCount = await this.getStaffBookingCountOnDate(tenantId, staff.id, date);

      // Score: lower booking count = higher priority (negative booking count)
      const score = -bookingCount;

      staffScores.push({ staff, score, bookingCount });
    }

    if (staffScores.length === 0) {
      return null;
    }

    // Sort by score (descending = least booked first)
    staffScores.sort((a, b) => b.score - a.score);

    return staffScores[0].staff;
  }

  /**
   * Find available staff for home visit booking
   * Special handling: considers travel time buffer and home visit daily quota per staff
   */
  static async findAvailableStaffForHomeVisit(
    tenantId: string,
    serviceId: string,
    scheduledAt: Date,
    serviceDuration: number,
    travelBufferMinutes: number = 30,
    maxDailyHomeVisitsPerStaff: number = 5
  ): Promise<{ staff: Staff; homeVisitCount: number } | null> {
    const supabase = getSupabaseClient();
    
    // Get all active staff that can perform this service with home visit config
    const { data: staffWithConfig } = await supabase
      .from('staff_services')
      .select(`
        staff!inner(id, tenant_id, name, email, phone, role, is_active, home_visit_config)
      `)
      .eq('service_id', serviceId)
      .eq('can_perform', true)
      .eq('staff.tenant_id', tenantId)
      .eq('staff.is_active', true);

    // Filter staff who can do home visits
    const qualifiedStaff = (staffWithConfig || [])
      .map((record: any) => ({
        id: record.staff.id,
        tenantId: record.staff.tenant_id,
        name: record.staff.name,
        email: record.staff.email,
        phone: record.staff.phone,
        role: record.staff.role,
        isActive: record.staff.is_active,
        homeVisitConfig: record.staff.home_visit_config || {
          canDoHomeVisit: true,
          maxDailyHomeVisits: maxDailyHomeVisitsPerStaff,
          maxTravelDistanceKm: 20
        }
      }))
      .filter((s: any) => s.homeVisitConfig?.canDoHomeVisit !== false);
    
    if (qualifiedStaff.length === 0) {
      console.log('[StaffAvailability] No qualified staff found for home visit service:', serviceId);
      return null;
    }

    console.log('[StaffAvailability] Found qualified staff for home visit:', qualifiedStaff.map((s: any) => s.name));

    // Calculate time window with travel buffer
    const startTime = new Date(scheduledAt.getTime() - travelBufferMinutes * 60000);
    const endTime = new Date(scheduledAt.getTime() + (serviceDuration + travelBufferMinutes) * 60000);
    
    // Get day start/end for counting daily home visits
    const dayStart = new Date(scheduledAt);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(scheduledAt);
    dayEnd.setHours(23, 59, 59, 999);

    const availableStaff: { staff: Staff; homeVisitCount: number; score: number }[] = [];

    for (const staffData of qualifiedStaff) {
      const staff = staffData as Staff & { homeVisitConfig?: any };
      const staffMaxHomeVisits = staff.homeVisitConfig?.maxDailyHomeVisits || maxDailyHomeVisitsPerStaff;
      
      // 1. Check if staff is on leave
      const isAvailableDate = await this.isStaffAvailableOnDate(staff.id, scheduledAt);
      if (!isAvailableDate) {
        console.log(`[StaffAvailability] ${staff.name} is on leave`);
        continue;
      }

      // 2. Check staff schedule for this day of week
      const dayOfWeek = scheduledAt.getDay();
      const workingHours = await this.getStaffWorkingHours(staff.id, dayOfWeek);
      if (!workingHours.isAvailable) {
        console.log(`[StaffAvailability] ${staff.name} doesn't work on this day`);
        continue;
      }

      // 3. Check if slot is within working hours
      const scheduledHour = scheduledAt.getHours();
      const scheduledMinute = scheduledAt.getMinutes();
      const scheduledTimeStr = `${String(scheduledHour).padStart(2, '0')}:${String(scheduledMinute).padStart(2, '0')}`;
      
      if (scheduledTimeStr < workingHours.startTime || scheduledTimeStr >= workingHours.endTime) {
        console.log(`[StaffAvailability] ${staff.name} - slot outside working hours`);
        continue;
      }

      // 4. Check if staff has conflicting bookings (with travel buffer)
      const isAvailableSlot = await this.isStaffAvailableForSlot(
        tenantId,
        staff.id,
        scheduledAt,
        startTime,
        endTime,
        0 // Buffer already included in start/end time
      );
      if (!isAvailableSlot) {
        console.log(`[StaffAvailability] ${staff.name} has conflicting booking`);
        continue;
      }

      // 5. Count existing home visit bookings for this staff today
      const { data: homeVisits } = await supabase
        .from('bookings')
        .select('id')
        .eq('tenant_id', tenantId)
        .eq('staff_id', staff.id)
        .eq('is_home_visit', true)
        .gte('scheduled_at', dayStart.toISOString())
        .lte('scheduled_at', dayEnd.toISOString())
        .in('status', ['pending', 'confirmed']);

      const homeVisitCount = homeVisits?.length || 0;
      
      // Use staff's individual max home visits config
      if (homeVisitCount >= staffMaxHomeVisits) {
        console.log(`[StaffAvailability] ${staff.name} reached daily home visit limit (${homeVisitCount}/${staffMaxHomeVisits})`);
        continue;
      }

      // Score: prefer staff with fewer home visits today (relative to their max)
      const score = staffMaxHomeVisits - homeVisitCount;
      
      availableStaff.push({ staff, homeVisitCount, score });
      console.log(`[StaffAvailability] ${staff.name} is available (${homeVisitCount}/${staffMaxHomeVisits} home visits today)`);
    }

    if (availableStaff.length === 0) {
      console.log('[StaffAvailability] No available staff for home visit');
      return null;
    }

    // Sort by score (highest first = least home visits)
    availableStaff.sort((a, b) => b.score - a.score);
    
    const selected = availableStaff[0];
    console.log(`[StaffAvailability] Selected: ${selected.staff.name}`);
    
    return { staff: selected.staff, homeVisitCount: selected.homeVisitCount };
  }

  /**
   * Get all available staff for a home visit time slot
   * Returns list of staff with their availability info
   */
  static async getAllAvailableStaffForHomeVisit(
    tenantId: string,
    serviceId: string,
    scheduledAt: Date,
    serviceDuration: number,
    travelBufferMinutes: number = 30
  ): Promise<Array<{ staff: Staff; homeVisitCount: number; maxHomeVisits: number; isAvailable: boolean; unavailableReason?: string }>> {
    const supabase = getSupabaseClient();
    
    // Get staff with home visit config
    const { data: staffWithConfig } = await supabase
      .from('staff_services')
      .select(`
        staff!inner(id, tenant_id, name, email, phone, role, is_active, home_visit_config)
      `)
      .eq('service_id', serviceId)
      .eq('can_perform', true)
      .eq('staff.tenant_id', tenantId)
      .eq('staff.is_active', true);

    // Filter staff who can do home visits
    const qualifiedStaff = (staffWithConfig || [])
      .map((record: any) => ({
        id: record.staff.id,
        tenantId: record.staff.tenant_id,
        name: record.staff.name,
        email: record.staff.email,
        phone: record.staff.phone,
        role: record.staff.role,
        isActive: record.staff.is_active,
        homeVisitConfig: record.staff.home_visit_config || {
          canDoHomeVisit: true,
          maxDailyHomeVisits: 5,
          maxTravelDistanceKm: 20
        }
      }))
      .filter((s: any) => s.homeVisitConfig?.canDoHomeVisit !== false);
    
    if (qualifiedStaff.length === 0) {
      return [];
    }

    const startTime = new Date(scheduledAt.getTime() - travelBufferMinutes * 60000);
    const endTime = new Date(scheduledAt.getTime() + (serviceDuration + travelBufferMinutes) * 60000);
    
    const dayStart = new Date(scheduledAt);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(scheduledAt);
    dayEnd.setHours(23, 59, 59, 999);

    const results: Array<{ staff: Staff; homeVisitCount: number; maxHomeVisits: number; isAvailable: boolean; unavailableReason?: string }> = [];

    for (const staffData of qualifiedStaff) {
      const staff = staffData as Staff & { homeVisitConfig?: any };
      const maxHomeVisits = staff.homeVisitConfig?.maxDailyHomeVisits || 5;
      let isAvailable = true;
      let unavailableReason: string | undefined;
      
      // Check leave
      const isAvailableDate = await this.isStaffAvailableOnDate(staff.id, scheduledAt);
      if (!isAvailableDate) {
        isAvailable = false;
        unavailableReason = 'Sedang cuti';
      }

      // Check working hours
      if (isAvailable) {
        const dayOfWeek = scheduledAt.getDay();
        const workingHours = await this.getStaffWorkingHours(staff.id, dayOfWeek);
        if (!workingHours.isAvailable) {
          isAvailable = false;
          unavailableReason = 'Tidak bekerja hari ini';
        } else {
          const scheduledHour = scheduledAt.getHours();
          const scheduledMinute = scheduledAt.getMinutes();
          const scheduledTimeStr = `${String(scheduledHour).padStart(2, '0')}:${String(scheduledMinute).padStart(2, '0')}`;
          
          if (scheduledTimeStr < workingHours.startTime || scheduledTimeStr >= workingHours.endTime) {
            isAvailable = false;
            unavailableReason = 'Di luar jam kerja';
          }
        }
      }

      // Check slot conflict
      if (isAvailable) {
        const isAvailableSlot = await this.isStaffAvailableForSlot(
          tenantId, staff.id, scheduledAt, startTime, endTime, 0
        );
        if (!isAvailableSlot) {
          isAvailable = false;
          unavailableReason = 'Ada jadwal lain';
        }
      }

      // Get home visit count
      const { data: homeVisits } = await supabase
        .from('bookings')
        .select('id')
        .eq('tenant_id', tenantId)
        .eq('staff_id', staff.id)
        .eq('is_home_visit', true)
        .gte('scheduled_at', dayStart.toISOString())
        .lte('scheduled_at', dayEnd.toISOString())
        .in('status', ['pending', 'confirmed']);

      const homeVisitCount = homeVisits?.length || 0;
      
      // Check quota
      if (isAvailable && homeVisitCount >= maxHomeVisits) {
        isAvailable = false;
        unavailableReason = `Kuota penuh (${homeVisitCount}/${maxHomeVisits})`;
      }

      results.push({
        staff,
        homeVisitCount,
        maxHomeVisits,
        isAvailable,
        unavailableReason
      });
    }

    return results;
  }
}
