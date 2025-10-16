# Scripts Directory

This directory contains various scripts for development, setup, debugging, and utilities.

## Directory Structure:

```
scripts/
├── debug/          # Debugging and diagnostic scripts
├── setup/          # Setup and initialization scripts  
├── utils/          # Utility and helper scripts
└── README.md       # This file
```

## Quick Start:

### **Debugging Problems:**
```bash
# Run comprehensive diagnostics
node scripts/debug/comprehensive-rls-diagnostics.js

# Test login flow
node scripts/debug/test-api-login.js

# Test middleware and sessions
node scripts/debug/test-middleware-specific.js
```

### **Setup & Admin:**
```bash
# Quick admin setup
node scripts/setup/quick-admin-setup.js

# Create admin users
node scripts/setup/create-admin.js

# Setup production environment
node scripts/setup/setup-production.js

# Check Vercel environment
node scripts/setup/check-vercel-env.js
```

### **Utilities:**
```bash
# Test database connection
npx ts-node scripts/utils/test-db-connection.ts

# Development testing
npx ts-node scripts/utils/dev-test.ts
```

## Important Notes:

⚠️ **Before running any script:**
- Make sure environment variables are properly configured
- Backup your database before running setup scripts
- Some scripts modify database data - use with caution
- Check individual README files in each subdirectory for specific usage

🔐 **Security:**
- These scripts may contain sensitive operations
- Do not commit sensitive credentials
- Use appropriate permissions for production deployments

## Script Categories:

### **Debug Scripts** (`debug/`)
- API endpoint testing
- Authentication flow debugging  
- Session management testing
- Middleware behavior analysis
- Database connectivity checks

### **Setup Scripts** (`setup/`)
- User and admin creation
- Database initialization
- Environment configuration
- Production deployment setup

### **Utility Scripts** (`utils/`)
- Development helpers
- Syntax validation
- Connection testing
- Development workflow tools

For more detailed information, see the README files in each subdirectory.
