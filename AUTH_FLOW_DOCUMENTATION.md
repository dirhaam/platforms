# Authentication Flow Documentation

## IMPORTANT: Staff Login Flow

### Overview
Staff login uses a **BYPASS MIDDLEWARE** approach with subdomain creation, NOT regular user authentication.

### Authentication Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    STAFF LOGIN FLOW                         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1. Staff visits: staff.booqing.com (or subdomain)         │
│     └─> Bypass middleware checks subdomain                 │
│                                                             │
│  2. Middleware verifies:                                   │
│     └─> Subdomain exists in system                         │
│     └─> Maps to tenant_id                                  │
│                                                             │
│  3. Direct access granted:                                 │
│     └─> NO user authentication required                    │
│     └─> NO password login                                  │
│     └─> NO JWT token validation                            │
│                                                             │
│  4. Dashboard loads with:                                  │
│     └─> x-tenant-id header set                             │
│     └─> All API calls filtered by tenant                   │
│     └─> Multi-tenant isolation maintained                  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Key Points

**What's Different:**
- ❌ NO user registration required
- ❌ NO password hashing/verification
- ❌ NO JWT token generation
- ❌ NO session management
- ✅ Subdomain = Tenant access key

**What's Same:**
- ✅ Multi-tenant data isolation (via x-tenant-id)
- ✅ API middleware validation
- ✅ Row-level security (RLS) in database

### Implementation Details

#### Middleware Location
```
File: middleware.ts
Function: Checks incoming subdomain
Maps: subdomain → tenant_id
Sets: x-tenant-id header for all requests
```

#### Subdomain Format
```
Pattern: {tenant-subdomain}.booqing.com
Example: hairsalon.booqing.com
         coffeeshop.booqing.com
         servicebus.booqing.com
```

#### API Request Flow
```
1. Client Request
   └─> Include x-tenant-id header (set by middleware)

2. API Endpoint (e.g., /api/bookings)
   └─> Verify x-tenant-id header
   └─> Append to all database queries
   └─> Filter results by tenant

3. Supabase RLS Policies
   └─> Double-check tenant isolation
   └─> Prevent cross-tenant data access
```

### Security Considerations

#### Strengths
✅ Simple subdomain-based access
✅ No user credentials to manage
✅ Faster deployment for staff
✅ Automatic tenant context in all requests
✅ Database-level isolation with RLS

#### Weaknesses
⚠️  No per-staff authentication tracking
⚠️  No audit log of who made changes
⚠️  Entire staff shares same access key (subdomain)
⚠️  No password protection if subdomain leaked
⚠️  No session expiration

### Future Enhancements

If needed, can upgrade to:

**Option 1: Per-Staff Login**
```
- Each staff gets email/password
- Email + password login page
- JWT token generation
- Session management
- Individual audit trail
```

**Option 2: Hybrid Approach**
```
- Keep subdomain access (quick access)
- Add optional staff email login
- Mixed authentication methods
- Granular permissions per staff
```

**Option 3: OAuth Integration**
```
- Google/Apple login
- No password management
- Standard OAuth flow
- Better security posture
```

### Current Limitation & Workaround

**Limitation:**
- All staff on same subdomain share same access
- Cannot differentiate who made what change

**Current Workaround:**
- Tenant manually manages access
- Audit trail would show "subdomain user"
- No individual staff member tracking

### Configuration

#### Subdomain Creation Process
1. Admin creates new tenant (e.g., "hairsalon")
2. System generates subdomain: hairsalon.booqing.com
3. DNS configured to point to app
4. Middleware auto-maps subdomain to tenant_id
5. Staff can immediately access dashboard

#### Environment Variables Needed
```env
NEXT_PUBLIC_BASE_DOMAIN=booqing.com
BYPASS_AUTH_FOR_SUBDOMAIN=true
```

### Testing Staff Login

```bash
# Local development
1. Add to /etc/hosts:
   127.0.0.1 hairsalon.localhost:3000
   127.0.0.1 coffeeshop.localhost:3000

2. Visit: http://hairsalon.localhost:3000
3. Middleware intercepts & validates
4. Dashboard loads if tenant exists
```

### Debugging

If staff cannot access:

1. **Check subdomain mapping:**
   ```
   Verify subdomain exists in tenants table
   Check x-tenant-id header in request
   ```

2. **Check middleware:**
   ```
   File: middleware.ts
   Ensure subdomain parsing logic is correct
   Verify bypass condition is met
   ```

3. **Check RLS policies:**
   ```
   Supabase RLS policies enforcing tenant isolation
   Verify x-tenant-id is being passed correctly
   ```

### Related Files

```
middleware.ts              - Subdomain → tenant_id mapping
app/api/[...]/route.ts    - All API endpoints check x-tenant-id
types/booking.ts          - Booking interface
lib/booking/*             - Service layer
```

### Notes for Future Developers

⚠️ **IMPORTANT:**
- Do NOT add user authentication to staff dashboard without updating this flow
- Do NOT remove x-tenant-id validation from any API endpoint
- Always verify tenant isolation before deploying
- Test multi-tenant scenarios before production

---

**Last Updated:** 2025-01-21
**Status:** Current Implementation (Bypass Middleware Approach)
**Next Review:** When per-staff authentication is required
