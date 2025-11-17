import { z } from 'zod';
import { BookingStatus, PaymentStatus } from '@/types/booking';

// Booking validation schemas
export const createBookingSchema = z.object({
  customerId: z.string().min(1, 'Customer ID is required'),
  serviceId: z.string().min(1, 'Service ID is required'),
  scheduledAt: z.string().datetime('Invalid date format'),
  isHomeVisit: z.boolean().optional().default(false),
  homeVisitAddress: z.string().optional(),
  homeVisitCoordinates: z.object({
    lat: z.number().min(-90).max(90),
    lng: z.number().min(-180).max(180)
  }).optional(),
  notes: z.string().optional(),
  paymentMethod: z.enum(['cash', 'card', 'transfer', 'qris']).optional().default('cash'),
  dpAmount: z.number().min(0).optional().default(0),
  // Travel-related fields (from frontend calculation)
  travelDistance: z.number().optional(),
  travelDuration: z.number().optional(),
  travelSurchargeAmount: z.number().optional(),
  travelRoute: z.array(z.object({
    lat: z.number(),
    lng: z.number()
  })).optional(),
  paymentReference: z.string().optional()
}).refine((data: any) => {
  // If it's a home visit, address is required
  if (data.isHomeVisit && !data.homeVisitAddress) {
    return false;
  }
  return true;
}, {
  message: 'Home visit address is required for home visit bookings',
  path: ['homeVisitAddress']
});

export const updateBookingSchema = z.object({
  customerId: z.string().optional(),
  serviceId: z.string().optional(),
  status: z.nativeEnum(BookingStatus).optional(),
  scheduledAt: z.union([z.string().datetime('Invalid date format'), z.date()]).optional(),
  duration: z.number().min(15).max(480).optional(),
  totalAmount: z.number().min(0, 'Amount must be >= 0').optional(),
  isHomeVisit: z.boolean().optional(),
  homeVisitAddress: z.string().optional(),
  homeVisitCoordinates: z.object({
    lat: z.number().min(-90).max(90),
    lng: z.number().min(-180).max(180)
  }).optional(),
  notes: z.string().optional(),
  paymentStatus: z.nativeEnum(PaymentStatus).optional(),
  paymentMethod: z.enum(['cash', 'card', 'transfer', 'qris']).optional()
});

// Service validation schemas
export const createServiceSchema = z.object({
  name: z.string().min(1, 'Service name is required').max(100, 'Service name too long'),
  description: z.string().min(1, 'Description is required').max(500, 'Description too long'),
  duration: z.number().min(15, 'Minimum duration is 15 minutes').max(480, 'Maximum duration is 8 hours'),
  price: z.number().min(0, 'Price must be positive'),
  category: z.string().min(1, 'Category is required'),
  homeVisitAvailable: z.boolean().optional().default(false),
  homeVisitSurcharge: z.number().min(0).optional().nullable(),
  images: z.array(z.string().url()).optional().default([]),
  requirements: z.array(z.string()).optional().default([]),
  slotDurationMinutes: z.number().min(15).max(480).optional().default(30),
  hourlyQuota: z.number().min(1).max(100).optional().default(10)
});

export const updateServiceSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  duration: z.number().min(15).max(480).optional(),
  price: z.number().min(0).optional(),
  category: z.string().optional(),
  isActive: z.boolean().optional(),
  homeVisitAvailable: z.boolean().optional(),
  homeVisitSurcharge: z.number().min(0).optional().nullable(),
  images: z.array(z.string().url()).optional().default([]),
  requirements: z.array(z.string()).optional().default([]),
  slotDurationMinutes: z.number().min(15).max(480).optional(),
  hourlyQuota: z.number().min(1).max(100).optional()
});

// Customer validation schemas
export const createCustomerSchema = z.object({
  name: z.string().min(1, 'Customer name is required').max(100, 'Name too long'),
  email: z.string().email('Invalid email format').optional(),
  phone: z.string().min(10, 'Phone number too short').max(20, 'Phone number too long'),
  address: z.string().max(200, 'Address too long').optional(),
  notes: z.string().max(500, 'Notes too long').optional(),
  whatsappNumber: z.string().min(10).max(20).optional()
});

export const updateCustomerSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  email: z.string().email().optional(),
  phone: z.string().min(10).max(20).optional(),
  address: z.string().max(200).optional(),
  notes: z.string().max(500).optional(),
  whatsappNumber: z.string().min(10).max(20).optional()
});

// Availability validation
export const availabilityRequestSchema = z.object({
  serviceId: z.string().min(1, 'Service ID is required'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  duration: z.number().min(15).max(480).optional()
});

// Validation helper functions
export function validateBookingTime(scheduledAt: Date): { valid: boolean; message?: string } {
  const now = new Date();
  
  // Check if booking is in the past
  if (scheduledAt <= now) {
    return { valid: false, message: 'Booking time must be in the future' };
  }
  
  // Check if booking is too far in the future (e.g., 1 year)
  const oneYearFromNow = new Date();
  oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);
  
  if (scheduledAt > oneYearFromNow) {
    return { valid: false, message: 'Booking time cannot be more than 1 year in the future' };
  }
  
  return { valid: true };
}

export function validateBusinessHours(
  scheduledAt: Date,
  businessHours: any
): { valid: boolean; message?: string } {
  if (!businessHours) {
    return { valid: true }; // No business hours restriction
  }
  
  // FIXED: Use consistent day-of-week calculation
  // scheduledAt is a Date object in local time, so getDay() is correct here
  const dayOfWeek = scheduledAt.getDay(); // 0 = Sunday, 1 = Monday, etc.
  const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const dayName = dayNames[dayOfWeek];
  
  const daySchedule = businessHours.schedule?.[dayName];
  
  if (!daySchedule || !daySchedule.isOpen) {
    return { valid: false, message: 'Business is closed on this day' };
  }
  
  // Get time in HH:MM format in local timezone
  const hours = scheduledAt.getHours().toString().padStart(2, '0');
  const minutes = scheduledAt.getMinutes().toString().padStart(2, '0');
  const bookingTime = `${hours}:${minutes}`; // HH:MM format
  
  if (bookingTime < daySchedule.openTime || bookingTime > daySchedule.closeTime) {
    return { 
      valid: false, 
      message: `Business hours are ${daySchedule.openTime} - ${daySchedule.closeTime}` 
    };
  }
  
  // Check for breaks
  if (daySchedule.breaks) {
    for (const breakTime of daySchedule.breaks) {
      if (bookingTime >= breakTime.startTime && bookingTime <= breakTime.endTime) {
        return { 
          valid: false, 
          message: `Business is closed during break time ${breakTime.startTime} - ${breakTime.endTime}` 
        };
      }
    }
  }
  
  return { valid: true };
}