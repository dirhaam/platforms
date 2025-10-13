// Runtime Configuration Guidelines for Cloudflare Deployment
//
// This file documents the runtime configuration approach for different types of routes
// to ensure compatibility with Cloudflare Pages deployment

// Routes that require Node.js runtime:
// 1. Any route that accesses PostgreSQL database
// 2. Any route that uses bcrypt or other Node.js built-in modules
// 3. Any route that performs file operations (PDF generation, Excel export)
// 4. Any route that performs complex data processing requiring Node.js packages
//
// These routes should have: export const runtime = 'nodejs';

// Routes that can run in Edge Runtime:
// 1. Static data retrieval that doesn't require database access
// 2. Simple calculations or transformations on client-provided data
// 3. Routes that only access external APIs (if compatible)
//
// These routes can have: export const runtime = 'edge'; (default behavior without explicit declaration)

// Examples of routes requiring Node.js:
// - /api/auth/* (database + bcrypt)
// - /api/invoices/* (database access)
// - /api/customers/* (database access) 
// - /api/bookings/* (database access)
// - /api/analytics/* (database access)
// - /api/admin/* (database access)
// - /api/financial/* (database access)
// - /api/services/* (database access)
// - /api/service-areas/* (database access)
// - /api/location/* (if accessing database)
// - /api/settings/* (if accessing database)

// Middleware must always be Edge Runtime compatible and should NOT access database directly
// Database access in middleware was replaced with JWT token validation only