# Landing Page Templates - 5 Theme Options

## Overview

The booking platform now supports **5 different landing page templates** that tenants can choose from. Each template has a unique design and is optimized for different business types.

---

## 🎨 Template Comparison

| Feature | Modern | Classic | Minimal | Beauty | Healthcare |
|---------|--------|---------|---------|--------|------------|
| Layout | Grid-based | Sidebar | Single column | Card grid | Structured |
| Color Scheme | Vibrant | Professional | Monochrome | Gradient | Blue/Trust |
| Best For | General | Formal | Tech/Minimalist | Salon/Spa | Medical/Clinic |
| Vibe | Contemporary | Traditional | Clean | Glamorous | Professional |
| Images/Graphics | Yes | Limited | Minimal | Heavy | Moderate |

---

## 1. 🆕 **Modern Template** (Default)

**Location:** `components/subdomain/templates/ModernTemplate.tsx`

### Design Characteristics
- Contemporary, clean aesthetic
- Gradient backgrounds
- Card-based service display
- Color-coded service cards with accent bars
- Modern icons and shadows
- Smooth animations

### Sections
```
Header Navigation
    ↓
Hero Section (Gradient background)
    ↓
Services Grid (3 columns)
    - Color-coded top bar
    - Icons for details
    - Large pricing display
    ↓
Why Choose Us Section (Dark)
    - 4 feature boxes
    - Icons per feature
    ↓
CTA Section (Gradient blue)
    ↓
Contact Section
    ↓
Business Hours
    ↓
Footer
```

### Best For
- Startups & tech companies
- Modern service businesses
- E-commerce services
- Contemporary brands

### Brand Color Usage
- Primary: Buttons, accents, icons
- Secondary: Badges
- Gradients: Backgrounds, overlays

---

## 2. 🆕 **Classic Template**

**Location:** `components/subdomain/templates/ClassicTemplate.tsx`

### Design Characteristics
- Traditional, elegant layout
- Left sidebar navigation
- Formal typography
- Colored header matching brand
- List-style service layout
- Professional footer

### Layout
```
┌─────────────────────────┐
│      Navigation Bar     │
├─────────────────────────┤
│  Sidebar  │  Main Content│
│  (About)  │  (Hero)      │
│  (Hours)  │  (Services)  │
│  (Contact)│  (Footer)    │
└─────────────────────────┘
```

### Sections
```
Navigation (Colored header)
    ↓
[Sidebar]        [Main]
About            Hero Section
Hours            Services List
Contact          Footer
```

### Best For
- Law firms & professional services
- Medical practices
- Corporate services
- Traditional businesses

### Design Elements
- Sidebar: 250px fixed width (hidden on mobile)
- Color: Branded primary color for header & accents
- Services: Horizontal list layout with book button

---

## 3. 🆕 **Minimal Template**

**Location:** `components/subdomain/templates/MinimalTemplate.tsx`

### Design Characteristics
- Extreme simplicity and whitespace
- Large, light typography
- Monochrome color scheme
- Minimal borders and graphics
- Focus on content
- Elegant spacing

### Design Philosophy
- "Less is more"
- Whitespace as design element
- Minimal colors
- Large typefaces
- Focus on readability

### Sections
```
Simple Header (Logo only)
    ↓
Hero Section (Large typography)
    ↓
Services Grid (2 columns)
    - Minimal borders
    - Bottom border accent
    ↓
Contact Information
    ↓
Business Hours
    ↓
Footer
```

### Best For
- Tech startups
- Design agencies
- Photography services
- Luxury brands
- Minimalist businesses

### Style Features
- Light font weights (300-400)
- Single brand color
- Large spacing
- Bottom border accents
- Simple emoji/logo only

---

## 4. 🆕 **Beauty/Salon Template**

**Location:** `components/subdomain/templates/BeautyTemplate.tsx`

### Design Characteristics
- Glamorous, visual-heavy design
- Gradient backgrounds (pink/purple)
- Sparkle icons and emojis
- Card-based grid layout
- Color-coded accent bars
- Premium aesthetic

### Visual Elements
- Gradient overlays (pink → purple)
- Backdrop blur effects
- Sparkles icon (✨)
- Color-coded badges
- Emoji icons (👑, ⚡, ✓, 👥)
- Large service cards

### Sections
```
Sticky Header (Glassmorphism)
    ↓
Hero Section (Gradient + Large Title)
    ↓
Premium Services Grid (3 columns)
    - Gradient accent bar
    - Full details with icons
    - Home visit highlight
    ↓
Why Choose Us (4 emojis + text)
    ↓
Contact Cards (Gradient backgrounds)
    ↓
Footer (Gradient)
```

### Best For
- Salons & spas
- Beauty services
- Hair/makeup studios
- Nail services
- Wellness businesses
- Luxury brands

### Color Scheme
- Pink/Purple gradients
- High contrast
- Bold accent colors
- Sparkle effects

---

## 5. 🆕 **Healthcare Template**

**Location:** `components/subdomain/templates/HealthcareTemplate.tsx`

### Design Characteristics
- Professional, trust-focused
- Blue color scheme (medical/trust)
- Structured layout
- Icon-based trust signals
- Clinic hours emphasis
- Accessible design

### Trust Elements
- Shield icon: Certification
- Heart icon: Patient care
- Users icon: Experience
- Professional copy

