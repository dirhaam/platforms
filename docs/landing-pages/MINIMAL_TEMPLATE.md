# Minimal Landing Page Template

## Overview

Template Minimal adalah desain landing page yang ultra-clean, minimalist, dan modern dengan fokus pada kesederhanaan dan whitespace. Sempurna untuk bisnis yang ingin tampilan profesional dan elegan.

## Features

### ✨ Design Principles

- **Whitespace-First** - Whitespace digunakan sebagai elemen desain utama
- **Typography-Focused** - Konten dan typography menjadi hero utama
- **Color Restraint** - Penggunaan warna brand yang minimal dan purposeful
- **Micro-Interactions** - Hover states dan transitions yang smooth
- **Touch-Friendly** - Optimal spacing untuk mobile devices

### 🎯 Key Components

#### 1. **Sticky Header**
```
┌─ Logo    Business Name     [Book Now] ─┐
│ Category                               │
└─────────────────────────────────────────┘
(sticky, backdrop blur, min py-4)
```

Features:
- Logo + Business name + category
- Sticky positioning with backdrop blur
- Right-aligned "Book Now" button
- Hidden details on mobile (shows via overflow)

#### 2. **Hero Section**
```
┌────────────────────────────────┐
│  Business Name (Large Bold)    │
│  Category                      │
│                                │
│  Business Description          │
│  (max-w-2xl)                  │
│                                │
│  [Book] [View Services]        │
│  ● Open today • 09:00-17:00   │
└────────────────────────────────┘
```

Features:
- Ultra-large typography (text-4xl sm:text-6xl)
- Bold font weight (not light)
- Generous vertical spacing
- CTA buttons in column on mobile
- Real-time status indicator

#### 3. **Services Section**
```
┌─────────────────────────────────────────┐
│ Services                                 │
│                                         │
│ Service Name          •               │
│ 30 min • IDR 100,000 • Category       │
│                                         │
│ Service Name          •               │
│ 45 min • IDR 150,000 • Category       │
│                                         │
│ ... (up to 8 services)                │
└─────────────────────────────────────────┘
```

Features:
- Clickable service cards
- Icons aligned right with ChevronRight
- Subtle hover effect (bg-gray-50, border update)
- Minimal borders (border-gray-100)
- Category shown as small pill

#### 4. **Contact Section**
```
┌─────────────────────────────────────────┐
│ Contact                                  │
│                                         │
│ [Phone Icon]          [Email Icon]     │
│ Phone                 Email             │
│ +62 812 1234 5678     user@email.com  │
│                                         │
│ [Location Icon]                         │
│ Location                                │
│ Street Address                          │
└─────────────────────────────────────────┘
```

Features:
- Icon-based cards
- Full card clickable (href on <a>)
- Hover state: border update + bg-gray-50
- Uppercase labels with tracking-wide
- Icons use brand primary color

#### 5. **Business Hours**
```
┌──────────────────────┐
│ Hours                │
│                      │
│ MON        09:00-17  │
│ TUE        09:00-17  │
│ WED        09:00-17  │
│ THU        09:00-17  │
│ FRI        09:00-17  │
│ SAT        11:00-15  │
│ SUN        Closed    │
└──────────────────────┘
```

Features:
- Grid layout (2 col mobile, 4 col desktop)
- Compact card design
- Uppercase day names
- Clean typography

#### 6. **Minimal Footer**
```
© 2024 Business Name     |     booqing.my.id     |     Admin
```

Features:
- Single line layout
- Auto-updated year
- Responsive on mobile (stacked)
- Small, subtle text

---

## Design Tokens

### Colors
```tsx
- Primary Color: Brand color (from tenant.brandColors.primary)
- Background: white (#ffffff)
- Borders: gray-100 (#f3f4f6)
- Hover: gray-50 (#f9fafb)
- Text Primary: gray-900 (#111827)
- Text Secondary: gray-600 (#4b5563)
- Status Indicators: green-500 (#22c55e), red-500 (#ef4444)
```

