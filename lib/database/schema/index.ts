// Drizzle schema for Supabase (PostgreSQL)
import { pgTable, text, integer, real, boolean, timestamp, jsonb, uuid } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Tenant table
export const tenants = pgTable('tenants', {
  id: uuid('id').defaultRandom().primaryKey(),
  subdomain: text('subdomain').notNull().unique(),
  emoji: text('emoji').default('🏢'),
  businessName: text('business_name').notNull().default(''),
  businessCategory: text('business_category').notNull(),
  ownerName: text('owner_name').notNull(),
  email: text('email').notNull(),
  phone: text('phone').notNull(),
  address: text('address'),
  businessDescription: text('business_description'),
  logo: text('logo'),

  brandColors: jsonb('brand_colors').$type<Record<string, string> | null>(),

  whatsappEnabled: boolean('whatsapp_enabled').default(false),
  homeVisitEnabled: boolean('home_visit_enabled').default(false),
  analyticsEnabled: boolean('analytics_enabled').default(false),
  customTemplatesEnabled: boolean('custom_templates_enabled').default(false),
  multiStaffEnabled: boolean('multi_staff_enabled').default(false),
  // Add business-critical fields
  subscriptionPlan: text('subscription_plan').notNull().default('basic'),
  subscriptionStatus: text('subscription_status').notNull().default('active'),
  subscriptionExpiresAt: timestamp('subscription_expires_at', { withTimezone: true }),

  passwordHash: text('password_hash'),
  lastLoginAt: timestamp('last_login_at', { withTimezone: true }),
  loginAttempts: integer('login_attempts').default(0),
  lockedUntil: timestamp('locked_until', { withTimezone: true }),
  passwordResetToken: text('password_reset_token'),
  passwordResetExpires: timestamp('password_reset_expires', { withTimezone: true }),

  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// Service table
export const services = pgTable('services', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  description: text('description').notNull(),
  duration: integer('duration').notNull(),
  price: real('price').notNull(),
  category: text('category').notNull(),
  isActive: boolean('is_active').default(true),
  homeVisitAvailable: boolean('home_visit_available').default(false),
  homeVisitSurcharge: real('home_visit_surcharge'),
  
  // Time slot configuration (uses global tenant business hours)
  slotDurationMinutes: integer('slot_duration_minutes').default(30), // Duration of each time slot
  hourlyQuota: integer('hourly_quota').default(10), // Max bookings per hour
  
  images: jsonb('images').$type<string[] | null>(),
  requirements: jsonb('requirements').$type<string[] | null>(),
  
  // Home visit configuration
  serviceType: text('service_type').notNull().default('on_premise'), // 'on_premise', 'home_visit', 'both'
  homeVisitFullDayBooking: boolean('home_visit_full_day_booking').default(false), // If true, only 1 booking per day
  homeVisitMinBufferMinutes: integer('home_visit_min_buffer_minutes').default(30), // Travel buffer between appointments
  dailyQuotaPerStaff: integer('daily_quota_per_staff'), // Max bookings per staff per day (NULL = unlimited)
  requiresStaffAssignment: boolean('requires_staff_assignment').default(false),
  
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// Customer table
export const customers = pgTable('customers', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  email: text('email'),
  phone: text('phone').notNull(),
  address: text('address'),
  notes: text('notes'),
  totalBookings: integer('total_bookings').default(0),
  lastBookingAt: timestamp('last_booking_at', { withTimezone: true }),
  whatsappNumber: text('whatsapp_number'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// Booking table
export const bookings = pgTable('bookings', {
  id: uuid('id').defaultRandom().primaryKey(),
  bookingNumber: text('booking_number').notNull().unique(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  customerId: uuid('customer_id').notNull().references(() => customers.id, { onDelete: 'cascade' }),
  serviceId: uuid('service_id').notNull().references(() => services.id, { onDelete: 'cascade' }),
  staffId: uuid('staff_id').references(() => staff.id, { onDelete: 'set null' }),
  status: text('status').notNull().default('pending'),
  scheduledAt: timestamp('scheduled_at', { withTimezone: true }),
  duration: integer('duration').notNull(),
  isHomeVisit: boolean('is_home_visit').default(false),
  homeVisitAddress: text('home_visit_address'),
  homeVisitCoordinates: jsonb('home_visit_coordinates').$type<{ lat: number; lng: number } | null>(),
  notes: text('notes'),
  totalAmount: real('total_amount').notNull(),
  paymentStatus: text('payment_status').notNull().default('pending'),
  remindersSent: jsonb('reminders_sent').$type<string[] | null>(),
  // Travel-related fields
  travelDistance: real('travel_distance').default(0),
  travelDuration: integer('travel_duration').default(0),
  travelSurchargeAmount: real('travel_surcharge_amount').default(0),
  travelTimeMinutesBefore: integer('travel_time_minutes_before').default(0),
  travelTimeMinutesAfter: integer('travel_time_minutes_after').default(0),
  // Additional pricing fields
  taxPercentage: real('tax_percentage'),
  serviceChargeAmount: real('service_charge_amount'),
  additionalFeesAmount: real('additional_fees_amount'),
  // Payment fields
  paymentMethod: text('payment_method'),
  paymentReference: text('payment_reference'),
  dpAmount: real('dp_amount').default(0),
  paidAmount: real('paid_amount').default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// Staff table
export const staff = pgTable('staff', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  email: text('email').notNull(),
  phone: text('phone'),
  role: text('role').notNull().default('staff'),
  permissions: jsonb('permissions').$type<string[] | null>(),
  isActive: boolean('is_active').default(true),

  passwordHash: text('password_hash'),
  lastLoginAt: timestamp('last_login_at', { withTimezone: true }),
  loginAttempts: integer('login_attempts').default(0),
  lockedUntil: timestamp('locked_until', { withTimezone: true }),
  passwordResetToken: text('password_reset_token'),
  passwordResetExpires: timestamp('password_reset_expires', { withTimezone: true }),

  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// WhatsApp Device table
export const whatsappDevices = pgTable('whatsapp_devices', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  deviceName: text('device_name').notNull(),
  phoneNumber: text('phone_number').notNull(),
  status: text('status').notNull().default('disconnected'),
  lastSeen: timestamp('last_seen', { withTimezone: true }),
  qrCode: text('qr_code'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// Conversation table
export const conversations = pgTable('conversations', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  customerId: uuid('customer_id').notNull().references(() => customers.id, { onDelete: 'cascade' }),
  whatsappNumber: text('whatsapp_number').notNull(),
  lastMessageAt: timestamp('last_message_at', { withTimezone: true }),
  unreadCount: integer('unread_count').default(0),
  assignedToId: uuid('assigned_to_id').references(() => staff.id, { onDelete: 'set null' }),
  status: text('status').notNull().default('active'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// Message table
export const messages = pgTable('messages', {
  id: uuid('id').defaultRandom().primaryKey(),
  conversationId: uuid('conversation_id').notNull().references(() => conversations.id, { onDelete: 'cascade' }),
  type: text('type').notNull().default('text'),
  content: text('content').notNull(),
  mediaUrl: text('media_url'),
  isFromCustomer: boolean('is_from_customer').default(true),
  deliveryStatus: text('delivery_status').notNull().default('sent'),
  sentAt: timestamp('sent_at', { withTimezone: true }),
});

// Message Template table
export const messageTemplates = pgTable('message_templates', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  content: text('content').notNull(),
  variables: jsonb('variables').$type<string[] | null>(),
  category: text('category').notNull().default('reminder'),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// Staff Services table (many-to-many mapping)
export const staffServices = pgTable('staff_services', {
  id: uuid('id').defaultRandom().primaryKey(),
  staffId: uuid('staff_id').notNull().references(() => staff.id, { onDelete: 'cascade' }),
  serviceId: uuid('service_id').notNull().references(() => services.id, { onDelete: 'cascade' }),
  canPerform: boolean('can_perform').notNull().default(true),
  isSpecialist: boolean('is_specialist').notNull().default(false),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// Staff Schedule table (per-staff working hours override)
export const staffSchedule = pgTable('staff_schedule', {
  id: uuid('id').defaultRandom().primaryKey(),
  staffId: uuid('staff_id').notNull().references(() => staff.id, { onDelete: 'cascade' }),
  dayOfWeek: integer('day_of_week').notNull(), // 0=Sunday, 6=Saturday
  startTime: text('start_time').notNull(), // "08:00"
  endTime: text('end_time').notNull(), // "18:00"
  isAvailable: boolean('is_available').notNull().default(true),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// Staff Leave table (vacation/sick leave)
export const staffLeave = pgTable('staff_leave', {
  id: uuid('id').defaultRandom().primaryKey(),
  staffId: uuid('staff_id').notNull().references(() => staff.id, { onDelete: 'cascade' }),
  dateStart: text('date_start').notNull(), // DATE as text (YYYY-MM-DD)
  dateEnd: text('date_end').notNull(), // DATE as text (YYYY-MM-DD)
  reason: text('reason').notNull(),
  isPaid: boolean('is_paid').default(true),
  approverId: uuid('approver_id').references(() => staff.id, { onDelete: 'set null' }),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// Business Hours table
export const businessHours = pgTable('business_hours', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: uuid('tenant_id').notNull().unique().references(() => tenants.id, { onDelete: 'cascade' }),
  schedule: jsonb('schedule').notNull().$type<Record<string, any>>(),
  timezone: text('timezone').default('Asia/Jakarta'),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// Invoice table
export const invoices = pgTable('invoices', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  customerId: uuid('customer_id').notNull().references(() => customers.id, { onDelete: 'cascade' }),
  bookingId: uuid('booking_id').references(() => bookings.id, { onDelete: 'set null' }),
  invoiceNumber: text('invoice_number').notNull().unique(),
  status: text('status').notNull().default('draft'),
  issueDate: timestamp('issue_date', { withTimezone: true }),
  dueDate: timestamp('due_date', { withTimezone: true }),
  paidDate: timestamp('paid_date', { withTimezone: true }),

  subtotal: real('subtotal').notNull(),
  taxRate: real('tax_rate').default(0),
  taxAmount: real('tax_amount').default(0),
  discountAmount: real('discount_amount').default(0),
  totalAmount: real('total_amount').notNull(),

  paymentMethod: text('payment_method'),
  paymentReference: text('payment_reference'),

  notes: text('notes'),
  terms: text('terms'),
  qrCodeData: text('qr_code_data'),
  qrCodeUrl: text('qr_code_url'),

  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// Invoice Item table
export const invoiceItems = pgTable('invoice_items', {
  id: uuid('id').defaultRandom().primaryKey(),
  invoiceId: uuid('invoice_id').notNull().references(() => invoices.id, { onDelete: 'cascade' }),
  description: text('description').notNull(),
  quantity: integer('quantity').default(1),
  unitPrice: real('unit_price').notNull(),
  totalPrice: real('total_price').notNull(),
  serviceId: uuid('service_id').references(() => services.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// Service Area table
export const serviceAreas = pgTable('service_areas', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  description: text('description'),
  isActive: boolean('is_active').default(true),
  boundaries: jsonb('boundaries').notNull().$type<Record<string, any>>(),
  baseTravelSurcharge: real('base_travel_surcharge').notNull(),
  perKmSurcharge: real('per_km_surcharge'),
  maxTravelDistance: real('max_travel_distance').notNull(),
  estimatedTravelTime: integer('estimated_travel_time').notNull(),
  availableServices: jsonb('available_services').$type<string[] | null>(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// Super Admin table
export const superAdmins = pgTable('super_admins', {
  id: uuid('id').defaultRandom().primaryKey(),
  email: text('email').notNull().unique(),
  name: text('name').notNull(),
  isActive: boolean('is_active').default(true),
  passwordHash: text('password_hash').notNull().default(''),
  lastLoginAt: timestamp('last_login_at', { withTimezone: true }),
  loginAttempts: integer('login_attempts').default(0),
  lockedUntil: timestamp('locked_until', { withTimezone: true }),
  passwordResetToken: text('password_reset_token'),
  passwordResetExpires: timestamp('password_reset_expires', { withTimezone: true }),
  permissions: jsonb('permissions').$type<string[] | null>().default([] as string[]),
  canAccessAllTenants: boolean('can_access_all_tenants').default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// Security Audit Log table
export const securityAuditLogs = pgTable('security_audit_logs', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: text('tenant_id').notNull(),
  userId: text('user_id').notNull(),
  action: text('action').notNull(),
  resource: text('resource'),
  ipAddress: text('ip_address').notNull(),
  userAgent: text('user_agent').notNull(),
  success: boolean('success').default(true),
  details: text('details'),
  timestamp: timestamp('timestamp', { withTimezone: true }).defaultNow().notNull(),
});

// Activity Logs table
export const activityLogs = pgTable('activity_logs', {
  id: uuid('id').defaultRandom().primaryKey(),
  timestamp: timestamp('timestamp', { withTimezone: true }).defaultNow().notNull(),
  type: text('type').notNull(),
  tenantId: text('tenant_id'),
  tenantName: text('tenant_name'),
  userId: text('user_id'),
  userName: text('user_name'),
  action: text('action').notNull(),
  details: text('details').notNull(),
  severity: text('severity').notNull().default('info'),
  metadata: jsonb('metadata').$type<Record<string, any> | null>(),
});

// Tenant Subdomains table
export const tenantSubdomains = pgTable('tenant_subdomains', {
  id: uuid('id').defaultRandom().primaryKey(),
  subdomain: text('subdomain').notNull().unique(),
  tenantData: jsonb('tenant_data').notNull().$type<any>(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// Sessions table
export const sessions = pgTable('sessions', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull(),
  tenantId: uuid('tenant_id').notNull(),
  sessionData: jsonb('session_data').$type<any>(),
  expiresAt: timestamp('expires_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// Cache table
export const cache = pgTable('cache', {
  key: text('key').primaryKey().notNull(),
  value: jsonb('value').notNull().$type<any>(),
  expiresAt: timestamp('expires_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// Sales Transactions table
export const salesTransactions = pgTable('sales_transactions', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  customerId: uuid('customer_id').notNull().references(() => customers.id, { onDelete: 'cascade' }),
  serviceId: uuid('service_id').notNull().references(() => services.id, { onDelete: 'cascade' }),
  bookingId: uuid('booking_id').references(() => bookings.id, { onDelete: 'set null' }),
  transactionNumber: text('transaction_number'),
  source: text('source').notNull().default('on_the_spot'),
  serviceName: text('service_name').notNull(),
  duration: integer('duration').notNull(),
  isHomeVisit: boolean('is_home_visit').default(false),
  homeVisitAddress: text('home_visit_address'),
  homeVisitCoordinates: jsonb('home_visit_coordinates').$type<{ lat: number; lng: number } | null>(),
  unitPrice: real('unit_price').default(0).notNull(),
  homeVisitSurcharge: real('home_visit_surcharge').default(0),
  subtotal: real('subtotal').default(0).notNull(),
  taxRate: real('tax_rate').default(0).notNull(),
  taxAmount: real('tax_amount').default(0).notNull(),
  discountAmount: real('discount_amount').default(0).notNull(),
  totalAmount: real('total_amount').notNull(),
  paymentMethod: text('payment_method').notNull().default('cash'),
  paymentStatus: text('payment_status').notNull().default('pending'),
  paidAmount: real('paid_amount').default(0).notNull(),
  paymentReference: text('payment_reference'),
  paidAt: timestamp('paid_at', { withTimezone: true }),
  status: text('status').notNull().default('pending'),
  staffId: uuid('staff_id'),
  scheduledAt: timestamp('scheduled_at', { withTimezone: true }),
  completedAt: timestamp('completed_at', { withTimezone: true }),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// Relations
export const tenantRelations = relations(tenants, ({ many, one }) => ({
  services: many(services),
  customers: many(customers),
  bookings: many(bookings),
  staff: many(staff),
  whatsappDevices: many(whatsappDevices),
  conversations: many(conversations),
  messageTemplates: many(messageTemplates),
  businessHours: one(businessHours),
  invoices: many(invoices),
  serviceAreas: many(serviceAreas),
  salesTransactions: many(salesTransactions),
  videos: many(tenantVideos),
  socialMedia: many(tenantSocialMedia),
  photoGalleries: many(tenantPhotoGalleries),
  mediaSettings: one(tenantMediaSettings),
}));

export const serviceRelations = relations(services, ({ one, many }) => ({
  tenant: one(tenants, { fields: [services.tenantId], references: [tenants.id] }),
  bookings: many(bookings),
  invoiceItems: many(invoiceItems),
  salesTransactions: many(salesTransactions),
  staffServices: many(staffServices),
}));

export const customerRelations = relations(customers, ({ one, many }) => ({
  tenant: one(tenants, { fields: [customers.tenantId], references: [tenants.id] }),
  bookings: many(bookings),
  conversations: many(conversations),
  invoices: many(invoices),
  salesTransactions: many(salesTransactions),
}));

export const bookingRelations = relations(bookings, ({ one, many }) => ({
  tenant: one(tenants, { fields: [bookings.tenantId], references: [tenants.id] }),
  customer: one(customers, { fields: [bookings.customerId], references: [customers.id] }),
  service: one(services, { fields: [bookings.serviceId], references: [services.id] }),
  staffMember: one(staff, { fields: [bookings.staffId], references: [staff.id] }),
  invoices: many(invoices),
  salesTransactions: many(salesTransactions),
}));

export const staffRelations = relations(staff, ({ one, many }) => ({
  tenant: one(tenants, { fields: [staff.tenantId], references: [tenants.id] }),
  assignedConversations: many(conversations),
  services: many(staffServices),
  schedule: many(staffSchedule),
  leaves: many(staffLeave),
  approvedLeaves: many(staffLeave, { relationName: 'approvedLeaves' }),
}));

export const staffServicesRelations = relations(staffServices, ({ one }) => ({
  staff: one(staff, { fields: [staffServices.staffId], references: [staff.id] }),
  service: one(services, { fields: [staffServices.serviceId], references: [services.id] }),
}));

export const staffScheduleRelations = relations(staffSchedule, ({ one }) => ({
  staff: one(staff, { fields: [staffSchedule.staffId], references: [staff.id] }),
}));

export const staffLeaveRelations = relations(staffLeave, ({ one }) => ({
  staff: one(staff, { fields: [staffLeave.staffId], references: [staff.id] }),
  approver: one(staff, { 
    fields: [staffLeave.approverId], 
    references: [staff.id],
    relationName: 'approvedLeaves'
  }),
}));

export const conversationRelations = relations(conversations, ({ one, many }) => ({
  tenant: one(tenants, { fields: [conversations.tenantId], references: [tenants.id] }),
  customer: one(customers, { fields: [conversations.customerId], references: [customers.id] }),
  assignedTo: one(staff, { fields: [conversations.assignedToId], references: [staff.id] }),
  messages: many(messages),
}));

export const messageRelations = relations(messages, ({ one }) => ({
  conversation: one(conversations, { fields: [messages.conversationId], references: [conversations.id] }),
}));

export const invoiceRelations = relations(invoices, ({ one, many }) => ({
  tenant: one(tenants, { fields: [invoices.tenantId], references: [tenants.id] }),
  customer: one(customers, { fields: [invoices.customerId], references: [customers.id] }),
  booking: one(bookings, { fields: [invoices.bookingId], references: [bookings.id] }),
  items: many(invoiceItems),
}));

export const invoiceItemRelations = relations(invoiceItems, ({ one }) => ({
  invoice: one(invoices, { fields: [invoiceItems.invoiceId], references: [invoices.id] }),
  service: one(services, { fields: [invoiceItems.serviceId], references: [services.id] }),
}));

export const serviceAreaRelations = relations(serviceAreas, ({ one }) => ({
  tenant: one(tenants, { fields: [serviceAreas.tenantId], references: [tenants.id] }),
}));

export const salesTransactionRelations = relations(salesTransactions, ({ one }) => ({
  tenant: one(tenants, { fields: [salesTransactions.tenantId], references: [tenants.id] }),
  customer: one(customers, { fields: [salesTransactions.customerId], references: [customers.id] }),
  service: one(services, { fields: [salesTransactions.serviceId], references: [services.id] }),
  booking: one(bookings, { fields: [salesTransactions.bookingId], references: [bookings.id] }),
}));

export const superAdminRelations = relations(superAdmins, () => ({}));

export const securityAuditLogRelations = relations(securityAuditLogs, () => ({}));

// Blocked Dates table
export const blockedDates = pgTable('blocked_dates', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  date: timestamp('date', { withTimezone: true }).notNull(),
  reason: text('reason'),
  isRecurring: boolean('is_recurring').default(false),
  recurringPattern: text('recurring_pattern'), // 'daily', 'weekly', 'monthly', 'yearly'
  recurringEndDate: timestamp('recurring_end_date', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// Tenant Videos table
export const tenantVideos = pgTable('tenant_videos', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  youtubeUrl: text('youtube_url').notNull(),
  thumbnail: text('thumbnail'),
  description: text('description'),
  displayOrder: integer('display_order').default(0),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// Tenant Social Media table
export const tenantSocialMedia = pgTable('tenant_social_media', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  platform: text('platform').notNull(), // 'facebook', 'instagram', 'tiktok', 'youtube', 'linkedin', 'twitter'
  url: text('url').notNull(),
  displayOrder: integer('display_order').default(0),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// Tenant Photo Galleries table
export const tenantPhotoGalleries = pgTable('tenant_photo_galleries', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  description: text('description'),
  displayType: text('display_type').notNull().default('grid'), // 'grid', 'carousel', 'masonry'
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// Tenant Gallery Photos table
export const tenantGalleryPhotos = pgTable('tenant_gallery_photos', {
  id: uuid('id').defaultRandom().primaryKey(),
  galleryId: uuid('gallery_id').notNull().references(() => tenantPhotoGalleries.id, { onDelete: 'cascade' }),
  url: text('url').notNull(),
  caption: text('caption'),
  alt: text('alt').notNull(),
  displayOrder: integer('display_order').default(0),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// Relations for tenant videos, social media, and photo galleries
export const tenantVideosRelations = relations(tenantVideos, ({ one }) => ({
  tenant: one(tenants, { fields: [tenantVideos.tenantId], references: [tenants.id] }),
}));

export const tenantSocialMediaRelations = relations(tenantSocialMedia, ({ one }) => ({
  tenant: one(tenants, { fields: [tenantSocialMedia.tenantId], references: [tenants.id] }),
}));

export const tenantPhotoGalleriesRelations = relations(tenantPhotoGalleries, ({ one, many }) => ({
  tenant: one(tenants, { fields: [tenantPhotoGalleries.tenantId], references: [tenants.id] }),
  photos: many(tenantGalleryPhotos),
}));

export const tenantGalleryPhotosRelations = relations(tenantGalleryPhotos, ({ one }) => ({
  gallery: one(tenantPhotoGalleries, { fields: [tenantGalleryPhotos.galleryId], references: [tenantPhotoGalleries.id] }),
}));

// Tenant Media Settings table
export const tenantMediaSettings = pgTable('tenant_media_settings', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: uuid('tenant_id').notNull().unique().references(() => tenants.id, { onDelete: 'cascade' }),
  videoSize: text('video_size').notNull().default('medium'),
  videoAutoplay: boolean('video_autoplay').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const tenantMediaSettingsRelations = relations(tenantMediaSettings, ({ one }) => ({
  tenant: one(tenants, { fields: [tenantMediaSettings.tenantId], references: [tenants.id] }),
}));