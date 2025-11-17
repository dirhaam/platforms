# Template Structure Update Guide - Complete Implementation

## Status Summary

| Template | Status | Priority | Work Required |
|----------|--------|----------|----------------|
| MinimalTemplate | ✅ REFERENCE | - | None - Golden Standard |
| BeautyTemplate | ✅ COMPLETED | High | Done |
| ModernTemplate | ⏳ TODO | Medium | Add: Testimonials, FAQ, Newsletter |
| ClassicTemplate | ⏳ TODO | High | Add: Testimonials, FAQ, Newsletter |
| HealthcareTemplate | ⏳ TODO | High | Add: Testimonials, FAQ, Newsletter |
| HealthcareV2Template | ⏳ TODO | High | Complete rebuild (most complex) |

---

## What Was Added to BeautyTemplate ✅

Added these sections to match MinimalTemplate structure:
1. **Header Status** - Now shows "Open/Closed" indicator
2. **Testimonials Section** - 3-5 client reviews with 5-star ratings
3. **Business Hours Grid** - All 7 days in grid format
4. **FAQ Section** - Expandable Q&A with 4 questions
5. **Newsletter Section** - Email subscription signup
6. **Enhanced Footer** - Brand info + Quick links + Contact info (3-column layout)

---

## Template Update Code Snippets

### 1. Add Required Imports
```typescript
import { Star, ChevronRight, Clock } from 'lucide-react';

// Add state variables in component:
const [expandedFAQ, setExpandedFAQ] = useState<number | null>(0);
const [email, setEmail] = useState('');

// Add computed values:
const currentDay = new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
const todayHours = businessHours?.[currentDay];
const isOpen = todayHours?.isOpen || false;
```

### 2. Sample Data (Add to Component)
```typescript
const testimonials = [
  {
    name: 'Client Name',
    role: 'Client',
    text: 'Outstanding service! Professional and exactly what I needed.',
    rating: 5
  },
  // Add 2-3 more testimonials
];

const faqItems = [
  {
    question: 'How do I book an appointment?',
    answer: 'Click the Book button and select your service, date, and time.'
  },
  {
    question: 'Can I cancel or reschedule?',
    answer: 'Yes, up to 24 hours before your appointment.'
  },
  {
    question: 'What payment methods do you accept?',
    answer: 'We accept all major payment methods.'
  },
  {
    question: 'Do you offer home visits?',
    answer: 'Check individual services for home visit availability.'
  }
];

const stats = [
  { number: '1000+', label: 'Happy Clients' },
  { number: '4.9', label: 'Rating', sub: '/5.0' },
  { number: '10+', label: 'Years Experience' },
  { number: '500+', label: 'Services' }
];
```

### 3. Testimonials Section (Copy-Paste Ready)
```typescript
{/* Testimonials Section */}
<section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
  <div className="max-w-6xl mx-auto">
    <h2 className="text-4xl md:text-5xl font-bold text-center mb-16" style={{ color: primaryColor }}>
      Client Testimonials
    </h2>

    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
      {testimonials.map((testimonial, i) => (
        <div key={i} className="p-8 rounded-xl bg-white border border-gray-200 hover:shadow-md transition-shadow">
          <div className="flex gap-1 mb-4">
            {[...Array(testimonial.rating)].map((_, j) => (
              <Star key={j} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
            ))}
          </div>
          <p className="text-gray-700 mb-4 leading-relaxed italic">
            "{testimonial.text}"
          </p>
          <div className="pt-2 border-t border-gray-200">
            <p className="font-semibold text-gray-900">{testimonial.name}</p>
            <p className="text-xs text-gray-500">{testimonial.role}</p>
          </div>
        </div>
      ))}
    </div>
  </div>
</section>
```

### 4. Business Hours Grid Section (Copy-Paste Ready)
```typescript
{/* Business Hours Grid */}
{businessHours && (
  <section className="py-20 px-4 sm:px-6 lg:px-8 border-t border-gray-100 bg-gray-50">
    <div className="max-w-6xl mx-auto">
      <h2 className="text-4xl md:text-5xl font-bold text-center mb-12" style={{ color: primaryColor }}>
        Business Hours
      </h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Object.entries(businessHours).map(([day, hours]) => (
          <div key={day} className="p-5 rounded-xl bg-white border border-gray-200 hover:bg-gray-50 hover:shadow-md transition-all text-center">
            <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">
              {day}
            </p>
            <p className={`text-sm font-semibold ${hours.isOpen ? 'text-gray-900' : 'text-gray-400'}`}>
              {hours.isOpen ? `${hours.openTime} - ${hours.closeTime}` : 'Closed'}
            </p>
          </div>
        ))}
      </div>
    </div>
  </section>
)}
```

