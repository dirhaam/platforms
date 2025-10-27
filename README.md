# 🏢 Booqing - Professional Booking Platform

A comprehensive multi-tenant booking platform built with Next.js 15, designed specifically for Indonesian businesses with advanced features like WhatsApp integration, home visit management, and powerful analytics.

## ✨ Features

### 🏢 Multi-Tenant Architecture
- ✅ Custom subdomain routing (`tenant.yourdomain.com`)
- ✅ Complete tenant isolation with dedicated data
- ✅ Role-based access control (Super Admin, Tenant Admin, Staff)
- ✅ Customizable branding per tenant

### 📅 Advanced Booking System
- ✅ Real-time availability checking
- ✅ Recurring bookings support
- ✅ Home visit management with location validation
- ✅ Service area management with travel calculations
- ✅ Blackout dates and business hours configuration

### 📱 WhatsApp Integration
- ✅ Multi-device management
- ✅ Automated notifications and reminders
- ✅ Customer conversation tracking
- ✅ Message templates system
- ✅ Webhook handling

### 💰 Financial Management
- ✅ Complete invoice generation with tax calculations
- ✅ Payment status tracking
- ✅ Export to Excel/CSV
- ✅ Revenue analytics and reporting
- ✅ Customer financial insights

### 📊 Analytics & Monitoring
- ✅ Customer analytics and lifetime value
- ✅ Service performance metrics
- ✅ Revenue tracking and forecasts
- ✅ System health monitoring
- ✅ Security audit logging

### 🛡️ Security & Performance
- ✅ JWT-based authentication with session management
- ✅ Rate limiting and input validation
- ✅ SQL injection prevention
- ✅ XSS protection
- ✅ Optimized for Verc deployment

## 🛠️ Tech Stack