### Sections
```
Sticky Header (White background)
    ↓
Hero Section (Colored, "Your Health, Our Priority")
    ↓
Trust Section (3 boxes with icons)
    - Certified professionals
    - Patient care
    - Experienced staff
    ↓
Services Grid (2 columns)
    - Category badges
    - Duration with clock
    - Clinic visit + home option
    ↓
Clinic Hours (Card with borders)
    ↓
Contact Information (3 cards)
    ↓
Footer (Colored)
```

### Best For
- Hospitals & clinics
- Medical practices
- Dental offices
- Mental health services
- Physical therapy
- Healthcare facilities

### Design Principles
- Blue color (trust/medical)
- Professional typography
- Clear information hierarchy
- Emphasis on credibility
- Structured layout

---

## 🔧 How to Select Template

### For Tenants (Via Settings)
```
Tenant Settings
    ↓
Landing Page Settings
    ↓
Select Template:
    [ ] Modern
    [ ] Classic
    [ ] Minimal
    [ ] Beauty/Salon
    [ ] Healthcare
    ↓
[Save & Preview]
```

### For Developers
```typescript
// In app/s/[subdomain]/page.tsx
const templateId = tenantData.template?.id || 'modern';

switch (templateId) {
  case 'modern':
    return <ModernTemplate {...props} />;
  case 'classic':
    return <ClassicTemplate {...props} />;
  case 'minimal':
    return <MinimalTemplate {...props} />;
  case 'beauty':
    return <BeautyTemplate {...props} />;
  case 'healthcare':
    return <HealthcareTemplate {...props} />;
  default:
    return <ModernTemplate {...props} />;
}
```

---

## 📱 Responsive Behavior

All templates are fully responsive:

### Mobile (< 640px)
- Single column layout
- Full-width cards
- Collapsed navigation
- Touch-friendly buttons
- No sidebars

### Tablet (640px - 1024px)
- 2 column grids
- Adjusted spacing
- Responsive typography
- Optimized layouts

### Desktop (> 1024px)
- Full layout
- Multiple columns
- Sidebar (if applicable)
- Optimal spacing

---

## 🎨 Brand Customization

Each template uses tenant's brand colors:

```typescript
const primaryColor = tenant.brandColors?.primary || '#default-color';
const secondaryColor = tenant.brandColors?.secondary || '#default-color';
const accentColor = tenant.brandColors?.accent || '#default-color';
```

### Applied To
- Primary buttons
- Accent bars (cards)
- Icons
- Links
- Headers
- Borders
- Badges

---

## ✨ Shared Features (All Templates)

- ✅ Service card display with pricing
- ✅ Home visit indicators
- ✅ Business hours display
- ✅ Contact information (phone, email, address)
- ✅ Booking dialog integration
- ✅ Brand color customization
- ✅ SEO meta tags
- ✅ Responsive design
- ✅ Mobile optimization
- ✅ Dark/light mode support (in Beauty)
- ✅ Animations and transitions

---

## 📊 Selection Guide by Business Type

| Business Type | Recommended | Alternative |
|---------------|-------------|-------------|
| Salon/Spa | Beauty | Modern |
| Medical/Clinic | Healthcare | Classic |
| Tech/Digital | Minimal | Modern |
| Law Firm | Classic | Modern |
| Restaurant | Modern | Beauty |
| Coaching | Minimal | Modern |
| Photography | Minimal | Modern |
| Fitness | Modern | Beauty |
| Education | Classic | Modern |
| Luxury Services | Beauty | Minimal |

---

## 🚀 Future Enhancements

Potential improvements for each template:

### Modern
- Testimonials carousel
- Statistics section
- Blog integration

### Classic
- Timeline feature
- About team section
- PDF brochure download

### Minimal
- Case studies
- FAQs section
- Simple blog

### Beauty
- Before/after gallery
- Product showcase
- Team bios with photos

### Healthcare
- Insurance info
- Patient testimonials
- COVID/Safety info
- Appointment confirmation emails

---

## 📄 Commit Information

- **Commit:** `40d1086`
- **Message:** "feat(templates): add 4 additional landing page templates (5 total themes)"
- **Files Created:** 4 template components
- **Files Modified:** `app/s/[subdomain]/page.tsx`
- **Total Changes:** 1056 insertions(+)

---

## 🔗 File Structure

```
components/subdomain/templates/
├── ModernTemplate.tsx       ✅ (already existed)
├── ClassicTemplate.tsx      ✨ NEW
├── MinimalTemplate.tsx      ✨ NEW
├── BeautyTemplate.tsx       ✨ NEW
└── HealthcareTemplate.tsx   ✨ NEW
```

---

## 🎯 Next Steps

1. **Implement template selection in settings page**
   - Add dropdown selector for templates
   - Save selection to database
   - Preview before applying

2. **Add template preview thumbnails**
   - Screenshot or mockup each template
   - Show in selection interface

3. **Test all templates**
   - Mobile responsiveness
   - Brand color customization
   - Service/customer data loading

4. **Optional: More templates**
   - Restaurant/Food
   - Real Estate
   - Education
   - Fitness/Gym

---

## Summary

**5 Landing Page Templates Available:**
1. **Modern** - Contemporary, default
2. **Classic** - Traditional, formal
3. **Minimal** - Clean, simple
4. **Beauty** - Glamorous, visual
5. **Healthcare** - Professional, trust

Each template:
- Uses same tenant/service data
- Supports booking integration
- Responsive and mobile-optimized
- Brand customizable
- SEO friendly