### Typography
```tsx
- Hero Title: text-4xl sm:text-6xl font-bold
- Section Title: text-3xl sm:text-4xl font-bold
- Body: text-base/text-lg leading-relaxed
- Labels: text-xs uppercase tracking-wide
- Small: text-sm
```

### Spacing
```tsx
- Section Padding: py-20 sm:py-32 px-4 sm:px-6 lg:px-8
- Container Max Width: max-w-3xl, max-w-4xl, max-w-6xl
- Gap Units: gap-3, gap-4, gap-8, gap-12
- Card Padding: p-4 sm:p-5 / p-6
```

### Shadows & Borders
```tsx
- Borders: border-gray-100, border-gray-200
- No shadows (ultra-minimal)
- Hover: border-gray-200 (from gray-100)
```

---

## Responsive Design

### Mobile (< 640px)
- Full width with px-4 padding
- Stacked layout for buttons
- Logo + emoji only (name/category hidden)
- Services shown full-width
- Contact cards in single column
- Hours in 2-column grid

### Tablet (640px - 1024px)
- px-6 padding
- Services in single column
- Contact cards in 2-3 columns
- Business hours in 3-column grid

### Desktop (1024px+)
- px-8 padding with max-width container
- All layouts full
- Smooth transitions
- Full header details visible

---

## Interactive Elements

### Buttons
```tsx
// Primary CTA
<Button 
  style={{ backgroundColor: primaryColor, color: 'white' }}
  className="hover:opacity-90 transition-opacity"
>
  Book Now
</Button>

// Secondary
<Button 
  variant="outline"
  // Hover inherits from shadcn default
>
  View Services
</Button>
```

### Cards (Services)
```tsx
<button
  className="group flex items-center justify-between p-4 sm:p-5 rounded-lg 
             hover:bg-gray-50 transition-colors 
             border border-gray-100 hover:border-gray-200"
>
  {/* Content */}
  <ChevronRight className="group-hover:text-gray-400" />
</button>
```

### Contact Cards
```tsx
<a
  className="group flex items-start gap-4 p-6 rounded-lg 
             border border-gray-100 hover:border-gray-200 
             hover:bg-gray-50 transition-colors"
>
  {/* Content */}
</a>
```

---

## Animations & Transitions

```css
/* All interactive elements */
transition-colors       /* Color changes (smooth 150ms) */
transition-opacity      /* Opacity changes */

/* Hover States */
hover:opacity-90        /* Buttons fade slightly */
hover:text-gray-400     /* Icons update color */
hover:border-gray-200   /* Borders lighten */
hover:bg-gray-50        /* Background fills */
```

---

## Real-Time Status Indicator

Shows customer if business is open today:

```tsx
{todayHours && (
  <div className="flex items-center gap-2 text-sm pt-4">
    <div className={`w-2 h-2 rounded-full 
                    ${todayHours.isOpen 
                      ? 'bg-green-500' 
                      : 'bg-red-500'}`}
    ></div>
    <span>
      {todayHours.isOpen 
        ? `Open today • ${todayHours.openTime} - ${todayHours.closeTime}` 
        : 'Closed today'}
    </span>
  </div>
)}
```

---

## Best Practices

### DO
- ✅ Use plenty of whitespace
- ✅ Keep typography large and bold
- ✅ Use subtle hover states
- ✅ Maintain consistent padding
- ✅ Use brand colors sparingly
- ✅ Optimize images for fast loading
- ✅ Test on mobile first

### DON'T
- ❌ Use light font weights (font-light, font-extralight)
- ❌ Add unnecessary decorations
- ❌ Use multiple fonts
- ❌ Make sections too wide (keep max-width)
- ❌ Use bold colors everywhere
- ❌ Forget about accessible contrast
- ❌ Ignore mobile responsiveness

---

## Usage

### Basic Implementation
```tsx
import MinimalTemplate from '@/components/subdomain/templates/MinimalTemplate';

export default function LandingPage({ tenant, services, businessHours }) {
  return (
    <MinimalTemplate 
      tenant={tenant}
      services={services}
      businessHours={businessHours}
    />
  );
}
```

### Props

