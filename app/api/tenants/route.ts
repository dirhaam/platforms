import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/database/server';
import { tenants } from '@/lib/database/schema';
import { desc, eq } from 'drizzle-orm';

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
    // Get all tenants from PostgreSQL database, ordered by creation date
    const dbTenants = await db.select().from(tenants).orderBy(desc(tenants.createdAt));
    
    // Convert to EnhancedTenant format
    const enhancedTenants = dbTenants.map(convertDbToEnhancedTenant);
    
    return NextResponse.json({ tenants: enhancedTenants });
  } catch (error) {
    console.error('Error getting all tenants:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tenants data' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
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
    const existingSubdomain = await db.select()
      .from(tenants)
      .where(eq(tenants.subdomain, subdomain))
      .limit(1);
    
    if (existingSubdomain.length > 0) {
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
      subscriptionExpiresAt: null, // Will be set based on plan in a real implementation
      
      // Metadata
      passwordHash: '', // Will be set when tenant owner creates an account
      lastLoginAt: null,
      loginAttempts: 0,
      lockedUntil: null,
      passwordResetToken: null,
      passwordResetExpires: null,
      
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Insert tenant into database
    const result = await db.insert(tenants).values(newTenant).returning();
    
    if (!result || result.length === 0) {
      throw new Error('Failed to create tenant');
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