# Design Document

## Overview

The Booqing Platform Transformation design builds upon the existing Next.js multi-tenant architecture to create a comprehensive booking platform. The system will maintain the current subdomain-based multi-tenancy while adding extensive booking management, WhatsApp integration, and business customization capabilities. The architecture follows a modular approach with clear separation between platform administration and tenant-specific functionality.

## Architecture

### Current Foundation
The existing system already provides:
- Next.js 15 with App Router
- TypeScript configuration
- TailwindCSS with shadcn/ui components
- Redis integration via Upstash
- Subdomain routing middleware
- Basic tenant management

### Enhanced System Architecture

```mermaid
graph TB
    subgraph "Client Layer"
        MW[Main Website - booqing.my.id]
        SD[Subdomain - {tenant}.booqing.my.id]
    end
    
    subgraph "Next.js App Router (Existing)"
        MW_ROUTES[app/page.tsx - Main Website]
        SD_ROUTES[app/s/[subdomain]/page.tsx - Subdomain]
        ADMIN_ROUTES[app/admin/page.tsx - Platform Admin]
        API[app/api/* - API Routes]
        MIDDLEWARE[middleware.ts - Subdomain Routing]
    end
    
    subgraph "Enhanced Business Logic"
        TENANT_LIB[lib/subdomains.ts - Enhanced]
        BOOKING[lib/booking.ts - New]
        WHATSAPP[lib/whatsapp.ts - New]
        AUTH[lib/auth.ts - New]
        ANALYTICS[lib/analytics.ts - New]
    end
    
    subgraph "Data Layer (Current + Enhanced)"
        REDIS[(Upstash Redis - Existing)]
        DB[(PostgreSQL - New)]
        FILES[File Storage - New]
    end
    
    MW --> MW_ROUTES
    SD --> SD_ROUTES
    MIDDLEWARE --> SD_ROUTES
    
    TENANT_LIB --> REDIS
    BOOKING --> DB
    WHATSAPP --> EXTERNAL[WhatsApp API]
    AUTH --> DB
    ANALYTICS --> DB
```

### Enhanced Multi-Tenant Architecture

Building on the existing subdomain routing system:

1. **Main Website (`booqing.my.id`) - Enhanced**
   - Current: Basic landing page with subdomain creation
   - Enhanced: Professional landing page, tenant registration, platform admin panel
   - File structure: `app/page.tsx`, `app/admin/`, `app/api/`

2. **Tenant Subdomains (`{tenant}.booqing.my.id`) - Enhanced**
   - Current: Simple emoji display page
   - Enhanced: Full business landing page, booking system, tenant dashboard
   - File structure: `app/s/[subdomain]/`, `app/s/[subdomain]/admin/`, `app/s/[subdomain]/book/`

3. **Existing Middleware Enhancement**
   - Current: Basic subdomain detection and routing
   - Enhanced: Tenant context injection, feature flags, authentication
   - File: `middleware.ts` (enhanced)

## Components and Interfaces

### 1. Main Website Components (Building on Existing)

#### Enhanced Landing Page System
```typescript
// components/main/LandingPage.tsx - New
interface LandingPageProps {
  features: Feature[];
  testimonials: Testimonial[];
  pricingPlans: PricingPlan[];
}

// components/main/HeroSection.tsx - New
interface HeroSectionProps {
  title: string;
  subtitle: string;
  ctaButtons: CTAButton[];
}

// Enhanced existing SubdomainForm
// app/subdomain-form.tsx - Enhanced
interface EnhancedSubdomainFormProps {
  businessCategories: BusinessCategory[];
  onSubmit: (data: TenantRegistrationData) => Promise<void>;
}
```

#### Enhanced Registration System (Building on existing form)
```typescript
// Enhanced app/subdomain-form.tsx
interface TenantRegistrationData {
  // Existing fields
  subdomain: string;
  icon: string;
  
  // New fields
  businessName: string;
  ownerName: string;
  email: string;
  phone: string;
  businessCategory: string;
  businessDescription?: string;
  address?: string;
}

// Enhanced app/actions.ts
export async function createSubdomainAction(
  prevState: any,
  formData: FormData
): Promise<CreateSubdomainResult>;
```

