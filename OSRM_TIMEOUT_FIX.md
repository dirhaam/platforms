# OSRM API Timeout Fix

## 🔧 Problem: OSRM Request Timeout

### **Error:**
```
GET https://router.project-osrm.org/route/v1/driving/... net::ERR_TIMED_OUT
[RouteMiniMap] Failed to fetch OSRM route, using fallback: TypeError: Failed to fetch
```

### **Penyebab:**
- Public OSRM service lambat/overloaded
- Fetch request tidak punya timeout → hang forever
- Mini-map menjadi blank/tidak responsive

---

## ✅ Solusi: Add Fetch Timeout + Fallback

### **Implementation:**

```typescript
// BEFORE: No timeout
const response = await fetch(osrmUrl);

// AFTER: 5 second timeout with AbortController
const controller = new AbortController();
const timeoutId = setTimeout(() => controller.abort(), 5000);  // 5s timeout

const response = await fetch(osrmUrl, { 
  signal: controller.signal 
});
clearTimeout(timeoutId);
```

### **Cara Kerja:**

1. **Request start**
   - Set timeout 5 detik
   - Start OSRM fetch

2. **Scenario A: Request berhasil dalam 5 detik**
   - Response received
   - Clear timeout
   - Draw actual road route
   - ✅ Map shows accurate route

3. **Scenario B: Request timeout setelah 5 detik**
   - AbortController.abort() triggered
   - Fetch error caught
   - Fallback ke straight line
   - ✅ Map shows straight dashed line (still functional!)

---

## ⚡ Benefits

✅ **No Hanging** - Map won't be stuck loading forever
✅ **Graceful Degradation** - Still shows map with straight line
✅ **Fast Fallback** - User sees something in 5 seconds max
✅ **Better UX** - Responsive interface

---

## 📊 Behavior Matrix

| Scenario | OSRM Status | Timeout | Result |
|----------|----------|---------|--------|
| ✅ Fast OSRM | Responds < 5s | N/A | Actual road route |
| ⚠️ Slow OSRM | Responds 5-30s | Triggered | Straight line (fallback) |
| ❌ OSRM Down | No response | Triggered | Straight line (fallback) |
| ❌ Network Error | Connection fail | Triggered | Straight line (fallback) |

---

## 🧪 Testing

### **To verify timeout works:**

1. Open Home Visit menu ✓
2. Expand booking ✓
3. Mini-map should load within 5 seconds ✓
   - If OSRM responds: see actual road route
   - If OSRM slow/down: see straight dashed line
4. Map should be interactive ✓

---

## 🔄 Fallback Chain

```
Priority 1: Stored route (fastest)
    ↓
Priority 2: Fetch from OSRM (5 second timeout)
    ↓ (if timeout/error)
    
Priority 3: Straight line with dashes (instant)
    ↓
Display in mini-map
```

---

## 🚀 Future Improvements

### **Option 1: Backend Route Caching**
```
During booking creation:
1. Calculate travel on backend
2. Store route coordinates
3. Mini-map uses stored route (no fetch needed)
✅ Fastest, most reliable
```

### **Option 2: Alternative Routing Service**
```
If OSRM keeps timing out:
- Try MapBox (paid but reliable)
- Try Google Directions API (paid but reliable)
- Self-hosted OSRM (expensive but works)
```

### **Option 3: Progressive Loading**
```
User sees:
1. Map with markers immediately
2. Straight line while route loading
3. Actual route when ready (or timeout after 5s)
```

---

## 📝 Code Changes

### **File: components/location/RouteMiniMap.tsx**

```typescript
// Added AbortController for timeout
const controller = new AbortController();
const timeoutId = setTimeout(() => controller.abort(), 5000);

const response = await fetch(
  osrmUrl,
  { signal: controller.signal }  // ← AbortSignal added
);

clearTimeout(timeoutId);  // Clear timeout if successful
```

---

## ✨ User Experience

### **Before:**
```
User expands mini-map
    ↓
Waiting... waiting... waiting... (stuck for 30 seconds or more)
    ↓
Map shows error or blank
    ↗ User frustrated
```

### **After:**
```
User expands mini-map
    ↓
Waiting 1-2 seconds
    ↓
Route appears (actual road OR straight line)
    ↓
Map is interactive
    ↗ User happy
```

---

## 🔍 Troubleshooting

### **If still showing straight line:**
- Check browser console: 
  - "Failed to fetch OSRM" = timeout triggered (correct!)
  - Other error = different issue
- Wait a moment for map to load
- Refresh page and try again

### **If OSRM keeps failing:**
- Check internet connection
- Try different location (maybe coordinate is invalid)
- OSRM service might be down (try https://demo.project-osrm.org/ to verify)

---

**Status:** ✅ Timeout added | ✅ Graceful fallback | ✅ Ready to deploy!
