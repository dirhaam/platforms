import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export interface BlockedDate {
  id: string;
  tenantId: string;
  date: string;
  reason?: string;
  isRecurring: boolean;
  recurringPattern?: 'daily' | 'weekly' | 'monthly' | 'yearly';
  recurringEndDate?: string;
  createdAt: string;
  updatedAt: string;
}

export class BlockedDatesService {
  /**
   * Check if a specific date is blocked for a tenant
   */
  static async isDateBlocked(tenantId: string, date: Date): Promise<boolean> {
    try {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);

      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      const { data, error } = await supabase
        .from('blocked_dates')
        .select('*')
        .eq('tenant_id', tenantId)
        .gte('date', startOfDay.toISOString())
        .lte('date', endOfDay.toISOString())
        .limit(1);

      if (error) throw error;
      return (data && data.length > 0) || false;
    } catch (error) {
      console.error('Error checking if date is blocked:', error);
      return false;
    }
  }

  /**
   * Get all blocked dates for a tenant in a date range
   */
  static async getBlockedDatesInRange(
    tenantId: string,
    startDate: Date,
    endDate: Date
  ): Promise<BlockedDate[]> {
    try {
      const { data, error } = await supabase
        .from('blocked_dates')
        .select('*')
        .eq('tenant_id', tenantId)
        .gte('date', startDate.toISOString())
        .lte('date', endDate.toISOString())
        .order('date', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching blocked dates in range:', error);
      return [];
    }
  }

  /**
   * Get all blocked dates for a tenant (with optional filtering)
   */
  static async getBlockedDates(tenantId: string, month?: string): Promise<BlockedDate[]> {
    try {
      let query = supabase
        .from('blocked_dates')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('date', { ascending: true });

      if (month) {
        // month format: YYYY-MM
        const startDate = new Date(`${month}-01`);
        const endDate = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0);
        query = query
          .gte('date', startDate.toISOString())
          .lte('date', endDate.toISOString());
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching blocked dates:', error);
      return [];
    }
  }

  /**
   * Create a blocked date
   */
  static async createBlockedDate(
    tenantId: string,
    date: Date,
    reason?: string,
    recurringPattern?: 'daily' | 'weekly' | 'monthly' | 'yearly',
    recurringEndDate?: Date
  ): Promise<BlockedDate | null> {
    try {
      const { data, error } = await supabase
        .from('blocked_dates')
        .insert([
          {
            tenant_id: tenantId,
            date: date.toISOString(),
            reason,
            is_recurring: !!recurringPattern,
            recurring_pattern: recurringPattern,
            recurring_end_date: recurringEndDate?.toISOString(),
          },
        ])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating blocked date:', error);
      return null;
    }
  }

  /**
   * Delete a blocked date
   */
  static async deleteBlockedDate(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('blocked_dates')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting blocked date:', error);
      return false;
    }
  }

  /**
   * Check if time slot is available (considering blocked dates and business hours)
   */
  static async isTimeSlotAvailable(
    tenantId: string,
    date: Date,
    startTime: number, // minutes from start of day
    duration: number, // in minutes
    businessHoursData?: any
  ): Promise<boolean> {
    // Check if date is blocked
    const isBlocked = await this.isDateBlocked(tenantId, date);
    if (isBlocked) {
      return false;
    }

    // Check business hours if provided
    if (businessHoursData) {
      const dayOfWeek = date.getDay();
      const dayName = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][
        dayOfWeek
      ];

      const daySchedule = businessHoursData?.schedule?.[dayName];
      if (!daySchedule || !daySchedule.isOpen) {
        return false;
      }

      const [openHour, openMin] = daySchedule.openTime?.split(':').map(Number) || [0, 0];
      const [closeHour, closeMin] = daySchedule.closeTime?.split(':').map(Number) || [23, 59];

      const openMinutes = openHour * 60 + openMin;
      const closeMinutes = closeHour * 60 + closeMin;
      const endTime = startTime + duration;

      if (startTime < openMinutes || endTime > closeMinutes) {
        return false;
      }
    }

    return true;
  }

  /**
   * Get available dates in a range
   */
  static async getAvailableDatesInRange(
    tenantId: string,
    startDate: Date,
    endDate: Date
  ): Promise<Date[]> {
    try {
      const blockedDates = await this.getBlockedDatesInRange(tenantId, startDate, endDate);
      const blockedDateSet = new Set(
        blockedDates.map(bd => new Date(bd.date).toDateString())
      );

      const availableDates: Date[] = [];
      const current = new Date(startDate);

      while (current <= endDate) {
        if (!blockedDateSet.has(current.toDateString())) {
          availableDates.push(new Date(current));
        }
        current.setDate(current.getDate() + 1);
      }

      return availableDates;
    } catch (error) {
      console.error('Error getting available dates:', error);
      return [];
    }
  }
}
