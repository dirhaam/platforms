import { redis } from '@/lib/redis';
import { TenantAuth } from './tenant-auth';

export interface SuperAdmin {
  id: string;
  email: string;
  name: string;
  isActive: boolean;
  passwordHash: string;
  lastLoginAt?: Date;
  loginAttempts: number;
  lockedUntil?: Date;
  passwordResetToken?: string;
  passwordResetExpires?: Date;
  permissions: string[];
  canAccessAllTenants: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class SuperAdminService {
  private static readonly SUPERADMIN_PREFIX = 'superadmin:';
  private static readonly SUPERADMIN_EMAIL_INDEX = 'superadmin:email:';
  private static readonly SUPERADMIN_LIST = 'superadmin:list';

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

    // Create SuperAdmin object
    const superAdmin: SuperAdmin = {
      id: `sa_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      email,
      name,
      isActive: true,
      passwordHash,
      loginAttempts: 0,
      permissions: ['*'],
      canAccessAllTenants: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Store in Redis
    await this.save(superAdmin);

    return superAdmin;
  }

  // Find SuperAdmin by email
  static async findByEmail(email: string): Promise<SuperAdmin | null> {
    try {
      console.log('Looking for SuperAdmin with email:', email);
      const emailKey = `${this.SUPERADMIN_EMAIL_INDEX}${email}`;
      console.log('Email key:', emailKey);
      
      const redisClient = redis();
      const superAdminId = await redisClient.get(emailKey);
      
      if (!superAdminId) {
        return null;
      }

      const dataKey = `${this.SUPERADMIN_PREFIX}${superAdminId}`;
      const data = await redisClient.get(dataKey);
      
      if (!data) {
        return null;
      }

      // Handle both string and object responses from Redis
      let superAdmin: SuperAdmin;
      if (typeof data === 'string') {
        superAdmin = this.deserialize(data);
      } else if (typeof data === 'object') {
        // Redis already parsed the JSON, just convert dates
        superAdmin = {
          ...data as any,
          createdAt: new Date(data.createdAt),
          updatedAt: new Date(data.updatedAt),
          lastLoginAt: data.lastLoginAt ? new Date(data.lastLoginAt) : undefined,
          lockedUntil: data.lockedUntil ? new Date(data.lockedUntil) : undefined,
          passwordResetExpires: data.passwordResetExpires ? new Date(data.passwordResetExpires) : undefined,
        };
      } else {
        return null;
      }
      console.log('Deserialized SuperAdmin:', { id: superAdmin.id, email: superAdmin.email, isActive: superAdmin.isActive });
      return superAdmin;
    } catch (error) {
      console.error('Error finding SuperAdmin by email:', error);
      return null;
    }
  }

  // Find SuperAdmin by ID
  static async findById(id: string): Promise<SuperAdmin | null> {
    try {
      const redisClient = redis();
      const data = await redisClient.get(`${this.SUPERADMIN_PREFIX}${id}`);
      if (!data) {
        return null;
      }

      // Handle both string and object responses from Redis
      if (typeof data === 'string') {
        return this.deserialize(data);
      } else if (typeof data === 'object') {
        // Redis already parsed the JSON, just convert dates
        return {
          ...data as any,
          createdAt: new Date(data.createdAt),
          updatedAt: new Date(data.updatedAt),
          lastLoginAt: data.lastLoginAt ? new Date(data.lastLoginAt) : undefined,
          lockedUntil: data.lockedUntil ? new Date(data.lockedUntil) : undefined,
          passwordResetExpires: data.passwordResetExpires ? new Date(data.passwordResetExpires) : undefined,
        };
      } else {
        return null;
      }
    } catch (error) {
      console.error('Error finding SuperAdmin by ID:', error);
      return null;
    }
  }

  // Update SuperAdmin
  static async update(id: string, updates: Partial<SuperAdmin>): Promise<SuperAdmin> {
    const existing = await this.findById(id);
    if (!existing) {
      throw new Error('SuperAdmin not found');
    }

    const updated: SuperAdmin = {
      ...existing,
      ...updates,
      updatedAt: new Date(),
    };

    await this.save(updated);
    return updated;
  }

  // Save SuperAdmin to Redis
  private static async save(superAdmin: SuperAdmin): Promise<void> {
    const redisClient = redis();
    const serialized = this.serialize(superAdmin);
    
    // Store SuperAdmin data
    await redisClient.set(`${this.SUPERADMIN_PREFIX}${superAdmin.id}`, serialized);
    
    // Store email index
    await redisClient.set(`${this.SUPERADMIN_EMAIL_INDEX}${superAdmin.email}`, superAdmin.id);
    
    // Add to list
    await redisClient.sadd(this.SUPERADMIN_LIST, superAdmin.id);
  }

  // List all SuperAdmins
  static async list(): Promise<SuperAdmin[]> {
    try {
      const redisClient = redis();
      const ids = await redisClient.smembers(this.SUPERADMIN_LIST);
      const superAdmins: SuperAdmin[] = [];

      for (const id of ids) {
        const superAdmin = await this.findById(id as string);
        if (superAdmin) {
          superAdmins.push(superAdmin);
        }
      }

      return superAdmins.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    } catch (error) {
      console.error('Error listing SuperAdmins:', error);
      return [];
    }
  }

  // Delete SuperAdmin
  static async delete(id: string): Promise<void> {
    const existing = await this.findById(id);
    if (!existing) {
      throw new Error('SuperAdmin not found');
    }

    const redisClient = redis();
    // Remove from Redis
    await redisClient.del(`${this.SUPERADMIN_PREFIX}${id}`);
    await redisClient.del(`${this.SUPERADMIN_EMAIL_INDEX}${existing.email}`);
    await redisClient.srem(this.SUPERADMIN_LIST, id);
  }

  // Authenticate SuperAdmin
  static async authenticate(
    email: string,
    password: string
  ): Promise<{ success: boolean; superAdmin?: SuperAdmin; error?: string }> {
    try {
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
          lockedUntil: shouldLock ? new Date(Date.now() + 30 * 60 * 1000) : undefined, // 30 minutes
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
      lockedUntil: undefined,
    });
  }

  // Activate/Deactivate SuperAdmin
  static async setActive(id: string, isActive: boolean): Promise<SuperAdmin> {
    return await this.update(id, { 
      isActive,
      loginAttempts: isActive ? 0 : undefined,
      lockedUntil: isActive ? undefined : undefined,
    });
  }

  // Serialize SuperAdmin for Redis storage
  private static serialize(superAdmin: SuperAdmin): string {
    return JSON.stringify({
      ...superAdmin,
      createdAt: superAdmin.createdAt.toISOString(),
      updatedAt: superAdmin.updatedAt.toISOString(),
      lastLoginAt: superAdmin.lastLoginAt?.toISOString(),
      lockedUntil: superAdmin.lockedUntil?.toISOString(),
      passwordResetExpires: superAdmin.passwordResetExpires?.toISOString(),
    });
  }

  // Deserialize SuperAdmin from Redis storage
  private static deserialize(data: string): SuperAdmin {
    const parsed = JSON.parse(data);
    return {
      ...parsed,
      createdAt: new Date(parsed.createdAt),
      updatedAt: new Date(parsed.updatedAt),
      lastLoginAt: parsed.lastLoginAt ? new Date(parsed.lastLoginAt) : undefined,
      lockedUntil: parsed.lockedUntil ? new Date(parsed.lockedUntil) : undefined,
      passwordResetExpires: parsed.passwordResetExpires ? new Date(parsed.passwordResetExpires) : undefined,
    };
  }

  // Check if any SuperAdmin exists
  static async hasAnySuperAdmin(): Promise<boolean> {
    try {
      const redisClient = redis();
      const count = await redisClient.scard(this.SUPERADMIN_LIST);
      return count > 0;
    } catch (error) {
      console.error('Error checking SuperAdmin existence:', error);
      return false;
    }
  }

  // Initialize default SuperAdmin if none exists
  static async initializeDefault(): Promise<SuperAdmin | null> {
    try {
      const hasAny = await this.hasAnySuperAdmin();
      if (hasAny) {
        return null; // Already has SuperAdmin
      }

      // Create default SuperAdmin
      return await this.create({
        email: 'dirhamrozi@gmail.com',
        name: 'Super Administrator',
        password: '12345nabila',
      });
    } catch (error) {
      console.error('Error initializing default SuperAdmin:', error);
      return null;
    }
  }
}