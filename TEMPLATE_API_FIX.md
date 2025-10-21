# Landing Page Template API Fix

## Issue

Browser console showed 404 and 400 errors when trying to fetch template settings:
```
GET https://test-demo.booqing.my.id/api/tenant/settings/template 404 (Not Found)
POST https://test-demo.booqing.my.id/api/tenant/settings/template 400 (Bad Request)
```

## Root Cause

The template API endpoint was expecting tenant ID from custom headers (`x-tenant-id`), but:

1. **Browser Security:** Browsers cannot send custom headers in client-side fetch requests from cross-origin or subdomain requests
2. **Subdomain Routing:** The middleware uses subdomain-based routing (e.g., `test-demo.booqing.my.id`), but doesn't automatically pass subdomain context to API routes
3. **Tenant Isolation:** Each subdomain needs to identify its tenant context to the API

## Solution

Updated API endpoints to accept tenant ID from **query parameters** instead of just headers.

### Changes Made

#### 1. API Route Handler (`app/api/tenant/settings/template/route.ts`)

**Before:**
```typescript
export async function POST(request: NextRequest) {
  const headerTenantId = request.headers.get('x-tenant-id');
  if (!headerTenantId) {
    return NextResponse.json({ error: 'Tenant ID required' }, { status: 400 });
  }
  // ... use headerTenantId
}
```

**After:**
```typescript
export async function POST(request: NextRequest) {
  // Get tenant ID from header, query params, or body
  let tenantId = request.headers.get('x-tenant-id');
  
  if (!tenantId) {
    const url = new URL(request.url);
    tenantId = url.searchParams.get('subdomain') || url.searchParams.get('tenant');
  }

  if (!tenantId) {
    return NextResponse.json({ error: 'Tenant ID required' }, { status: 400 });
  }
  // ... use tenantId
}
```

**Same changes applied to GET handler**

#### 2. Component (`components/tenant/LandingPageStyleSettings.tsx`)

**Before:**
```typescript
const response = await fetch('/api/tenant/settings/template', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-tenant-id': subdomain  // ❌ Browser doesn't send custom headers
  },
  body: JSON.stringify({ template: selectedTemplate })
});
```

**After:**
```typescript
const url = new URL('/api/tenant/settings/template', window.location.origin);
url.searchParams.set('subdomain', subdomain);  // ✅ Query param

const response = await fetch(url.toString(), {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',  // Standard headers only
  },
  body: JSON.stringify({ template: selectedTemplate })
});
```

#### 3. Settings Page (`app/tenant/admin/settings/content.tsx`)

**Before:**
```typescript
const response = await fetch('/api/tenant/settings/template', {
  headers: {
    'x-tenant-id': subdomain!
  }
});
```

**After:**
```typescript
const url = new URL('/api/tenant/settings/template', window.location.origin);
url.searchParams.set('subdomain', subdomain!);

const response = await fetch(url.toString());
```

---

## API Endpoint Behavior

### Updated Endpoint
```
GET|POST /api/tenant/settings/template
```

### Supported Tenant ID Sources (in order of precedence)

1. **Custom Header** (for server-to-server calls):
   ```
   x-tenant-id: test-demo
   x-tenant-id: a1b2c3d4-e5f6-7890-abcd-ef1234567890
   ```

2. **Query Parameter - Subdomain**:
   ```
   /api/tenant/settings/template?subdomain=test-demo
   ```

3. **Query Parameter - Tenant ID**:
   ```
   /api/tenant/settings/template?tenant=a1b2c3d4-e5f6-7890-abcd-ef1234567890
   ```

### ID Resolution

The endpoint accepts both:
- **Subdomain** (string): Automatically looks up UUID in database
- **UUID** (36-char string): Directly used for database query

### Example Requests

**Fetch current template (client-side):**
```javascript
const url = new URL('/api/tenant/settings/template', window.location.origin);
url.searchParams.set('subdomain', 'test-demo');
const response = await fetch(url.toString());
const { template } = await response.json();
// Returns: { template: 'modern' | 'classic' | 'minimal' | 'beauty' | 'healthcare' }
```

**Update template (client-side):**
```javascript
const url = new URL('/api/tenant/settings/template', window.location.origin);
url.searchParams.set('subdomain', 'test-demo');
const response = await fetch(url.toString(), {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ template: 'beauty' })
});
// Returns: { success: true, message: '...', template: 'beauty' }
```

