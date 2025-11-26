import { BlockedDatesService } from '@/lib/bookings/blocked-dates-service';
import { getSupabaseClient, getDayKey, getDayHours, timezoneOffsets } from './utils';
import { getService } from './crud';
import { AvailabilityRequest, AvailabilityResponse, TimeSlot, BookingStatus } from './types';

export async function getAvailability(
  tenantId: string,
  request: AvailabilityRequest
): Promise<AvailabilityResponse | null> {
  try {
    const supabase = getSupabaseClient();

    const service = await getService(tenantId, request.serviceId);
    if (!service) {
      return null;
    }

    // Get global business hours for the tenant
    const { data: businessHoursData } = await supabase
      .from('business_hours')
      .select('*')
      .eq('tenant_id', tenantId)
      .single();

    // Parse YYYY-MM-DD format as LOCAL date
    const [year, month, day] = request.date.split('-').map(Number);
    const bookingDate = new Date(year, month - 1, day);
    bookingDate.setHours(0, 0, 0, 0);

    const dayKey = getDayKey(bookingDate);
    const schedule = businessHoursData?.schedule || {};
    const dayHours = getDayHours(schedule, dayKey);

    // Check if business is open on this day
    if (!dayHours.isOpen) {
      return {
        date: request.date,
        slots: [],
        businessHours: { isOpen: false }
      };
    }

    const operatingHours = {
      startTime: dayHours.openTime,
      endTime: dayHours.closeTime
    };

    const startOfDay = new Date(bookingDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(bookingDate);
    endOfDay.setHours(23, 59, 59, 999);

    // Fetch all confirmed bookings for this service on this date
    const { data: bookings, error } = await supabase
      .from('bookings')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('service_id', request.serviceId)
      .eq('status', BookingStatus.CONFIRMED)
      .gte('scheduled_at', startOfDay.toISOString())
      .lte('scheduled_at', endOfDay.toISOString());

    if (error) {
      console.error('Error fetching bookings for availability:', error);
      return {
        date: request.date,
        slots: [],
        businessHours: { isOpen: false }
      };
    }

    // Get slot duration and quota from service
    const slotDurationMinutes = (service as any).slotDurationMinutes || 30;
    const hourlyQuota = (service as any).hourlyQuota || 10;
    const serviceDuration = request.duration || (service as any).duration;
    const slots: TimeSlot[] = [];

    // Get timezone offset from database
    const timezone = businessHoursData?.timezone || 'Asia/Jakarta';

    // Use date-fns-tz to handle timezone conversions
    const { fromZonedTime } = await import('date-fns-tz');

    const dateStr = request.date;
    const startIsoStr = `${dateStr}T${operatingHours.startTime}:00`;
    const endIsoStr = `${dateStr}T${operatingHours.endTime}:00`;

    const startDate = fromZonedTime(startIsoStr, timezone);
    const endDate = fromZonedTime(endIsoStr, timezone);

    // Count bookings per hour to enforce hourly quota
    const bookingsPerHour = new Map<string, number>();

    (bookings || []).forEach(booking => {
      const bookingTime = new Date(booking.scheduled_at);
      const hourKey = `${bookingTime.getHours()}:00`;
      bookingsPerHour.set(hourKey, (bookingsPerHour.get(hourKey) || 0) + 1);
    });

    let currentTime = new Date(startDate);

    while (currentTime < endDate) {
      const slotStart = new Date(currentTime);
      const slotEnd = new Date(slotStart.getTime() + serviceDuration * 60000);

      // Check if slot would go past business hours
      if (slotEnd > endDate) {
        break;
      }

      // Get hour slot key for quota check
      const hourKey = `${slotStart.getHours()}:00`;
      const bookingsInThisHour = bookingsPerHour.get(hourKey) || 0;

      // Check if slot is available
      let isAvailable = false;

      // First check: don't exceed hourly quota
      if (bookingsInThisHour < hourlyQuota) {
        // Second check: ensure no time conflicts with existing bookings
        const conflictingBooking = (bookings || []).find(b => {
          const bookingStart = new Date(b.scheduled_at);
          const bookingEnd = new Date(bookingStart.getTime() + b.duration * 60000);
          return slotStart < bookingEnd && slotEnd > bookingStart;
        });

        isAvailable = !conflictingBooking;
      }

      slots.push({
        start: slotStart,
        end: slotEnd,
        available: isAvailable
      });

      currentTime = new Date(currentTime.getTime() + slotDurationMinutes * 60000);
    }

    return {
      date: request.date,
      slots,
      businessHours: {
        isOpen: true,
        openTime: operatingHours.startTime,
        closeTime: operatingHours.endTime
      }
    };
  } catch (error) {
    console.error('Error in getAvailability:', error);
    return null;
  }
}

export async function getAvailabilityWithStaff(
  tenantId: string,
  serviceId: string,
  date: string,
  staffId?: string
): Promise<AvailabilityResponse | null> {
  try {
    const { StaffAvailabilityService } = await import('@/lib/booking/staff-availability-service');

    const supabase = getSupabaseClient();

    const service = await getService(tenantId, serviceId);
    if (!service) {
      return null;
    }

    // Get business hours
    const { data: businessHoursData } = await supabase
      .from('business_hours')
      .select('*')
      .eq('tenant_id', tenantId)
      .single();

    // Parse date
    const [year, month, day] = date.split('-').map(Number);
    const bookingDate = new Date(year, month - 1, day);
    bookingDate.setHours(0, 0, 0, 0);

    const dayKey = getDayKey(bookingDate);
    const schedule = businessHoursData?.schedule || {};
    const dayHours = getDayHours(schedule, dayKey);

    if (!dayHours.isOpen) {
      return {
        date,
        slots: [],
        businessHours: { isOpen: false }
      };
    }

    // Check if date is blocked
    const isBlocked = await BlockedDatesService.isDateBlocked(tenantId, bookingDate);
    if (isBlocked) {
      return {
        date,
        slots: [],
        businessHours: { isOpen: true, isBlocked: true }
      };
    }

    // Determine which staff to check
    let staffToCheck: string[] = [];

    if (staffId) {
      const isAvailable = await StaffAvailabilityService.isStaffAvailableOnDate(staffId, bookingDate);
      if (!isAvailable) {
        return { date, slots: [], businessHours: { isOpen: true } };
      }
      staffToCheck = [staffId];
    } else if ((service as any).requiresStaffAssignment || (service as any).serviceType === 'home_visit') {
      const qualifiedStaff = await StaffAvailabilityService.getStaffForService(tenantId, serviceId);

      const availableStaff: string[] = [];
      for (const staff of qualifiedStaff) {
        const isAvailable = await StaffAvailabilityService.isStaffAvailableOnDate(staff.id, bookingDate);
        if (isAvailable) {
          availableStaff.push(staff.id);
        }
      }

      if (availableStaff.length === 0) {
        return { date, slots: [], businessHours: { isOpen: true } };
      }

      staffToCheck = availableStaff;
    }

    const timezone = businessHoursData?.timezone || 'Asia/Jakarta';
    const tzOffset = timezoneOffsets[timezone] || 7;

    const [startHour, startMin] = dayHours.openTime.split(':').map(Number);
    const [endHour, endMin] = dayHours.closeTime.split(':').map(Number);

    const startDate = new Date(bookingDate);
    startDate.setHours(startHour, startMin, 0, 0);
    startDate.setHours(startDate.getHours() - tzOffset);

    const endDate = new Date(bookingDate);
    endDate.setHours(endHour, endMin, 0, 0);
    endDate.setHours(endDate.getHours() - tzOffset);

    const serviceDuration = (service as any).duration;
    const slotDurationMinutes = (service as any).slotDurationMinutes || 30;
    const isFullDayBooking = (service as any).homeVisitFullDayBooking || false;
    const bufferMinutes = (service as any).homeVisitMinBufferMinutes || 0;
    const dailyQuota = (service as any).dailyQuotaPerStaff;

    const slots: TimeSlot[] = [];

    // If full day booking, only return 1 slot per day per staff
    if (isFullDayBooking) {
      let hasBooking = false;

      if (staffId) {
        const bookingCount = await StaffAvailabilityService.getStaffBookingCountOnDate(
          tenantId,
          staffId,
          bookingDate
        );
        hasBooking = bookingCount > 0;
      } else {
        for (const stfId of staffToCheck) {
          const bookingCount = await StaffAvailabilityService.getStaffBookingCountOnDate(
            tenantId,
            stfId,
            bookingDate
          );
          if (bookingCount > 0) {
            hasBooking = true;
            break;
          }
        }
      }

      if (!hasBooking) {
        slots.push({
          start: new Date(startDate),
          end: new Date(startDate.getTime() + serviceDuration * 60000),
          available: true
        });
      }

      return {
        date,
        slots,
        businessHours: { isOpen: true, openTime: dayHours.openTime, closeTime: dayHours.closeTime }
      };
    }

    // Multiple bookings per day - generate slots with travel time blocking
    const staffBookings: Map<string, any[]> = new Map();

    if (staffId) {
      const bookings = await StaffAvailabilityService.getStaffBookingsOnDate(
        tenantId,
        staffId,
        bookingDate
      );
      staffBookings.set(staffId, bookings);
    } else {
      for (const stfId of staffToCheck) {
        const bookings = await StaffAvailabilityService.getStaffBookingsOnDate(
          tenantId,
          stfId,
          bookingDate
        );
        staffBookings.set(stfId, bookings);
      }
    }

    let currentTime = new Date(startDate);

    while (currentTime < endDate) {
      const slotStart = new Date(currentTime);
      const slotEnd = new Date(slotStart.getTime() + serviceDuration * 60000);

      if (slotEnd > endDate) {
        break;
      }

      let isAvailable = false;

      const staffToCheck1 = staffId ? [staffId] : Array.from(staffBookings.keys());

      for (const stfId of staffToCheck1) {
        const bookings = staffBookings.get(stfId) || [];

        if (dailyQuota && bookings.length >= dailyQuota) {
          continue;
        }

        let hasConflict = false;

        for (const booking of bookings) {
          const bookingStart = new Date(booking.scheduled_at);
          const bookingEnd = new Date(bookingStart.getTime() + booking.duration * 60000);

          const bookingStartWithBuffer = new Date(bookingStart.getTime() - bufferMinutes * 60000);
          const bookingEndWithBuffer = new Date(bookingEnd.getTime() + bufferMinutes * 60000);

          if (slotStart < bookingEndWithBuffer && slotEnd > bookingStartWithBuffer) {
            hasConflict = true;
            break;
          }
        }

        if (!hasConflict) {
          isAvailable = true;
          break;
        }
      }

      slots.push({
        start: slotStart,
        end: slotEnd,
        available: isAvailable
      });

      currentTime = new Date(currentTime.getTime() + slotDurationMinutes * 60000);
    }

    return {
      date,
      slots,
      businessHours: { isOpen: true, openTime: dayHours.openTime, closeTime: dayHours.closeTime }
    };
  } catch (error) {
    console.error('Error in getAvailabilityWithStaff:', error);
    return null;
  }
}
