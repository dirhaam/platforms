# Template Structure Analysis & Comparison

## MinimalTemplate - Complete Reference Structure ✅

MinimalTemplate contains all comprehensive sections. This is the **golden standard** for landing page structure.

### Complete Section List:
1. ✅ **Sticky Header** - Brand logo, business hours status, Book Now button
2. ✅ **Hero Section** - Main title, category, description, features list, CTA buttons, quick info
3. ✅ **Services Section** - Services grouped by category (up to 6 per category), with:
   - Service name
   - Home visit indicator
   - Duration & price
   - Description
   - Book link
4. ✅ **Testimonials Section** - 3-5 client testimonials with 5-star ratings
5. ✅ **Contact Section** - 4 contact cards:
   - Phone (clickable tel link)
   - Email (clickable mailto link)
   - Address (Google Maps link)
   - Today's Hours
6. ✅ **Business Hours Grid** - All 7 days visible in grid format
7. ✅ **FAQ Section** - Expandable Q&A with 4+ common questions
8. ✅ **Newsletter Section** - Email subscription call-to-action
9. ✅ **Videos Section** - Integrated video display (inline, no separate header)
10. ✅ **Social Media Section** - Social links display (icons)
11. ✅ **Photo Gallery Section** - Photo gallery from database
12. ✅ **Footer** - 
    - Brand info (logo, name, category, description)
    - Quick links (Services, Book, Contact, Hours)
    - Contact info (phone, email, address)
    - Copyright & admin portal link

---

## Template Comparison Matrix

| Section | Minimal | Modern | Classic | Beauty | Healthcare | HealthcareV2 |
|---------|---------|--------|---------|--------|-------------|--------------|
| Sticky Header | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| Hero Section | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| Services | ✅ | ✅ | ✅ | ⚠️ Limited | ✅ | ⚠️ Limited |
| Testimonials | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Contact Section | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| Business Hours Grid | ✅ | ✅ | ✅ | ❌ | ✅ | ⚠️ |
| FAQ Section | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Newsletter | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Videos | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Social Media | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Photo Gallery | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Footer | ✅ | ✅ | ✅ | ⚠️ Minimal | ✅ | ⚠️ Minimal |

---

## Detailed Gaps Per Template

### ModernTemplate ❌ Missing:
- ❌ Testimonials Section
- ❌ FAQ Section
- ❌ Newsletter Section
- ❌ Business Hours Grid (should have)

### ClassicTemplate ❌ Missing:
- ❌ Testimonials Section
- ❌ FAQ Section
- ❌ Newsletter Section
- ⚠️ Contact Section (simplified version)
- ⚠️ Business Hours Grid (needs enhancement)

### BeautyTemplate ❌ Missing:
- ❌ Testimonials Section
- ❌ FAQ Section
- ❌ Newsletter Section
- ❌ Business Hours Grid (critical gap)
- ⚠️ Service listings (too minimal)
- ⚠️ Contact Section (incomplete)
- ⚠️ Footer (very minimal)

### HealthcareTemplate ❌ Missing:
- ❌ Testimonials Section
- ❌ FAQ Section
- ❌ Newsletter Section

### HealthcareV2Template ❌ Missing:
- ❌ Sticky Header
- ❌ Complete Hero Section
- ❌ Testimonials Section
- ❌ FAQ Section
- ❌ Newsletter Section
- ❌ Contact Section (critical gap)
- ⚠️ Business Hours Grid (incomplete)
- ⚠️ Services (too minimal)
- ⚠️ Footer (minimal)

---

## Key Components to Add

### 1. Testimonials Section (Template Code)
```typescript
// Sample testimonials with 5-star ratings
const testimonials = [
  {
    name: 'Sarah Johnson',
    role: 'Client',
    text: 'Outstanding service! Professional, on-time, and exactly what I needed.',
    rating: 5
  },
  // ... more testimonials
];

// Render with stars, name, role
```

### 2. FAQ Section (Template Code)
```typescript
// Expandable Q&A
const faqItems = [
  {
    question: 'How do I book an appointment?',
    answer: 'Click the Book button to select your service, date, and time.'
  },
  // ... more FAQs
];

// Render with expand/collapse toggle
```

### 3. Newsletter Section (Template Code)
```typescript
// Email subscription signup
<input type="email" placeholder="Enter your email" />
<Button>Subscribe</Button>
```

### 4. Business Hours Grid (Template Code)
```typescript
// Show all 7 days in grid format
Object.entries(businessHours).map(([day, hours]) => (
  <div>
    <p>{day}</p>
    <p>{hours.isOpen ? `${hours.openTime} - ${hours.closeTime}` : 'Closed'}</p>
  </div>
))
```

### 5. Enhanced Contact Section (Template Code)
```typescript
// 4 contact cards: Phone, Email, Address, Hours (Today)
// Each clickable (tel:, mailto:, Google Maps, info)
```

### 6. Enhanced Footer (Template Code)
```typescript
// 3-column footer:
// - Brand info + description
// - Quick links (Services, Book, Contact, Hours)
// - Contact info (phone, email, address)
// - Copyright + admin link
```

---

## Implementation Roadmap

### Phase 1: Critical Gaps (Highest Priority)
1. **BeautyTemplate** - Add: Hours Grid, Contact Section, Testimonials, FAQ, Newsletter
2. **HealthcareV2Template** - Add: ALL missing sections (most complete overhaul)

### Phase 2: High Priority
3. **ClassicTemplate** - Add: Testimonials, FAQ, Newsletter
4. **HealthcareTemplate** - Add: Testimonials, FAQ, Newsletter

### Phase 3: Medium Priority
5. **ModernTemplate** - Add: Testimonials, FAQ, Newsletter

---

## File Paths to Update

```
components/subdomain/templates/
├── MinimalTemplate.tsx ✅ (REFERENCE - DO NOT MODIFY)
├── ModernTemplate.tsx ❌ (Update: Add missing sections)
├── ClassicTemplate.tsx ❌ (Update: Add missing sections)
├── BeautyTemplate.tsx ❌ (Update: Add missing sections)
├── HealthcareTemplate.tsx ❌ (Update: Add missing sections)
├── HealthcareV2Template.tsx ❌ (Update: Add missing sections)
├── MinimalTemplate-v1.tsx ⚠️ (Old version - verify if needed)
└── ModernTemplate-old.tsx ⚠️ (Old version - verify if needed)
```

---

## Testing Checklist

After updating each template, verify:
- [ ] All sections render without errors
- [ ] Responsive design works (mobile, tablet, desktop)
- [ ] Brand colors apply correctly
- [ ] Booking dialog opens from all CTA buttons
- [ ] Links work (phone, email, maps, etc.)
- [ ] Videos, social media, galleries display
- [ ] Footer links work
- [ ] Testimonials and FAQ display properly
- [ ] Newsletter subscription works
- [ ] Business hours display all 7 days correctly

---

## Notes

- MinimalTemplate uses clean, modern design with excellent UX
- All templates should support the same data structure
- Maintain design consistency across templates while preserving unique styles
- Each template's unique style should be preserved (color schemes, layout variations)
- Core content sections should be identical across all templates
