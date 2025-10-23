// app/api/admin/superadmins/route.ts
import { NextResponse } from 'next/server';
import { SuperAdminService } from '@/lib/auth/superadmin-service';
import { getServerSession } from '@/lib/auth/auth-middleware';

export async function POST(request: Request) {
  try {
    // Check if the current user is a superadmin
    const session = await getServerSession();
    if (!session || !session.isSuperAdmin) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: SuperAdmin access required' },
        { status: 403 }
      );
    }

    const { email, name, password, phone, permissions = ['*'], canAccessAllTenants = true } = await request.json();

    // Validate required fields
    if (!email || !name || !password) {
      return NextResponse.json(
        { success: false, error: 'Email, name, and password are required' },
        { status: 400 }
      );
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Check if superadmin already exists
    const existing = await SuperAdminService.findByEmail(email);
    if (existing) {
      return NextResponse.json(
        { success: false, error: 'A superadmin with this email already exists' },
        { status: 409 }
      );
    }

    // Create the new superadmin
    const newSuperAdmin = await SuperAdminService.create({
      email,
      name,
      password,
    });

    // Update additional fields if provided
    const updates: any = {};
    
    if (phone) updates.phone = phone;
    if (permissions && JSON.stringify(permissions) !== JSON.stringify(['*'])) updates.permissions = permissions;
    if (canAccessAllTenants !== undefined && canAccessAllTenants !== true) updates.canAccessAllTenants = canAccessAllTenants;
    
    if (Object.keys(updates).length > 0) {
      await SuperAdminService.update(newSuperAdmin.id, updates);
    }

    return NextResponse.json({
      success: true,
      message: 'SuperAdmin created successfully',
      superadmin: {
        id: newSuperAdmin.id,
        email: newSuperAdmin.email,
        name: newSuperAdmin.name,
        isActive: newSuperAdmin.isActive,
        canAccessAllTenants: newSuperAdmin.canAccessAllTenants,
        createdAt: newSuperAdmin.createdAt,
      }
    });

  } catch (error) {
    console.error('Error creating superadmin:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to create superadmin' 
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    // Check if the current user is a superadmin
    const session = await getServerSession();
    if (!session || !session.isSuperAdmin) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: SuperAdmin access required' },
        { status: 403 }
      );
    }

    // Get all superadmins (excluding password hashes for security)
    const superAdmins = await SuperAdminService.list();
    
    console.log(`[SuperAdmins GET] Found ${superAdmins.length} superadmins`);
    
    const safeSuperAdmins = superAdmins.map(sa => ({
      id: sa.id,
      email: sa.email,
      name: sa.name,
      isActive: sa.isActive,
      canAccessAllTenants: sa.canAccessAllTenants,
      lastLoginAt: sa.lastLoginAt,
      loginAttempts: sa.loginAttempts,
      lockedUntil: sa.lockedUntil,
      permissions: sa.permissions,
      createdAt: sa.createdAt,
      updatedAt: sa.updatedAt,
    }));

    return NextResponse.json({
      success: true,
      superadmins: safeSuperAdmins,
      count: safeSuperAdmins.length,
    });

  } catch (error) {
    console.error('[SuperAdmins GET] Error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to fetch superadmins',
        details: process.env.NODE_ENV === 'development' ? String(error) : undefined
      },
      { status: 500 }
    );
  }
}