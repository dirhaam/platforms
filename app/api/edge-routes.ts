// app/api/edge-routes.ts
// Placeholder file for Edge Runtime compatible API routes

// These routes will be automatically run in Edge Runtime
// since they don't have explicit runtime config
// and don't import Node.js specific modules

export { GET as getTenantData } from './tenants/[subdomain]/route';
export { GET as getAllTenants } from './tenants/route';