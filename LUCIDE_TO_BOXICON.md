# Lucide to BoxIcon Migration Guide

## Overview

Project ini sedang migrasi dari **Lucide React** ke **BoxIcon** untuk konsistensi icon library.

BoxIcon menggunakan **CSS font-based icons** yang sudah di-load di layout:
- CSS: `/public/fonts/boxicons/boxicons.css`
- Font files: `.woff2`, `.woff`, `.ttf` (bundled)

**Keuntungan:**
- Tidak perlu copy SVG files satu per satu
- Font di-cache browser
- Ukuran lebih kecil (~150KB untuk semua icons)

## BoxIcon Component

Gunakan komponen `BoxIcon` dari `@/components/ui/box-icon`:

```tsx
import { BoxIcon } from '@/components/ui/box-icon';

// Regular icon
<BoxIcon name="home" size={24} />

// Solid icon  
<BoxIcon name="home" type="solid" size={24} />

// Brand/Logo icon
<BoxIcon name="whatsapp" type="logos" size={24} />

// Animated icon
<BoxIcon name="loader-alt" animate="spin" size={24} />
```

**Atau langsung pakai class CSS:**
```tsx
<i className="bx bx-home" style={{ fontSize: '24px' }}></i>
<i className="bx bxs-home"></i>  // Solid
<i className="bx bxl-whatsapp"></i>  // Logo/Brand
<i className="bx bx-loader-alt bx-spin"></i>  // Animated
```

## Icon Mapping (Lucide → BoxIcon)

### Navigation & UI
| Lucide | BoxIcon | Type |
|--------|---------|------|
| `Home` | `home` | regular |
| `Menu` | `menu` | regular |
| `X` | `x` | regular |
| `ChevronLeft` | `chevron-left` | regular |
| `ChevronRight` | `chevron-right` | regular |
| `ChevronUp` | `chevron-up` | regular |
| `ChevronDown` | `chevron-down` | regular |
| `ArrowLeft` | `arrow-back` | regular |
| `ArrowRight` | `right-arrow-alt` | regular |
| `ArrowUp` | `up-arrow-alt` | regular |
| `ArrowDown` | `down-arrow-alt` | regular |

### Actions
| Lucide | BoxIcon | Type |
|--------|---------|------|
| `Plus` | `plus` | regular |
| `Minus` | `minus` | regular |
| `Edit` | `edit` | regular |
| `Edit2` | `pencil` | regular |
| `Trash` | `trash` | regular |
| `Trash2` | `trash-alt` | regular |
| `Save` | `save` | regular |
| `Copy` | `copy` | regular |
| `Check` | `check` | regular |
| `Search` | `search` | regular |
| `Filter` | `filter-alt` | regular |
| `Settings` | `cog` | regular |
| `RefreshCw` | `refresh` | regular |
| `Download` | `download` | regular |
| `Upload` | `upload` | regular |
| `ExternalLink` | `link-external` | regular |
| `Link` | `link` | regular |
| `Eye` | `show` | regular |
| `EyeOff` | `hide` | regular |
| `Lock` | `lock` | regular |
| `Unlock` | `lock-open` | regular |

### Business & Commerce
| Lucide | BoxIcon | Type |
|--------|---------|------|
| `Calendar` | `calendar` | regular |
| `Clock` | `time` | regular |
| `Users` | `group` | regular |
| `User` | `user` | regular |
| `UserPlus` | `user-plus` | regular |
| `Building` | `building` | regular |
| `Building2` | `buildings` | regular |
| `Briefcase` | `briefcase` | regular |
| `DollarSign` | `dollar` | regular |
| `CreditCard` | `credit-card` | regular |
| `Wallet` | `wallet` | regular |
| `ShoppingCart` | `cart` | regular |
| `Package` | `package` | regular |
| `Tag` | `purchase-tag` | regular |

### Communication
| Lucide | BoxIcon | Type |
|--------|---------|------|
| `Mail` | `envelope` | regular |
| `Phone` | `phone` | regular |
| `MessageSquare` | `message-square` | regular |
| `MessageCircle` | `message-rounded` | regular |
| `Bell` | `bell` | regular |
| `Send` | `send` | regular |

