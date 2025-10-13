// Business categories for registration
export const BUSINESS_CATEGORIES = [
  'Beauty & Wellness',
  'Healthcare',
  'Fitness & Sports',
  'Education & Training',
  'Professional Services',
  'Home Services',
  'Automotive',
  'Food & Beverage',
  'Entertainment',
  'Other'
] as const;

export type BusinessCategory = typeof BUSINESS_CATEGORIES[number];

// Enhanced tenant data structure (compatible with database types)
export interface EnhancedTenant {
  // Existing fields from current SubdomainData
  subdomain: string;
  emoji: string;
  createdAt: number;
  
  // New fields for enhanced functionality
  id: string;
  businessName: string;
  businessCategory: string;
  ownerName: string;
  email: string;
  phone: string;
  address?: string;
  businessDescription?: string;
  logo?: string;
  
  // Brand colors
  brandColors?: {
    primary: string;
    secondary: string;
    accent: string;
  };
  
  // Feature flags (matching database schema)
  whatsappEnabled: boolean;
  homeVisitEnabled: boolean;
  analyticsEnabled: boolean;
  customTemplatesEnabled: boolean;
  multiStaffEnabled: boolean;
  
  // Subscription info
  subscriptionPlan: string;
  subscriptionStatus: string;
  subscriptionExpiresAt?: Date;
  
  updatedAt: Date;
  
  // Computed properties for backward compatibility
  features: {
    whatsapp: boolean;
    homeVisit: boolean;
    analytics: boolean;
    customTemplates: boolean;
    multiStaff: boolean;
  };
  subscription: {
    plan: 'basic' | 'premium' | 'enterprise';
    status: 'active' | 'suspended' | 'cancelled';
    expiresAt?: Date;
  };
}

// Registration data interface
export interface TenantRegistrationData {
  // Existing fields
  subdomain: string;
  icon: string;
  
  // New fields
  businessName: string;
  ownerName: string;
  email: string;
  phone: string;
  businessCategory: BusinessCategory;
  businessDescription?: string;
  address?: string;
}

export function isValidIcon(str: string) {
  if (str.length > 10) {
    return false;
  }

  try {
    // Primary validation: Check if the string contains at least one emoji character
    // This regex pattern matches most emoji Unicode ranges
    const emojiPattern = /[\\p{Emoji}]/u;
    if (emojiPattern.test(str)) {
      return true;
    }
  } catch (error) {
    // If the regex fails (e.g., in environments that don't support Unicode property escapes),
    // fall back to a simpler validation
    console.warn(
      'Emoji regex validation failed, using fallback validation',
      error
    );
  }

  // Fallback validation: Check if the string is within a reasonable length
  // This is less secure but better than no validation
  return str.length >= 1 && str.length <= 10;
}