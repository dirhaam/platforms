# Travel Charge - Quick Reference Guide

## The Problem (Before Fix)

```
For 3km booking:
❌ WRONG: 5000 × 3 = Rp 15,000 (or 40,000 if base=25000)
✓ CORRECT: Rp 25,000 (base charge covers 0-5km)
```

## The Solution

### UI Flow (What User Sees)

```
┌─────────────────────────────────────────┐
│ Invoice Settings → Charges Tab          │
├─────────────────────────────────────────┤
│                                         │
│ Travel Surcharge (Home Visit)  [Nonaktif]│
│                                         │
│ ☐ Travel Surcharge Wajib (Unchecked)  │
│                                         │
│ Base Travel Surcharge (Rp): _________  │
│ Per Kilometer (Rp/km): _________      │
│ Min Distance (km): _________           │
│ Max Distance (km): _________           │
│                                         │
│ [Simpan Pengaturan] (Enabled)         │
└─────────────────────────────────────────┘
```

### When User Enables

```
┌─────────────────────────────────────────┐
│ Invoice Settings → Charges Tab          │
├─────────────────────────────────────────┤
│                                         │
│ Travel Surcharge (Home Visit)  [Aktif]  │
│                                         │
│ ☑ Travel Surcharge Wajib (Checked)    │
│                                         │
│ Base Travel Surcharge (Rp): 25000     │
│ Per Kilometer (Rp/km): 5000           │
│ Min Distance (km): _________ (EMPTY)  │
│ Max Distance (km): _________ (EMPTY)  │
│                                         │
│ ⚠️ Konfigurasi Tidak Lengkap           │
│ • Min Distance belum diisi             │
│                                         │
│ [Simpan Pengaturan] (DISABLED)        │
└─────────────────────────────────────────┘
```

### When User Completes Setup

```
┌─────────────────────────────────────────┐
│ Invoice Settings → Charges Tab          │
├─────────────────────────────────────────┤
│                                         │
│ Travel Surcharge (Home Visit)  [Aktif]  │
│                                         │
│ ☑ Travel Surcharge Wajib (Checked)    │
│                                         │
│ Base Travel Surcharge (Rp): 25000     │
│ Per Kilometer (Rp/km): 5000           │
│ Min Distance (km): 5                  │
│ Max Distance (km): 50                 │
│                                         │
│ Example Calculations:                 │
│ • 3km: Rp 25,000 (dalam base)        │
│ • 5km: Rp 25,000 (masih dalam base)  │
│ • 7km: Rp 35,000 (base + 2km excess) │
│ • 10km: Rp 50,000 (base + 5km excess)│
│                                         │
│ [Simpan Pengaturan] (ENABLED) ✓       │
└─────────────────────────────────────────┘
```

## Calculation Examples

### Configuration: base=25000, perKm=5000, minDist=5

```
Distance  │  Formula                    │  Result
──────────┼─────────────────────────────┼──────────────
0 km      │  base (0 ≤ 5)               │  Rp 25,000
1 km      │  base (1 ≤ 5)               │  Rp 25,000
3 km      │  base (3 ≤ 5)               │  Rp 25,000  ← The problem case
5 km      │  base (5 ≤ 5)               │  Rp 25,000
6 km      │  base + (1 × 5k)            │  Rp 30,000
7 km      │  base + (2 × 5k)            │  Rp 35,000
10 km     │  base + (5 × 5k)            │  Rp 50,000
15 km     │  base + (10 × 5k)           │  Rp 75,000
```

### What Was Wrong Before Fix

```
If minTravelDistance = undefined (not filled):
  ↓ (defaults to 0)
  ↓
  For 3km: surcharge = 25000 + (3 × 5000) = Rp 40,000  ❌

The Fix:
  ↓
  UI prevents saving without filling minTravelDistance
  ↓
  For 3km: surcharge = 25000 (because 3 ≤ 5)  ✓
```

## Decision Tree

```
                    ┌─ Disable Travel Surcharge
                    │  └─ Can save anytime
                    │
User at Settings ───┤
                    │
                    └─ Enable Travel Surcharge
                       └─ Fill all fields?
                          ├─ NO  → Warning shows
                          │       → Save disabled
                          │       → User sees what's missing
                          │
                          └─ YES → Warning gone
                                  → Save enabled
                                  → Can proceed
```

## Configuration Validation Rules

| Condition | Status | Save | Warning |
|-----------|--------|------|---------|
| Travel Surcharge = Disabled | ✓ Valid | ✓ Enabled | None |
| Travel Surcharge = Enabled + All filled | ✓ Valid | ✓ Enabled | None |
| Travel Surcharge = Enabled + Base missing | ❌ Invalid | ✗ Disabled | "Base harus diisi" |
| Travel Surcharge = Enabled + MinDist missing | ❌ Invalid | ✗ Disabled | "MinDist harus diisi" |
| Travel Surcharge = Enabled + Both missing | ❌ Invalid | ✗ Disabled | Both errors shown |

