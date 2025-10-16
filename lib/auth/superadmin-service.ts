import { db } from '@/lib/database/server';
import { superAdmins } from '@/lib/database/schema';
import { eq, desc } from 'drizzle-orm';
import { TenantAuth } from './tenant-auth';

const DEFAULT_SUPERADMIN_EMAIL = process.env.DEFAULT_SUPERADMIN_EMAIL || 'superadmin@booqing.my.id';
const DEFAULT_SUPERADMIN_PASSWORD = process.env.DEFAULT_SUPERADMIN_PASSWORD || 'ChangeThisPassword123!';

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

type SuperAdminRow = typeof superAdmins.$inferSelect;

const ensureCrypto = () => {
  if (typeof globalThis.crypto === 'undefined') {
    throw new Error('Web Crypto API is not available in this environment');
  }
  return globalThis.crypto;
};

const generateId = () => {
  const cryptoObj = ensureCrypto();
  if (typeof cryptoObj.randomUUID === 'function') {
    return `sa_${cryptoObj.randomUUID().replace(/-/g, '')}`;
  }
  return `sa_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;
};

const mapRow = (row: SuperAdminRow): SuperAdmin => ({
  id: row.id,
  email: row.email,
  name: row.name,
  isActive: row.isActive ?? true,
  passwordHash: row.passwordHash,
  lastLoginAt: row.lastLoginAt ?? null,
  loginAttempts: row.loginAttempts ?? 0,
  lockedUntil: row.lockedUntil ?? null,
  passwordResetToken: row.passwordResetToken ?? null,
  passwordResetExpires: row.passwordResetExpires ?? null,
  permissions: Array.isArray(row.permissions) ? row.permissions : [],
  canAccessAllTenants: row.canAccessAllTenants ?? true,
  createdAt: row.createdAt ?? new Date(),
  updatedAt: row.updatedAt ?? new Date(),
});

const buildUpdate = (updates: Partial<SuperAdmin>) => {
  const data: Partial<typeof superAdmins.$inferInsert> = {
    updatedAt: new Date(),
  };

  if (updates.email !== undefined) data.email = updates.email;
  if (updates.name !== undefined) data.name = updates.name;
  if (updates.isActive !== undefined) data.isActive = updates.isActive;
  if (updates.passwordHash !== undefined) data.passwordHash = updates.passwordHash;
  if (updates.lastLoginAt !== undefined) data.lastLoginAt = updates.lastLoginAt ?? null;
  if (updates.loginAttempts !== undefined) data.loginAttempts = updates.loginAttempts;
  if (updates.lockedUntil !== undefined) data.lockedUntil = updates.lockedUntil ?? null;
  if (updates.passwordResetToken !== undefined) data.passwordResetToken = updates.passwordResetToken ?? null;
  if (updates.passwordResetExpires !== undefined) data.passwordResetExpires = updates.passwordResetExpires ?? null;
  if (updates.permissions !== undefined) data.permissions = updates.permissions ?? [];
  if (updates.canAccessAllTenants !== undefined) data.canAccessAllTenants = updates.canAccessAllTenants;

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

    // Check if email already exists
    const existing = await this.findByEmail(email);
    if (existing) {
      throw new Error('SuperAdmin with this email already exists');
    }

    // Hash password
    const passwordHash = await TenantAuth.hashPassword(password);

    const now = new Date();
    const id = generateId();

    await db.insert(superAdmins).values({
      id,
      email,
      name,
      isActive: true,
      passwordHash,
      loginAttempts: 0,
      permissions: ['*'],
      canAccessAllTenants: true,
      createdAt: now,
      updatedAt: now,
    });

    const [created] = await db
      .select()
      .from(superAdmins)
      .where(eq(superAdmins.id, id))
      .limit(1);

    return mapRow(created!);
  }

  // Find SuperAdmin by email
  static async findByEmail(email: string): Promise<SuperAdmin | null> {
    const [row] = await db
      .select()
      .from(superAdmins)
      .where(eq(superAdmins.email, email))
      .limit(1);

    return row ? mapRow(row) : null;
  }

  // Find SuperAdmin by ID
  static async findById(id: string): Promise<SuperAdmin | null> {
    const [row] = await db
      .select()
      .from(superAdmins)
      .where(eq(superAdmins.id, id))
      .limit(1);

    return row ? mapRow(row) : null;
  }

  // Update SuperAdmin
  static async update(id: string, updates: Partial<SuperAdmin>): Promise<SuperAdmin> {
    const existing = await this.findById(id);
    if (!existing) {
      throw new Error('SuperAdmin not found');
    }

    const data = buildUpdate(updates);
    await db.update(superAdmins).set(data).where(eq(superAdmins.id, id));

    const [row] = await db
      .select()
      .from(superAdmins)
      .where(eq(superAdmins.id, id))
      .limit(1);

    return mapRow(row!);
  }

  // List all SuperAdmins
  static async list(): Promise<SuperAdmin[]> {
    const rows = await db.select().from(superAdmins).orderBy(desc(superAdmins.createdAt));
    return rows.map(mapRow);
  }

  // Delete SuperAdmin
  static async delete(id: string): Promise<void> {
    const existing = await this.findById(id);
    if (!existing) {
      throw new Error('SuperAdmin not found');
    }

    await db.delete(superAdmins).where(eq(superAdmins.id, id));
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
        lockedUntil: undefined,
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