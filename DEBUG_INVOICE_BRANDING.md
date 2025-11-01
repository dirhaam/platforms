# Debug: Invoice Branding Settings Not Saving

## Checklist untuk Troubleshoot:

### 1. Verify Database Columns

Di Supabase Dashboard:
1. Go to **Table Editor**
2. Select `invoice_branding_settings` table
3. Check kolom yang ada:
   - ✓ `tenant_id`
   - ✓ `logo_url`
   - ✓ `header_text`
   - ✓ `footer_text`
   - ✓ `show_business_name` (baru)
   - ✓ `show_header_text` (baru)

Jika ada yang kurang → Run migration SQL di SQL Editor

### 2. Run Migrations (if missing)

**For show_business_name:**
```sql
ALTER TABLE invoice_branding_settings 
ADD COLUMN IF NOT EXISTS show_business_name BOOLEAN DEFAULT TRUE;
```

**For show_header_text:**
```sql
ALTER TABLE invoice_branding_settings 
ADD COLUMN IF NOT EXISTS show_header_text BOOLEAN DEFAULT TRUE;
```

### 3. Check Browser Console

1. Open DevTools (F12)
2. Go to **Console** tab
3. Try to save branding settings
4. Look for any errors

### 4. Test API Directly

Open browser console and run:
```javascript
// GET current settings
fetch('/api/settings/invoice', {
  headers: { 'x-tenant-id': 'your-tenant-id' }
}).then(r => r.json()).then(d => console.log(d))

// POST new settings
fetch('/api/settings/invoice', {
  method: 'POST',
  headers: { 
    'Content-Type': 'application/json',
    'x-tenant-id': 'your-tenant-id'
  },
  body: JSON.stringify({
    logoUrl: '',
    headerText: 'Test',
    footerText: '',
    showBusinessName: true,
    showHeaderText: false
  })
}).then(r => r.json()).then(d => console.log(d))
```

### 5. Verify Current Data in DB

Di Supabase SQL Editor:
```sql
SELECT * FROM invoice_branding_settings 
WHERE tenant_id = 'YOUR_TENANT_ID';
```

Check kalau columns show_business_name dan show_header_text ada datanya

## Common Issues:

| Issue | Solution |
|-------|----------|
| Columns not in table | Run migrations in Supabase SQL Editor |
| Unchecked becomes checked | Migration not executed properly |
| API error 400/500 | Check browser console for error message |
| Settings not persisting | Verify columns exist and can write to them |

## Next Steps:

1. Verify columns exist di table
2. Run migrations if missing
3. Refresh app
4. Try saving again
5. Check browser console for errors

Kalau masih error, screenshot error message dari console!