#### Enhanced Platform Admin Dashboard (Building on existing)
```typescript
// Enhanced app/admin/dashboard.tsx
interface EnhancedAdminDashboardProps {
  tenants: EnhancedTenant[]; // Enhanced from existing Tenant type
  systemMetrics: SystemMetrics;
  recentActivity: ActivityLog[];
}

// New components/admin/TenantManagement.tsx
interface TenantManagementProps {
  tenants: EnhancedTenant[];
  onFeatureToggle: (tenantId: string, feature: string, enabled: boolean) => void;
  onTenantDelete: (tenantId: string) => void; // Enhanced existing delete function
  onTenantEdit: (tenantId: string, data: Partial<EnhancedTenant>) => void;
}

// Enhanced existing tenant type
interface EnhancedTenant extends Tenant {
  businessName: string;
  businessCategory: string;
  features: FeatureFlags;
  subscription: SubscriptionInfo;
}
```

### 2. Subdomain Components

#### Tenant Landing Page
```typescript
// components/subdomain/TenantLandingPage.tsx
interface TenantLandingPageProps {
  tenant: Tenant;
  template: LandingPageTemplate;
  services: Service[];
  reviews: Review[];
  businessHours: BusinessHours;
}

// components/subdomain/ServiceShowcase.tsx
interface ServiceShowcaseProps {
  services: Service[];
  onBookingClick: (serviceId: string) => void;
  displayMode: 'grid' | 'list' | 'carousel';
}
```

#### Booking System
```typescript
// components/booking/BookingCalendar.tsx
interface BookingCalendarProps {
  availableSlots: TimeSlot[];
  selectedDate: Date;
  onSlotSelect: (slot: TimeSlot) => void;
  businessHours: BusinessHours;
  blockedDates: Date[];
}

// components/booking/BookingForm.tsx
interface BookingFormProps {
  service: Service;
  selectedSlot: TimeSlot;
  onSubmit: (booking: BookingData) => Promise<void>;
  requiresHomeVisit: boolean;
}

// components/booking/HomeVisitForm.tsx
interface HomeVisitFormProps {
  serviceAreas: ServiceArea[];
  onAddressValidation: (address: string) => Promise<AddressValidation>;
  onSubmit: (homeVisitData: HomeVisitData) => void;
}
```

#### Tenant Dashboard
```typescript
// components/dashboard/TenantDashboard.tsx
interface TenantDashboardProps {
  tenant: Tenant;
  todayStats: DashboardStats;
  recentBookings: Booking[];
  pendingActions: PendingAction[];
}

// components/dashboard/BookingManagement.tsx
interface BookingManagementProps {
  bookings: Booking[];
  onStatusUpdate: (bookingId: string, status: BookingStatus) => void;
  onReschedule: (bookingId: string, newSlot: TimeSlot) => void;
  onCancel: (bookingId: string, reason: string) => void;
}
```

### 3. WhatsApp Integration Components

```typescript
// components/whatsapp/ChatInbox.tsx
interface ChatInboxProps {
  conversations: Conversation[];
  activeConversation: string | null;
  onConversationSelect: (conversationId: string) => void;
  onMessageSend: (message: Message) => void;
}

// components/whatsapp/MessageComposer.tsx
interface MessageComposerProps {
  conversation: Conversation;
  templates: MessageTemplate[];
  onSend: (message: MessageData) => void;
  supportedTypes: ('text' | 'image' | 'file' | 'voice')[];
}

// components/whatsapp/DeviceManagement.tsx
interface DeviceManagementProps {
  devices: WhatsAppDevice[];
  onDeviceConnect: () => void;
  onDeviceDisconnect: (deviceId: string) => void;
  qrCode?: string;
}
```

### 4. Enhanced UI Components (Building on existing shadcn/ui)

```typescript
// New components/ui/DataTable.tsx (using existing Card, Button)
interface DataTableProps<T> {
  data: T[];
  columns: ColumnDef<T>[];
  pagination?: boolean;
  sorting?: boolean;
  filtering?: boolean;
}

// New components/ui/StatsCard.tsx (using existing Card components)
interface StatsCardProps {
  title: string;
  value: string | number;
  change?: {
    value: number;
    type: 'increase' | 'decrease';
    period: string;
  };
  icon?: React.ReactNode;
}

// New components/ui/FeatureToggle.tsx (using existing Button variants)
interface FeatureToggleProps {
  feature: string;
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
  disabled?: boolean;
  description?: string;
}

// Existing components to be enhanced:
// - components/ui/button.tsx (add new variants)
// - components/ui/card.tsx (already well-structured)
// - components/ui/input.tsx (add validation states)
```

