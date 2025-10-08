# Booqing Platform - Layout & Style Guide

## Overview
Dokumentasi ini menjelaskan struktur layout dan sistem styling untuk platform Booqing yang menggunakan Next.js, TypeScript, TailwindCSS, dan shadcn/ui components.

---

## Teknologi Stack

### Core Technologies
- **Next.js 14+** - React framework dengan App Router
- **TypeScript** - Type safety dan development experience
- **TailwindCSS** - Utility-first CSS framework
- **shadcn/ui** - High-quality React components
- **Radix UI** - Accessible component primitives
- **Lucide React** - Icon library

### Design System
- **Font**: Inter (Google Fonts)
- **Base Style**: Modern, clean, professional
- **Theme**: Light theme dengan custom color palette
- **Radius**: 0.5rem untuk rounded corners

---

## Color Palette & Theme Variables

```css
/* globals.css - Color Variables */
--color-primary: #3b82f6        /* Blue 500 */
--color-primary-foreground: #ffffff
--color-secondary: #f1f5f9      /* Slate 100 */
--color-secondary-foreground: #0f172a
--color-accent: #10b981         /* Emerald 500 */
--color-accent-foreground: #ffffff
--color-muted: #f1f5f9          /* Background muted */
--color-muted-foreground: #64748b
--color-destructive: #ef4444    /* Red 500 */
--color-success: #10b981        /* Emerald 500 */
--color-warning: #f59e0b        /* Amber 500 */
--color-background: #ffffff
--color-foreground: #0f172a
--color-border: #e2e8f0         /* Slate 200 */
--radius: 0.5rem
```

---

## Layout Structure

### 1. Root Layout (`app/layout.tsx`)
```typescript
- HTML wrapper dengan Inter font
- AuthProvider context wrapper
- Minimal background styling
- Mobile-first responsive design
```

### 2. Page Structures

#### Main Website (`app/page.tsx`)
```
Header
├── Navigation/Header.tsx
Main
├── HeroSection.tsx
├── FeaturesSection.tsx  
└── DashboardPreview.tsx
```

#### Subdomain Layout (`app/[subdomain]/page.tsx`)
```
Header (Subdomain-specific)
├── Logo + Business Name
├── Booking CTA
└── Admin Login

Hero Section
├── Business Badge
├── Business Name (Gradient)
├── Description
└── Action Buttons

Services Section
├── Service Cards
├── Pricing Display
└── Booking Links

Reviews Section
├── Rating Display
├── Customer Reviews
└── Star Ratings

Contact Section
├── Address Card
├── Phone Card
└── Email Card

Footer
└── Booqing Branding
```

### 3. Admin Dashboard (`components/subdomain/SubdomainDashboard.tsx`)
```
Header
├── Business Name (Gradient)
├── Subdomain Info
├── Status Badges
└── Settings Button

Quick Stats (4 Cards Grid)
├── Today's Bookings
├── Weekly Revenue
├── Confirmed Bookings  
└── Pending Confirmations

Tabs Navigation
├── Dashboard
├── Bookings
├── Customers
├── Finance
├── WhatsApp
├── Reports
└── Settings

Content Area
├── Tab-specific content
├── Cards & Analytics
└── Action Buttons
```

---

## Component System

### 1. UI Components (`components/ui/`)

#### Button Variants
```typescript
// Button variants dengan custom styling
default    // Primary blue dengan elegant shadow
hero       // Gradient dengan hover scale effect
glass      // Glass morphism effect
premium    // Gradient accent ke primary
outline    // Border dengan hover background
secondary  // Muted background
ghost      // Transparent dengan hover
destructive // Red untuk delete actions
link       // Text link style
```

#### Card Components
```typescript
Card, CardHeader, CardTitle, CardDescription, CardContent
// Digunakan untuk semua sectioning dan content blocks
```

#### Form Components  
```typescript
Input, Button, Select, Textarea, Label
Checkbox, RadioGroup, Switch
// Konsisten styling untuk semua forms
```

### 2. Custom CSS Classes (`globals.css`)

#### Utility Classes
```css
.gradient-text
/* Linear gradient dari primary ke accent untuk text */

.card-shadow
/* Elegant shadow dengan hover effect */

.smooth-transition  
/* Smooth transition untuk semua hover states */

.hero-gradient
/* Background gradient primary ke accent */

.elegant-shadow
/* Shadow dengan primary color tint */

.glass-card
/* Glass morphism effect untuk modern look */

.bounce-transition
/* Quick bounce effect untuk interactive elements */
```

---

## Responsive Design System

### Breakpoints (TailwindCSS defaults)
```
sm: 640px   - Small tablets
md: 768px   - Tablets  
lg: 1024px  - Small desktops
xl: 1280px  - Large desktops
2xl: 1536px - Extra large screens
```

### Grid System
```css
/* Main Content */
container mx-auto px-4 py-4
max-w-7xl mx-auto

/* Cards Grid */
grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4
gap-4 md:gap-6

/* Stats Grid */
grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6

/* Two Column Layout */
grid grid-cols-1 lg:grid-cols-2 gap-6
```

---

## Typography Scale

