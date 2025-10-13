// Drizzle schema for Cloudflare D1 (SQLite)
import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';
import { relations, sql } from 'drizzle-orm';

const timestampColumn = (name: string, notNull: boolean = true) => {
  const column = integer(name, { mode: 'timestamp_ms' }).default(sql`(unixepoch() * 1000)`);
  return notNull ? column.notNull() : column;
};

const booleanColumn = (name: string, defaultValue?: boolean) => {
  const column = integer(name, { mode: 'boolean' });
  return defaultValue === undefined ? column : column.default(defaultValue);
};

// Tenant table
export const tenants = sqliteTable('tenants', {
  id: text('id').primaryKey().notNull(),
  subdomain: text('subdomain').notNull().unique(),
  emoji: text('emoji').default('🏢'),
  businessName: text('business_name').notNull(),
  businessCategory: text('business_category').notNull(),
  ownerName: text('owner_name').notNull(),
  email: text('email').notNull(),
  phone: text('phone').notNull(),
  address: text('address'),
  businessDescription: text('business_description'),
  logo: text('logo'),

  brandColors: text('brand_colors', { mode: 'json' }).$type<Record<string, string> | null>(),

  whatsappEnabled: booleanColumn('whatsapp_enabled', false),
  homeVisitEnabled: booleanColumn('home_visit_enabled', false),
  analyticsEnabled: booleanColumn('analytics_enabled', false),
  customTemplatesEnabled: booleanColumn('custom_templates_enabled', false),
  multiStaffEnabled: booleanColumn('multi_staff_enabled', false),

  subscriptionPlan: text('subscription_plan').notNull().default('basic'),
  subscriptionStatus: text('subscription_status').notNull().default('active'),
  subscriptionExpiresAt: timestampColumn('subscription_expires_at', false),

  passwordHash: text('password_hash'),
  lastLoginAt: timestampColumn('last_login_at', false),
  loginAttempts: integer('login_attempts').default(0),
  lockedUntil: timestampColumn('locked_until', false),
  passwordResetToken: text('password_reset_token'),
  passwordResetExpires: timestampColumn('password_reset_expires', false),

  createdAt: timestampColumn('created_at'),
  updatedAt: timestampColumn('updated_at'),
});

