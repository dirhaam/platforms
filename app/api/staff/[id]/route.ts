export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getTenantFromRequest } from '@/lib/auth/tenant-auth';
import { RBAC } from '@/lib/auth/rbac';
import { TenantAuth } from '@/lib/auth/tenant-auth';

const getSupabaseClient = () => {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
};

// GET /api/staff/[id] - Get staff member details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: staffId } = await params;
    const tenant = await getTenantFromRequest(request);

    if (!tenant) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get session to check permissions
    const session = await TenantAuth.getSessionFromRequest(request);

    // Check if user can manage staff OR is viewing their own profile
    const canManageStaff = session && RBAC.hasPermission(session, 'manage_staff');
    const isOwnProfile = session?.userId === staffId;

    if (!canManageStaff && !isOwnProfile) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const supabase = getSupabaseClient();

    const { data: staff, error } = await supabase
      .from('staff')
      .select('*')
      .eq('id', staffId)
      .eq('tenant_id', tenant.id)
      .single();

    if (error || !staff) {
      console.error('Error fetching staff:', error);
      return NextResponse.json({ error: 'Staff not found' }, { status: 404 });
    }

    // Map database fields to response format
    const mappedStaff = {
      id: staff.id,
      tenantId: staff.tenant_id,
      name: staff.name,
      email: staff.email,
      phone: staff.phone,
      role: staff.role,
      isActive: staff.is_active,
      permissions: staff.permissions || [],
      createdAt: staff.created_at,
      updatedAt: staff.updated_at,
      lastLoginAt: staff.last_login_at,
    };

    return NextResponse.json({ staff: mappedStaff });
  } catch (error) {
    console.error('Error in GET /api/staff/[id]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/staff/[id] - Update staff member
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: staffId } = await params;
    const tenant = await getTenantFromRequest(request);

    if (!tenant) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get session to check permissions
    const session = await TenantAuth.getSessionFromRequest(request);

    // Only staff with manage_staff permission can update other staff
    // Staff can update their own profile
    const canManageStaff = session && RBAC.hasPermission(session, 'manage_staff');
    const isOwnProfile = session?.userId === staffId;

    if (!canManageStaff && !isOwnProfile) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { name, email, phone, role, isActive, permissions } = body;

    // Staff cannot change their own role/permissions
    if (isOwnProfile && (role !== undefined || permissions !== undefined)) {
      return NextResponse.json(
        { error: 'Cannot change your own role or permissions' },
        { status: 400 }
      );
    }

    // Only admins can change role/permissions
    if (!canManageStaff && (role !== undefined || permissions !== undefined)) {
      return NextResponse.json(
        { error: 'Only administrators can change role or permissions' },
        { status: 403 }
      );
    }

    const supabase = getSupabaseClient();

    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    if (name !== undefined) updateData.name = name;
    if (email !== undefined) updateData.email = email;
    if (phone !== undefined) updateData.phone = phone;
    if (isActive !== undefined) updateData.is_active = isActive;
    if (role !== undefined && canManageStaff) updateData.role = role;
    if (permissions !== undefined && canManageStaff) updateData.permissions = permissions;

    const { data: staff, error } = await supabase
      .from('staff')
      .update(updateData)
      .eq('id', staffId)
      .eq('tenant_id', tenant.id)
      .select()
      .single();

    if (error || !staff) {
      console.error('Error updating staff:', error);
      return NextResponse.json({ error: 'Failed to update staff' }, { status: 500 });
    }

    const mappedStaff = {
      id: staff.id,
      tenantId: staff.tenant_id,
      name: staff.name,
      email: staff.email,
      phone: staff.phone,
      role: staff.role,
      isActive: staff.is_active,
      permissions: staff.permissions || [],
      createdAt: staff.created_at,
      updatedAt: staff.updated_at,
    };

    return NextResponse.json({ staff: mappedStaff });
  } catch (error) {
    console.error('Error in PUT /api/staff/[id]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/staff/[id] - Delete/deactivate staff member
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: staffId } = await params;
    const tenant = await getTenantFromRequest(request);

    if (!tenant) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get session to check permissions
    const session = await TenantAuth.getSessionFromRequest(request);

    // Only admins can delete staff
    if (!session || !RBAC.hasPermission(session, 'manage_staff')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Cannot delete yourself
    if (session.userId === staffId) {
      return NextResponse.json(
        { error: 'Cannot delete your own account' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseClient();

    // Soft delete - set is_active to false
    const { data: staff, error } = await supabase
      .from('staff')
      .update({
        is_active: false,
        updated_at: new Date().toISOString(),
      })
      .eq('id', staffId)
      .eq('tenant_id', tenant.id)
      .select()
      .single();

    if (error || !staff) {
      console.error('Error deleting staff:', error);
      return NextResponse.json({ error: 'Failed to delete staff' }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Staff member deactivated' });
  } catch (error) {
    console.error('Error in DELETE /api/staff/[id]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