### Core Framework
- **[Next.js 15](https://nextjs.org/)** - App Router + Server Components
- **[React 19](https://react.dev/)** - Latest React features
- **[TypeScript](https://www.typescriptlang.org/)** - Type safety

### Database & Backend
- **[PostgreSQL](https://www.postgresql.org/)** - Primary database
- **[Drizzle ORM](https://orm.drizzle.team/)** - Modern TypeScript ORM
- **[Supabase](https://supabase.com/)** - Backend-as-a-Service
- **[NextAuth.js](https://next-auth.js.org/)** - Authentication

### Frontend & UI
- **[Tailwind CSS 4](https://tailwindcss.com/)** - Utility-first styling
- **[shadcn/ui](https://ui.shadcn.com/)** - Accessible design system
- **[Radix UI](https://www.radix-ui.com/)** - UI primitives
- **[Lucide React](https://lucide.dev/)** - Icon library

### Business Logic
- **[Zod](https://zod.dev/)** - Schema validation
- **[date-fns](https://date-fns.org/)** - Date manipulation
- **[Decimal.js](https://mikemcl.github.io/decimal.js/)** - Precise calculations
- **[Recharts](https://recharts.org/)** - Data visualization

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18.17.0 or higher
- **pnpm** (recommended) or npm/yarn
- **Supabase** account for PostgreSQL database

### Installation

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd booqing-platform
   ```

2. **Install dependencies:**
   ```bash
   pnpm install
   ```

3. **Set up environment variables:**
   ```bash
   cp .env.example .env.local
   ```
   
   And configure:
   ```env
   # Database
   DATABASE_URL="postgresql://[project_ref]:[password]@[project_ref].supabase.co:5432/postgres"
   NEXT_PUBLIC_SUPABASE_URL="https://[project_ref].supabase.co"
   NEXT_PUBLIC_SUPABASE_ANON_KEY="your_anon_key"
   
   # Authentication
   JWT_SECRET="your-super-secret-jwt-key"
   SESSION_SECRET="your-session-secret"
   
   # Application
   NEXTAUTH_URL="http://localhost:3000"
   ROOT_DOMAIN="localhost:3000"
   
   # WhatsApp (Optional)
   WHATSAPP_API_KEY="your-whatsapp-api-key"
   WHATSAPP_WEBHOOK_SECRET="your-webhook-secret"
   ```

4. **Set up database:**
   ```bash
   # Generate and apply migrations
   pnpm db:generate
   pnpm db:push
   
   # Optional: Open Drizzle Studio
   pnpm db:studio
   ```

5. **Start the development server:**
   ```bash
   pnpm dev
   ```

6. **Access the application:**
   - **Main Site**: http://localhost:3000
   - **Admin Panel**: http://localhost:3000/admin
   - **Tenant Example**: http://[tenant].localhost:3000

## 🏗️ Architecture

### Multi-Tenant Design

The platform uses a subdomain-based multi-tenant architecture:

- **Tenant Isolation**: Each tenant gets dedicated subdomain (`tenant.domain.com`)
- **Data Separation**: Complete isolation dengan row-level security
- **Custom Branding**: Per-tenant customization of colors, logo, etc.
- **Scalable Design**: Easy to add/remove tenants without affecting others

### Database Schema

核心模块包括：
- **Tenants**: Multi-tenant management
- **Services**: Service catalog dengan pricing
- **Customers**: Customer management
- **Bookings**: Booking engine dengan status tracking
- **Invoices**: Financial management
- **WhatsApp**: Communication system

For complete schema documentation, see `docs/PLATFORM_DOCUMENTATION.md`.

## 📚 Documentation

### Main Documentation
- **[Platform Documentation](./docs/platform/PLATFORM_DOCUMENTATION.md)** - Complete platform overview
- **[API Reference](./docs/API_REFERENCE.md)** - Comprehensive API documentation
- **[Database Schema](./docs/DATABASE_SCHEMA.md)** - Database structure and relationships
- **[Security Guide](./docs/SECURITY.md)** - Security best practices

### Organized Documentation Index
For a complete overview of all documentation files, see the [Documentation Index](./DOCUMENTATION_INDEX.md).

#### By Category:
- **[Platform & Architecture](./docs/platform/)** - Core platform features, architecture, and system documentation
- **[Setup & Deployment](./docs/setup/)** - Installation, configuration, and deployment guides
- **[Authentication](./docs/auth/)** - Login, security, RBAC, and access control documentation
- **[Booking System](./docs/booking/)** - Booking workflows and management
- **[WhatsApp Integration](./docs/whatsapp/)** - WhatsApp features and integration
- **[Development](./docs/development/)** - Testing, debugging, and development guides

## 🔧 Development

### Available Scripts

```bash
# Development
pnpm dev              # Start development server
pnpm build            # Build for production
pnpm start            # Start production server

# Database
pnpm db:generate      # Generate migrations
pnpm db:push          # Apply migrations
pnpm db:studio        # Open Drizzle Studio

# Testing
pnpm test             # Run tests
pnpm lint             # Run linter
```

### Project Structure

```
booqing-platform/
├── app/                 # Next.js App Router
│   ├── api/            # API routes
│   ├── admin/          # Admin dashboard
│   └── s/[subdomain]/  # Tenant interfaces
├── components/         # Reusable components
├── lib/               # Business logic & utilities
├── types/             # TypeScript definitions
└── docs/              # Documentation
```

## 🚀 Deployment

### Vercel Deployment (Recommended)

1. **Connect to Vercel:**
   ```bash
   vercel link
   ```

2. **Configure environment variables in Vercel dashboard:**
   - `DATABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `JWT_SECRET`
   - `ROOT_DOMAIN`

3. **Deploy:**
   ```bash
   vercel --prod
   ```

4. **Set up custom domain:**
   - Add your root domain to Vercel
   - Configure wildcard DNS (`*.yourdomain.com` → CNAME → `cname.vercel-dns.com`)

### Database Migration in Production

```bash
# Apply migrations to production database
pnpm db:push --prod
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🧪 Debugging & Scripts

The project includes comprehensive debugging and setup tools in the `scripts/` folder:

### **Quick Debugging**
```bash
# Run comprehensive diagnostics
node scripts/debug/comprehensive-rls-diagnostics.js

# Test login flow
node scripts/debug/test-api-login.js

# Test middleware & sessions
node scripts/debug/test-middleware-specific.js

# Check environment variables
node scripts/setup/check-vercel-env.js
```

### **Setup & Admin**
```bash
# Quick admin setup
node scripts/setup/quick-admin-setup.js

# Create tenant admin
node scripts/setup/create-admin.js

# Setup production deployment
node scripts/setup/setup-production.js
```

### **Project Structure**
```
scripts/
├── debug/          # Debugging and diagnostic scripts
│   ├── test-api-login.js
│   ├── test-middleware-specific.js
│   └── comprehensive-rls-diagnostics.js
├── setup/          # Setup and admin scripts
│   ├── quick-admin-setup.js
│   ├── create-admin.js
│   └── check-vercel-env.js
└── utils/          # Development utilities
    └── test-db-connection.ts
```

## 🔧 Troubleshooting

### **Login Issues**
1. **401 Unauthorized**:
   ```bash
   node scripts/debug/comprehensive-rls-diagnostics.js
   ```

2. **Subdomain not working**:
   ```bash
   node scripts/debug/test-subdomain-simple.js
   ```

3. **Session problems**:
   ```bash
   node scripts/debug/test-session-debug.js
   ```

### **Database Issues**
- Check connection: `npx ts-node scripts/utils/test-db-connection.ts`
- Run diagnostics: `node scripts/debug/comprehensive-rls-diagnostics.js`
- Check RLS policies: See debug output

### **Environment Variables**
- Verify Vercel setup: `node scripts/setup/check-vercel-env.js`
- Check documentation: See [fix-rls-and-login.md](./fix-rls-and-login.md)

## 🆘 Support

- **Scripts Documentation**: See `scripts/README.md` for detailed usage
- **Project Documentation**: Check `docs/` folder for comprehensive guides
- **Issues**: Report bugs via GitHub Issues
- **Discussions**: Ask questions in GitHub Discussions

---

*Built with ❤️ for Indonesian businesses*
