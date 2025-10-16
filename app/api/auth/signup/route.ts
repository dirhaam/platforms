import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';

interface SignUpRequest {
  email: string;
  password: string;
  name: string;
  role: 'owner' | 'staff' | 'superadmin';
  businessName?: string;
  subdomain?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: SignUpRequest = await request.json();
    const { email, password, name, role, businessName, subdomain } = body;

    // Validate input
    if (!email || !password || !name || !role) {
      return NextResponse.json(
        { success: false, error: 'Email, password, name, and role are required' },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { success: false, error: 'Password must be at least 8 characters' },
        { status: 400 }
      );
    }

    // Validate superadmin email requirement
    if (role === 'superadmin' && !email.includes('@booqing.my.id')) {
      return NextResponse.json(
        { success: false, error: 'Super admin must use @booqing.my.id email address' },
        { status: 400 }
      );
    }

    // Initialize Supabase client
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Check if user already exists in super_admins
    const { data: existingSuperAdmin } = await supabase
      .from('super_admins')
      .select('email')
      .eq('email', email)
      .single();

    if (existingSuperAdmin) {
      return NextResponse.json(
        { success: false, error: 'Email already registered as super admin' },
        { status: 400 }
      );
    }

    // Check if user already exists in tenants
    const { data: existingTenant } = await supabase
      .from('tenants')
      .select('email')
      .eq('email', email)
      .single();

    if (existingTenant) {
      return NextResponse.json(
        { success: false, error: 'Email already registered' },
        { status: 400 }
      );
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    if (role === 'owner') {
      // Validate owner-specific fields
      if (!businessName || !subdomain) {
        return NextResponse.json(
          { success: false, error: 'Business name and subdomain are required for business owners' },
          { status: 400 }
        );
      }

      // Check if subdomain is already taken
      const { data: existingSubdomain } = await supabase
        .from('tenants')
        .select('subdomain')
        .eq('subdomain', subdomain)
        .single();

      if (existingSubdomain) {
        return NextResponse.json(
          { success: false, error: 'Subdomain already taken. Please choose another one.' },
          { status: 400 }
        );
      }

      // Create tenant record
      const { data: tenant, error: tenantError } = await supabase
        .from('tenants')
        .insert({
          email,
          subdomain,
          business_name: businessName,
          owner_name: name,
          password_hash: passwordHash,
          business_category: 'General', // Default category
          phone: '', // Will be filled later
          subscription_plan: 'basic',
          subscription_status: 'active',
        })
        .select()
        .single();

      if (tenantError) {
        console.error('Tenant creation error:', tenantError);
        return NextResponse.json(
          { success: false, error: 'Failed to create business account' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        message: 'Business account created successfully',
        tenant: {
          id: tenant.id,
          email: tenant.email,
          subdomain: tenant.subdomain,
          business_name: tenant.business_name,
        },
      });

    } else if (role === 'superadmin') {
      // Create superadmin record
      const { data: superAdmin, error: superAdminError } = await supabase
        .from('super_admins')
        .insert({
          email,
          name,
          password_hash: passwordHash,
          permissions: '["*"]',
          can_access_all_tenants: true,
        })
        .select()
        .single();

      if (superAdminError) {
        console.error('Super Admin creation error:', superAdminError);
        return NextResponse.json(
          { success: false, error: 'Failed to create super admin account' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        message: 'Super admin account created successfully',
        superAdmin: {
          id: superAdmin.id,
          email: superAdmin.email,
          name: superAdmin.name,
        },
      });

    } else if (role === 'staff') {
      // For staff, we need to create a basic record or wait for invitation
      // For now, create a simple staff record that can be updated later
      const tempTenantId = 'pending'; // Will be updated when invited
      
      // Create staff record (this will need to be associated with a tenant later)
      // For now, we'll just return success since staff needs to be invited by owner
      return NextResponse.json({
        success: true,
        message: 'Staff account created. You will need to be invited to join a business by the owner.',
        staff: {
          email,
          name,
          role: 'staff',
          status: 'pending_invitation',
        },
      });
    }

  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
