import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// This API route requires Node.js runtime due to database access
export const runtime = 'nodejs';

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

// Helper function to convert database tenant to EnhancedTenant
function convertDbToEnhancedTenant(dbTenant: any): EnhancedTenant {
  const createdAtTime = dbTenant.created_at 
    ? (typeof dbTenant.created_at === 'string' ? new Date(dbTenant.created_at).getTime() : dbTenant.created_at.getTime())
    : Date.now();

  return {
    // Basic info
    subdomain: dbTenant.subdomain,
    emoji: dbTenant.emoji || '🏢',
    createdAt: createdAtTime,
    
    // New fields from database (convert snake_case to camelCase)
    id: dbTenant.id,
    businessName: dbTenant.business_name,
    businessCategory: dbTenant.business_category,
    ownerName: dbTenant.owner_name,
    email: dbTenant.email,
    phone: dbTenant.phone,
    address: dbTenant.address,
    businessDescription: dbTenant.business_description,
    logo: dbTenant.logo,
    
    // Brand colors
    brandColors: dbTenant.brand_colors,
    
    // Feature flags (convert snake_case to camelCase)
    whatsappEnabled: dbTenant.whatsapp_enabled,
    homeVisitEnabled: dbTenant.home_visit_enabled,
    analyticsEnabled: dbTenant.analytics_enabled,
    customTemplatesEnabled: dbTenant.custom_templates_enabled,
    multiStaffEnabled: dbTenant.multi_staff_enabled,
    
    // Subscription info (convert snake_case to camelCase)
    subscriptionPlan: dbTenant.subscription_plan,
    subscriptionStatus: dbTenant.subscription_status,
    subscriptionExpiresAt: dbTenant.subscription_expires_at,
    
    updatedAt: dbTenant.updated_at ? new Date(dbTenant.updated_at) : new Date(),
    
    // Computed properties for backward compatibility
    features: {
      whatsapp: dbTenant.whatsapp_enabled,
      homeVisit: dbTenant.home_visit_enabled,
      analytics: dbTenant.analytics_enabled,
      customTemplates: dbTenant.custom_templates_enabled,
      multiStaff: dbTenant.multi_staff_enabled,
    },
    subscription: {
      plan: dbTenant.subscription_plan as 'basic' | 'premium' | 'enterprise',
      status: dbTenant.subscription_status as 'active' | 'suspended' | 'cancelled',
      expiresAt: dbTenant.subscription_expires_at,
    },
  };
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ subdomain: string }> }
) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { subdomain } = await params;
    const sanitizedSubdomain = subdomain.toLowerCase().replace(/[^a-z0-9-]/g, '');
    
    if (!sanitizedSubdomain) {
      return NextResponse.json(
        { error: 'Subdomain is required' },
        { status: 400 }
      );
    }

    // Get tenant from Supabase
    const { data: tenantResult, error } = await supabase
      .from('tenants')
      .select('*')
      .eq('subdomain', sanitizedSubdomain)
      .limit(1)
      .single();
    
    if (error) {
      return NextResponse.json(
        { error: 'Tenant not found' },
        { status: 404 }
      );
    }
    
    if (!tenantResult) {
      return NextResponse.json(
        { error: 'Tenant not found' },
        { status: 404 }
      );
    }
    
    // Convert to EnhancedTenant format
    const enhancedTenant = convertDbToEnhancedTenant(tenantResult);
    
    return NextResponse.json(enhancedTenant);
  } catch (error) {
    console.error('Error getting tenant data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tenant data' },
      { status: 500 }
    );
  }
}