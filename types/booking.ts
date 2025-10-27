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
  paymentStatus: PaymentStatus;
  paymentMethod?: 'cash' | 'card' | 'transfer' | 'qris';
  remindersSent: Date[];
  createdAt: Date;
  updatedAt: Date;
  
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