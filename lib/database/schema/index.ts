// Drizzle schema file
import { pgTable, serial, text, varchar, integer, boolean, decimal, timestamp, json, Json, pgEnum } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Enums
export const subscriptionPlanEnum = pgEnum('subscription_plan', ['basic', 'premium', 'enterprise']);
export const subscriptionStatusEnum = pgEnum('subscription_status', ['active', 'suspended', 'cancelled']);
export const bookingStatusEnum = pgEnum('booking_status', ['pending', 'confirmed', 'completed', 'cancelled', 'no_show']);
export const paymentStatusEnum = pgEnum('payment_status', ['pending', 'paid', 'refunded']);
export const messageCategoryEnum = pgEnum('message_category', ['reminder', 'confirmation', 'follow_up', 'marketing']);
export const roleEnum = pgEnum('role', ['admin', 'staff']);
export const whatsappStatusEnum = pgEnum('whatsapp_status', ['connected', 'disconnected', 'connecting']);
export const messageDeliveryStatusEnum = pgEnum('message_delivery_status', ['sent', 'delivered', 'read', 'failed']);
export const messageTypeEnum = pgEnum('message_type', ['text', 'image', 'file', 'voice', 'template']);
export const invoiceStatusEnum = pgEnum('invoice_status', ['draft', 'sent', 'paid', 'overdue', 'cancelled']);
export const paymentMethodEnum = pgEnum('payment_method', ['cash', 'bank_transfer', 'credit_card', 'digital_wallet', 'other']);
export const conversationStatusEnum = pgEnum('conversation_status', ['active', 'archived']);

