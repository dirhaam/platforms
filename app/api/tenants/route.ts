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
  return {
    // Basic info
    subdomain: dbTenant.subdomain,
    emoji: dbTenant.emoji || '🏢',
    createdAt: dbTenant.createdAt ? dbTenant.createdAt.getTime() : Date.now(),
    
    // New fields from database
    id: dbTenant.id,
    businessName: dbTenant.businessName,
    businessCategory: dbTenant.businessCategory,
    ownerName: dbTenant.ownerName,
    email: dbTenant.email,
    phone: dbTenant.phone,
    address: dbTenant.address,
    businessDescription: dbTenant.businessDescription,
    logo: dbTenant.logo,
    
    // Brand colors
    brandColors: dbTenant.brandColors,
    
    // Feature flags
    whatsappEnabled: dbTenant.whatsappEnabled,
    homeVisitEnabled: dbTenant.homeVisitEnabled,
    analyticsEnabled: dbTenant.analyticsEnabled,
    customTemplatesEnabled: dbTenant.customTemplatesEnabled,
    multiStaffEnabled: dbTenant.multiStaffEnabled,
    
    // Subscription info
    subscriptionPlan: dbTenant.subscriptionPlan,
    subscriptionStatus: dbTenant.subscriptionStatus,
    subscriptionExpiresAt: dbTenant.subscriptionExpiresAt,
    
    updatedAt: dbTenant.updatedAt,
    
    // Computed properties for backward compatibility
    features: {
      whatsapp: dbTenant.whatsappEnabled,
      homeVisit: dbTenant.homeVisitEnabled,
      analytics: dbTenant.analyticsEnabled,
      customTemplates: dbTenant.customTemplatesEnabled,
      multiStaff: dbTenant.multiStaffEnabled,
    },
    subscription: {
      plan: dbTenant.subscriptionPlan as 'basic' | 'premium' | 'enterprise',
      status: dbTenant.subscriptionStatus as 'active' | 'suspended' | 'cancelled',
      expiresAt: dbTenant.subscriptionExpiresAt,
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

    // Create tenant data
    const newTenant = {
      id: crypto.randomUUID(),
      businessName: businessName.trim(),
      subdomain: subdomain.trim().toLowerCase(),
      businessCategory: businessCategory,
      ownerName: ownerName.trim(),
      email: ownerEmail.trim().toLowerCase(),
      phone: phone.trim(),
      address: address?.trim() || null,
      businessDescription: businessDescription?.trim() || null,
      emoji: emoji || '🏢',
      website: website?.trim() || null,
      
      // Feature flags
      whatsappEnabled: Boolean(whatsappEnabled),
      homeVisitEnabled: Boolean(homeVisitEnabled),
      analyticsEnabled: Boolean(analyticsEnabled),
      customTemplatesEnabled: Boolean(customTemplatesEnabled),
      multiStaffEnabled: Boolean(multiStaffEnabled),
      
      // Subscription
      subscriptionPlan: subscriptionPlan || 'basic',
      subscriptionStatus: 'active',
      subscriptionExpiresAt: null,
      
      // Metadata
      passwordHash: '',
      lastLoginAt: null,
      loginAttempts: 0,
      lockedUntil: null,
      passwordResetToken: null,
      passwordResetExpires: null,
      
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
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