## Key Fields Explained

### Base Travel Surcharge (Rp)
```
The flat charge for ANY home visit
Example: 25000 means Rp 25,000 for ANY distance 0-5km

REQUIRED when feature enabled
```

### Per Kilometer (Rp/km)
```
Additional charge PER KM beyond minTravelDistance
Example: 5000 means Rp 5,000 extra for each km over the minimum

REQUIRED when feature enabled
```

### Min Distance (km) - Covered by Base
```
The distance zone covered by the base charge
Example: 5 means base charge covers 0-5km

Any distance ≤ this gets base charge only
Any distance > this gets base + (excess × perKm)

REQUIRED when feature enabled
⚠️ This was the missing piece causing the bug
```

### Max Distance (km) - Optional
```
Maximum service radius
Example: 50 means can't book beyond 50km

OPTIONAL - leave blank if no limit
```

## Testing Scenarios

### Scenario 1: Initial Setup
```
Step 1: Open Settings → Charges
Result: Travel Surcharge shows [Nonaktif]
Step 2: All fields empty
Result: Save button enabled (no changes yet)
Status: ✓ PASS
```

### Scenario 2: Enable Without Filling
```
Step 1: Check "Travel Surcharge Wajib"
Step 2: Leave fields empty
Step 3: Try to Save
Result: Warning appears + Save disabled
Status: ✓ PASS (prevented incomplete config)
```

### Scenario 3: Partial Fill
```
Step 1: Check "Travel Surcharge Wajib"
Step 2: Enter Base = 25000
Step 3: Leave MinDist empty
Step 4: Try to Save
Result: Warning shows "MinDist belum diisi" + Save disabled
Status: ✓ PASS
```

### Scenario 4: Complete Setup
```
Step 1: Check "Travel Surcharge Wajib"
Step 2: Enter Base = 25000
Step 3: Enter PerKm = 5000
Step 4: Enter MinDist = 5
Step 5: Save
Result: Status shows [Aktif], no warning, save succeeds
Status: ✓ PASS
```

### Scenario 5: Later Disable
```
Step 1: Feature currently enabled + configured
Step 2: Uncheck "Travel Surcharge Wajib"
Step 3: Warning gone, Save enabled
Step 4: Save
Result: Status shows [Nonaktif]
Status: ✓ PASS
```

## Common Mistakes Prevented

### ❌ Before: Enable without setup
```
User: "Let me just enable travel surcharge"
Action: Check box, click save
Result: Travel surcharge broken in all new bookings ❌
```

### ✓ After: UI guides user
```
User: "Let me just enable travel surcharge"
Action: Check box
Result: ⚠️ Warning appears immediately
Message: "Base Travel Surcharge belum diisi"
Action: Fill required fields
Result: Save becomes enabled
Outcome: User sets up correctly ✓
```

## For Different Tenant Models

### Model A: Fixed Base Rate
```
Base: 25000 (covers 0-5km)
PerKm: 5000 (each km beyond 5km)
MinDist: 5

→ Good for salons with standard zones
```

### Model B: Pure Per-KM (No Base)
```
Base: 10000 (flag rate)
PerKm: 5000
MinDist: 0 (charge per km from start)

→ 3km = 10k + (3×5k) = 25k
→ Good for delivery-style services
```

### Model C: Very Limited Service Area
```
Base: 30000 (covers 0-3km)
PerKm: 10000 (expensive beyond 3km)
MinDist: 3

→ 2km = 30k
→ 5km = 30k + (2×10k) = 50k
→ Good for limited radius services
```

## Files to Reference

- **Full Setup Guide:** `TRAVEL_CHARGE_SETUP_GUIDE.md`
- **Technical Details:** `TRAVEL_CHARGE_VALIDATION_FIX.md`
- **Inspection Results:** `TRAVEL_CHARGE_INSPECTION_RESULT.md`
- **Code Changes:** Commit `feb7ccc`

## Support Questions

**Q: What if I don't want travel surcharge?**
A: Leave "Travel Surcharge Wajib" unchecked. Feature is disabled by default.

**Q: What if existing bookings have wrong surcharge?**
A: They keep their value. New bookings will use correct calculation.

**Q: Can minTravelDistance be 0?**
A: Yes! Means charge per-km from start (no base coverage zone).

**Q: What happens after I save configuration?**
A: New home visit bookings will automatically calculate correct surcharge.

**Q: Can I change configuration later?**
A: Yes! It affects all NEW bookings only. Existing ones stay unchanged.