// Tenant table
export const tenants = pgTable('tenants', {
  id: text('id').primaryKey().notNull(),
  subdomain: varchar('subdomain', { length: 255 }).notNull().unique(),
  emoji: varchar('emoji', { length: 10 }).default('🏢'),
  businessName: varchar('business_name', { length: 255 }).notNull(),
  businessCategory: varchar('business_category', { length: 255 }).notNull(),
  ownerName: varchar('owner_name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }).notNull(),
  phone: varchar('phone', { length: 50 }).notNull(),
  address: varchar('address', { length: 500 }),
  businessDescription: varchar('business_description', { length: 1000 }),
  logo: varchar('logo', { length: 500 }),
  
  // Brand colors as JSON
  brandColors: json('brand_colors').$type<Record<string, string>>(),
  
  // Feature flags
  whatsappEnabled: boolean('whatsapp_enabled').default(false),
  homeVisitEnabled: boolean('home_visit_enabled').default(false),
  analyticsEnabled: boolean('analytics_enabled').default(false),
  customTemplatesEnabled: boolean('custom_templates_enabled').default(false),
  multiStaffEnabled: boolean('multi_staff_enabled').default(false),
  
  // Subscription info
  subscriptionPlan: subscriptionPlanEnum('subscription_plan').default('basic'),
  subscriptionStatus: subscriptionStatusEnum('subscription_status').default('active'),
  subscriptionExpiresAt: timestamp('subscription_expires_at'),
  
  // Security fields for owner
  passwordHash: varchar('password_hash', { length: 255 }),
  lastLoginAt: timestamp('last_login_at'),
  loginAttempts: integer('login_attempts').default(0),
  lockedUntil: timestamp('locked_until'),
  passwordResetToken: varchar('password_reset_token', { length: 255 }),
  passwordResetExpires: timestamp('password_reset_expires'),
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Service table
export const services = pgTable('services', {
  id: text('id').primaryKey().notNull(),
  tenantId: text('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 255 }).notNull(),
  description: varchar('description', { length: 1000 }).notNull(),
  duration: integer('duration').notNull(), // minutes
  price: decimal('price', { precision: 10, scale: 2 }).notNull(),
  category: varchar('category', { length: 255 }).notNull(),
  isActive: boolean('is_active').default(true),
  homeVisitAvailable: boolean('home_visit_available').default(false),
  homeVisitSurcharge: decimal('home_visit_surcharge', { precision: 10, scale: 2 }),
  images: text('images').array(),
  requirements: text('requirements').array(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Customer table
export const customers = pgTable('customers', {
  id: text('id').primaryKey().notNull(),
  tenantId: text('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }),
  phone: varchar('phone', { length: 50 }).notNull(),
  address: varchar('address', { length: 500 }),
  notes: varchar('notes', { length: 1000 }),
  totalBookings: integer('total_bookings').default(0),
  lastBookingAt: timestamp('last_booking_at'),
  whatsappNumber: varchar('whatsapp_number', { length: 50 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Booking table
export const bookings = pgTable('bookings', {
  id: text('id').primaryKey().notNull(),
  tenantId: text('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  customerId: text('customer_id').notNull().references(() => customers.id, { onDelete: 'cascade' }),
  serviceId: text('service_id').notNull().references(() => services.id, { onDelete: 'cascade' }),
  status: bookingStatusEnum('status').default('pending'),
  scheduledAt: timestamp('scheduled_at').notNull(),
  duration: integer('duration').notNull(), // minutes
  isHomeVisit: boolean('is_home_visit').default(false),
  homeVisitAddress: varchar('home_visit_address', { length: 500 }),
  homeVisitCoordinates: json('home_visit_coordinates').$type<{ lat: number; lng: number }>(),
  notes: varchar('notes', { length: 1000 }),
  totalAmount: decimal('total_amount', { precision: 10, scale: 2 }).notNull(),
  paymentStatus: paymentStatusEnum('payment_status').default('pending'),
  remindersSent: timestamp('reminders_sent').array(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Staff table
export const staff = pgTable('staff', {
  id: text('id').primaryKey().notNull(),
  tenantId: text('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }).notNull(),
  phone: varchar('phone', { length: 50 }),
  role: roleEnum('role').default('staff'),
  permissions: text('permissions').array(),
  isActive: boolean('is_active').default(true),
  
  // Security fields
  passwordHash: varchar('password_hash', { length: 255 }),
  lastLoginAt: timestamp('last_login_at'),
  loginAttempts: integer('login_attempts').default(0),
  lockedUntil: timestamp('locked_until'),
  passwordResetToken: varchar('password_reset_token', { length: 255 }),
  passwordResetExpires: timestamp('password_reset_expires'),
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// WhatsApp Device table
export const whatsappDevices = pgTable('whatsapp_devices', {
  id: text('id').primaryKey().notNull(),
  tenantId: text('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  deviceName: varchar('device_name', { length: 255 }).notNull(),
  phoneNumber: varchar('phone_number', { length: 50 }).notNull(),
  status: whatsappStatusEnum('status').default('disconnected'),
  lastSeen: timestamp('last_seen'),
  qrCode: varchar('qr_code', { length: 1000 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Conversation table
export const conversations = pgTable('conversations', {
  id: text('id').primaryKey().notNull(),
  tenantId: text('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  customerId: text('customer_id').notNull().references(() => customers.id, { onDelete: 'cascade' }),
  whatsappNumber: varchar('whatsapp_number', { length: 50 }).notNull(),
  lastMessageAt: timestamp('last_message_at').defaultNow().notNull(),
  unreadCount: integer('unread_count').default(0),
  assignedToId: text('assigned_to_id').references(() => staff.id, { onDelete: 'setNull' }),
  status: conversationStatusEnum('status').default('active'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Message table
export const messages = pgTable('messages', {
  id: text('id').primaryKey().notNull(),
  conversationId: text('conversation_id').notNull().references(() => conversations.id, { onDelete: 'cascade' }),
  type: messageTypeEnum('type').default('text'),
  content: varchar('content', { length: 1000 }).notNull(),
  mediaUrl: varchar('media_url', { length: 500 }),
  isFromCustomer: boolean('is_from_customer').default(true),
  deliveryStatus: messageDeliveryStatusEnum('delivery_status').default('sent'),
  sentAt: timestamp('sent_at').defaultNow().notNull(),
});

// Message Template table
export const messageTemplates = pgTable('message_templates', {
  id: text('id').primaryKey().notNull(),
  tenantId: text('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 255 }).notNull(),
  content: varchar('content', { length: 1000 }).notNull(),
  variables: text('variables').array(),
  category: messageCategoryEnum('category').default('reminder'),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Business Hours table
export const businessHours = pgTable('business_hours', {
  id: text('id').primaryKey().notNull(),
  tenantId: text('tenant_id').notNull().unique().references(() => tenants.id, { onDelete: 'cascade' }),
  schedule: json('schedule').notNull().$type<Record<string, any>>(), // Schedule configuration as JSON
  timezone: varchar('timezone', { length: 50 }).default('Asia/Jakarta'),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Invoice table
export const invoices = pgTable('invoices', {
  id: text('id').primaryKey().notNull(),
  tenantId: text('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  customerId: text('customer_id').notNull().references(() => customers.id, { onDelete: 'cascade' }),
  bookingId: text('booking_id').references(() => bookings.id, { onDelete: 'setNull' }),
  invoiceNumber: varchar('invoice_number', { length: 100 }).notNull().unique(),
  status: invoiceStatusEnum('status').default('draft'),
  issueDate: timestamp('issue_date').defaultNow().notNull(),
  dueDate: timestamp('due_date').notNull(),
  paidDate: timestamp('paid_date'),
  
  // Financial details
  subtotal: decimal('subtotal', { precision: 10, scale: 2 }).notNull(),
  taxRate: decimal('tax_rate', { precision: 5, scale: 4 }).default('0'),
  taxAmount: decimal('tax_amount', { precision: 10, scale: 2 }).default('0'),
  discountAmount: decimal('discount_amount', { precision: 10, scale: 2 }).default('0'),
  totalAmount: decimal('total_amount', { precision: 10, scale: 2 }).notNull(),
  
  // Payment details
  paymentMethod: paymentMethodEnum('payment_method'),
  paymentReference: varchar('payment_reference', { length: 255 }),
  
  // Invoice content
  notes: varchar('notes', { length: 1000 }),
  terms: varchar('terms', { length: 1000 }),
  
  // QR code for payment
  qrCodeData: varchar('qr_code_data', { length: 500 }),
  qrCodeUrl: varchar('qr_code_url', { length: 500 }),
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Invoice Item table
export const invoiceItems = pgTable('invoice_items', {
  id: text('id').primaryKey().notNull(),
  invoiceId: text('invoice_id').notNull().references(() => invoices.id, { onDelete: 'cascade' }),
  description: varchar('description', { length: 500 }).notNull(),
  quantity: integer('quantity').default(1),
  unitPrice: decimal('unit_price', { precision: 10, scale: 2 }).notNull(),
  totalPrice: decimal('total_price', { precision: 10, scale: 2 }).notNull(),
  serviceId: text('service_id').references(() => services.id, { onDelete: 'setNull' }),
});

// Service Area table
export const serviceAreas = pgTable('service_areas', {
  id: text('id').primaryKey().notNull(),
  tenantId: text('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 255 }).notNull(),
  description: varchar('description', { length: 1000 }),
  isActive: boolean('is_active').default(true),
  
  // Geographic boundaries as JSON
  boundaries: json('boundaries').notNull().$type<Record<string, any>>(), // ServiceAreaBoundary type
  
  // Pricing and logistics
  baseTravelSurcharge: decimal('base_travel_surcharge', { precision: 10, scale: 2 }).notNull(),
  perKmSurcharge: decimal('per_km_surcharge', { precision: 10, scale: 2 }),
  maxTravelDistance: decimal('max_travel_distance', { precision: 8, scale: 2 }).notNull(),
  estimatedTravelTime: integer('estimated_travel_time').notNull(), // base travel time in minutes
  
  // Service availability
  availableServices: text('available_services').array(), // service IDs
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Super Admin table
export const superAdmins = pgTable('super_admins', {
  id: text('id').primaryKey().notNull(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  name: varchar('name', { length: 255 }).notNull(),
  isActive: boolean('is_active').default(true),
  
  // Security fields
  passwordHash: varchar('password_hash', { length: 255 }).notNull(),
  lastLoginAt: timestamp('last_login_at'),
  loginAttempts: integer('login_attempts').default(0),
  lockedUntil: timestamp('locked_until'),
  passwordResetToken: varchar('password_reset_token', { length: 255 }),
  passwordResetExpires: timestamp('password_reset_expires'),
  
  // Permissions and access
  permissions: text('permissions').array().default(['*']), // Platform-wide permissions
  canAccessAllTenants: boolean('can_access_all_tenants').default(true),
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Security Audit Log table
export const securityAuditLogs = pgTable('security_audit_logs', {
  id: text('id').primaryKey().notNull(),
  tenantId: text('tenant_id').notNull(),
  userId: text('user_id').notNull(),
  action: varchar('action', { length: 100 }).notNull(), // login, logout, create_booking, delete_customer, etc.
  resource: varchar('resource', { length: 100 }), // booking_id, customer_id, etc.
  ipAddress: varchar('ip_address', { length: 45 }).notNull(), // IPv6 addresses can be 39 chars + port
  userAgent: varchar('user_agent', { length: 500 }).notNull(),
  success: boolean('success').default(true),
  details: varchar('details', { length: 1000 }), // JSON string with additional details
  timestamp: timestamp('timestamp').defaultNow().notNull(),
});

// Activity Logs table
export const activityLogs = pgTable('activity_logs', {
  id: text('id').primaryKey().notNull(),
  timestamp: timestamp('timestamp').defaultNow().notNull(),
  type: varchar('type', { length: 50 }).notNull(), // tenant_created, tenant_updated, etc.
  tenantId: text('tenant_id'),
  tenantName: varchar('tenant_name', { length: 255 }),
  userId: text('user_id'),
  userName: varchar('user_name', { length: 255 }),
  action: varchar('action', { length: 100 }).notNull(),
  details: varchar('details', { length: 1000 }).notNull(),
  severity: varchar('severity', { length: 20 }).notNull().default('info'), // info, warning, error, success
  metadata: text('metadata'), // JSON string with additional metadata
});

// Tenant Subdomains table (untuk menggantikan penyimpanan Redis untuk data tenant)
export const tenantSubdomains = pgTable('tenant_subdomains', {
  id: text('id').primaryKey().notNull(),
  subdomain: varchar('subdomain', { length: 255 }).notNull().unique(),
  tenantData: text('tenant_data').notNull(), // JSON string with tenant data
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Sessions table (untuk menggantikan penyimpanan Redis untuk session)
export const sessions = pgTable('sessions', {
  id: text('id').primaryKey().notNull(),
  userId: text('user_id').notNull(),
  tenantId: text('tenant_id').notNull(),
  sessionData: text('session_data'), // JSON string with session data
  expiresAt: timestamp('expires_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Cache table (untuk menggantikan penyimpanan Redis untuk cache)
export const cache = pgTable('cache', {
  key: text('key').primaryKey().notNull(),
  value: text('value').notNull(), // JSON string with cached data
  expiresAt: timestamp('expires_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Relations
export const tenantRelations = relations(tenants, ({ many }) => ({
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
}));

export const serviceRelations = relations(services, ({ one, many }) => ({
  tenant: one(tenants, { fields: [services.tenantId], references: [tenants.id] }),
  bookings: many(bookings),
  invoiceItems: many(invoiceItems),
}));

export const customerRelations = relations(customers, ({ one, many }) => ({
  tenant: one(tenants, { fields: [customers.tenantId], references: [tenants.id] }),
  bookings: many(bookings),
  conversations: many(conversations),
  invoices: many(invoices),
}));

export const bookingRelations = relations(bookings, ({ one }) => ({
  tenant: one(tenants, { fields: [bookings.tenantId], references: [tenants.id] }),
  customer: one(customers, { fields: [bookings.customerId], references: [customers.id] }),
  service: one(services, { fields: [bookings.serviceId], references: [services.id] }),
  invoices: many(invoices),
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

export const superAdminRelations = relations(superAdmins, {});

export const securityAuditLogRelations = relations(securityAuditLogs, {});