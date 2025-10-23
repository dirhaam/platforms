import { createClient } from '@supabase/supabase-js';
import { TenantAuth } from './tenant-auth';

const DEFAULT_SUPERADMIN_EMAIL = process.env.DEFAULT_SUPERADMIN_EMAIL || '';
const DEFAULT_SUPERADMIN_PASSWORD = process.env.DEFAULT_SUPERADMIN_PASSWORD || '';

export interface SuperAdmin {
  id: string;
  email: string;
  name: string;
  isActive: boolean;
  passwordHash: string;
  lastLoginAt?: Date | null;
  loginAttempts: number;
  lockedUntil?: Date | null;
  passwordResetToken?: string | null;
  passwordResetExpires?: Date | null;
  permissions: string[];
  canAccessAllTenants: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const mapRow = (row: any): SuperAdmin => ({
  id: row.id,
  email: row.email,
  name: row.name,
  isActive: row.is_active ?? true,
  passwordHash: row.password_hash,
  lastLoginAt: row.last_login_at ?? null,
  loginAttempts: row.login_attempts ?? 0,
  lockedUntil: row.locked_until ?? null,
  passwordResetToken: row.password_reset_token ?? null,
  passwordResetExpires: row.password_reset_expires ?? null,
  permissions: Array.isArray(row.permissions) ? row.permissions : [],
  canAccessAllTenants: row.can_access_all_tenants ?? true,
  createdAt: row.created_at ?? new Date(),
  updatedAt: row.updated_at ?? new Date(),
});

const buildUpdate = (updates: Partial<SuperAdmin>) => {
  const data: any = {
    updated_at: new Date().toISOString(),
  };

  if (updates.email !== undefined) data.email = updates.email;
  if (updates.name !== undefined) data.name = updates.name;
  if (updates.isActive !== undefined) data.is_active = updates.isActive;
  if (updates.passwordHash !== undefined) data.password_hash = updates.passwordHash;
  if (updates.lastLoginAt !== undefined) data.last_login_at = updates.lastLoginAt?.toISOString() ?? null;
  if (updates.loginAttempts !== undefined) data.login_attempts = updates.loginAttempts;
  if (updates.lockedUntil !== undefined) data.locked_until = updates.lockedUntil?.toISOString() ?? null;
  if (updates.passwordResetToken !== undefined) data.password_reset_token = updates.passwordResetToken ?? null;
  if (updates.passwordResetExpires !== undefined) data.password_reset_expires = updates.passwordResetExpires?.toISOString() ?? null;
  if (updates.permissions !== undefined) data.permissions = updates.permissions ?? [];
  if (updates.canAccessAllTenants !== undefined) data.can_access_all_tenants = updates.canAccessAllTenants;

  return data;
};

export class SuperAdminService {
  private static async ensureDefaultSuperAdmin(): Promise<void> {
    if (process.env.NODE_ENV === 'production') {
      return;
    }

    const existing = await this.findByEmail(DEFAULT_SUPERADMIN_EMAIL);
    if (!existing) {
      await this.create({
        email: DEFAULT_SUPERADMIN_EMAIL,
        name: 'Development SuperAdmin',
        password: DEFAULT_SUPERADMIN_PASSWORD,
      });
      console.warn(
        `[SuperAdminService] Created default super admin ${DEFAULT_SUPERADMIN_EMAIL} (development only)`
      );
    }
  }

  // Create SuperAdmin
  static async create(data: {
    email: string;
    name: string;
    password: string;
  }): Promise<SuperAdmin> {
    const { email, name, password } = data;
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Check if email already exists
    const existing = await this.findByEmail(email);
    if (existing) {
      throw new Error('SuperAdmin with this email already exists');
    }

    // Hash password
    const passwordHash = await TenantAuth.hashPassword(password);

    const { data: created, error: insertError } = await supabase
      .from('super_admins')
      .insert({
        id: crypto.randomUUID(),
        email,
        name,
        is_active: true,
        password_hash: passwordHash,
        login_attempts: 0,
        permissions: ['*'],
        can_access_all_tenants: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (insertError || !created) {
      throw insertError || new Error('Failed to create SuperAdmin');
    }

    return mapRow(created);
  }

  // Find SuperAdmin by email
  static async findByEmail(email: string): Promise<SuperAdmin | null> {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: row, error } = await supabase
      .from('super_admins')
      .select('*')
      .eq('email', email)
      .limit(1)
      .single();

    return error ? null : (row ? mapRow(row) : null);
  }

  // Find SuperAdmin by ID
  static async findById(id: string): Promise<SuperAdmin | null> {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: row, error } = await supabase
      .from('super_admins')
      .select('*')
      .eq('id', id)
      .limit(1)
      .single();

    return error ? null : (row ? mapRow(row) : null);
  }

