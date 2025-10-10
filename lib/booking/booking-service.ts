import { prisma } from '@/lib/database';
import { 
  Booking, 
  Service, 
  Customer, 
  CreateBookingRequest, 
  UpdateBookingRequest,
  BookingConflict,
  TimeSlot,
  AvailabilityRequest,
  AvailabilityResponse,
  BookingStatus 
} from '@/types/booking';
import { validateBookingTime, validateBusinessHours } from '@/lib/validation/booking-validation';
import { LocationService } from '@/lib/location/location-service';
import { ServiceAreaService } from '@/lib/location/service-area-service';

export class BookingService {
  // Create a new booking
  static async createBooking(
    tenantId: string, 
    data: CreateBookingRequest
  ): Promise<{ booking?: Booking; error?: string }> {
    try {
      // Validate the service exists and belongs to tenant
      const service = await prisma.service.findFirst({
        where: { id: data.serviceId, tenantId, isActive: true }
      });
      
      if (!service) {
        return { error: 'Service not found or inactive' };
      }
      
      // Validate the customer exists and belongs to tenant
      const customer = await prisma.customer.findFirst({
        where: { id: data.customerId, tenantId }
      });
      
      if (!customer) {
        return { error: 'Customer not found' };
      }
      
      const scheduledAt = new Date(data.scheduledAt);
      
      // Validate booking time
      const timeValidation = validateBookingTime(scheduledAt);
      if (!timeValidation.valid) {
        return { error: timeValidation.message };
      }
      
      // Get business hours for validation
      const businessHours = await prisma.businessHours.findUnique({
        where: { tenantId }
      });
      
      // Validate against business hours
      const hoursValidation = validateBusinessHours(scheduledAt, businessHours);
      if (!hoursValidation.valid) {
        return { error: hoursValidation.message };
      }
      
      // Check for conflicts (including travel time for home visits)
      const conflictCheck = await this.checkBookingConflicts(
        tenantId,
        scheduledAt,
        service.duration,
        undefined,
        data.isHomeVisit
      );
      
      if (conflictCheck.hasConflict) {
        return { error: conflictCheck.message || 'Time slot is not available' };
      }
      
      // Validate home visit requirements
      if (data.isHomeVisit && !service.homeVisitAvailable) {
        return { error: 'Home visit is not available for this service' };
      }
      
      // Calculate total amount including location-based surcharges
      let totalAmount = service.price;
      let locationSurcharge = 0;
      
      if (data.isHomeVisit) {
        // Add base home visit surcharge
        if (service.homeVisitSurcharge) {
          totalAmount = totalAmount.add(service.homeVisitSurcharge);
        }
        
        // Calculate location-based surcharge if address is provided
        if (data.homeVisitAddress && data.homeVisitCoordinates) {
          try {
            const surchargeResult = await ServiceAreaService.calculateSurcharge(
              tenantId,
              data.homeVisitCoordinates,
              0, // Distance will be calculated by the service
              data.serviceId
            );
            locationSurcharge = surchargeResult.surcharge;
            totalAmount = totalAmount.add(locationSurcharge);
          } catch (error) {
            console.warn('Could not calculate location surcharge:', error);
          }
        }
      }
      
      // Create the booking
      const booking = await prisma.booking.create({
        data: {
          tenantId,
          customerId: data.customerId,
          serviceId: data.serviceId,
          scheduledAt,
          duration: service.duration,
          isHomeVisit: data.isHomeVisit || false,
          homeVisitAddress: data.homeVisitAddress,
          homeVisitCoordinates: data.homeVisitCoordinates,
          notes: data.notes,
          totalAmount,
          status: BookingStatus.PENDING,
          remindersSent: []
        },
        include: {
          customer: true,
          service: true
        }
      });
      
      // Update customer's total bookings count
      await prisma.customer.update({
        where: { id: data.customerId },
        data: { 
          totalBookings: { increment: 1 },
          lastBookingAt: new Date()
        }
      });
      
      return { booking: booking as Booking };
    } catch (error) {
      console.error('Error creating booking:', error);
      return { error: 'Failed to create booking' };
    }
  }
  
