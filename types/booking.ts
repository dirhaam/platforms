// Booking status enum
export enum BookingStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  NO_SHOW = 'no_show'
}

// Payment status enum
export enum PaymentStatus {
  PENDING = 'pending',
  PAID = 'paid',
  REFUNDED = 'refunded'
}

// Booking payment record
export interface BookingPayment {
  id: string;
  bookingId: string;
  tenantId: string;
  paymentAmount: number;
  paymentMethod: 'cash' | 'card' | 'transfer' | 'qris';
  paymentReference?: string;
  notes?: string;
  paidAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Booking interface
export interface Booking {
  id: string;
  bookingNumber: string;
  tenantId: string;
  customerId: string;
  serviceId: string;
  status: BookingStatus;
  scheduledAt: Date;
  duration: number; // minutes
  isHomeVisit: boolean;
  homeVisitAddress?: string;
  homeVisitCoordinates?: {
    lat: number;
    lng: number;
  };
  notes?: string;
  totalAmount: number;
  taxPercentage?: number;
  serviceChargeAmount?: number;
  additionalFeesAmount?: number;
  travelSurchargeAmount?: number; // Additional surcharge based on travel distance
  paymentStatus: PaymentStatus;
  paymentMethod?: 'cash' | 'card' | 'transfer' | 'qris';
  remindersSent: Date[];
  createdAt: Date;
  updatedAt: Date;
  
  // Travel & Route Details (for home visit)
  travelDistance?: number; // Distance in km
  travelDuration?: number; // Duration in minutes
  travelRoute?: Array<{ lat: number; lng: number }>; // Route coordinates
  
  // Down Payment (DP) support
  dpAmount?: number; // Down payment amount
  paidAmount?: number; // Total paid so far
  paymentReference?: string; // Reference/receipt for initial payment
  paymentHistory?: BookingPayment[]; // List of all payments
  remainingBalance?: number; // totalAmount - paidAmount
  
  // Relations
  customer?: Customer;
  service?: Service;
}

// Service interface
export interface Service {
  id: string;
  tenantId: string;
  name: string;
  description: string;
  duration: number; // minutes
  price: number;
  category: string;
  isActive: boolean;
  homeVisitAvailable: boolean;
  homeVisitSurcharge?: number;
  
  // Operating hours and quota
  operatingHours?: {
    startTime: string; // HH:MM format
    endTime: string;   // HH:MM format
  } | null;
  slotDurationMinutes?: number; // Duration of each time slot (default 30)
  hourlyQuota?: number; // Max bookings per hour (default 10)
  
  images: string[];
  requirements: string[];
  createdAt: Date;
  updatedAt: Date;
  
  // Relations
  bookings?: Booking[];
}

// Customer interface
export interface Customer {
  id: string;
  tenantId: string;
  name: string;
  email?: string;
  phone: string;
  address?: string;
  notes?: string;
  totalBookings: number;
  lastBookingAt?: Date;
  whatsappNumber?: string;
  createdAt: Date;
  updatedAt: Date;
  
  // Relations
  bookings?: Booking[];
}

// Create booking request
export interface CreateBookingRequest {
  customerId: string;
  serviceId: string;
  scheduledAt: string; // ISO string
  isHomeVisit?: boolean;
  homeVisitAddress?: string;
  homeVisitCoordinates?: {
    lat: number;
    lng: number;
  };
  notes?: string;
  dpAmount?: number; // Down payment amount
  paymentMethod?: 'cash' | 'card' | 'transfer' | 'qris';
  paymentReference?: string;
  // Travel-related fields (from frontend calculation)
  travelDistance?: number;
  travelDuration?: number;
  travelSurchargeAmount?: number;
  travelRoute?: Array<{ lat: number; lng: number }>;
}

// Update booking request
export interface UpdateBookingRequest {
  customerId?: string;
  serviceId?: string;
  status?: BookingStatus;
  scheduledAt?: string | Date; // ISO string or Date object
  duration?: number; // minutes
  totalAmount?: number;
  isHomeVisit?: boolean;
  homeVisitAddress?: string;
  homeVisitCoordinates?: {
    lat: number;
    lng: number;
  };
  notes?: string;
  paymentStatus?: PaymentStatus;
  paymentMethod?: 'cash' | 'card' | 'transfer' | 'qris';
  dpAmount?: number; // Down payment amount
  paymentReference?: string;
}

// Create service request
export interface CreateServiceRequest {
  name: string;
  description: string;
  duration: number;
  price: number;
  category: string;
  homeVisitAvailable?: boolean;
  homeVisitSurcharge?: number;
  images?: string[];
  requirements?: string[];
  operatingHours?: {
    startTime: string;
    endTime: string;
  };
  slotDurationMinutes?: number;
  hourlyQuota?: number;
}

// Update service request
export interface UpdateServiceRequest {
  name?: string;
  description?: string;
  duration?: number;
  price?: number;
  category?: string;
  isActive?: boolean;
  homeVisitAvailable?: boolean;
  homeVisitSurcharge?: number;
  images?: string[];
  requirements?: string[];
  operatingHours?: {
    startTime: string;
    endTime: string;
  } | null;
  slotDurationMinutes?: number;
  hourlyQuota?: number;
}

// Create customer request
export interface CreateCustomerRequest {
  name: string;
  email?: string;
  phone: string;
  address?: string;
  notes?: string;
  whatsappNumber?: string;
}

// Update customer request
export interface UpdateCustomerRequest {
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
  notes?: string;
  whatsappNumber?: string;
}

// Booking conflict check
export interface BookingConflict {
  hasConflict: boolean;
  conflictingBookings: Booking[];
  message?: string;
}

// Time slot interface
export interface TimeSlot {
  start: Date;
  end: Date;
  available: boolean;
  bookingId?: string;
}

// Availability check request
export interface AvailabilityRequest {
  serviceId: string;
  date: string; // YYYY-MM-DD format
  duration?: number; // Override service duration if needed
}

// Availability response
export interface AvailabilityResponse {
  date: string;
  slots: TimeSlot[];
  businessHours: {
    isOpen: boolean;
    openTime?: string;
    closeTime?: string;
  };
}