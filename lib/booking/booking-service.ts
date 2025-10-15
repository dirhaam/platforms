import { db } from '@/lib/database/server';
import { 
  bookings,
  services,
  customers,
  businessHours,
  tenants
} from '@/lib/database/schema';
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
import { eq, and, ne, gte, lte, inArray, asc } from 'drizzle-orm';
import { sql } from 'drizzle-orm';

const randomUUID = () => {
  if (typeof globalThis.crypto?.randomUUID === 'function') {
    return globalThis.crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2);
};

type BusinessHoursRow = typeof businessHours.$inferSelect;

export class BookingService {
  // Create a new booking
  static async createBooking(
    tenantId: string, 
    data: CreateBookingRequest
  ): Promise<{ booking?: Booking; error?: string }> {
    try {
      // Validate the service exists and belongs to tenant
      const [serviceResult] = await db.select().from(services).where(
        and(
          eq(services.id, data.serviceId),
          eq(services.tenantId, tenantId),
          eq(services.isActive, true)
        )
      ).limit(1);
      
      const service = serviceResult || null;
      
      if (!service) {
        return { error: 'Service not found or inactive' };
      }
      
      // Validate the customer exists and belongs to tenant
      const [customerResult] = await db.select().from(customers).where(
        and(
          eq(customers.id, data.customerId),
          eq(customers.tenantId, tenantId)
        )
      ).limit(1);
      
      const customer = customerResult || null;
      
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
      const businessHoursRows: typeof businessHours.$inferSelect[] = await db.select().from(businessHours).where(
        eq(businessHours.tenantId, tenantId)
      ).limit(1);
      
      const businessHoursRecord = businessHoursRows[0] || null;
      
      // Validate against business hours
      const hoursValidation = validateBusinessHours(scheduledAt, businessHoursRecord);
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
      let totalAmount: any = service.price;
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
      const [newBooking] = await db.insert(bookings).values({
        id: randomUUID(), // Assuming we need to generate an ID
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
        remindersSent: [],
        createdAt: new Date(),
        updatedAt: new Date()
      }).returning();
      
      // Get the created booking with customer and service data
      const booking = await db.select({
        id: bookings.id,
        tenantId: bookings.tenantId,
        customerId: bookings.customerId,
        serviceId: bookings.serviceId,
        status: bookings.status,
        scheduledAt: bookings.scheduledAt,
        duration: bookings.duration,
        isHomeVisit: bookings.isHomeVisit,
        homeVisitAddress: bookings.homeVisitAddress,
        homeVisitCoordinates: bookings.homeVisitCoordinates,
        notes: bookings.notes,
        totalAmount: bookings.totalAmount,
        paymentStatus: bookings.paymentStatus,
        remindersSent: bookings.remindersSent,
        createdAt: bookings.createdAt,
        updatedAt: bookings.updatedAt,
        customer: {
          id: customers.id,
          name: customers.name,
          email: customers.email,
          phone: customers.phone,
          address: customers.address,
          notes: customers.notes,
          totalBookings: customers.totalBookings,
          lastBookingAt: customers.lastBookingAt,
          whatsappNumber: customers.whatsappNumber,
          createdAt: customers.createdAt,
          updatedAt: customers.updatedAt
        },
        service: {
          id: services.id,
          name: services.name,
          description: services.description,
          duration: services.duration,
          price: services.price,
          category: services.category,
          isActive: services.isActive,
          homeVisitAvailable: services.homeVisitAvailable,
          homeVisitSurcharge: services.homeVisitSurcharge,
          createdAt: services.createdAt,
          updatedAt: services.updatedAt
        }
      }).from(bookings).leftJoin(customers, eq(bookings.customerId, customers.id)).leftJoin(services, eq(bookings.serviceId, services.id)).where(eq(bookings.id, newBooking.id)).limit(1);
      
      // Update customer's total bookings count
      await db.update(customers).set({
        totalBookings: sql`${customers.totalBookings} + 1`,
        lastBookingAt: new Date()
      }).where(eq(customers.id, data.customerId));
      
      return { booking: booking[0] as unknown as Booking };
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
      const [existingBookingResult] = await db
        .select({
          booking: {
            id: bookings.id,
            tenantId: bookings.tenantId,
            customerId: bookings.customerId,
            serviceId: bookings.serviceId,
            status: bookings.status,
            scheduledAt: bookings.scheduledAt,
            duration: bookings.duration,
            isHomeVisit: bookings.isHomeVisit,
            homeVisitAddress: bookings.homeVisitAddress,
            homeVisitCoordinates: bookings.homeVisitCoordinates,
            notes: bookings.notes,
            totalAmount: bookings.totalAmount,
            paymentStatus: bookings.paymentStatus,
            remindersSent: bookings.remindersSent,
            createdAt: bookings.createdAt,
            updatedAt: bookings.updatedAt
          },
          service: {
            id: services.id,
            name: services.name,
            description: services.description,
            duration: services.duration,
            price: services.price,
            category: services.category,
            isActive: services.isActive,
            homeVisitAvailable: services.homeVisitAvailable,
            homeVisitSurcharge: services.homeVisitSurcharge,
            createdAt: services.createdAt,
            updatedAt: services.updatedAt
          }
        })
        .from(bookings)
        .leftJoin(services, eq(bookings.serviceId, services.id))
        .where(
          and(eq(bookings.id, bookingId), eq(bookings.tenantId, tenantId))
        )
        .limit(1);

      const existingBooking = existingBookingResult?.booking;
      const existingService = existingBookingResult?.service;

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
          data.isHomeVisit !== undefined ? data.isHomeVisit : Boolean(existingBooking.isHomeVisit)
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
        if (existingService?.price) {
          let totalAmount = existingService.price;
          if (data.isHomeVisit && existingService.homeVisitSurcharge) {
            const totalAmountValue = totalAmount as any;
            if (typeof totalAmountValue?.add === 'function') {
              totalAmount = totalAmountValue.add(existingService.homeVisitSurcharge);
            } else {
              const base = Number(totalAmount);
              const surcharge = Number(existingService.homeVisitSurcharge);
              if (!Number.isNaN(base) && !Number.isNaN(surcharge)) {
                totalAmount = base + surcharge;
              }
            }
          }
          updateData.totalAmount = totalAmount;
        }
      }
      
      // Update booking
      await db.update(bookings).set({
        ...updateData,
        updatedAt: new Date()
      }).where(eq(bookings.id, bookingId));
      
      // Get updated booking with customer and service data
      const [updatedBooking] = await db.select({
        id: bookings.id,
        tenantId: bookings.tenantId,
        customerId: bookings.customerId,
        serviceId: bookings.serviceId,
        status: bookings.status,
        scheduledAt: bookings.scheduledAt,
        duration: bookings.duration,
        isHomeVisit: bookings.isHomeVisit,
        homeVisitAddress: bookings.homeVisitAddress,
        homeVisitCoordinates: bookings.homeVisitCoordinates,
        notes: bookings.notes,
        totalAmount: bookings.totalAmount,
        paymentStatus: bookings.paymentStatus,
        remindersSent: bookings.remindersSent,
        createdAt: bookings.createdAt,
        updatedAt: bookings.updatedAt,
        customer: {
          id: customers.id,
          name: customers.name,
          email: customers.email,
          phone: customers.phone,
          address: customers.address,
          notes: customers.notes,
          totalBookings: customers.totalBookings,
          lastBookingAt: customers.lastBookingAt,
          whatsappNumber: customers.whatsappNumber,
          createdAt: customers.createdAt,
          updatedAt: customers.updatedAt
        },
        service: {
          id: services.id,
          name: services.name,
          description: services.description,
          duration: services.duration,
          price: services.price,
          category: services.category,
          isActive: services.isActive,
          homeVisitAvailable: services.homeVisitAvailable,
          homeVisitSurcharge: services.homeVisitSurcharge,
          createdAt: services.createdAt,
          updatedAt: services.updatedAt
        }
      }).from(bookings).leftJoin(customers, eq(bookings.customerId, customers.id)).leftJoin(services, eq(bookings.serviceId, services.id)).where(eq(bookings.id, bookingId)).limit(1);
      
      return { booking: updatedBooking as unknown as Booking };
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
      let query: any = db.select({
        id: bookings.id,
        tenantId: bookings.tenantId,
        customerId: bookings.customerId,
        serviceId: bookings.serviceId,
        status: bookings.status,
        scheduledAt: bookings.scheduledAt,
        duration: bookings.duration,
        isHomeVisit: bookings.isHomeVisit,
        homeVisitAddress: bookings.homeVisitAddress,
        homeVisitCoordinates: bookings.homeVisitCoordinates,
        notes: bookings.notes,
        totalAmount: bookings.totalAmount,
        paymentStatus: bookings.paymentStatus,
        remindersSent: bookings.remindersSent,
        createdAt: bookings.createdAt,
        updatedAt: bookings.updatedAt,
        customer: {
          id: customers.id,
          name: customers.name,
          email: customers.email,
          phone: customers.phone,
          address: customers.address,
          notes: customers.notes,
          totalBookings: customers.totalBookings,
          lastBookingAt: customers.lastBookingAt,
          whatsappNumber: customers.whatsappNumber,
          createdAt: customers.createdAt,
          updatedAt: customers.updatedAt
        },
        service: {
          id: services.id,
          name: services.name,
          description: services.description,
          duration: services.duration,
          price: services.price,
          category: services.category,
          isActive: services.isActive,
          homeVisitAvailable: services.homeVisitAvailable,
          homeVisitSurcharge: services.homeVisitSurcharge,
          createdAt: services.createdAt,
          updatedAt: services.updatedAt
        }
      }).from(bookings).leftJoin(customers, eq(bookings.customerId, customers.id)).leftJoin(services, eq(bookings.serviceId, services.id)).where(eq(bookings.tenantId, tenantId));

      // Add filters if provided
      if (options.status) query = query.where(eq(bookings.status, options.status));
      if (options.customerId) query = query.where(eq(bookings.customerId, options.customerId));
      if (options.serviceId) query = query.where(eq(bookings.serviceId, options.serviceId));
      
      if (options.startDate || options.endDate) {
        let dateFilter = and();
        if (options.startDate) dateFilter = and(dateFilter, gte(bookings.scheduledAt, options.startDate));
        if (options.endDate) dateFilter = and(dateFilter, lte(bookings.scheduledAt, options.endDate));
        query = query.where(dateFilter);
      }

      // Add ordering and limits
      query = query.orderBy(asc(bookings.scheduledAt));
      if (options.limit) query = query.limit(options.limit);
      if (options.offset) query = query.offset(options.offset);
      
      const bookingResults = await query;
      
      return bookingResults as Booking[];
    } catch (error) {
      console.error('Error fetching bookings:', error);
      return [];
    }
  }
  
  // Get a single booking
  static async getBooking(tenantId: string, bookingId: string): Promise<Booking | null> {
    try {
      const [bookingResult] = await db.select({
        id: bookings.id,
        tenantId: bookings.tenantId,
        customerId: bookings.customerId,
        serviceId: bookings.serviceId,
        status: bookings.status,
        scheduledAt: bookings.scheduledAt,
        duration: bookings.duration,
        isHomeVisit: bookings.isHomeVisit,
        homeVisitAddress: bookings.homeVisitAddress,
        homeVisitCoordinates: bookings.homeVisitCoordinates,
        notes: bookings.notes,
        totalAmount: bookings.totalAmount,
        paymentStatus: bookings.paymentStatus,
        remindersSent: bookings.remindersSent,
        createdAt: bookings.createdAt,
        updatedAt: bookings.updatedAt,
        customer: {
          id: customers.id,
          name: customers.name,
          email: customers.email,
          phone: customers.phone,
          address: customers.address,
          notes: customers.notes,
          totalBookings: customers.totalBookings,
          lastBookingAt: customers.lastBookingAt,
          whatsappNumber: customers.whatsappNumber,
          createdAt: customers.createdAt,
          updatedAt: customers.updatedAt
        },
        service: {
          id: services.id,
          name: services.name,
          description: services.description,
          duration: services.duration,
          price: services.price,
          category: services.category,
          isActive: services.isActive,
          homeVisitAvailable: services.homeVisitAvailable,
          homeVisitSurcharge: services.homeVisitSurcharge,
          createdAt: services.createdAt,
          updatedAt: services.updatedAt
        }
      }).from(bookings).leftJoin(customers, eq(bookings.customerId, customers.id)).leftJoin(services, eq(bookings.serviceId, services.id)).where(
        and(
          eq(bookings.id, bookingId),
          eq(bookings.tenantId, tenantId)
        )
      ).limit(1);
      
      return bookingResult ? (bookingResult as unknown as Booking) : null;
    } catch (error) {
      console.error('Error fetching booking:', error);
      return null;
    }
  }
  
  // Delete a booking
  static async deleteBooking(tenantId: string, bookingId: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Check if booking exists and belongs to tenant
      const [bookingResult] = await db.select({
        id: bookings.id,
        customerId: bookings.customerId
      }).from(bookings).where(
        and(
          eq(bookings.id, bookingId),
          eq(bookings.tenantId, tenantId)
        )
      ).limit(1);
      
      const booking = bookingResult || null;
      
      if (!booking) {
        return { success: false, error: 'Booking not found' };
      }
      
      // Delete the booking
      await db.delete(bookings).where(eq(bookings.id, bookingId));
      
      // Update customer's total bookings count
      await db.update(customers).set({
        totalBookings: sql`${customers.totalBookings} - 1`
      }).where(eq(customers.id, booking.customerId));
      
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
      const windowStart = new Date(scheduledAt.getTime() - 24 * 60 * 60 * 1000);
      const windowEnd = new Date(scheduledAt.getTime() + 24 * 60 * 60 * 1000);

      const conditions = [
        eq(bookings.tenantId, tenantId),
        inArray(bookings.status, [BookingStatus.PENDING, BookingStatus.CONFIRMED]),
        gte(bookings.scheduledAt, windowStart),
        lte(bookings.scheduledAt, windowEnd)
      ];

      if (excludeBookingId) {
        conditions.push(ne(bookings.id, excludeBookingId));
      }

      const conflictingBookings = await db
        .select({
          id: bookings.id,
          tenantId: bookings.tenantId,
          customerId: bookings.customerId,
          serviceId: bookings.serviceId,
          status: bookings.status,
          scheduledAt: bookings.scheduledAt,
          duration: bookings.duration,
          isHomeVisit: bookings.isHomeVisit,
          homeVisitAddress: bookings.homeVisitAddress,
          homeVisitCoordinates: bookings.homeVisitCoordinates,
          notes: bookings.notes,
          totalAmount: bookings.totalAmount,
          paymentStatus: bookings.paymentStatus,
          remindersSent: bookings.remindersSent,
          createdAt: bookings.createdAt,
          updatedAt: bookings.updatedAt,
          customer: {
            id: customers.id,
            name: customers.name,
            email: customers.email,
            phone: customers.phone,
            address: customers.address,
            notes: customers.notes,
            totalBookings: customers.totalBookings,
            lastBookingAt: customers.lastBookingAt,
            whatsappNumber: customers.whatsappNumber,
            createdAt: customers.createdAt,
            updatedAt: customers.updatedAt
          },
          service: {
            id: services.id,
            name: services.name,
            description: services.description,
            duration: services.duration,
            price: services.price,
            category: services.category,
            isActive: services.isActive,
            homeVisitAvailable: services.homeVisitAvailable,
            homeVisitSurcharge: services.homeVisitSurcharge,
            createdAt: services.createdAt,
            updatedAt: services.updatedAt
          }
        })
        .from(bookings)
        .leftJoin(customers, eq(bookings.customerId, customers.id))
        .leftJoin(services, eq(bookings.serviceId, services.id))
        .where(and(...conditions))
        .orderBy(asc(bookings.scheduledAt));
      
      // Filter for actual time conflicts with travel buffer considerations
      const bookingsWithRelations = conflictingBookings as unknown as Booking[];
      const actualConflicts = bookingsWithRelations.filter(booking => {
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
        conflictingBookings: actualConflicts,
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
      const [serviceResult] = await db
        .select()
        .from(services)
        .where(
          and(
            eq(services.id, request.serviceId),
            eq(services.tenantId, tenantId),
            eq(services.isActive, true)
          )
        )
        .limit(1);

      const service = serviceResult || null;

      if (!service) {
        return null;
      }
      
      // Get business hours
      const businessHoursRows: typeof businessHours.$inferSelect[] = await db
        .select()
        .from(businessHours)
        .where(eq(businessHours.tenantId, tenantId))
        .limit(1);

      const businessHoursRecord = businessHoursRows[0] || null;
      
      const requestDate = new Date(request.date);
      const dayOfWeek = requestDate.getDay();
      const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
      const dayName = dayNames[dayOfWeek];
      
      let businessHoursInfo = { isOpen: true, openTime: '09:00', closeTime: '17:00' };
      
      if (businessHoursRecord?.schedule) {
        const daySchedule = (businessHoursRecord.schedule as any)[dayName];
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