### 5. FAQ Section (Copy-Paste Ready)
```typescript
{/* FAQ Section */}
<section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
  <div className="max-w-4xl mx-auto">
    <h2 className="text-4xl md:text-5xl font-bold text-center mb-16" style={{ color: primaryColor }}>
      Frequently Asked Questions
    </h2>

    <div className="space-y-4">
      {faqItems.map((item, idx) => (
        <button
          key={idx}
          onClick={() => setExpandedFAQ(expandedFAQ === idx ? null : idx)}
          className="w-full text-left p-6 bg-gray-50 border border-gray-200 rounded-xl hover:border-gray-300 transition-all"
        >
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-gray-900 text-lg">{item.question}</h3>
            <div 
              className="w-6 h-6 rounded-full flex items-center justify-center transition-transform"
              style={{ 
                backgroundColor: primaryColor + '20', 
                color: primaryColor, 
                transform: expandedFAQ === idx ? 'rotate(180deg)' : 'rotate(0deg)' 
              }}
            >
              <ChevronRight className="w-4 h-4" />
            </div>
          </div>
          
          {expandedFAQ === idx && (
            <p className="mt-4 text-gray-600 leading-relaxed">
              {item.answer}
            </p>
          )}
        </button>
      ))}
    </div>
  </div>
</section>
```

### 6. Newsletter Section (Copy-Paste Ready)
```typescript
{/* Newsletter Section */}
<section className="py-20 px-4 sm:px-6 lg:px-8 border-t border-gray-100">
  <div className="max-w-2xl mx-auto text-center space-y-8">
    <div>
      <h2 className="text-4xl md:text-5xl font-bold mb-4" style={{ color: primaryColor }}>
        Stay Updated
      </h2>
      <p className="text-gray-600 text-lg">
        Get special offers and updates delivered to your inbox
      </p>
    </div>

    <div className="flex gap-2 flex-col sm:flex-row">
      <input
        type="email"
        placeholder="Enter your email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="flex-1 px-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2"
        style={{ focusRingColor: primaryColor + '30' } as any}
      />
      <Button 
        onClick={() => {
          if (email) {
            // Handle newsletter signup
            setEmail('');
          }
        }}
        style={{ backgroundColor: primaryColor }}
        className="text-white hover:opacity-90 transition-opacity"
      >
        Subscribe
      </Button>
    </div>
  </div>
</section>
```

### 7. Enhanced Footer (Copy-Paste Ready)
```typescript
{/* Footer */}
<footer className="py-16 px-4 sm:px-6 lg:px-8 bg-gray-50 border-t border-gray-100">
  <div className="max-w-7xl mx-auto">
    <div className="grid md:grid-cols-3 gap-12 mb-8">
      {/* Brand Info */}
      <div>
        <div className="flex items-center gap-3 mb-4">
          {tenant.logo && (
            <img src={tenant.logo} alt={tenant.businessName} className="h-8 w-8 rounded object-cover" />
          )}
          <div>
            <p className="font-semibold text-gray-900">{tenant.businessName}</p>
            <p className="text-xs text-gray-500">{tenant.businessCategory}</p>
          </div>
        </div>
        {tenant.businessDescription && (
          <p className="text-sm text-gray-600 max-w-xs">
            {tenant.businessDescription}
          </p>
        )}
      </div>

      {/* Quick Links */}
      <div>
        <h4 className="font-semibold text-gray-900 mb-4">Quick Links</h4>
        <ul className="space-y-2 text-sm text-gray-600">
          <li><button onClick={() => document.getElementById('services')?.scrollIntoView({ behavior: 'smooth' })} className="hover:text-gray-900">Services</button></li>
          <li><button onClick={() => handleBookService()} className="hover:text-gray-900">Book Appointment</button></li>
          <li><a href="#contact" className="hover:text-gray-900">Contact</a></li>
          <li><a href="#hours" className="hover:text-gray-900">Hours</a></li>
        </ul>
      </div>

      {/* Contact Info */}
      <div>
        <h4 className="font-semibold text-gray-900 mb-4">Contact</h4>
        <ul className="space-y-2 text-sm text-gray-600">
          {tenant.phone && <li><a href={`tel:${tenant.phone}`} className="hover:text-gray-900">{tenant.phone}</a></li>}
          {tenant.email && <li><a href={`mailto:${tenant.email}`} className="hover:text-gray-900">{tenant.email}</a></li>}
          {tenant.address && <li>{tenant.address}</li>}
        </ul>
      </div>
    </div>

    <div className="pt-8 border-t border-gray-200 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-gray-500">
      <p>© {new Date().getFullYear()} {tenant.businessName}. All rights reserved.</p>
      <div className="flex gap-4">
        <Link href={`${protocol}://${rootDomain}`} className="hover:text-gray-700">
          {rootDomain}
        </Link>
        <span>•</span>
        <Link href="/tenant/login" className="hover:text-gray-700 font-medium">
          Admin Portal
        </Link>
      </div>
    </div>
  </div>
