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

export async function GET() {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Get all tenants from Supabase, try to order if possible
    let query = supabase.from('tenants').select('*');
    
    // Try to order by a common column, fallback to no ordering if it fails
    const { data: dbTenants, error } = await query.order('id', { ascending: false });
    
    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { error: 'Database query failed', details: error.message },
        { status: 500 }
      );
    }
    
    // Convert to EnhancedTenant format
    const enhancedTenants = (dbTenants || []).map(convertDbToEnhancedTenant);
    
    return NextResponse.json({ tenants: enhancedTenants });
  } catch (error) {
    console.error('Error getting all tenants:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Failed to fetch tenants data', details: errorMessage },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const body = await request.json();
    
    const {
      businessName,
      subdomain,
      businessCategory,
      ownerName,
      ownerEmail,
      phone,
      address,
      businessDescription,
      whatsappEnabled,
      homeVisitEnabled,
      analyticsEnabled,
      customTemplatesEnabled,
      multiStaffEnabled,
      subscriptionPlan,
      emoji,
      website
    } = body;

    // Validation
    if (!businessName || !subdomain || !businessCategory || !ownerName || !ownerEmail || !phone) {
      return NextResponse.json(
        { error: 'Missing required fields: businessName, subdomain, businessCategory, ownerName, ownerEmail, phone' },
        { status: 400 }
      );
    }

    // Check if subdomain already exists
    const { data: existingSubdomain, error: checkError } = await supabase
      .from('tenants')
      .select('id')
      .eq('subdomain', subdomain.trim().toLowerCase())
      .limit(1);
    
    if (checkError) throw checkError;
    
    if (existingSubdomain && existingSubdomain.length > 0) {
      return NextResponse.json(
        { error: 'Subdomain already exists. Please choose a different subdomain.' },
        { status: 409 }
      );
    }

    // Create tenant data - use snake_case for database columns
    const newTenant = {
      id: crypto.randomUUID(),
      business_name: businessName.trim(),
      subdomain: subdomain.trim().toLowerCase(),
      business_category: businessCategory,
      owner_name: ownerName.trim(),
      email: ownerEmail.trim().toLowerCase(),
      phone: phone.trim(),
      address: address?.trim() || null,
      business_description: businessDescription?.trim() || null,
      emoji: emoji || '🏢',
      
      // Feature flags (snake_case)
      whatsapp_enabled: Boolean(whatsappEnabled),
      home_visit_enabled: Boolean(homeVisitEnabled),
      analytics_enabled: Boolean(analyticsEnabled),
      custom_templates_enabled: Boolean(customTemplatesEnabled),
      multi_staff_enabled: Boolean(multiStaffEnabled),
      
      // Subscription (snake_case)
      subscription_plan: subscriptionPlan || 'basic',
      subscription_status: 'active',
      subscription_expires_at: null,
      
      // Metadata (snake_case)
      password_hash: '',
      last_login_at: null,
      login_attempts: 0,
      locked_until: null,
      password_reset_token: null,
      password_reset_expires: null,
      
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Insert tenant into database
    const { data: result, error: insertError } = await supabase
      .from('tenants')
      .insert([newTenant])
      .select();
    
    if (insertError || !result || result.length === 0) {
      throw insertError || new Error('Failed to create tenant');
    }

    const createdTenant = result[0];
    const enhancedTenant = convertDbToEnhancedTenant(createdTenant);

    return NextResponse.json({
      success: true,
      tenant: enhancedTenant
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating tenant:', error);
    
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to create tenant' },
      { status: 500 }
    );
  }
}