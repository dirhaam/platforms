// lib/subdomain-fetcher.ts - Client-side fetcher for tenant data

// Enhanced tenant data structure (compatible with database types)
interface EnhancedTenant {
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

// Fetch tenant data by subdomain from API
export async function fetchTenantBySubdomain(subdomain: string): Promise<EnhancedTenant | null> {
  try {
    const response = await fetch(`/api/tenants/${encodeURIComponent(subdomain)}`);
    
    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      throw new Error(`Failed to fetch tenant data: ${response.status} ${response.statusText}`);
    }
    
    const tenantData = await response.json();
    return tenantData as EnhancedTenant;
  } catch (error) {
    console.error('Error fetching tenant by subdomain:', error);
    return null;
  }
}

// Fetch all tenants from API
export async function fetchAllTenants(): Promise<EnhancedTenant[]> {
  try {
    const response = await fetch('/api/tenants');
    
    if (!response.ok) {
      throw new Error(`Failed to fetch all tenants: ${response.status} ${response.statusText}`);
    }
    
    const { tenants } = await response.json();
    return tenants as EnhancedTenant[];
  } catch (error) {
    console.error('Error fetching all tenants:', error);
    return [];
  }
}