## Data Models

### Enhanced Core Entities (Building on existing)

```typescript
// Enhanced types/tenant.ts (extending existing SubdomainData)
interface EnhancedTenant {
  // Existing fields from current SubdomainData
  subdomain: string;
  emoji: string;
  createdAt: number;
  
  // New fields for enhanced functionality
  id: string;
  businessName: string;
  businessCategory: BusinessCategory;
  ownerName: string;
  email: string;
  phone: string;
  address?: string;
  businessDescription?: string;
  logo?: string;
  brandColors?: {
    primary: string;
    secondary: string;
    accent: string;
  };
  features: {
    whatsapp: boolean;
    homeVisit: boolean;
    analytics: boolean;
    customTemplates: boolean;
    multiStaff: boolean;
  };
  subscription: {
    plan: 'basic' | 'premium' | 'enterprise';
    status: 'active' | 'suspended' | 'cancelled';
    expiresAt: Date;
  };
  updatedAt: Date;
}

// Migration strategy from existing SubdomainData
interface SubdomainDataMigration {
  migrateFromLegacy(legacyData: SubdomainData): EnhancedTenant;
  validateMigration(tenant: EnhancedTenant): boolean;
}

// types/booking.ts
interface Booking {
  id: string;
  tenantId: string;
  customerId: string;
  serviceId: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'no_show';
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
  paymentStatus: 'pending' | 'paid' | 'refunded';
  remindersSent: Date[];
  createdAt: Date;
  updatedAt: Date;
}

// types/service.ts
interface Service {
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
  requirements?: string[];
  createdAt: Date;
  updatedAt: Date;
}

// types/customer.ts
interface Customer {
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
}
```

### WhatsApp Integration Models

```typescript
// types/whatsapp.ts
interface WhatsAppDevice {
  id: string;
  tenantId: string;
  deviceName: string;
  phoneNumber: string;
  status: 'connected' | 'disconnected' | 'connecting';
  lastSeen: Date;
  qrCode?: string;
  createdAt: Date;
}

interface Conversation {
  id: string;
  tenantId: string;
  customerId: string;
  whatsappNumber: string;
  lastMessageAt: Date;
  unreadCount: number;
  assignedTo?: string; // staff member ID
  status: 'active' | 'archived';
  createdAt: Date;
}

interface Message {
  id: string;
  conversationId: string;
  type: 'text' | 'image' | 'file' | 'voice' | 'template';
  content: string;
  mediaUrl?: string;
  isFromCustomer: boolean;
  deliveryStatus: 'sent' | 'delivered' | 'read' | 'failed';
  sentAt: Date;
}

interface MessageTemplate {
  id: string;
  tenantId: string;
  name: string;
  content: string;
  variables: string[]; // e.g., ['CustomerName', 'BookingDate', 'ServiceName']
  category: 'reminder' | 'confirmation' | 'follow_up' | 'marketing';
  isActive: boolean;
  createdAt: Date;
}
```

### Configuration Models

```typescript
// types/configuration.ts
interface BusinessHours {
  tenantId: string;
  schedule: {
    [key in DayOfWeek]: {
      isOpen: boolean;
      openTime: string; // HH:mm format
      closeTime: string; // HH:mm format
      breaks?: {
        startTime: string;
        endTime: string;
      }[];
    };
  };
  timezone: string;
  updatedAt: Date;
}

interface LandingPageTemplate {
  id: string;
  name: string;
  category: string;
  preview: string;
  sections: {
    hero: boolean;
    services: boolean;
    about: boolean;
    reviews: boolean;
    contact: boolean;
    gallery: boolean;
  };
  customization: {
    colors: boolean;
    fonts: boolean;
    layout: boolean;
  };
  isActive: boolean;
}
```

## Error Handling

### Error Types and Handling Strategy