### Data & Analytics
| Lucide | BoxIcon | Type |
|--------|---------|------|
| `BarChart` | `bar-chart` | regular |
| `BarChart2` | `bar-chart-alt-2` | regular |
| `BarChart3` | `bar-chart-square` | regular |
| `LineChart` | `line-chart` | regular |
| `PieChart` | `pie-chart` | regular |
| `TrendingUp` | `trending-up` | regular |
| `TrendingDown` | `trending-down` | regular |
| `Activity` | `pulse` | regular |
| `Target` | `target-lock` | regular |

### Status & Alerts
| Lucide | BoxIcon | Type |
|--------|---------|------|
| `AlertCircle` | `error-circle` | regular |
| `AlertTriangle` | `error` | regular |
| `CheckCircle` | `check-circle` | regular |
| `XCircle` | `x-circle` | regular |
| `Info` | `info-circle` | regular |
| `HelpCircle` | `help-circle` | regular |

### Files & Documents
| Lucide | BoxIcon | Type |
|--------|---------|------|
| `File` | `file` | regular |
| `FileText` | `file-doc` | regular |
| `Folder` | `folder` | regular |
| `Image` | `image` | regular |
| `Video` | `video` | regular |

### Location
| Lucide | BoxIcon | Type |
|--------|---------|------|
| `MapPin` | `map-pin` | regular |
| `Map` | `map` | regular |
| `Globe` | `globe` | regular |
| `Navigation` | `navigation` | regular |
| `Compass` | `compass` | regular |

### Devices & Tech
| Lucide | BoxIcon | Type |
|--------|---------|------|
| `Smartphone` | `mobile` | regular |
| `Monitor` | `desktop` | regular |
| `Laptop` | `laptop` | regular |
| `Wifi` | `wifi` | regular |
| `Database` | `data` | regular |
| `Server` | `server` | regular |
| `Cloud` | `cloud` | regular |

### Miscellaneous
| Lucide | BoxIcon | Type |
|--------|---------|------|
| `Star` | `star` | regular |
| `Heart` | `heart` | regular |
| `Sun` | `sun` | regular |
| `Moon` | `moon` | regular |
| `Zap` | `bolt` | regular |
| `Shield` | `shield` | regular |
| `Award` | `award` | regular |
| `Gift` | `gift` | regular |
| `Camera` | `camera` | regular |
| `Loader2` | `loader-alt` | regular |
| `MoreHorizontal` | `dots-horizontal-rounded` | regular |
| `MoreVertical` | `dots-vertical-rounded` | regular |
| `Grip` | `grid` | regular |
| `List` | `list-ul` | regular |
| `LayoutGrid` | `grid-alt` | regular |
| `Power` | `power-off` | regular |
| `LogOut` | `log-out` | regular |
| `LogIn` | `log-in` | regular |
| `Contact` | `id-card` | regular |
| `Crown` | `crown` | regular |
| `Ban` | `block` | regular |
| `Command` | `command` | regular |

### Brand Icons (type: 'logos')
| Lucide | BoxIcon | Type |
|--------|---------|------|
| - | `whatsapp` | logos |
| - | `instagram` | logos |
| - | `facebook` | logos |
| - | `twitter` | logos |
| - | `google` | logos |
| - | `github` | logos |

## Migration Steps

### Before (Lucide)
```tsx
import { Home, Calendar, Users } from 'lucide-react';

<Home className="w-5 h-5" />
<Calendar className="w-5 h-5 text-blue-500" />
```

### After (BoxIcon)
```tsx
import { BoxIcon } from '@/components/ui/box-icon';

<BoxIcon name="home" size={20} />
<BoxIcon name="calendar" size={20} className="text-blue-500" />
```

## Files Already Migrated

- [x] `/components/ui/box-icon.tsx` - BoxIcon component
- [x] `/components/tenant/Sidebar.tsx`
- [x] `/components/tenant/Navbar.tsx`
- [x] `/components/tenant/ExpiredOverlay.tsx`

## Files To Migrate

See full list with: `grep -r "from 'lucide-react'" --include="*.tsx" .`

## BoxIcon Reference

Full icon list: https://boxicons.com/

- Regular: `bx-{name}` → `name="name"`
- Solid: `bxs-{name}` → `name="name" type="solid"`
- Logos: `bxl-{name}` → `name="name" type="logos"`
