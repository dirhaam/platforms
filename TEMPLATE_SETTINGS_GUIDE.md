# Landing Page Template Settings Guide

## Overview

Tenants can now select their preferred landing page template directly from the Settings page. Each template has a unique design while maintaining all core features (services, booking, contact info).

---

## 🎯 How to Access

1. Login to your tenant admin dashboard
2. Navigate to **Settings** (left sidebar)
3. Scroll to **Landing Page Style** section
4. Select your preferred template
5. Click **Save Style**

---

## 📋 Template Selection UI

### Template Cards Display:
- **Template Icon** (emoji representative)
- **Template Name** (Modern, Classic, Minimal, Beauty, Healthcare)
- **Description** (design characteristics)
- **Best For** (recommended business types)
- **Color Palette** (3 representative colors)

### Selection Features:
- ✅ Visual selection with hover effects
- ✅ Blue border/background on selected template
- ✅ "Selected" badge on current choice
- ✅ Current template info shown above grid
- ✅ Preview of pending changes shown below grid

### Action Buttons:
- **Preview Live** - Opens your live landing page in new tab
- **Save Style** - Saves template preference (enabled only if changed)

---

## 🎨 The 5 Templates

### 1. **Modern** (Default)
- **Icon:** ✨
- **Style:** Contemporary, vibrant, smooth animations
- **Colors:** Blue, Purple, Pink
- **Best For:** Startups, tech companies, modern services
- **Features:** Grid layout, gradient backgrounds, card-based services

### 2. **Classic**
- **Icon:** 🏛️
- **Style:** Traditional, elegant, formal
- **Colors:** Dark gray, Slate, Medium gray
- **Best For:** Law firms, medical practices, corporate services
- **Features:** Sidebar navigation, professional typography, formal header

### 3. **Minimal**
- **Icon:** ✏️
- **Style:** Clean, simple, whitespace-focused
- **Colors:** Black, Dark gray, Light gray
- **Best For:** Tech startups, design agencies, luxury brands
- **Features:** Large typography, minimal borders, elegant spacing

### 4. **Beauty/Salon**
- **Icon:** 💄
- **Style:** Glamorous, visual-heavy, premium
- **Colors:** Pink, Magenta, Purple
- **Best For:** Salons, spas, beauty services, wellness
- **Features:** Gradient backgrounds, sparkle effects, emojis, premium cards

### 5. **Healthcare**
- **Icon:** 🏥
- **Style:** Professional, trust-focused, structured
- **Colors:** Teal, Sky blue, Light blue
- **Best For:** Hospitals, clinics, medical practices, therapy
- **Features:** Trust indicators, structured layout, professional typography

---

## 💾 Saving Your Template Choice

### Process:
1. **Select Template** - Click on template card
   - Visual feedback shows selection
   - Blue border appears around card
   - "Selected" badge appears

2. **Review Selection** - Info box shows pending changes
   - Template name displayed
   - Description shown
   - Best use cases listed

3. **Save** - Click "Save Style" button
   - Button shows "Saving..." while processing
   - Toast notification shows success/error
   - Page updates with new template

4. **Verification** - View live site
   - Click "Preview Live" to see in new tab
   - Check both desktop and mobile views
   - Verify all content displays correctly

---

## 🔄 What Changes & What Doesn't

### ✅ Changes With Template:
- Landing page layout and design
- Color scheme and visual hierarchy
- Typography and spacing
- Component arrangement
- Animations and transitions

### ❌ Doesn't Change:
- Your services and pricing
- Customer data
- Business hours
- Contact information
- Booking system
- Admin dashboard
- All tenant configurations

**All templates include:**
- ✅ Your services with pricing
- ✅ Business hours display
- ✅ Contact information
- ✅ Booking system integration
- ✅ Brand colors customization
- ✅ Full responsive design

---

## 📱 Responsive Behavior

All templates adapt to screen sizes:

| Device | Layout |
|--------|--------|
| **Mobile** (<640px) | Single column, stacked |
| **Tablet** (640-1024px) | 2 columns, optimized |
| **Desktop** (>1024px) | Full layout, multiple columns |

---

## 🎨 Brand Customization

Each template uses your tenant's brand colors:
- **Primary Color:** Buttons, accents, icons
- **Secondary Color:** Badges, highlights
- **Accent Color:** Decorative elements

These colors are applied consistently across your chosen template.

---

## 🚀 After Selecting Template

### Next Steps:
1. **Verify Landing Page**
   - Preview in all browsers
   - Test on mobile devices
   - Check all links work

2. **Update Content (if needed)**
   - Edit services in Services page
   - Update business hours in Settings
   - Modify contact info in Settings

3. **Share Your Site**
   - Landing page: `https://[subdomain].booqing.my.id/`
   - Admin dashboard: `https://[subdomain].booqing.my.id/admin`

4. **Monitor Traffic**
   - Check analytics
   - Gather customer feedback
   - Adjust if needed

---

## 🔧 Technical Details

### API Endpoints:

**GET** `/api/tenant/settings/template`
- Fetch current template preference
- Header: `x-tenant-id`
- Response: `{ template: "modern" | "classic" | "minimal" | "beauty" | "healthcare" }`

**POST** `/api/tenant/settings/template`
- Update template preference
- Header: `x-tenant-id`
- Body: `{ template: "..." }`
- Response: Success/error with new template

### Valid Templates:
- `modern`
- `classic`
- `minimal`
- `beauty`
- `healthcare`

---

## ❓ FAQ

**Q: Can I change templates later?**
A: Yes, anytime from Settings > Landing Page Style

**Q: Will changing templates affect my data?**
A: No, all your services, bookings, and customer data remain unchanged

**Q: What if I don't like the new template?**
A: Switch to another template anytime

**Q: Do I lose any data when switching?**
A: No, only the visual presentation changes

**Q: Will my customers see the old template?**
A: Template changes apply immediately after save

**Q: Can I customize template colors?**
A: Yes, use the brand colors in Settings

---

## 🆘 Troubleshooting

| Issue | Solution |
|-------|----------|
| Save button disabled | Select a different template first |
| Page won't load | Check internet connection |
| Template not showing | Refresh page after save |
| Old template still showing | Clear browser cache |

---

## 📝 Files Involved

- **Component:** `components/tenant/LandingPageStyleSettings.tsx`
- **API:** `app/api/tenant/settings/template/route.ts`
- **Settings Page:** `app/tenant/admin/settings/content.tsx`
- **Templates:** `components/subdomain/templates/[Template].tsx` (5 files)

---

## 💡 Best Practices

1. **Preview Before Committing** - Always check live preview
2. **Test Mobile View** - Ensure looks good on all devices
3. **Gather Feedback** - Ask customers/staff what they think
4. **Try Different Templates** - What works best for your business?
5. **Update Content Regularly** - Keep services and hours current

---

**Commit:** `710d88a`  
**Component Created:** Oct 21, 2025