  // Update a booking
  static async updateBooking(
    tenantId: string,
    bookingId: string,
    data: UpdateBookingRequest
  ): Promise<{ booking?: Booking; error?: string }> {
    try {
      // Check if booking exists and belongs to tenant
      const existingBooking = await prisma.booking.findFirst({
        where: { id: bookingId, tenantId },
        include: { service: true }
      });
      
      if (!existingBooking) {
        return { error: 'Booking not found' };
      }
      
      const updateData: any = {};
      
      // Handle scheduled time update
      if (data.scheduledAt) {
        const newScheduledAt = new Date(data.scheduledAt);
        
        // Validate new time
        const timeValidation = validateBookingTime(newScheduledAt);
        if (!timeValidation.valid) {
          return { error: timeValidation.message };
        }
        
        // Check for conflicts (excluding current booking, including travel time for home visits)
        const conflictCheck = await this.checkBookingConflicts(
          tenantId,
          newScheduledAt,
          existingBooking.duration,
          bookingId,
          data.isHomeVisit !== undefined ? data.isHomeVisit : existingBooking.isHomeVisit
        );
        
        if (conflictCheck.hasConflict) {
          return { error: conflictCheck.message || 'New time slot is not available' };
        }
        
        updateData.scheduledAt = newScheduledAt;
      }
      
      // Handle other updates
      if (data.status !== undefined) updateData.status = data.status;
      if (data.isHomeVisit !== undefined) updateData.isHomeVisit = data.isHomeVisit;
      if (data.homeVisitAddress !== undefined) updateData.homeVisitAddress = data.homeVisitAddress;
      if (data.homeVisitCoordinates !== undefined) updateData.homeVisitCoordinates = data.homeVisitCoordinates;
      if (data.notes !== undefined) updateData.notes = data.notes;
      if (data.paymentStatus !== undefined) updateData.paymentStatus = data.paymentStatus;
      
      // Recalculate total amount if home visit status changed
      if (data.isHomeVisit !== undefined && data.isHomeVisit !== existingBooking.isHomeVisit) {
        let totalAmount = existingBooking.service.price;
        if (data.isHomeVisit && existingBooking.service.homeVisitSurcharge) {
          totalAmount = totalAmount.add(existingBooking.service.homeVisitSurcharge);
        }
        updateData.totalAmount = totalAmount;
      }
      
      const booking = await prisma.booking.update({
        where: { id: bookingId },
        data: updateData,
        include: {
          customer: true,
          service: true
        }
      });
      
      return { booking: booking as Booking };
    } catch (error) {
      console.error('Error updating booking:', error);
      return { error: 'Failed to update booking' };
    }
  }
  
  // Get bookings for a tenant
  static async getBookings(
    tenantId: string,
    options: {
      status?: BookingStatus;
      customerId?: string;
      serviceId?: string;
      startDate?: Date;
      endDate?: Date;
      limit?: number;
      offset?: number;
    } = {}
  ): Promise<Booking[]> {
    try {
      const where: any = { tenantId };
      
      if (options.status) where.status = options.status;
      if (options.customerId) where.customerId = options.customerId;
      if (options.serviceId) where.serviceId = options.serviceId;
      
      if (options.startDate || options.endDate) {
        where.scheduledAt = {};
        if (options.startDate) where.scheduledAt.gte = options.startDate;
        if (options.endDate) where.scheduledAt.lte = options.endDate;
      }
      
      const bookings = await prisma.booking.findMany({
        where,
        include: {
          customer: true,
          service: true
        },
        orderBy: { scheduledAt: 'asc' },
        take: options.limit,
        skip: options.offset
      });
      
      return bookings as Booking[];
    } catch (error) {
      console.error('Error fetching bookings:', error);
      return [];
    }
  }
  
  // Get a single booking
  static async getBooking(tenantId: string, bookingId: string): Promise<Booking | null> {
    try {
      const booking = await prisma.booking.findFirst({
        where: { id: bookingId, tenantId },
        include: {
          customer: true,
          service: true
        }
      });
      
      return booking as Booking | null;
    } catch (error) {
      console.error('Error fetching booking:', error);
      return null;
    }
  }
  