### Headings
```css
/* Hero Title */
text-4xl md:text-6xl font-bold gradient-text

/* Section Title */  
text-3xl font-bold mb-4

/* Card Title */
text-xl font-bold

/* Subtitle */
text-lg font-semibold

/* Body Text */
text-base leading-relaxed

/* Muted Text */
text-sm text-muted-foreground

/* Caption */
text-xs text-muted-foreground
```

### Font Weights
```css
font-normal    (400) - Body text
font-medium    (500) - Emphasis
font-semibold  (600) - Subtitles  
font-bold      (700) - Headings
```

---

## Layout Patterns

### 1. Hero Sections
```css
/* Full viewport hero */
min-h-screen flex items-center justify-center

/* Section hero */
py-16 text-center

/* Background patterns */
hero-gradient opacity-10
bg-cover bg-center opacity-20
```

### 2. Content Sections
```css
/* Standard section */
py-16
container mx-auto px-4

/* Centered content */
max-w-4xl mx-auto text-center
max-w-2xl mx-auto leading-relaxed
```

### 3. Card Layouts
```css
/* Service cards */
p-6 card-shadow hover:scale-105 smooth-transition border-0

/* Stats cards */  
glass-card p-6 rounded-2xl

/* Info cards */
p-6 text-center card-shadow border-0
```

---

## Animation & Interactions

### Hover Effects
```css
/* Button hover */
hover:scale-105 bounce-transition
hover:bg-primary/90

/* Card hover */  
hover:scale-105 smooth-transition
hover:shadow-lg elegant-shadow

/* Link hover */
hover:text-foreground smooth-transition
```

### Loading States
```css
/* Skeleton loading */
animate-pulse bg-muted/50 rounded

/* Spinner */
animate-spin text-primary
```

---

## Multi-Template Support

### Template Classes
```typescript
// Template-specific styling
getTemplateClass(template: string) {
  switch (template) {
    case 'modern': 
      return 'bg-gradient-to-r from-blue-50 to-indigo-50';
    case 'classic': 
      return 'bg-gradient-to-r from-gray-50 to-white';
    default: 
      return '';
  }
}
```

### Category Icons
```typescript
// Dynamic icons berdasarkan kategori bisnis
getCategoryEmoji(category: string) {
  switch (category) {
    case 'salon': return '💇‍♀️';
    case 'mua': return '💄'; 
    case 'decoration': return '🎨';
    case 'home-visit': return '🏠';
    default: return '💼';
  }
}
```

---

## Performance Optimizations

### CSS Strategy
- TailwindCSS utility classes (reduced bundle size)
- Component-scoped styling
- Custom CSS properties untuk theming
- Minimal custom CSS classes

### Loading Strategy
- Next.js font optimization (Inter)
- Lazy loading untuk heavy components
- Skeleton loading states
- Optimized images dengan Next.js Image component

---

## Accessibility Features

### Semantic HTML
- Proper heading hierarchy (h1 → h6)
- Semantic sections dan landmarks  
- Form labels dan ARIA attributes
- Skip navigation links

### Color Accessibility
- High contrast ratios
- Color blind friendly palette
- Focus indicators visible
- Alternative text untuk visual elements

### Keyboard Navigation
- Tab order optimization
- Focus management
- Keyboard shortcuts
- Screen reader compatibility

---

## Customization Guidelines

### Theme Customization
1. Update CSS variables di `globals.css`
2. Extend Tailwind config untuk custom colors
3. Update component variants di `button.tsx`
4. Test responsiveness pada semua breakpoints

### Component Customization
1. Extend base components di `components/ui/`
2. Create custom variants menggunakan CVA
3. Maintain accessibility standards
4. Document breaking changes

### Layout Modifications
1. Follow established grid patterns
2. Maintain responsive behavior
3. Test pada multiple screen sizes
4. Update documentation

---

## File Structure

```
app/
├── globals.css           # Global styles & CSS variables
├── layout.tsx           # Root layout wrapper  
├── page.tsx             # Main landing page
├── [subdomain]/         # Dynamic subdomain routes
│   ├── page.tsx         # Subdomain landing page
│   ├── admin/page.tsx   # Subdomain dashboard
│   └── book/page.tsx    # Booking interface
└── admin/page.tsx       # Main admin panel

components/
├── ui/                  # shadcn/ui base components
│   ├── button.tsx       # Button variants
│   ├── card.tsx         # Card components
│   └── ...              # Other UI primitives
├── navigation/
│   └── Header.tsx       # Site navigation
├── sections/
│   ├── HeroSection.tsx  # Landing hero
│   └── ...              # Other sections
└── subdomain/
    ├── SubdomainDashboard.tsx  # Admin dashboard
    └── SubdomainRouter.tsx     # Subdomain routing
```

---

## Best Practices

### CSS Organization
1. Use TailwindCSS utilities first
2. Custom CSS classes untuk reusable patterns
3. Component-level styling dengan CSS-in-JS minimal
4. Consistent naming conventions

### Responsive Design
1. Mobile-first approach
2. Progressive enhancement  
3. Touch-friendly interface elements
4. Optimized loading untuk mobile networks

### Performance
1. Minimize custom CSS
2. Use TailwindCSS purging
3. Optimize critical path CSS
4. Lazy load non-critical components

### Maintenance
1. Document semua custom styling
2. Use TypeScript untuk type safety
3. Consistent component patterns
4. Regular accessibility audits

---

*Last Updated: September 2024*  
*Version: 1.0*