  // Update SuperAdmin
  static async update(id: string, updates: Partial<SuperAdmin>): Promise<SuperAdmin> {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const existing = await this.findById(id);
    if (!existing) {
      throw new Error('SuperAdmin not found');
    }

    const data = buildUpdate(updates);
    const { error: updateError } = await supabase
      .from('super_admins')
      .update(data)
      .eq('id', id);

    if (updateError) throw updateError;

    const { data: row, error: fetchError } = await supabase
      .from('super_admins')
      .select('*')
      .eq('id', id)
      .limit(1)
      .single();

    if (fetchError || !row) throw fetchError || new Error('Failed to fetch updated SuperAdmin');
    return mapRow(row);
  }

  // List all SuperAdmins
  static async list(): Promise<SuperAdmin[]> {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: rows, error } = await supabase
      .from('super_admins')
      .select('*')
      .order('created_at', { ascending: false });

    if (error || !rows) return [];
    return rows.map(mapRow);
  }

  // Delete SuperAdmin
  static async delete(id: string): Promise<void> {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const existing = await this.findById(id);
    if (!existing) {
      throw new Error('SuperAdmin not found');
    }

    const { error } = await supabase
      .from('super_admins')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  // Authenticate SuperAdmin
  static async authenticate(
    email: string,
    password: string
  ): Promise<{ success: boolean; superAdmin?: SuperAdmin; error?: string }> {
    try {
      await this.ensureDefaultSuperAdmin();

      const superAdmin = await this.findByEmail(email);
      
      if (!superAdmin) {
        return { success: false, error: 'Invalid credentials' };
      }

      if (!superAdmin.isActive) {
        return { success: false, error: 'Account is deactivated' };
      }

      // Check if account is locked
      if (superAdmin.lockedUntil && superAdmin.lockedUntil > new Date()) {
        return { success: false, error: 'Account is temporarily locked' };
      }

      // Verify password
      const isValidPassword = await TenantAuth.verifyPassword(password, superAdmin.passwordHash);
      if (!isValidPassword) {
        // Increment login attempts
        const newAttempts = superAdmin.loginAttempts + 1;
        const shouldLock = newAttempts >= 5;
        
        await this.update(superAdmin.id, {
          loginAttempts: newAttempts,
          lockedUntil: shouldLock ? new Date(Date.now() + 30 * 60 * 1000) : null, // 30 minutes
        });

        return { success: false, error: 'Invalid credentials' };
      }

      // Reset login attempts on successful login
      const updatedSuperAdmin = await this.update(superAdmin.id, {
        loginAttempts: 0,
        lockedUntil: null,
        lastLoginAt: new Date(),
      });

      return { success: true, superAdmin: updatedSuperAdmin };
    } catch (error) {
      console.error('SuperAdmin authentication error:', error);
      return { success: false, error: 'Authentication failed' };
    }
  }

  // Set password
  static async setPassword(id: string, newPassword: string): Promise<void> {
    const passwordHash = await TenantAuth.hashPassword(newPassword);
    await this.update(id, {
      passwordHash,
      loginAttempts: 0,
      lockedUntil: null,
    });
  }

  // Activate/Deactivate SuperAdmin
  static async setActive(id: string, isActive: boolean): Promise<SuperAdmin> {
    return await this.update(id, {
      isActive,
      loginAttempts: isActive ? 0 : undefined,
      lockedUntil: isActive ? null : undefined,
    });
  }
}