  // Delete a booking
  static async deleteBooking(tenantId: string, bookingId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const booking = await prisma.booking.findFirst({
        where: { id: bookingId, tenantId }
      });
      
      if (!booking) {
        return { success: false, error: 'Booking not found' };
      }
      
      await prisma.booking.delete({
        where: { id: bookingId }
      });
      
      // Update customer's total bookings count
      await prisma.customer.update({
        where: { id: booking.customerId },
        data: { totalBookings: { decrement: 1 } }
      });
      
      return { success: true };
    } catch (error) {
      console.error('Error deleting booking:', error);
      return { success: false, error: 'Failed to delete booking' };
    }
  }
  
  // Check for booking conflicts with travel time considerations
  static async checkBookingConflicts(
    tenantId: string,
    scheduledAt: Date,
    duration: number,
    excludeBookingId?: string,
    isHomeVisit: boolean = false
  ): Promise<BookingConflict> {
    try {
      const endTime = new Date(scheduledAt.getTime() + duration * 60000);
      
      const where: any = {
        tenantId,
        status: { in: [BookingStatus.PENDING, BookingStatus.CONFIRMED] },
        scheduledAt: {
          gte: new Date(scheduledAt.getTime() - 24 * 60 * 60 * 1000), // Check within 24 hours
          lte: new Date(scheduledAt.getTime() + 24 * 60 * 60 * 1000)
        }
      };
      
      if (excludeBookingId) {
        where.id = { not: excludeBookingId };
      }
      
      const conflictingBookings = await prisma.booking.findMany({
        where,
        include: {
          customer: true,
          service: true
        },
        orderBy: { scheduledAt: 'asc' }
      });
      
      // Filter for actual time conflicts with travel buffer considerations
      const actualConflicts = conflictingBookings.filter(booking => {
        const bookingEnd = new Date(booking.scheduledAt.getTime() + booking.duration * 60000);
        
        // Basic time overlap check
        const hasTimeOverlap = (
          (scheduledAt >= booking.scheduledAt && scheduledAt < bookingEnd) ||
          (endTime > booking.scheduledAt && endTime <= bookingEnd) ||
          (scheduledAt <= booking.scheduledAt && endTime >= bookingEnd)
        );
        
        if (hasTimeOverlap) return true;
        
        // Additional check for home visits - consider travel time
        if (isHomeVisit || booking.isHomeVisit) {
          const travelBuffer = 30 * 60000; // 30 minutes buffer in milliseconds
          
          // Check if new booking is too close after existing booking
          if (scheduledAt > booking.scheduledAt && scheduledAt < new Date(bookingEnd.getTime() + travelBuffer)) {
            return true;
          }
          
          // Check if existing booking is too close after new booking
          if (booking.scheduledAt > scheduledAt && booking.scheduledAt < new Date(endTime.getTime() + travelBuffer)) {
            return true;
          }
        }
        
        return false;
      });
      
      return {
        hasConflict: actualConflicts.length > 0,
        conflictingBookings: actualConflicts as Booking[],
        message: actualConflicts.length > 0 ? 
          (isHomeVisit ? 'Time slot conflicts with existing booking or insufficient travel time' : 'Time slot conflicts with existing booking') 
          : undefined
      };
    } catch (error) {
      console.error('Error checking booking conflicts:', error);
      return {
        hasConflict: true,
        conflictingBookings: [],
        message: 'Error checking availability'
      };
    }
  }
  
  // Get availability for a specific date
  static async getAvailability(
    tenantId: string,
    request: AvailabilityRequest
  ): Promise<AvailabilityResponse | null> {
    try {
      // Get service details
      const service = await prisma.service.findFirst({
        where: { id: request.serviceId, tenantId, isActive: true }
      });
      
      if (!service) {
        return null;
      }
      
      // Get business hours
      const businessHours = await prisma.businessHours.findUnique({
        where: { tenantId }
      });
      
      const requestDate = new Date(request.date);
      const dayOfWeek = requestDate.getDay();
      const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
      const dayName = dayNames[dayOfWeek];
      
      let businessHoursInfo = { isOpen: true, openTime: '09:00', closeTime: '17:00' };
      
      if (businessHours?.schedule) {
        const daySchedule = (businessHours.schedule as any)[dayName];
        if (daySchedule) {
          businessHoursInfo = {
            isOpen: daySchedule.isOpen,
            openTime: daySchedule.openTime,
            closeTime: daySchedule.closeTime
          };
        }
      }
      
      if (!businessHoursInfo.isOpen) {
        return {
          date: request.date,
          slots: [],
          businessHours: businessHoursInfo
        };
      }
      
      // Generate time slots
      const duration = request.duration || service.duration;
      const slots: TimeSlot[] = [];
      
      const startTime = new Date(`${request.date}T${businessHoursInfo.openTime}:00`);
      const endTime = new Date(`${request.date}T${businessHoursInfo.closeTime}:00`);
      
      // Get existing bookings for the date
      const existingBookings = await this.getBookings(tenantId, {
        startDate: new Date(`${request.date}T00:00:00`),
        endDate: new Date(`${request.date}T23:59:59`),
        status: BookingStatus.CONFIRMED
      });
      
      // Generate 30-minute slots
      const slotDuration = 30; // minutes
      let currentTime = new Date(startTime);
      
      while (currentTime.getTime() + duration * 60000 <= endTime.getTime()) {
        const slotEnd = new Date(currentTime.getTime() + duration * 60000);
        
        // Check if this slot conflicts with existing bookings
        const hasConflict = existingBookings.some(booking => {
          const bookingEnd = new Date(booking.scheduledAt.getTime() + booking.duration * 60000);
          return (
            (currentTime >= booking.scheduledAt && currentTime < bookingEnd) ||
            (slotEnd > booking.scheduledAt && slotEnd <= bookingEnd) ||
            (currentTime <= booking.scheduledAt && slotEnd >= bookingEnd)
          );
        });
        
        slots.push({
          start: new Date(currentTime),
          end: slotEnd,
          available: !hasConflict,
          bookingId: hasConflict ? existingBookings.find(b => 
            currentTime >= b.scheduledAt && 
            currentTime < new Date(b.scheduledAt.getTime() + b.duration * 60000)
          )?.id : undefined
        });
        
        // Move to next slot
        currentTime = new Date(currentTime.getTime() + slotDuration * 60000);
      }
      
      return {
        date: request.date,
        slots,
        businessHours: businessHoursInfo
      };
    } catch (error) {
      console.error('Error getting availability:', error);
      return null;
    }
  }
}