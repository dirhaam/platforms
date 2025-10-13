import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/database';
import { tenants } from '@/lib/database/schema';
import { desc } from 'drizzle-orm';

// This API route requires Node.js runtime due to database access
export const runtime = 'edge';

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