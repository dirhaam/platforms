// Session configuration
export interface TenantSession {
  userId: string;
  tenantId: string;
  role: 'superadmin' | 'owner' | 'admin' | 'staff';
  permissions: string[];
  email: string;
  name: string;
  isSuperAdmin?: boolean; // Flag for superadmin access
  [key: string]: any; // Index signature for JWT compatibility
}

export interface AuthResult {
  success: boolean;
  session?: TenantSession;
  error?: string;
}