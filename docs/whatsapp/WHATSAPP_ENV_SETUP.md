# WhatsApp Environment Configuration

## Format

`WHATSAPP_ENDPOINTS` adalah JSON array yang di-stringify menjadi environment variable.

```env
WHATSAPP_ENDPOINTS=[{"name":"Primary","apiUrl":"https://...","apiKey":"..."}]
```

---

## Setup untuk Berbagai Environment

### 1. Development (`.env.local`)

```env
# Minimal - 1 endpoint
WHATSAPP_ENDPOINTS=[{"name":"Primary","apiUrl":"https://api.whatsapp-dev.com","apiKey":"YOUR_DEV_API_KEY"}]
```

### 2. Production (Docker/Vercel)

#### Format Compact (Single Line)
```env
WHATSAPP_ENDPOINTS=[{"name":"Primary","apiUrl":"https://api.whatsapp.com","apiKey":"YOUR_PROD_API_KEY_1"},{"name":"Secondary","apiUrl":"https://api2.whatsapp.com","apiKey":"YOUR_PROD_API_KEY_2"}]
```

#### Format Readable (dengan newline escape)
```env
WHATSAPP_ENDPOINTS=[
  {"name":"Primary","apiUrl":"https://api.whatsapp.com","apiKey":"YOUR_PROD_API_KEY_1"},
  {"name":"Secondary","apiUrl":"https://api2.whatsapp.com","apiKey":"YOUR_PROD_API_KEY_2"}
]
```

---

## Setup di Berbagai Platform

### Vercel (Production)

1. **Dashboard → Settings → Environment Variables**
2. **Add New Variable:**
   - **Name:** `WHATSAPP_ENDPOINTS`
   - **Value:** (paste satu baris)
   ```
   [{"name":"Primary","apiUrl":"https://api.whatsapp.com","apiKey":"your_key"}]
   ```
   - **Environments:** Select Production
   - **Save**

3. **Redeploy** untuk apply changes

### Docker

```dockerfile
ENV WHATSAPP_ENDPOINTS='[{"name":"Primary","apiUrl":"https://api.whatsapp.com","apiKey":"your_key"}]'
```

### Docker Compose

```yaml
services:
  app:
    image: booqing:latest
    environment:
      WHATSAPP_ENDPOINTS: '[{"name":"Primary","apiUrl":"https://api.whatsapp.com","apiKey":"your_key"}]'
```

### Kubernetes

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: app-config
data:
  WHATSAPP_ENDPOINTS: |
    [
      {"name":"Primary","apiUrl":"https://api.whatsapp.com","apiKey":"your_key"},
      {"name":"Secondary","apiUrl":"https://api2.whatsapp.com","apiKey":"your_key_2"}
    ]
```

Or as secret:

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: whatsapp-config
type: Opaque
stringData:
  WHATSAPP_ENDPOINTS: '[{"name":"Primary","apiUrl":"https://api.whatsapp.com","apiKey":"your_key"}]'
```

### AWS Lambda (via Secrets Manager - Recommended)

```python
import json
import boto3

secrets_client = boto3.client('secretsmanager')

def get_whatsapp_endpoints():
    response = secrets_client.get_secret_value(
        SecretId='whatsapp/endpoints'
    )
    return json.loads(response['SecretString'])
```

Store in Secrets Manager:
```json
{
  "WHATSAPP_ENDPOINTS": "[{\"name\":\"Primary\",\"apiUrl\":\"https://...\",\"apiKey\":\"...\"}]"
}
```

### AWS RDS Environment Manager

```bash
aws secretsmanager create-secret \
  --name whatsapp/endpoints \
  --secret-string '[{"name":"Primary","apiUrl":"https://api.whatsapp.com","apiKey":"prod_key"}]'
```

---

## Multi-Endpoint Examples

### Load Balancing (3 Endpoints)

```env
WHATSAPP_ENDPOINTS=[{"name":"Primary","apiUrl":"https://api1.whatsapp.com","apiKey":"key1"},{"name":"Secondary","apiUrl":"https://api2.whatsapp.com","apiKey":"key2"},{"name":"Tertiary","apiUrl":"https://api3.whatsapp.com","apiKey":"key3"}]
```

### Multi-Region (4 Endpoints)

```env
WHATSAPP_ENDPOINTS=[{"name":"Asia-SG","apiUrl":"https://sg.whatsapp.com","apiKey":"key_sg"},{"name":"Asia-ID","apiUrl":"https://id.whatsapp.com","apiKey":"key_id"},{"name":"EU-UK","apiUrl":"https://uk.whatsapp.com","apiKey":"key_uk"},{"name":"US-East","apiUrl":"https://us.whatsapp.com","apiKey":"key_us"}]
```

### Dev/Staging/Prod

Buat 3 `.env` files:

