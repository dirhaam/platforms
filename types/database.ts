// Database types based on Prisma schema
import type { 
  Tenant as PrismaTenant,
  Service as PrismaService,
  Customer as PrismaCustomer,
  Booking as PrismaBooking,
  Staff as PrismaStaff,
  WhatsAppDevice as PrismaWhatsAppDevice,
  Conversation as PrismaConversation,
  Message as PrismaMessage,
  MessageTemplate as PrismaMessageTemplate,
  BusinessHours as PrismaBusinessHours,
} from '../lib/generated/prisma';

// Enhanced Tenant type (migrated from Redis SubdomainData)
export interface EnhancedTenant {
  // Core fields
  id: string;
  subdomain: string;
  emoji: string;
  createdAt: number; // Keep as number for Redis compatibility
  
  // Business info
  businessName: string;
  businessCategory: string;
  ownerName: string;
  email: string;
  phone: string;
  address?: string;
  businessDescription?: string;
  logo?: string;
  
  // Brand colors
  brandColors?: {
    primary: string;
    secondary: string;
    accent: string;
  };
  
  // Feature flags
  features: {
    whatsapp: boolean;
    homeVisit: boolean;
    analytics: boolean;
    customTemplates: boolean;
    multiStaff: boolean;
  };
  
  // Subscription info
  subscription: {
    plan: 'basic' | 'premium' | 'enterprise';
    status: 'active' | 'suspended' | 'cancelled';
    expiresAt?: Date;
  };
  
  // Timestamps
  updatedAt: Date;
}

// Legacy SubdomainData interface for migration compatibility
export interface LegacySubdomainData {
  subdomain: string;
  emoji: string;
  createdAt: number;
}

// Booking related types
export type BookingStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'no_show';
export type PaymentStatus = 'pending' | 'paid' | 'refunded';

export interface BookingData {
  customerId: string;
  serviceId: string;
  scheduledAt: Date;
  duration: number;
  isHomeVisit: boolean;
  homeVisitAddress?: string;
  homeVisitCoordinates?: {
    lat: number;
    lng: number;
  };
  notes?: string;
  totalAmount: number;
}

// WhatsApp related types
export type WhatsAppDeviceStatus = 'connected' | 'disconnected' | 'connecting';
export type MessageType = 'text' | 'image' | 'file' | 'voice' | 'template';
export type DeliveryStatus = 'sent' | 'delivered' | 'read' | 'failed';
export type ConversationStatus = 'active' | 'archived';

// Business configuration types
export interface BusinessHoursSchedule {
  [key: string]: {
    isOpen: boolean;
    openTime: string; // HH:mm format
    closeTime: string; // HH:mm format
    breaks?: {
      startTime: string;
      endTime: string;
    }[];
  };
}

// Service area for home visits
export interface ServiceArea {
  id: string;
  name: string;
  coordinates: {
    lat: number;
    lng: number;
  }[];
  surcharge: number;
}

// Address validation
export interface AddressValidation {
  isValid: boolean;
  formattedAddress?: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
  serviceArea?: ServiceArea;
  estimatedTravelTime?: number; // minutes
}

// Migration types
export interface MigrationResult {
  success: boolean;
  migratedCount: number;
  errors: string[];
  skippedCount: number;
}

export interface TenantMigrationData {
  legacy: LegacySubdomainData;
  enhanced: Partial<EnhancedTenant>;
  validationErrors: string[];
}

// Re-export Prisma types for convenience
export type {
  PrismaTenant as Tenant,
  PrismaService as Service,
  PrismaCustomer as Customer,
  PrismaBooking as Booking,
  PrismaStaff as Staff,
  PrismaWhatsAppDevice as WhatsAppDevice,
  PrismaConversation as Conversation,
  PrismaMessage as Message,
  PrismaMessageTemplate as MessageTemplate,
  PrismaBusinessHours as BusinessHours,
};