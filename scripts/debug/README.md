# Debug Scripts

This folder contains debugging and diagnostic scripts used during development and troubleshooting.

## Scripts Overview:

### **Authentication & Login Debugging**
- `test-api-login.js` - Test API login endpoints
- `test-localhost-cookie.js` - Test cookie handling in localhost
- `test-login-browser-sim.js` - Simulate browser login flow
- `test-login-response.js` - Test login response headers
- `test-production-login.js` - Test production login scenarios
- `test-session-debug.js` - Debug session storage and retrieval
- `test-middleware-session.js` - Test middleware session handling
- `test-middleware-specific.js` - Test specific middleware behaviors
- `test-critical-endpoints.js` - Test all critical API endpoints
- `test-subdomain-simple.js` - Test subdomain extraction logic
- `test-redirect-ls.js` - Test redirect logic and routing

### **Database & System Debugging**
- `debug-login.js` - Debug login process and database queries
- `comprehensive-rls-diagnostics.js` - Full RLS and login diagnostics

## Usage:

Run these scripts from the project root:

```bash
node scripts/debug/test-api-login.js
node scripts/debug/test-production-login.js
node scripts/debug/comprehensive-rls-diagnostics.js
```

## Notes:

- These scripts are for development/debugging only
- Do not commit sensitive data or credentials
- Scripts may require environment variables to be set
- Some scripts may modify database data - use with care