**`.env.development`**
```env
WHATSAPP_ENDPOINTS=[{"name":"Dev","apiUrl":"https://api-dev.whatsapp.com","apiKey":"dev_key"}]
```

**`.env.staging`**
```env
WHATSAPP_ENDPOINTS=[{"name":"Staging","apiUrl":"https://api-staging.whatsapp.com","apiKey":"staging_key"}]
```

**`.env.production`**
```env
WHATSAPP_ENDPOINTS=[{"name":"Prod-1","apiUrl":"https://api1.whatsapp.com","apiKey":"prod_key_1"},{"name":"Prod-2","apiUrl":"https://api2.whatsapp.com","apiKey":"prod_key_2"}]
```

---

## JSON Validation

Pastikan JSON valid sebelum set ENV:

### Online Validator
- https://jsonlint.com
- https://www.json-lint.com

### Command Line
```bash
# Linux/Mac
echo '[{"name":"Primary","apiUrl":"https://api.whatsapp.com","apiKey":"key"}]' | jq .

# Windows PowerShell
'[{"name":"Primary","apiUrl":"https://api.whatsapp.com","apiKey":"key"}]' | ConvertFrom-Json | ConvertTo-Json
```

### Node.js Test
```javascript
const endpoints = JSON.parse(process.env.WHATSAPP_ENDPOINTS);
console.log('Valid JSON:', endpoints);
```

---

## Escaping Special Characters

Jika ada karakter spesial dalam API key:

### Dengan Backslash
```env
WHATSAPP_ENDPOINTS=[{"name":"Primary","apiUrl":"https://api.whatsapp.com","apiKey":"key\$with\$dollar"}]
```

### Dengan URL Encoding
```env
WHATSAPP_ENDPOINTS=[{"name":"Primary","apiUrl":"https://api.whatsapp.com","apiKey":"key%24with%24dollar"}]
```

### Dengan Quotes (Double/Single)
```env
# Single quotes di luar
WHATSAPP_ENDPOINTS='[{"name":"Primary","apiUrl":"https://api.whatsapp.com","apiKey":"key\"with\"quote"}]'
```

---

## Troubleshooting

### Error: "Invalid JSON"
**Cause:** JSON malformed
**Fix:** 
- Validate dengan online validator
- Check semua quotes adalah double `"`
- Tidak ada trailing comma di array

### Error: "Expected string, got number"
**Cause:** Value tidak quoted
**Fix:**
```javascript
// ❌ WRONG
{"name":Primary}

// ✅ RIGHT
{"name":"Primary"}
```

### Error: "Endpoints not loading"
**Cause:** ENV variable tidak set
**Fix:**
1. Check `.env` file exists
2. Run `echo $WHATSAPP_ENDPOINTS` (Linux/Mac) atau `echo %WHATSAPP_ENDPOINTS%` (Windows)
3. Restart server after changing ENV

### Endpoints showing in logs with credentials
**Cause:** Logging sensitive data
**Fix:**
```javascript
// ❌ WRONG
console.log('Endpoints:', process.env.WHATSAPP_ENDPOINTS);

// ✅ RIGHT
const count = JSON.parse(process.env.WHATSAPP_ENDPOINTS || '[]').length;
console.log(`Loaded ${count} endpoints`);
```

---

## Security Checklist

- [ ] Never commit `.env` files to git
- [ ] Add `.env*` to `.gitignore`
- [ ] Use `.env.example` untuk template saja
- [ ] Rotate API keys regularly
- [ ] Never log full credentials
- [ ] Use secrets manager untuk production
- [ ] Different keys untuk dev/staging/prod
- [ ] Audit access ke ENV variables
- [ ] Monitor API usage
- [ ] Alert jika key leaked

---

## Testing Configuration

### Test Script (Node.js)

```javascript
// test-whatsapp-config.js
try {
  const endpoints = JSON.parse(process.env.WHATSAPP_ENDPOINTS || '[]');
  
  console.log('✓ Configuration loaded successfully');
  console.log(`✓ Found ${endpoints.length} endpoint(s):`);
  
  endpoints.forEach((ep, i) => {
    console.log(`  ${i + 1}. ${ep.name}`);
    console.log(`     URL: ${ep.apiUrl}`);
    console.log(`     Key: ${ep.apiKey ? '***' : 'NOT SET'}`);
  });
} catch (error) {
  console.error('✗ Configuration error:', error.message);
  process.exit(1);
}
```

Run:
```bash
node test-whatsapp-config.js
```

---

## Version History

### v1.0
- JSON array format untuk multiple endpoints
- Environment variable based configuration
- Support untuk dev/staging/production

---

## Related Files

- `.env.example` - Template dengan examples
- `lib/whatsapp/env-endpoint-manager.ts` - Parsing logic
- `WHATSAPP_INTEGRATION_GUIDE.md` - Full integration guide
