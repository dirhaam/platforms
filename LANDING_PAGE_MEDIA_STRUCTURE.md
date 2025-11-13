# Landing Page Media Structure Documentation

This document describes the new media sections structure added to tenant landing pages.

## Overview

Three new media sections have been added to support YouTube videos, social media links, and photo galleries on tenant landing pages.

## Data Types

### VideoItem
Located in `types/booking.ts`

```typescript
interface VideoItem {
  id: string;
  title: string;
  youtubeUrl: string;        // Full URL or Video ID
  thumbnail?: string;
  description?: string;
  displayOrder: number;      // For ordering videos
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

### SocialMediaLink
```typescript
interface SocialMediaLink {
  id: string;
  platform: 'facebook' | 'instagram' | 'tiktok' | 'youtube' | 'linkedin' | 'twitter';
  url: string;
  displayOrder: number;      // For ordering links
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

### PhotoGalleryItem
```typescript
interface PhotoGalleryItem {
  id: string;
  url: string;
  caption?: string;
  alt: string;
  displayOrder: number;      // For ordering photos
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

### PhotoGallery
```typescript
interface PhotoGallery {
  id: string;
  tenantId: string;
  title: string;
  description?: string;
  displayType: 'grid' | 'carousel' | 'masonry';
  photos: PhotoGalleryItem[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

## Components

### VideoSection
**Location:** `components/subdomain/sections/VideoSection.tsx`

Displays YouTube videos with support for multiple display types.

**Props:**
```typescript
interface VideoSectionProps {
  videos: VideoItem[];
  displayType?: 'single' | 'carousel' | 'grid';  // Default: 'grid'
  title?: string;
  description?: string;
  primaryColor?: string;  // Brand color for styling
}
```

**Features:**
- Automatic YouTube URL parsing (supports full URLs and video IDs)
- Single video display (featured)
- Carousel with thumbnails
- Grid layout
- Responsive design

### SocialMediaSection
**Location:** `components/subdomain/sections/SocialMediaSection.tsx`

Displays social media links with platform-specific icons.

**Props:**
```typescript
interface SocialMediaSectionProps {
  socialMedia: SocialMediaLink[];
  displayType?: 'icons' | 'links' | 'buttons';  // Default: 'icons'
  title?: string;
  description?: string;
  primaryColor?: string;
  orientation?: 'horizontal' | 'vertical';  // Default: 'horizontal'
}
```

**Features:**
- Multiple display types (icon circles, links, buttons)
- Platform-specific icons (Facebook, Instagram, TikTok, YouTube, LinkedIn, Twitter)
- Horizontal or vertical orientation
- Hover effects
- Opens links in new tab

### PhotoGallerySection
**Location:** `components/subdomain/sections/PhotoGallerySection.tsx`

Displays photo galleries with multiple layout options.

**Props:**
```typescript
interface PhotoGallerySectionProps {
  gallery: PhotoGallery;
  primaryColor?: string;
}
```

**Features:**
- Grid layout (responsive: 1 col mobile, 2 cols tablet, 3 cols desktop)
- Carousel with thumbnail navigation
- Masonry layout
- Lightbox modal for full-screen viewing
- Photo captions
- Click to view full size

## Admin Settings Component

**Location:** `components/settings/LandingPageMediaSettings.tsx`

Provides admin interface for managing media on landing pages.

**Features:**
- Add/remove videos with YouTube URL
- Add/remove social media links
- Reorder items (up/down buttons)
- Toggle active/inactive status
- Photo gallery management (UI coming soon)

## Template Configuration

Updated in `lib/templates/landing-page-templates.ts`

Each template now supports toggling these sections:

```typescript
sections: {
  // ... existing sections
  videos: true | false;
  socialMedia: true | false;
  photoGallery: true | false;
}
```

All 6 templates now have these sections enabled by default:
- Modern Professional
- Classic Business
- Minimal Clean
- Beauty & Wellness
- Healthcare Professional
- Healthcare V2

## Integration Steps

### 1. Update TenantLandingPage Component

Props added to `TenantLandingPageProps`:
```typescript
videos?: VideoItem[];
socialMedia?: SocialMediaLink[];
galleries?: PhotoGallery[];
```

### 2. Use Sections in Templates

Example integration in any template:

```tsx
import VideoSection from '@/components/subdomain/sections/VideoSection';
import SocialMediaSection from '@/components/subdomain/sections/SocialMediaSection';
import PhotoGallerySection from '@/components/subdomain/sections/PhotoGallerySection';

export default function YourTemplate({
  tenant,
  services,
  businessHours,
  videos,
  socialMedia,
  galleries,
  primaryColor
}) {
  return (
    <div>
      {/* Other sections */}
      
      {videos && <VideoSection videos={videos} displayType="grid" primaryColor={primaryColor} />}
      
      {socialMedia && <SocialMediaSection socialMedia={socialMedia} displayType="icons" primaryColor={primaryColor} />}
      
      {galleries && galleries.map(gallery => (
        <PhotoGallerySection key={gallery.id} gallery={gallery} primaryColor={primaryColor} />
      ))}
      
      {/* Other sections */}
    </div>
  );
}
```

### 3. Position Sections

Each template can position these sections anywhere:
- Hero section area
- After services
- Before contact
- Footer area
- Between any existing sections

Position is **template-specific** and flexible.

## Database Considerations

The following database tables need to be created:

### tenant_videos
```sql
CREATE TABLE tenant_videos (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  title VARCHAR(255) NOT NULL,
  youtube_url VARCHAR(512) NOT NULL,
  thumbnail VARCHAR(512),
  description TEXT,
  display_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
);
```

### tenant_social_media
```sql
CREATE TABLE tenant_social_media (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  platform VARCHAR(50) NOT NULL,
  url VARCHAR(512) NOT NULL,
  display_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
);
```

### tenant_photo_galleries
```sql
CREATE TABLE tenant_photo_galleries (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  display_type VARCHAR(50) DEFAULT 'grid',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
);
```

### tenant_gallery_photos
```sql
CREATE TABLE tenant_gallery_photos (
  id UUID PRIMARY KEY,
  gallery_id UUID NOT NULL REFERENCES tenant_photo_galleries(id),
  url VARCHAR(512) NOT NULL,
  caption TEXT,
  alt VARCHAR(255) NOT NULL,
  display_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (gallery_id) REFERENCES tenant_photo_galleries(id) ON DELETE CASCADE
);
```

## API Endpoints Needed

### POST/PUT /api/settings/landing-page-media
Save media settings for a tenant

### GET /api/settings/landing-page-media
Retrieve media settings for a tenant

### DELETE /api/settings/landing-page-media/{mediaType}/{id}
Delete specific media item

## Status

✅ **Structure Created:**
- Types and interfaces defined
- Reusable components created
- Admin settings UI created
- Template configuration updated
- TenantLandingPage props updated

⏳ **TODO:**
- Create database migrations
- Implement API endpoints
- Integrate into TenantService
- Add to template pages (position per template preference)
- Test across all template variants