// Service table
export const services = sqliteTable('services', {
  id: text('id').primaryKey().notNull(),
  tenantId: text('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  description: text('description').notNull(),
  duration: integer('duration').notNull(),
  price: real('price').notNull(),
  category: text('category').notNull(),
  isActive: booleanColumn('is_active', true),
  homeVisitAvailable: booleanColumn('home_visit_available', false),
  homeVisitSurcharge: real('home_visit_surcharge'),
  images: text('images', { mode: 'json' }).$type<string[] | null>(),
  requirements: text('requirements', { mode: 'json' }).$type<string[] | null>(),
  createdAt: timestampColumn('created_at'),
  updatedAt: timestampColumn('updated_at'),
});

// Customer table
export const customers = sqliteTable('customers', {
  id: text('id').primaryKey().notNull(),
  tenantId: text('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  email: text('email'),
  phone: text('phone').notNull(),
  address: text('address'),
  notes: text('notes'),
  totalBookings: integer('total_bookings').default(0),
  lastBookingAt: timestampColumn('last_booking_at', false),
  whatsappNumber: text('whatsapp_number'),
  createdAt: timestampColumn('created_at'),
  updatedAt: timestampColumn('updated_at'),
});

// Booking table
export const bookings = sqliteTable('bookings', {
  id: text('id').primaryKey().notNull(),
  tenantId: text('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  customerId: text('customer_id').notNull().references(() => customers.id, { onDelete: 'cascade' }),
  serviceId: text('service_id').notNull().references(() => services.id, { onDelete: 'cascade' }),
  status: text('status').notNull().default('pending'),
  scheduledAt: timestampColumn('scheduled_at'),
  duration: integer('duration').notNull(),
  isHomeVisit: booleanColumn('is_home_visit', false),
  homeVisitAddress: text('home_visit_address'),
  homeVisitCoordinates: text('home_visit_coordinates', { mode: 'json' }).$type<{ lat: number; lng: number } | null>(),
  notes: text('notes'),
  totalAmount: real('total_amount').notNull(),
  paymentStatus: text('payment_status').notNull().default('pending'),
  remindersSent: text('reminders_sent', { mode: 'json' }).$type<string[] | null>(),
  createdAt: timestampColumn('created_at'),
  updatedAt: timestampColumn('updated_at'),
});

// Staff table
export const staff = sqliteTable('staff', {
  id: text('id').primaryKey().notNull(),
  tenantId: text('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  email: text('email').notNull(),
  phone: text('phone'),
  role: text('role').notNull().default('staff'),
  permissions: text('permissions', { mode: 'json' }).$type<string[] | null>(),
  isActive: booleanColumn('is_active', true),

  passwordHash: text('password_hash'),
  lastLoginAt: timestampColumn('last_login_at', false),
  loginAttempts: integer('login_attempts').default(0),
  lockedUntil: timestampColumn('locked_until', false),
  passwordResetToken: text('password_reset_token'),
  passwordResetExpires: timestampColumn('password_reset_expires', false),

  createdAt: timestampColumn('created_at'),
  updatedAt: timestampColumn('updated_at'),
});

// WhatsApp Device table
export const whatsappDevices = sqliteTable('whatsapp_devices', {
  id: text('id').primaryKey().notNull(),
  tenantId: text('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  deviceName: text('device_name').notNull(),
  phoneNumber: text('phone_number').notNull(),
  status: text('status').notNull().default('disconnected'),
  lastSeen: timestampColumn('last_seen', false),
  qrCode: text('qr_code'),
  createdAt: timestampColumn('created_at'),
  updatedAt: timestampColumn('updated_at'),
});

// Conversation table
export const conversations = sqliteTable('conversations', {
  id: text('id').primaryKey().notNull(),
  tenantId: text('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  customerId: text('customer_id').notNull().references(() => customers.id, { onDelete: 'cascade' }),
  whatsappNumber: text('whatsapp_number').notNull(),
  lastMessageAt: timestampColumn('last_message_at'),
  unreadCount: integer('unread_count').default(0),
  assignedToId: text('assigned_to_id').references(() => staff.id, { onDelete: 'set null' }),
  status: text('status').notNull().default('active'),
  createdAt: timestampColumn('created_at'),
  updatedAt: timestampColumn('updated_at'),
});

// Message table
export const messages = sqliteTable('messages', {
  id: text('id').primaryKey().notNull(),
  conversationId: text('conversation_id').notNull().references(() => conversations.id, { onDelete: 'cascade' }),
  type: text('type').notNull().default('text'),
  content: text('content').notNull(),
  mediaUrl: text('media_url'),
  isFromCustomer: booleanColumn('is_from_customer', true),
  deliveryStatus: text('delivery_status').notNull().default('sent'),
  sentAt: timestampColumn('sent_at'),
});

// Message Template table
export const messageTemplates = sqliteTable('message_templates', {
  id: text('id').primaryKey().notNull(),
  tenantId: text('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  content: text('content').notNull(),
  variables: text('variables', { mode: 'json' }).$type<string[] | null>(),
  category: text('category').notNull().default('reminder'),
  isActive: booleanColumn('is_active', true),
  createdAt: timestampColumn('created_at'),
  updatedAt: timestampColumn('updated_at'),
});

// Business Hours table
export const businessHours = sqliteTable('business_hours', {
  id: text('id').primaryKey().notNull(),
  tenantId: text('tenant_id').notNull().unique().references(() => tenants.id, { onDelete: 'cascade' }),
  schedule: text('schedule', { mode: 'json' }).notNull().$type<Record<string, any>>(),
  timezone: text('timezone').default('Asia/Jakarta'),
  updatedAt: timestampColumn('updated_at'),
});

// Invoice table
export const invoices = sqliteTable('invoices', {
  id: text('id').primaryKey().notNull(),
  tenantId: text('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  customerId: text('customer_id').notNull().references(() => customers.id, { onDelete: 'cascade' }),
  bookingId: text('booking_id').references(() => bookings.id, { onDelete: 'set null' }),
  invoiceNumber: text('invoice_number').notNull().unique(),
  status: text('status').notNull().default('draft'),
  issueDate: timestampColumn('issue_date'),
  dueDate: timestampColumn('due_date'),
  paidDate: timestampColumn('paid_date', false),

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

  createdAt: timestampColumn('created_at'),
  updatedAt: timestampColumn('updated_at'),
});

// Invoice Item table
export const invoiceItems = sqliteTable('invoice_items', {
  id: text('id').primaryKey().notNull(),
  invoiceId: text('invoice_id').notNull().references(() => invoices.id, { onDelete: 'cascade' }),
  description: text('description').notNull(),
  quantity: integer('quantity').default(1),
  unitPrice: real('unit_price').notNull(),
  totalPrice: real('total_price').notNull(),
  serviceId: text('service_id').references(() => services.id, { onDelete: 'set null' }),
  createdAt: timestampColumn('created_at'),
  updatedAt: timestampColumn('updated_at'),
});

// Service Area table
export const serviceAreas = sqliteTable('service_areas', {
  id: text('id').primaryKey().notNull(),
  tenantId: text('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  description: text('description'),
  isActive: booleanColumn('is_active', true),
  boundaries: text('boundaries', { mode: 'json' }).notNull().$type<Record<string, any>>(),
  baseTravelSurcharge: real('base_travel_surcharge').notNull(),
  perKmSurcharge: real('per_km_surcharge'),
  maxTravelDistance: real('max_travel_distance').notNull(),
  estimatedTravelTime: integer('estimated_travel_time').notNull(),
  availableServices: text('available_services', { mode: 'json' }).$type<string[] | null>(),
  createdAt: timestampColumn('created_at'),
  updatedAt: timestampColumn('updated_at'),
});

// Super Admin table
export const superAdmins = sqliteTable('super_admins', {
  id: text('id').primaryKey().notNull(),
  email: text('email').notNull().unique(),
  name: text('name').notNull(),
  isActive: booleanColumn('is_active', true),
  passwordHash: text('password_hash').notNull(),
  lastLoginAt: timestampColumn('last_login_at', false),
  loginAttempts: integer('login_attempts').default(0),
  lockedUntil: timestampColumn('locked_until', false),
  passwordResetToken: text('password_reset_token'),
  passwordResetExpires: timestampColumn('password_reset_expires', false),
  permissions: text('permissions', { mode: 'json' }).$type<string[] | null>().default([] as string[]),
  canAccessAllTenants: booleanColumn('can_access_all_tenants', true),
  createdAt: timestampColumn('created_at'),
  updatedAt: timestampColumn('updated_at'),
});

// Security Audit Log table
export const securityAuditLogs = sqliteTable('security_audit_logs', {
  id: text('id').primaryKey().notNull(),
  tenantId: text('tenant_id').notNull(),
  userId: text('user_id').notNull(),
  action: text('action').notNull(),
  resource: text('resource'),
  ipAddress: text('ip_address').notNull(),
  userAgent: text('user_agent').notNull(),
  success: booleanColumn('success', true),
  details: text('details'),
  timestamp: timestampColumn('timestamp'),
});

// Activity Logs table
export const activityLogs = sqliteTable('activity_logs', {
  id: text('id').primaryKey().notNull(),
  timestamp: timestampColumn('timestamp'),
  type: text('type').notNull(),
  tenantId: text('tenant_id'),
  tenantName: text('tenant_name'),
  userId: text('user_id'),
  userName: text('user_name'),
  action: text('action').notNull(),
  details: text('details').notNull(),
  severity: text('severity').notNull().default('info'),
  metadata: text('metadata', { mode: 'json' }).$type<Record<string, any> | null>(),
});

// Tenant Subdomains table
export const tenantSubdomains = sqliteTable('tenant_subdomains', {
  id: text('id').primaryKey().notNull(),
  subdomain: text('subdomain').notNull().unique(),
  tenantData: text('tenant_data', { mode: 'json' }).notNull().$type<any>(),
  createdAt: timestampColumn('created_at'),
  updatedAt: timestampColumn('updated_at'),
});

// Sessions table
export const sessions = sqliteTable('sessions', {
  id: text('id').primaryKey().notNull(),
  userId: text('user_id').notNull(),
  tenantId: text('tenant_id').notNull(),
  sessionData: text('session_data', { mode: 'json' }).$type<any>(),
  expiresAt: timestampColumn('expires_at', false),
  createdAt: timestampColumn('created_at'),
  updatedAt: timestampColumn('updated_at'),
});

// Cache table
export const cache = sqliteTable('cache', {
  key: text('key').primaryKey().notNull(),
  value: text('value', { mode: 'json' }).notNull().$type<any>(),
  expiresAt: timestampColumn('expires_at', false),
  createdAt: timestampColumn('created_at'),
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

export const bookingRelations = relations(bookings, ({ one, many }) => ({
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

export const superAdminRelations = relations(superAdmins, () => ({}));

export const securityAuditLogRelations = relations(securityAuditLogs, () => ({}));