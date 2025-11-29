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
  
  // Staff assignment
  staffId?: string; // Assigned staff member for this booking
  
  // Travel & Route Details (for home visit)
  travelDistance?: number; // Distance in km
  travelDuration?: number; // Duration in minutes
  travelRoute?: Array<{ lat: number; lng: number }>; // Route coordinates
  travelTimeMinutesBefore?: number; // Buffer time before appointment (e.g., travel time)
  travelTimeMinutesAfter?: number; // Buffer time after appointment (e.g., travel time)
  
  // Down Payment (DP) support
  dpAmount?: number; // Down payment amount
  paidAmount?: number; // Total paid so far
  paymentReference?: string; // Reference/receipt for initial payment
  paymentHistory?: BookingPayment[]; // List of all payments
  remainingBalance?: number; // totalAmount - paidAmount
  
  // Flat coordinate fields (from database)
  homeVisitLatitude?: number;
  homeVisitLongitude?: number;
  
  // Relations
  customer?: Customer;
  service?: Service;
  staff?: Staff;
  staffMember?: Staff;
  
  // Flat fields for backward compatibility
  customerName?: string;
  customerPhone?: string;
  serviceName?: string;
  staffName?: string;
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
  
  // Time slot configuration
  slotDurationMinutes?: number; // Duration of each time slot (default 30)
  hourlyQuota?: number; // Max bookings per hour (default 10)
  
  // Full home visit system fields
  serviceType?: ServiceType; // 'on_premise', 'home_visit', 'both'
  homeVisitFullDayBooking?: boolean; // If true, only 1 booking per day per staff
  homeVisitMinBufferMinutes?: number; // Travel buffer between appointments (default 30)
  dailyQuotaPerStaff?: number; // Max bookings per staff per day
  requiresStaffAssignment?: boolean; // If true, booking must be assigned to a staff
  
  images: string[];
  requirements: string[];
  createdAt: Date;
  updatedAt: Date;
  
  // Relations
  bookings?: Booking[];
  staffServices?: StaffService[];
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
  // Staff assignment
  staffId?: string; // Optional: specific staff assignment
  autoAssignStaff?: boolean; // If true, auto-assign available staff
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
    isBlocked?: boolean;
  };
}