```typescript
// types/errors.ts
enum ErrorType {
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  AUTHENTICATION_ERROR = 'AUTHENTICATION_ERROR',
  AUTHORIZATION_ERROR = 'AUTHORIZATION_ERROR',
  TENANT_NOT_FOUND = 'TENANT_NOT_FOUND',
  BOOKING_CONFLICT = 'BOOKING_CONFLICT',
  WHATSAPP_CONNECTION_ERROR = 'WHATSAPP_CONNECTION_ERROR',
  PAYMENT_ERROR = 'PAYMENT_ERROR',
  EXTERNAL_API_ERROR = 'EXTERNAL_API_ERROR',
  RATE_LIMIT_ERROR = 'RATE_LIMIT_ERROR',
  INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR'
}

interface AppError {
  type: ErrorType;
  message: string;
  details?: Record<string, any>;
  statusCode: number;
  timestamp: Date;
  requestId?: string;
}

// lib/error-handler.ts
class ErrorHandler {
  static handle(error: AppError, context: 'api' | 'component' | 'middleware'): void;
  static createValidationError(field: string, message: string): AppError;
  static createAuthenticationError(message?: string): AppError;
  static createTenantNotFoundError(subdomain: string): AppError;
  static createBookingConflictError(timeSlot: string): AppError;
}
```

### Error Boundaries and Recovery

```typescript
// components/ErrorBoundary.tsx
interface ErrorBoundaryProps {
  fallback?: React.ComponentType<{ error: Error; retry: () => void }>;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  children: React.ReactNode;
}

// components/ErrorFallback.tsx
interface ErrorFallbackProps {
  error: Error;
  retry: () => void;
  type: 'page' | 'component' | 'api';
}
```

## Testing Strategy

### Testing Pyramid

1. **Unit Tests (70%)**
   - Business logic functions
   - Utility functions
   - Component logic
   - Data validation
   - Error handling

2. **Integration Tests (20%)**
   - API endpoints
   - Database operations
   - External service integrations
   - Authentication flows
   - Multi-tenant routing

3. **End-to-End Tests (10%)**
   - Critical user journeys
   - Booking flow
   - Registration process
   - WhatsApp integration
   - Cross-subdomain functionality

### Testing Framework Setup (Compatible with existing Next.js 15)

```typescript
// jest.config.js (Next.js 15 compatible)
const nextJest = require('next/jest')

const createJestConfig = nextJest({
  dir: './',
})

const customJestConfig = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  testPathIgnorePatterns: ['<rootDir>/.next/', '<rootDir>/node_modules/'],
  collectCoverageFrom: [
    'app/**/*.{js,jsx,ts,tsx}',
    'components/**/*.{js,jsx,ts,tsx}',
    'lib/**/*.{js,jsx,ts,tsx}',
    '!**/*.d.ts',
    '!**/node_modules/**',
  ],
}

module.exports = createJestConfig(customJestConfig)

// Test utilities
// __tests__/utils/test-utils.tsx
interface RenderWithProvidersOptions {
  tenant?: Tenant;
  user?: User;
  initialState?: Partial<AppState>;
}

function renderWithProviders(
  ui: React.ReactElement,
  options?: RenderWithProvidersOptions
): RenderResult;

// Mock factories
// __tests__/factories/tenant.factory.ts
class TenantFactory {
  static create(overrides?: Partial<Tenant>): Tenant;
  static createMany(count: number, overrides?: Partial<Tenant>): Tenant[];
}
```

### Test Categories

```typescript
// __tests__/unit/booking.test.ts
describe('Booking Management', () => {
  describe('validateBookingSlot', () => {
    it('should validate available time slots');
    it('should reject conflicting bookings');
    it('should handle business hours validation');
  });
});

// __tests__/integration/api/bookings.test.ts
describe('Bookings API', () => {
  describe('POST /api/bookings', () => {
    it('should create a new booking');
    it('should send confirmation messages');
    it('should handle home visit bookings');
  });
});

// __tests__/e2e/booking-flow.test.ts
describe('Customer Booking Flow', () => {
  it('should complete full booking process');
  it('should handle payment and confirmation');
  it('should send WhatsApp notifications');
});
```

## Security Considerations

### Authentication and Authorization

```typescript
// lib/auth/tenant-auth.ts
interface TenantAuthConfig {
  sessionDuration: number;
  requireEmailVerification: boolean;
  allowSocialLogin: boolean;
  mfaRequired: boolean;
}

// lib/auth/rbac.ts
enum Permission {
  MANAGE_BOOKINGS = 'manage_bookings',
  VIEW_ANALYTICS = 'view_analytics',
  MANAGE_STAFF = 'manage_staff',
  SEND_MESSAGES = 'send_messages',
  MANAGE_SETTINGS = 'manage_settings',
  EXPORT_DATA = 'export_data'
}

interface Role {
  id: string;
  name: string;
  permissions: Permission[];
  tenantId: string;
}
```