**From backend/Postman (using header):**
```bash
curl -X GET \
  'https://test-demo.booqing.my.id/api/tenant/settings/template' \
  -H 'x-tenant-id: test-demo'
```

---

## Request Flow

### GET Template (Client)

```
1. Settings Page Loads
   ↓
2. fetchCurrentTemplate() in useEffect
   ↓
3. Build URL with query param:
   /api/tenant/settings/template?subdomain=test-demo
   ↓
4. fetch(url) - no custom headers
   ↓
5. Middleware routes to handler
   ↓
6. Handler extracts subdomain from query param
   ↓
7. Lookup tenant UUID from subdomain
   ↓
8. Query database for template_id
   ↓
9. Return: { template: 'modern' }
```

### POST Template (Client)

```
1. User selects new template
   ↓
2. handleSaveTemplate() onClick
   ↓
3. Build URL with query param:
   /api/tenant/settings/template?subdomain=test-demo
   ↓
4. fetch(url, { method: 'POST', body: { template: 'beauty' } })
   ↓
5. Middleware routes to handler
   ↓
6. Handler extracts subdomain from query param
   ↓
7. Lookup tenant UUID from subdomain
   ↓
8. Update database: tenants.template_id = 'beauty'
   ↓
9. Return: { success: true, template: 'beauty' }
   ↓
10. UI updates, user sees success toast
```

---

## Why This Approach

### Query Parameters Advantages
✅ Works in all contexts (browser, server, tools)  
✅ Standard HTTP practice for resource identification  
✅ Browser security compatible  
✅ No CORS issues  
✅ Visible in logs for debugging  

### Headers Limitations
❌ Custom headers limited in browser (CORS)  
❌ Preflight requests can block them  
❌ Not standard for resource identification  

---

## Error Handling

### Missing Tenant ID
```
Status: 400
Response: { error: 'Tenant ID required' }
```

### Tenant Not Found
```
Status: 404
Response: { error: 'Tenant not found' }
```

### Invalid Template Value
```
Status: 400
Response: { error: 'Invalid template. Must be one of: modern, classic, minimal, beauty, healthcare' }
```

### Database Update Failed
```
Status: 400
Response: { error: 'Failed to update template' }
```

### Server Error
```
Status: 500
Response: { error: 'Internal server error' }
```

---

## Testing

### Manual Testing Steps

1. **Login to tenant admin**
   ```
   https://test-demo.booqing.my.id/tenant/admin/settings?subdomain=test-demo
   ```

2. **Open browser DevTools** (F12)
   - Network tab
   - Go to Settings section

3. **Watch the requests**
   ```
   GET /api/tenant/settings/template?subdomain=test-demo
   Status: 200
   Response: { template: "modern" }
   ```

4. **Select new template**
   - Click Beauty template card
   - Click "Save Style"

5. **Watch POST request**
   ```
   POST /api/tenant/settings/template?subdomain=test-demo
   Status: 200
   Response: { success: true, template: "beauty" }
   ```

6. **Verify live site changes**
   - Click "Preview Live"
   - New template should be visible

### cURL Testing

```bash
# Get current template
curl -X GET \
  'https://test-demo.booqing.my.id/api/tenant/settings/template?subdomain=test-demo'

# Update template
curl -X POST \
  'https://test-demo.booqing.my.id/api/tenant/settings/template?subdomain=test-demo' \
  -H 'Content-Type: application/json' \
  -d '{ "template": "beauty" }'
```

---

## Commit Information

- **Commit:** `7c93246`
- **Message:** "fix: update template API to accept query parameters for subdomain routing"
- **Files Modified:** 3
  - `app/api/tenant/settings/template/route.ts`
  - `components/tenant/LandingPageStyleSettings.tsx`
  - `app/tenant/admin/settings/content.tsx`

---

## Related Issues Fixed

✅ 404 Not Found on GET `/api/tenant/settings/template`  
✅ 400 Bad Request on POST `/api/tenant/settings/template`  
✅ "Tenant ID required" errors  
✅ Template selector not loading  
✅ Save template button not working  

---

## Future Improvements

1. **Authentication Tokens** - Instead of passing subdomain, use JWT token
2. **Session Context** - Store tenant context in session/cookie
3. **Shared Middleware** - Create middleware to inject tenant context
4. **API Helpers** - Create reusable fetch helpers with tenant context

---

## References

- **Next.js API Routes:** https://nextjs.org/docs/app/building-your-application/routing/route-handlers
- **Browser CORS:** https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS
- **Query Parameters vs Headers:** https://restfulapi.net/resource-identification-and-location/
