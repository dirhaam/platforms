# Modern Template V2 - Premium Dark UI

## Overview

ModernTemplate V2 adalah redesign komplet dari template Modern dengan fokus pada desain premium, dark theme, dan interaksi yang sophisticated. Menampilkan animasi gradient yang dinamis, glassmorphism effects, dan UI yang ultra-modern.

Sempurna untuk bisnis luxury, premium services, dan brand yang ingin tampil sophisticated dan modern.

## Key Features

### 🌙 Dark Premium Theme
- Black background (#000000)
- Gradient overlays dan blur effects
- Glassmorphism untuk navbar dan cards
- Premium feel dengan subtle animations

### ✨ Advanced Animations
- Mouse-tracking gradient background
- Animated gradient text effects
- Smooth hover transitions (300ms)
- Pulse animations untuk decorative elements
- Translate effects pada cards (hover -translate-y-1)

### 🎨 Modern Design Elements
- Gradient backgrounds: blue → purple → pink
- Glassmorphic cards dengan backdrop blur
- Glow effects pada hover
- Color-coordinated icon backgrounds
- Professional shadow effects

### 📊 Trust & Social Proof
- Stats section (1000+ clients, 4.9/5 rating)
- Experience badge (10+ years)
- Real-time open/closed status indicator
- Professional layout

---

## Component Breakdown

### 1. **Navbar (Fixed/Sticky)**
```
┌─────────────────────────────────────────────────────────────┐
│ Logo  Business Name     ● Open Now • 09:00    [Reserve Now] │
│       Category                                               │
└─────────────────────────────────────────────────────────────┘
```

Features:
- Backdrop blur effect (backdrop-blur-md)
- Semi-transparent background (bg-black/30)
- Border bottom with subtle line
- Live status indicator dengan pulse animation
- Gradient hover effects pada logo

### 2. **Hero Section**
```
LEFT SIDE:
Badge: ✨ Premium Experience
Title: Business Name (Gradient)
Description: (Elegant copy)
Stats: (Trust metrics)
CTAs: [Reserve] [Explore Services]

RIGHT SIDE (Desktop):
Logo/Emoji dalam glassmorphic container
Glow effect pada hover
Gradient border animation
```

Features:
- Large gradient typography (text-6xl md:text-7xl)
- Stats dengan icon + color-coded backgrounds
- Dual CTA buttons dengan different styles
- Responsive grid layout
- Mouse-tracking background animation

### 3. **Services Section**
```
┌─────────────────────────────────────────┐
│ Our Services (Gradient Title)            │
│                                         │
│ ┌─ Service 1  [Category Badge] ─────┐ │
│ │ Description...                    │ │
│ │ Duration: 30 min | Price: IDR...  │ │
│ │ [Book Now →]                      │ │
│ └───────────────────────────────────┘ │
│                                         │
│ (3-column grid, 6 services max)        │
└─────────────────────────────────────────┘
```

Features:
- Glassmorphic cards dengan gradient borders
- Hover effects: glow, border color, translate
- Gradient background on hover
- Price displayed dengan gradient text
- Home visit badge jika available
- Smooth icon animations on CTA

### 4. **Contact Section**
```
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│  📞 Icon        │  │  📧 Icon        │  │  📍 Icon        │
│  (Blue Box)     │  │  (Purple Box)   │  │  (Pink Box)     │
│                 │  │                 │  │                 │
│  Phone          │  │  Email          │  │  Address        │
│  +62 812...     │  │  user@email.com │  │  Jl. Main St    │
│                 │  │                 │  │                 │
│  [Call Now]     │  │  [Send Email]   │  │  [Get Dir.]     │
└─────────────────┘  └─────────────────┘  └─────────────────┘
```

Features:
- Color-coordinated backgrounds (blue, purple, pink)
- Border pada hover dengan warna sesuai
- Icon dengan color yang match
- Full clickable area
- Translate effect pada hover

### 5. **Business Hours**
```
┌──────────┬──────────┬──────────┬──────────┐
│ MON      │ TUE      │ WED      │ THU      │
│ 09-17:00 │ 09-17:00 │ 09-17:00 │ 09-17:00 │
└──────────┴──────────┴──────────┴──────────┘

┌──────────┬──────────┬──────────┐
│ FRI      │ SAT      │ SUN      │
│ 09-17:00 │ 11-15:00 │ Closed   │
└──────────┴──────────┴──────────┘
```

Features:
- 4-column grid (desktop), 2-column (mobile)
- Green text untuk open, gray untuk closed
- Subtle hover effects
- Glassmorphic design

### 6. **Footer**
```
© 2024 Business Name          booqing.my.id    Admin Portal
Premium service platform
```

Features:
- Clean border top
- Minimal text
- Links dengan hover effects
- Professional layout

---

## Design Tokens

### Colors
```css
Primary: #0066ff (Bright Blue)
Secondary: #00d4ff (Cyan)
Accent: #ff0080 (Pink/Magenta)
Background: #000000 (Black)
Borders: rgba(255, 255, 255, 0.1-0.2) (Subtle white)
Text Primary: #ffffff
Text Secondary: #d1d5db (Gray-300)
Text Muted: #9ca3af (Gray-400)
Success: #22c55e (Green)
```

### Backgrounds
```tsx
// Glassmorphic Card
bg-gradient-to-br from-white/10 to-white/5
border border-white/20

// Navbar
bg-black/30 backdrop-blur-md

// Hero Background
Fixed gradient overlay with mouse tracking
```

### Typography
```tsx
// Headings
text-5xl md:text-7xl font-black
bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent

// Subheadings
text-xl text-gray-400

// Stats
font-bold text-lg
```

### Shadows & Glows
```tsx
// Card Hover
shadow-xl shadow-blue-500/20

// Button Hover
shadow-lg hover:shadow-blue-500/50

// Hero Image
shadow-2xl opacity-20 (gradient glow)
```

---

## Animations & Transitions

### Global Transitions
```tsx
transition-all duration-300  // Standard smooth transition
transition-colors duration-300
transition-transform duration-300
```

### Hover Effects
```tsx
// Cards
hover:-translate-y-1  // Lift effect
hover:border-blue-500/50  // Border color change
hover:shadow-xl hover:shadow-blue-500/20  // Glow

// Buttons
group-hover/btn:translate-x-1  // Icon moves right
hover:from-blue-700 hover:to-purple-700  // Gradient darkens

// Icons
group-hover:scale-110  // Scale up
group-hover:border-blue-400/50  // Border brightens
```

### Auto Animations
```tsx
animate-pulse  // Background elements pulsing
animationDelay: '1s'  // Staggered pulse
```

### Mouse Tracking
```tsx
useEffect(() => {
  const handleMouseMove = (e: MouseEvent) => {
    setMousePosition({ x: e.clientX, y: e.clientY });
  };
  // Gradients follow mouse position
});
```

---

## Color Scheme by Section

### Navbar
- Background: Black/30 with blur
- Text: White + Gray
- Status: Green (open) / Gray (closed)
- Button: Blue → Purple gradient

### Hero
- Title: Blue → Purple → Pink gradient
- Background: Dynamic mouse-tracked gradient
- Stats Icons: Blue, Purple, Pink boxes
- Buttons: Primary (gradient), Secondary (outline)

### Services
- Cards: White/10 with white/20 border
- Hover: Blue glow + gradient background
- Badge: Blue/30 background
- Price: Blue → Purple gradient text

### Contact
- Phone: Blue theme
- Email: Purple theme  
- Address: Pink theme
- Buttons: Match section color

### Hours
- Background: White/10 with white/20 border
- Text: Green (open) / Gray (closed)
- Hover: Blue glow

---

## Responsive Design

### Mobile (< 640px)
- Full width padding (px-4)
- Single column layout (hero image hidden)
- 2-column hours grid
- Full-width buttons
- Simplified navbar (hidden details)

### Tablet (640px - 1024px)
- px-6 padding
- 2-column services grid
- 3-column contact cards
- 3-column hours grid
- All navbar elements visible

### Desktop (1024px+)
- px-8 padding with max-width
- 3-column services grid
- 3-column contact cards
- Full hero with image
- Complete navbar with effects

---

## Interactive Elements

### Buttons
```tsx
// Primary CTA
className="bg-gradient-to-r from-blue-600 to-purple-600 
           hover:from-blue-700 hover:to-purple-700 
           shadow-lg hover:shadow-blue-500/50 
           transition-all duration-300"

// Secondary
className="border-2 border-white/20 
           hover:border-blue-400 hover:bg-blue-400/10"

// Icon Buttons
group-hover/btn:translate-x-1
```

### Cards (Services)
```tsx
className="group bg-gradient-to-br from-white/10 to-white/5 
           border border-white/20 
           hover:border-blue-500/50 
           transition-all duration-300 
           hover:shadow-xl hover:shadow-blue-500/20 
           hover:-translate-y-1"
```

### Badges
```tsx
className="bg-gradient-to-r from-blue-500/30 to-purple-500/30 
           border border-blue-400/30 
           text-blue-300"
```

---

## Best Practices

### DO
- ✅ Use gradients consistently
- ✅ Apply smooth transitions (300ms)
- ✅ Maintain high contrast for readability
- ✅ Use color-coded sections
- ✅ Provide visual feedback on hover
- ✅ Keep dark theme cohesive
- ✅ Test on multiple devices
- ✅ Use glassmorphic effects subtly

### DON'T
- ❌ Overuse white/transparent borders
- ❌ Make text too dim (needs contrast)
- ❌ Mix too many gradient directions
- ❌ Use harsh shadows
- ❌ Forget dark mode readability
- ❌ Animate everything
- ❌ Use jarring colors
- ❌ Forget accessibility

---

## Performance

- ✅ CSS-based animations (no JavaScript)
- ✅ Minimal DOM elements
- ✅ Optimized images with NextJS
- ✅ Lazy loading ready
- ✅ GPU-accelerated transforms
- ✅ Mobile-first approach
- ✅ Smooth 60fps animations

---

## Browser Support

- ✅ Chrome/Edge 88+
- ✅ Firefox 87+
- ✅ Safari 14+
- ✅ Mobile browsers
- ✅ Backdrop blur support required

---

## Usage Example

```tsx
import ModernTemplate from '@/components/subdomain/templates/ModernTemplate';

export default function LandingPage() {
  return (
    <ModernTemplate 
      tenant={tenantData}
      services={servicesList}
      businessHours={hours}
    />
  );
}
```

---

## Customization

### Changing Primary Colors
```tsx
// Affects all gradients automatically
// Change in tenant settings → brand colors

primaryColor = "#your-color"
// Gradients will use: blue → purple → pink
```

### Disabling Animations
```tsx
// Remove className animations:
// hover:-translate-y-1 → (remove for static)
// animate-pulse → (remove for static)
```

### Adjusting Spacing
```tsx
// Hero padding: py-20 px-4 sm:px-6 lg:px-8
// To make compact: py-12 sm:py-16

// Service gap: gap-6
// To increase: gap-8
```

---

## Examples by Industry

### Tech Company
- Colors: Blue + Cyan gradient
- Message: "Premium technology services"
- Stats: 500+ projects, 98% uptime

### Beauty Salon
- Colors: Pink + Purple gradient
- Message: "Luxury beauty experience"
- Stats: 3000+ clients, 4.9/5 rating

### Professional Services
- Colors: Blue + Deep Blue gradient
- Message: "Expert consultancy"
- Stats: 15+ years, $10M+ revenue

---

## Troubleshooting

### Colors Too Dim
- Increase opacity on gradient overlays
- Change text to brighter shade (e.g., #ffffff)
- Add more glow effects

### Animations Choppy
- Reduce number of animated elements
- Use shorter durations (200ms)
- Check GPU acceleration

### Text Hard to Read
- Add text shadow: shadow-lg
- Increase contrast ratio
- Use lighter text colors

### Performance Issues
- Reduce blur effects (backdrop-blur-md → sm)
- Limit animated elements
- Use static backgrounds instead of tracking

---

## Changelog

### v2.0 (Current)
- Complete redesign with dark theme
- Added mouse tracking background
- Implemented glassmorphism effects
- Added gradient text effects
- New stats section
- Improved hover animations
- Professional dark UI

### v1.0
- Initial Modern template
- Light theme
- Basic gradient header
- Simple cards

---

## Related Templates

- **MinimalTemplate** - Clean, whitespace-focused
- **ClassicTemplate** - Traditional business
- **BeautyTemplate** - Image-heavy
- **HealthcareTemplate** - Professional, trust-focused

---

## Support

For customization requests or issues, refer to template documentation or contact support.

Template is optimized for:
- Modern browsers
- All devices
- Professional presentation
- High conversion rates
