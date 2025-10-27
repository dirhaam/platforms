# Booqing Platform - Web Flow Architecture

## Platform Overview
Booqing is a multi-tenant booking platform that enables businesses to create their own booking systems with customizable features and integrations.

**Main Website**: [booqing.my.id](https://booqing.my.id)

---

## System Architecture

```
MAIN WEBSITE (booqing.my.id)
│
├── Landing Page
├── Login
├── Register Form New Tenant
├── Admin Panel
│     └── Subdomain Management
│           ├── Create/Edit/Delete Subdomain
│           ├── Feature Activation (Premium, WhatsApp, Template, Analytics)
│           ├── API Key Management
│           ├── User RBAC Management
│           ├── Reporting & Analytics
│           ├── Billing/Subscription
│
└── ↓ (Subdomain Created)
      └── SUBDOMAIN ({tenant}.booqing.my.id)
           ├── Landing Page (Customization & Template)
           ├── Booking Management
           │     ├── Booking Slot & Calendar
           │     ├── Home Visit Booking
           │     ├── Schedule (Booking List & Upcoming Events)
           │     │     └── WhatsApp Reminder (10 random templates)
           │     ├── Invoicing (PDF/QR, Payment Status)
           ├── Chat/WhatsApp Menu
           │     ├── Chat Inbox
           │     ├── Send Message (text, file, image)
           │     ├── Device Management
           ├── Users (Tenant Staff, RBAC Settings)
           ├── Reporting (Export Analytics XLS/PDF)
           ├── Settings Profile
```

---

## Main Website Features

### 1. Landing Page
The primary public interface for the Booqing platform.
- **Value Proposition**: Clear presentation of platform benefits
- **Feature Showcase**: Visual display of key platform capabilities
- **Pricing Plans**: Transparent subscription options
- **Demo Requests**: Lead capture for potential customers
- **Testimonials**: Success stories from existing tenants

### 2. Authentication System

#### Login
- **Secure Authentication**: Multi-factor authentication options
- **Password Recovery**: Self-service password reset
- **Session Management**: Secure token-based sessions
- **Single Sign-On**: Optional integration with social/enterprise accounts

#### Register Form New Tenant
- **Business Information Collection**: Company details and verification
- **Subscription Selection**: Choose service tier
- **Subdomain Creation**: Custom subdomain selection
- **Payment Processing**: Initial subscription setup
- **Guided Onboarding**: Step-by-step setup wizard

### 3. Admin Panel
The central management hub for the entire platform.

#### Subdomain Management
- **Create Subdomain**: Generate new tenant subdomains
- **Edit Subdomain**: Modify existing tenant configurations
- **Delete Subdomain**: Remove tenant instances
- **Domain Status**: Monitor subdomain health and performance

#### Feature Activation System
- **Premium Features**: Enable/disable premium functionality per tenant
- **WhatsApp Integration**: Activate WhatsApp business features
- **Template System**: Access to custom templates and themes
- **Analytics Module**: Advanced reporting and insights

#### API Key Management
Centralized management of third-party integrations:
- WhatsApp Business API keys
- Payment gateway credentials
- Email service providers
- SMS service providers
- Analytics tracking codes

#### User RBAC (Role-Based Access Control)
- **Super Admin**: Full system access
- **Platform Admin**: Platform-level management
- **Tenant Admin**: Subdomain-specific administration
- **Staff**: Limited operational access

#### Reporting & Analytics
- Platform-wide performance metrics
- Tenant usage statistics
- Revenue tracking and reporting
- System health monitoring

#### Billing/Subscription Management
- Subscription plan management
- Payment processing
- Invoice generation
- Usage-based billing
- Upgrade/downgrade workflows

---

## Tenant Subdomain Features

Each tenant gets their own subdomain: `{tenant}.booqing.my.id`

### 1. Landing Page System
- **Template Selection**: Choose from pre-built templates
- **Customization Options**: 
  - Brand colors and logos
  - Custom CSS/styling
  - Content management
  - Image galleries
- **SEO Optimization**: Meta tags, structured data
- **Mobile Responsiveness**: Auto-optimized for all devices

### 2. Booking Management

#### Booking Slot & Calendar
- **Time Slot Configuration**: Define available booking times
- **Calendar Integration**: Visual calendar interface
- **Availability Management**: Real-time slot availability
- **Recurring Appointments**: Support for repeat bookings
- **Blackout Dates**: Block unavailable periods

#### Home Visit Booking
- **Location Services**: Address collection and validation
- **Service Area Management**: Define coverage zones
- **Travel Time Calculation**: Automatic scheduling with travel buffer
- **Route Optimization**: Efficient scheduling for multiple visits

#### Schedule Management
- **Booking List**: Comprehensive view of all bookings
- **Upcoming Events**: Timeline view of scheduled appointments
- **Status Tracking**: Pending, confirmed, completed, cancelled
- **Customer Information**: Contact details and booking history

#### WhatsApp Reminder System
- **Automated Reminders**: Configurable reminder schedules
- **Template Variety**: 10+ randomized message templates
- **Personalization**: Dynamic customer and booking details
- **Delivery Status**: Read receipts and delivery confirmation

#### Invoicing System
- **PDF Generation**: Professional invoice documents
- **QR Code Integration**: Quick payment and booking reference
- **Payment Status Tracking**: Paid, pending, overdue
- **Tax Calculation**: Configurable tax rates and rules
- **Multi-currency Support**: Local and international currencies

### 3. Chat/WhatsApp Integration

#### Chat Inbox
- **Unified Messaging**: All customer communications in one place
- **Message History**: Complete conversation tracking
- **Team Assignment**: Route messages to specific staff members
- **Auto-responses**: Intelligent chatbot integration

#### Message Management
- **Text Messages**: Rich text formatting support
- **File Sharing**: Document and media file support
- **Image Handling**: Photo sharing and gallery features
- **Message Templates**: Quick response templates

#### Device Management
- **WhatsApp Web Integration**: Browser-based messaging
- **Multi-device Support**: Sync across multiple devices
- **Session Management**: Secure connection handling
- **QR Code Authentication**: Easy device pairing

### 4. User Management

#### Tenant Staff Management
- **Staff Accounts**: Create and manage team member accounts
- **Role Assignment**: Assign specific roles and permissions
- **Access Control**: Granular permission settings
- **Activity Logging**: Track staff actions and changes

#### RBAC Settings
- **Custom Roles**: Define tenant-specific roles
- **Permission Matrix**: Detailed access control
- **Department Management**: Organize staff by departments
- **Temporary Access**: Time-limited permissions

### 5. Reporting & Analytics

#### Export Capabilities
- **Excel Export**: Detailed spreadsheet reports
- **PDF Reports**: Professional formatted documents
- **Custom Date Ranges**: Flexible reporting periods
- **Automated Reports**: Scheduled report generation

#### Analytics Dashboard
- **Booking Metrics**: Conversion rates, popular services
- **Customer Analytics**: Demographics and behavior patterns
- **Revenue Tracking**: Financial performance indicators
- **Performance KPIs**: Key business metrics

### 6. Settings & Profile Management

#### Business Profile
- **Company Information**: Business details and branding
- **Contact Settings**: Phone, email, address management
- **Operating Hours**: Business schedule configuration
- **Service Catalog**: Service offerings and pricing

#### System Configuration
- **Notification Preferences**: Email and SMS settings
- **Integration Settings**: Third-party service configurations
- **Backup & Security**: Data protection settings
- **Customization Options**: Theme and layout preferences

---

## User Flow Examples

### 1. New Tenant Onboarding
1. Visit main website (booqing.my.id)
2. Browse landing page and features
3. Click "Register" to access New Tenant Registration Form
4. Fill business information and verification details
5. Choose subscription plan
6. Select desired subdomain (e.g., `salon.booqing.my.id`)
7. Complete payment processing for initial subscription
8. Follow guided onboarding wizard
9. Configure basic business settings
10. Select and customize landing page template
11. Set up booking slots and services
12. Integrate WhatsApp and payment methods
13. Launch subdomain and start accepting bookings

### 2. Customer Booking Flow
1. Visit tenant subdomain (e.g., `salon.booqing.my.id`)
2. Browse customized landing page and services
3. View availability and pricing
4. Select preferred time slot
5. Fill in contact and service details
6. Receive booking confirmation via email/SMS
7. Get automated WhatsApp reminder before appointment
8. Complete service and receive invoice
9. Process payment through integrated gateway

### 3. Platform Administrator Operations
1. Log into main website (booqing.my.id)
2. Access Admin Panel with elevated privileges
3. Monitor all tenant activities and performance
4. Manage subdomain creation/modification/deletion
5. Configure feature activations for tenants
6. Handle API key management and integrations
7. Review platform-wide analytics and reports
8. Process billing and subscription changes
9. Manage user roles and permissions across tenants

### 4. Tenant Daily Operations
1. Log into main website or directly to subdomain
2. Access subdomain admin panel
3. Check new bookings and messages
4. Respond to customer inquiries via WhatsApp
5. Update availability and service offerings
6. Generate and send invoices
7. Review daily/weekly reports
8. Manage staff schedules and assignments

---

## Technical Considerations

### Multi-tenancy Architecture
- **Database Isolation**: Separate schemas per tenant
- **Subdomain Routing**: Dynamic subdomain resolution
- **Resource Scaling**: Auto-scaling based on tenant usage
- **Data Security**: Tenant data isolation and encryption

### Integration Points
- **WhatsApp Business API**: Real-time messaging
- **Payment Gateways**: Multiple payment processor support
- **Email Services**: Transactional and marketing emails
- **Calendar Sync**: Google Calendar, Outlook integration
- **Analytics**: Google Analytics, custom tracking

### Performance & Security
- **CDN Integration**: Global content delivery
- **SSL Certificates**: Automatic HTTPS for all subdomains
- **Rate Limiting**: API and request throttling
- **Backup Strategy**: Automated data backup and recovery
- **Monitoring**: Real-time system health monitoring

---

## Future Enhancements

### Planned Features
- Mobile app for tenants and customers
- Advanced AI chatbot integration
- Multi-language support
- Advanced reporting with custom dashboards
- Marketplace for templates and plugins
- API for third-party integrations

### Scalability Roadmap
- Microservices architecture migration
- Global multi-region deployment
- Advanced caching strategies
- Real-time notification system
- Enhanced analytics and machine learning insights

---

*Last Updated: September 2024*
*Version: 1.0*