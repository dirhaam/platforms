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
   * Find best available staff member for a time slot
   * Prioritizes: least booked today, then available, then any
   */
  static async findBestAvailableStaff(
    tenantId: string,
    serviceId: string,
    date: Date,
    startTime: Date,
    endTime: Date
  ): Promise<Staff | null> {
    const qualifiedStaff = await this.getStaffForService(tenantId, serviceId);
    
    if (qualifiedStaff.length === 0) {
      return null;
    }
    
    // Check availability and booking count for each staff
    const staffScores: { staff: Staff; score: number; bookingCount: number }[] = [];
    
    for (const staff of qualifiedStaff) {
      const isAvailable = await this.isStaffAvailableOnDate(staff.id, date);
      if (!isAvailable) continue;
      
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
}
