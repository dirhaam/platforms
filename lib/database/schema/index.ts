// Drizzle schema for Supabase (PostgreSQL)
import { pgTable, text, integer, real, boolean, timestamp, jsonb, uuid } from 'drizzle-orm/pg-core';
import { relations, one } from 'drizzle-orm';

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
  images: jsonb('images').$type<string[] | null>(),
  requirements: jsonb('requirements').$type<string[] | null>(),
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
}));

export const serviceRelations = relations(services, ({ one, many }) => ({
  tenant: one(tenants, { fields: [services.tenantId], references: [tenants.id] }),
  bookings: many(bookings),
  invoiceItems: many(invoiceItems),
  salesTransactions: many(salesTransactions),
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
  invoices: many(invoices),
  salesTransactions: many(salesTransactions),
}));

export const staffRelations = relations(staff, ({ one, many }) => ({
  tenant: one(tenants, { fields: [staff.tenantId], references: [tenants.id] }),
  assignedConversations: many(conversations),
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

export const blockedDatesRelations = relations(blockedDates, () => ({
  tenant: one(tenants, { fields: [blockedDates.tenantId], references: [tenants.id] }),
}));