### Data Protection

```typescript
// lib/security/data-protection.ts
class DataProtection {
  static encryptSensitiveData(data: string): string;
  static decryptSensitiveData(encryptedData: string): string;
  static hashPassword(password: string): Promise<string>;
  static verifyPassword(password: string, hash: string): Promise<boolean>;
  static sanitizeInput(input: string): string;
  static validateFileUpload(file: File): ValidationResult;
}

// lib/security/rate-limiting.ts
interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  skipSuccessfulRequests?: boolean;
  keyGenerator?: (req: Request) => string;
}
```

### API Security

```typescript
// middleware/security.ts
interface SecurityMiddlewareConfig {
  cors: {
    allowedOrigins: string[];
    allowedMethods: string[];
  };
  rateLimit: RateLimitConfig;
  validation: {
    strictMode: boolean;
    sanitizeInput: boolean;
  };
  logging: {
    logRequests: boolean;
    logErrors: boolean;
  };
}
```

## Performance Optimization

### Caching Strategy

```typescript
// lib/cache/cache-manager.ts
interface CacheConfig {
  redis: {
    host: string;
    port: number;
    password?: string;
  };
  ttl: {
    tenant: number;
    booking: number;
    analytics: number;
  };
}

class CacheManager {
  static async get<T>(key: string): Promise<T | null>;
  static async set<T>(key: string, value: T, ttl?: number): Promise<void>;
  static async invalidate(pattern: string): Promise<void>;
  static async warmup(tenantId: string): Promise<void>;
}
```

### Database Optimization

```typescript
// lib/database/query-optimization.ts
interface QueryOptimization {
  indexStrategy: {
    tenant_id: 'btree';
    booking_date: 'btree';
    customer_phone: 'hash';
    whatsapp_number: 'hash';
  };
  partitioning: {
    bookings: 'monthly';
    messages: 'weekly';
    analytics: 'daily';
  };
  connectionPooling: {
    min: number;
    max: number;
    idleTimeoutMillis: number;
  };
}
```

### Frontend Optimization

```typescript
// lib/performance/optimization.ts
interface PerformanceConfig {
  lazyLoading: {
    components: string[];
    routes: string[];
  };
  bundleSplitting: {
    vendor: boolean;
    async: boolean;
  };
  imageOptimization: {
    formats: ('webp' | 'avif' | 'jpeg')[];
    quality: number;
    sizes: number[];
  };
}
```

## Deployment and Infrastructure

### Environment Configuration (Building on existing setup)

```typescript
// lib/config/environment.ts (enhancing existing lib/utils.ts)
interface EnvironmentConfig {
  app: {
    name: string;
    version: string;
    environment: 'development' | 'staging' | 'production';
    rootDomain: string; // Already exists in lib/utils.ts
    protocol: 'http' | 'https'; // Already exists in lib/utils.ts
  };
  database: {
    url: string;
    poolSize: number;
    ssl: boolean;
  };
  redis: {
    url: string; // Already configured for Upstash
    maxRetries: number;
  };
  whatsapp: {
    apiUrl: string;
    webhookSecret: string;
  };
  storage: {
    provider: 'local' | 's3' | 'cloudinary';
    bucket?: string;
    region?: string;
  };
}

// Enhanced lib/utils.ts (existing file)
export const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http';
export const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'localhost:3000';

// New environment variables to add
export const databaseUrl = process.env.DATABASE_URL;
export const whatsappApiUrl = process.env.WHATSAPP_API_URL;
export const storageProvider = process.env.STORAGE_PROVIDER || 'local';
```

### Monitoring and Logging

```typescript
// lib/monitoring/metrics.ts
interface MetricsCollector {
  trackBookingCreated(tenantId: string, serviceId: string): void;
  trackMessageSent(tenantId: string, type: 'manual' | 'automated'): void;
  trackPageView(tenantId: string, page: string): void;
  trackError(error: AppError, context: string): void;
  trackPerformance(metric: string, value: number, tags?: Record<string, string>): void;
}

// lib/monitoring/health-check.ts
interface HealthCheck {
  database: () => Promise<boolean>;
  redis: () => Promise<boolean>;
  whatsapp: () => Promise<boolean>;
  storage: () => Promise<boolean>;
}
```

This design provides a comprehensive foundation for transforming the current basic subdomain system into a full-featured booking platform while maintaining scalability, security, and maintainability.