```tsx
interface MinimalTemplateProps {
  tenant: {
    id: string;
    subdomain: string;
    emoji: string;
    businessName: string;
    businessCategory: string;
    email: string;
    phone: string;
    address?: string;
    businessDescription?: string;
    logo?: string;
    brandColors?: {
      primary: string;
      secondary?: string;
      accent?: string;
    };
  };
  services?: Service[];
  businessHours?: {
    [dayName: string]: {
      isOpen: boolean;
      openTime: string;
      closeTime: string;
    };
  };
}
```

---

## Customization

### Changing Colors
```tsx
// Template automatically uses tenant.brandColors.primary
// Change in tenant settings to update entire template
const primaryColor = tenant.brandColors?.primary || '#000000';
```

### Adding Logo
```tsx
// Template supports both:
1. Image Logo: tenant.logo (img tag)
2. Emoji: tenant.emoji (text)
// Automatically uses logo if available, falls back to emoji
```

### Modifying Spacing
Edit the py/px classes in section components:
```tsx
// Current (generous)
className="py-20 sm:py-32 px-4 sm:px-6 lg:px-8"

// More compact
className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8"

// More spacious
className="py-24 sm:py-40 px-4 sm:px-6 lg:px-8"
```

### Adjusting Service Count
Change slice number in services map:
```tsx
{services.slice(0, 8).map((service) => (  // Default is 8
  // ...
))}
```

---

## Performance

- **No External Fonts** - Uses system fonts
- **Minimal CSS** - Tailwind utility classes only
- **Optimized Images** - Specify dimensions for logo
- **Lazy Loading** - Next.js Image component recommended for logo
- **Mobile-First** - Progressive enhancement

---

## Browser Support

- ✅ Chrome/Edge 88+
- ✅ Firefox 85+
- ✅ Safari 14+
- ✅ Mobile browsers (iOS Safari, Chrome Mobile)

---

## Examples

### Beauty Salon
```
Logo: 💄
Business Name: SkinGlow Beauty
Category: Beauty & Skincare
Colors: Primary #d946a6 (pink)

Services shown with time/price
Contact via WhatsApp
Open status shown real-time
```

### Professional Services
```
Logo: 📊
Business Name: ConsultPro
Category: Business Consulting
Colors: Primary #0066cc (blue)

Services listed clearly
Multiple contact options
Business hours important
```

### Health & Wellness
```
Logo: 🏥
Business Name: HealthHub Clinic
Category: Healthcare
Colors: Primary #059669 (green)

Services with descriptions
Location prominently featured
Hours with status indicator
```

---

## Troubleshooting

### Colors Not Showing Brand Color
- Verify `tenant.brandColors.primary` is set
- Check hex color format (#RRGGBB)
- Try manually setting in tenant settings

### Services Not Displaying
- Verify services array is passed and has items
- Check service.name and service.price exist
- Maximum 8 services shown (adjust slice number if needed)

### Hours Not Showing
- Verify businessHours object structure
- Day names must match: monday, tuesday, etc. (lowercase)
- Check isOpen boolean is set

### Spacing Issues on Mobile
- Use Chrome DevTools responsive mode
- Test at 375px (iPhone SE) width
- Check that container max-width is applied

---

## Related Templates

- **ModernTemplate** - Gradient header, cards
- **ClassicTemplate** - Traditional business look
- **BeautyTemplate** - Image-heavy, visual focus
- **HealthcareTemplate** - Professional, trust-focused

---

## Changelog

### v2.0 (Current)
- Complete redesign with minimalist principles
- Sticky navigation header
- Status indicator for open/closed
- Card-based contact layout
- Improved responsive design
- Better typography hierarchy
- Smooth micro-interactions

### v1.0
- Initial minimal template
- Basic sections
- Light font weights
- Simple layout

---

## Support & Feedback

Have suggestions for improvements? The template is designed to be clean and elegant while maintaining all necessary business information.

Key metrics to maintain:
- Load time < 2s
- Mobile score > 90
- Accessibility score > 95
- CLS (Cumulative Layout Shift) < 0.1