// Video interface
export interface VideoItem {
  id: string;
  title: string;
  youtubeUrl: string; // Full URL or Video ID
  thumbnail?: string;
  description?: string;
  displayOrder: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Social Media Link interface
export interface SocialMediaLink {
  id: string;
  platform: 'facebook' | 'instagram' | 'tiktok' | 'youtube' | 'linkedin' | 'twitter';
  url: string;
  displayOrder: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Photo Gallery interface
export interface PhotoGalleryItem {
  id: string;
  url: string;
  caption?: string;
  alt: string;
  displayOrder: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface PhotoGallery {
  id: string;
  tenantId: string;
  title: string;
  description?: string;
  displayType: 'grid' | 'carousel' | 'masonry';
  photos: PhotoGalleryItem[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Landing Page Media Data
export interface LandingPageMediaData {
  videos?: VideoItem[];
  socialMedia?: SocialMediaLink[];
  galleries?: PhotoGallery[];
  settings?: {
    videoSize?: 'small' | 'medium' | 'large';
    autoplay?: boolean;
  };
}

// Service Type Enum
export enum ServiceType {
  ON_PREMISE = 'on_premise',
  HOME_VISIT = 'home_visit',
  BOTH = 'both'
}

// Staff interface
export interface Staff {
  id: string;
  tenantId: string;
  name: string;
  email: string;
  phone?: string;
  role: string;
  permissions?: string[];
  isActive: boolean;
  passwordHash?: string;
  lastLoginAt?: Date;
  loginAttempts?: number;
  lockedUntil?: Date;
  createdAt: Date;
  updatedAt: Date;
  
  // Relations
  services?: StaffService[];
  schedule?: StaffSchedule[];
  leaves?: StaffLeave[];
}

// Staff Service mapping interface
export interface StaffService {
  id: string;
  staffId: string;
  serviceId: string;
  canPerform: boolean;
  isSpecialist: boolean;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  
  // Relations
  staff?: Staff;
  service?: Service;
}

// Staff Schedule (per-staff working hours override)
export interface StaffSchedule {
  id: string;
  staffId: string;
  dayOfWeek: number; // 0=Sunday, 6=Saturday
  startTime: string; // "08:00"
  endTime: string; // "18:00"
  isAvailable: boolean;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  
  // Relations
  staff?: Staff;
}

// Staff Leave (vacation/sick leave)
export interface StaffLeave {
  id: string;
  staffId: string;
  dateStart: string | Date; // Date in YYYY-MM-DD format or Date object
  dateEnd: string | Date; // Date in YYYY-MM-DD format or Date object
  reason: string;
  isPaid: boolean;
  approverId?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  
  // Relations
  staff?: Staff;
  approver?: Staff;
}

// Home Visit Configuration
export interface HomeVisitConfig {
  serviceType: ServiceType;
  fullDayBooking: boolean; // If true, only 1 booking per day per staff
  minBufferMinutes: number; // Travel time between appointments
  dailyQuotaPerStaff?: number; // Max bookings per staff per day
  requiresStaffAssignment: boolean;
}

// Extended Service interface with home visit support
export interface ServiceWithHomeVisit extends Service {
  serviceType: ServiceType;
  homeVisitFullDayBooking: boolean;
  homeVisitMinBufferMinutes: number;
  dailyQuotaPerStaff?: number;
  requiresStaffAssignment: boolean;
  staffServices?: StaffService[];
}

// Extended Booking interface with staff tracking
export interface BookingWithStaff extends Booking {
  staffId?: string;
  travelTimeMinutesBefore: number;
  travelTimeMinutesAfter: number;
  staffMember?: Staff;
}

// Create service request with home visit config
export interface CreateServiceRequestWithHomeVisit extends CreateServiceRequest {
  serviceType?: ServiceType;
  homeVisitFullDayBooking?: boolean;
  homeVisitMinBufferMinutes?: number;
  dailyQuotaPerStaff?: number;
  requiresStaffAssignment?: boolean;
}

// Update service request with home visit config
export interface UpdateServiceRequestWithHomeVisit extends UpdateServiceRequest {
  serviceType?: ServiceType;
  homeVisitFullDayBooking?: boolean;
  homeVisitMinBufferMinutes?: number;
  dailyQuotaPerStaff?: number;
  requiresStaffAssignment?: boolean;
}

// Create staff service mapping request
export interface CreateStaffServiceRequest {
  staffId: string;
  serviceId: string;
  canPerform?: boolean;
  isSpecialist?: boolean;
  notes?: string;
}

// Create staff schedule request
export interface CreateStaffScheduleRequest {
  staffId: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isAvailable?: boolean;
  notes?: string;
}

// Create staff leave request
export interface CreateStaffLeaveRequest {
  staffId: string;
  dateStart: Date | string;
  dateEnd: Date | string;
  reason: string;
  isPaid?: boolean;
  approverId?: string;
  notes?: string;
}

// Availability request with staff filtering
export interface AvailabilityRequestWithStaff extends AvailabilityRequest {
  staffId?: string; // Optional: filter by specific staff
  requiresStaff?: boolean; // If true, only return slots for staff who can do this service
}

// Availability response with staff info
export interface AvailabilityResponseWithStaff extends AvailabilityResponse {
  availableStaff?: Staff[];
  slotsPerStaff?: Map<string, TimeSlot[]>; // staffId -> slots
}

// Create booking request with staff assignment
export interface CreateBookingRequestWithStaff extends CreateBookingRequest {
  staffId?: string; // Optional: specific staff assignment
  autoAssignStaff?: boolean; // If true, auto-assign available staff
}