</footer>
```

### 8. Enhanced Header with Status (Copy-Paste Ready)
```typescript
{/* Header */}
<header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-100 py-4 px-4 sm:px-6 lg:px-8">
  <div className="max-w-7xl mx-auto flex justify-between items-center">
    <div className="flex items-center gap-3">
      {tenant.logo ? (
        <img src={tenant.logo} alt={tenant.businessName} className="h-9 w-9 rounded object-cover" />
      ) : (
        <div className="text-2xl">{tenant.emoji}</div>
      )}
      <div className="hidden sm:block">
        <p className="font-semibold text-sm text-gray-900">{tenant.businessName}</p>
        {todayHours && (
          <p className="text-xs text-gray-500">
            {isOpen ? '✓ Open' : '✗ Closed'} • {isOpen ? `Until ${todayHours.closeTime}` : 'See Hours'}
          </p>
        )}
      </div>
    </div>
    
    <div className="flex items-center gap-3">
      {todayHours && (
        <div className="hidden md:flex items-center gap-2 px-4 py-2 rounded-full border border-gray-200">
          <div className={`w-2 h-2 rounded-full ${isOpen ? 'bg-green-500' : 'bg-red-500'}`}></div>
          <span className="text-xs font-medium text-gray-600">
            {isOpen ? 'Open' : 'Closed'}
          </span>
        </div>
      )}
      <Button 
        onClick={() => handleBookService()}
        size="sm"
        style={{ backgroundColor: primaryColor }}
        className="text-white hover:opacity-90 transition-opacity"
      >
        Book Now
      </Button>
    </div>
  </div>
</header>
```

---

## Implementation Checklist

For each template (except MinimalTemplate), follow this checklist:

### Step 1: Add Imports
- [ ] Import: `Star, ChevronRight, Clock` from lucide-react
- [ ] Verify `Card`, `CardContent`, `CardHeader` imports exist

### Step 2: Add State & Data
- [ ] Add state: `expandedFAQ`, `email`
- [ ] Add computed: `currentDay`, `todayHours`, `isOpen`
- [ ] Add sample data: `testimonials`, `faqItems`, `stats`

### Step 3: Add Sections (in order before footer)
- [ ] Add Testimonials section
- [ ] Add Business Hours Grid section
- [ ] Add FAQ section
- [ ] Add Newsletter section

### Step 4: Update Components
- [ ] Update Header to show status indicator
- [ ] Replace Footer with 3-column enhanced version

### Step 5: Test
- [ ] No console errors
- [ ] Responsive layout works
- [ ] All buttons clickable
- [ ] Colors use primaryColor correctly
- [ ] Section borders and spacing consistent

---

## Per-Template Implementation Notes

### ModernTemplate
- Current: Has Services, Videos, Social, but missing content sections
- Add: Testimonials, FAQ, Newsletter, Business Hours Grid
- Note: Has dark theme - adjust colors appropriately
- Placement: After Services section, before Videos

### ClassicTemplate
- Current: Simpler layout, card-based design
- Add: Testimonials, FAQ, Newsletter, Business Hours Grid
- Note: Uses specific color palette - maintain consistency
- Placement: After Services section, before Videos

### HealthcareTemplate
- Current: Has Hero, Services, Trust section
- Add: Testimonials, FAQ, Newsletter
- Note: Note: Healthcare-specific trust section already present
- Placement: After Services section

### HealthcareV2Template
- Current: Complex with videos carousel, filters
- Most extensive overhaul needed
- Add: Complete Contact section (missing)
- Add: Testimonials, FAQ, Newsletter, Hours Grid
- Note: Most complex - may need custom styling

---

## Testing After Updates

1. **Visual Check**:
   - All sections render properly
   - Colors match brand colors
   - Spacing is consistent
   - Responsive on mobile/tablet/desktop

2. **Functional Check**:
   - Testimonials display correctly
   - FAQ expand/collapse works
   - Newsletter email input works
   - Hours grid shows all 7 days
   - Footer links are clickable

3. **Integration Check**:
   - Services still display
   - Videos still display
   - Social media links work
   - Photo galleries display
   - Booking dialog opens

---

## Notes for Implementation

- All sections use the `primaryColor` variable for theming
- Keep sample data - it can be customized per business later
- Maintain existing design patterns within each template
- Use consistent spacing and typography
- All sections should be responsive (grid-cols-1 for mobile)
- Footer should always have 3 columns on desktop, stack on mobile

---

## Quick Reference - Section Order (Ideal)

1. Header (sticky)
2. Hero
3. Services
4. **Testimonials** (NEW)
5. Contact Info
6. **Business Hours Grid** (NEW)
7. **FAQ** (NEW)
8. **Newsletter** (NEW)
9. Videos
10. Social Media
11. Photo Galleries
12. Footer (enhanced)
