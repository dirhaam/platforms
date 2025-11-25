'use client';

import { cn } from '@/lib/utils';

type IconType = 'regular' | 'solid' | 'logos';

interface BoxIconProps {
  name: string;
  type?: IconType;
  size?: number | string;
  className?: string;
  animate?: 'spin' | 'tada' | 'flashing' | 'burst' | 'fade-left' | 'fade-right' | 'fade-up' | 'fade-down' | 'rotate';
}

/**
 * BoxIcon Component - Uses BoxIcons CSS (loaded via CDN in layout)
 * 
 * Usage:
 * <BoxIcon name="home" /> - Regular icon
 * <BoxIcon name="home" type="solid" /> - Solid icon
 * <BoxIcon name="whatsapp" type="logos" /> - Brand/Logo icon
 * <BoxIcon name="loader-alt" animate="spin" /> - Animated icon
 * 
 * Icon reference: https://boxicons.com/
 */
export function BoxIcon({ 
  name, 
  type = 'regular', 
  size = 24, 
  className,
  animate
}: BoxIconProps) {
  const animateClass = animate ? `bx-${animate}` : '';
  const sizeValue = typeof size === 'number' ? `${size}px` : size;

  // Brands use different class structure: "bxl bx-{name}"
  if (type === 'logos') {
    return (
      <i 
        className={cn('bxl', `bx-${name}`, animateClass, className)}
        style={{
          fontSize: sizeValue,
          lineHeight: 1,
        }}
      />
    );
  }

  // Regular and solid icons: "bx bx-{name}" or "bx bxs-{name}"
  const prefix = type === 'solid' ? 'bxs' : 'bx';
  const iconClass = `${prefix}-${name}`;

  return (
    <i 
      className={cn('bx', iconClass, animateClass, className)}
      style={{
        fontSize: sizeValue,
        lineHeight: 1,
      }}
    />
  );
}

// Common icon mappings from Lucide to BoxIcon for reference
export const LUCIDE_TO_BOXICON: Record<string, { name: string; type?: IconType }> = {
  // Navigation & UI
  Home: { name: 'home' },
  Menu: { name: 'menu' },
  X: { name: 'x' },
  ChevronLeft: { name: 'chevron-left' },
  ChevronRight: { name: 'chevron-right' },
  ChevronUp: { name: 'chevron-up' },
  ChevronDown: { name: 'chevron-down' },
  ArrowLeft: { name: 'arrow-back' },
  ArrowRight: { name: 'right-arrow-alt' },
  ArrowUp: { name: 'up-arrow-alt' },
  ArrowDown: { name: 'down-arrow-alt' },
  
  // Actions
  Plus: { name: 'plus' },
  Minus: { name: 'minus' },
  Edit: { name: 'edit' },
  Edit2: { name: 'pencil' },
  Trash: { name: 'trash' },
  Trash2: { name: 'trash-alt' },
  Save: { name: 'save' },
  Copy: { name: 'copy' },
  Check: { name: 'check' },
  Search: { name: 'search' },
  Filter: { name: 'filter-alt' },
  Settings: { name: 'cog' },
  RefreshCw: { name: 'refresh' },
  Download: { name: 'download' },
  Upload: { name: 'upload' },
  ExternalLink: { name: 'link-external' },
  Eye: { name: 'show' },
  EyeOff: { name: 'hide' },
  Lock: { name: 'lock' },
  Unlock: { name: 'lock-open' },
  
  // Business
  Calendar: { name: 'calendar' },
  Clock: { name: 'time' },
  Users: { name: 'group' },
  User: { name: 'user' },
  Building2: { name: 'buildings' },
  Briefcase: { name: 'briefcase' },
  DollarSign: { name: 'dollar' },
  CreditCard: { name: 'credit-card' },
  
  // Communication
  Mail: { name: 'envelope' },
  Phone: { name: 'phone' },
  MessageSquare: { name: 'message-square' },
  Bell: { name: 'bell' },
  
  // Charts
  BarChart2: { name: 'bar-chart-alt-2' },
  TrendingUp: { name: 'trending-up' },
  TrendingDown: { name: 'trending-down' },
  Activity: { name: 'pulse' },
  
  // Status
  AlertCircle: { name: 'error-circle' },
  AlertTriangle: { name: 'error' },
  CheckCircle: { name: 'check-circle' },
  XCircle: { name: 'x-circle' },
  Info: { name: 'info-circle' },
  
  // Misc
  Loader2: { name: 'loader-alt' },
  LogOut: { name: 'log-out' },
  Power: { name: 'power-off' },
  Globe: { name: 'globe' },
  Sun: { name: 'sun' },
  Moon: { name: 'moon' },
  Star: { name: 'star' },
  MapPin: { name: 'map-pin' },
  
  // Brands
  WhatsApp: { name: 'whatsapp', type: 'logos' },
};
