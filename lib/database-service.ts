// lib/database-service.ts
// Supabase-backed key-value helpers replacing the legacy D1/Redis layer

import { createClient } from '@supabase/supabase-js';

const getSupabaseClient = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!url || !key) {
    throw new Error('Missing Supabase environment variables');
  }
  
  return createClient(url, key);
};

interface TenantSubdomain {
  subdomain: string;
  tenant_data: any;
  created_at: string;
  updated_at: string;
}

interface Session {
  id: string;
  user_id: string;
  tenant_id: string;
  session_data: any;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
}

interface CacheEntry {
  key: string;
  value: any;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
}

export async function testSupabaseConnection(): Promise<boolean> {
  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase.from('tenant_subdomains').select('subdomain').limit(1);
    if (error) {
      console.error('Supabase connection failed:', error);
      return false;
    }
    return true;
  } catch (error) {
    console.error('Supabase connection failed:', error);
    return false;
  }
}

// Tenant helpers
export async function setTenant(subdomain: string, tenantData: any): Promise<boolean> {
  try {
    const supabase = getSupabaseClient();
    const { error } = await supabase
      .from('tenant_subdomains')
      .upsert({ subdomain, tenant_data: tenantData }, { onConflict: 'subdomain' });
    
    if (error) {
      console.error('Error setting tenant in Supabase:', error);
      return false;
    }
    return true;
  } catch (error) {
    console.error('Error setting tenant in Supabase:', error);
    return false;
  }
}

export async function getTenant(subdomain: string): Promise<any | null> {
  try {
    const supabase = getSupabaseClient();
    
    // First try to get from tenants table (new schema)
    const { data: tenantData, error: tenantError } = await supabase
      .from('tenants')
      .select('*')
      .eq('subdomain', subdomain.toLowerCase())
      .limit(1)
      .single();
    
    if (tenantError) {
      console.error(`[getTenant] Error:`, {
        code: tenantError.code,
        message: tenantError.message,
      });
    }
    
    if (tenantData && !tenantError) {
      // Convert snake_case database columns to camelCase for API consistency
      return {
        id: tenantData.id,
        subdomain: tenantData.subdomain,
        emoji: tenantData.emoji || '🏢',
        createdAt: tenantData.created_at ? new Date(tenantData.created_at).getTime() : Date.now(),
        businessName: tenantData.business_name,
        businessCategory: tenantData.business_category,
        ownerName: tenantData.owner_name,
        email: tenantData.email,
        phone: tenantData.phone,
        address: tenantData.address,
        businessDescription: tenantData.business_description,
        logo: tenantData.logo,
        brandColors: tenantData.brand_colors,
        whatsappEnabled: tenantData.whatsapp_enabled,
        homeVisitEnabled: tenantData.home_visit_enabled,
        analyticsEnabled: tenantData.analytics_enabled,
        customTemplatesEnabled: tenantData.custom_templates_enabled,
        multiStaffEnabled: tenantData.multi_staff_enabled,
        subscriptionPlan: tenantData.subscription_plan,
        subscriptionStatus: tenantData.subscription_status,
        subscriptionExpiresAt: tenantData.subscription_expires_at,
        updatedAt: tenantData.updated_at,
        features: {
          whatsapp: tenantData.whatsapp_enabled,
          homeVisit: tenantData.home_visit_enabled,
          analytics: tenantData.analytics_enabled,
          customTemplates: tenantData.custom_templates_enabled,
          multiStaff: tenantData.multi_staff_enabled,
        },
        subscription: {
          plan: tenantData.subscription_plan,
          status: tenantData.subscription_status,
          expiresAt: tenantData.subscription_expires_at,
        },
        templateId: tenantData.template_id,
      };
    }
    
    // Fallback to tenant_subdomains table for legacy data
    const { data, error } = await getSupabaseClient()
      .from('tenant_subdomains')
      .select('tenant_data')
      .eq('subdomain', subdomain)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') { // Record not found
        return null;
      }
      console.error('[getTenant] Error getting tenant from Supabase:', error);
      return null;
    }
    
    return data?.tenant_data || null;
  } catch (error) {
    console.error('[getTenant] Error getting tenant from Supabase:', error);
    return null;
  }
}

export async function deleteTenant(subdomain: string): Promise<boolean> {
  try {
    const supabase = getSupabaseClient();
    const { error } = await supabase
      .from('tenant_subdomains')
      .delete()
      .eq('subdomain', subdomain);
    
    if (error) {
      console.error('Error deleting tenant from Supabase:', error);
      return false;
    }
    return true;
  } catch (error) {
    console.error('Error deleting tenant from Supabase:', error);
    return false;
  }
}

// Session helpers
export async function setSession(
  sessionId: string,
  userId: string,
  tenantId: string,
  sessionData: any,
  ttl: number = 86400
): Promise<boolean> {
  try {
    const expiresAt = new Date(Date.now() + ttl * 1000).toISOString();
    
    // Check if IDs are valid UUIDs, if not generate new ones
    // This handles potential UUID issues
    if (!isValidUUID(sessionId)) {
      console.warn('Invalid session ID, generating new UUID:', sessionId);
      sessionId = crypto.randomUUID();
    }
    if (!isValidUUID(userId)) {
      console.warn('Invalid user ID, generating new UUID:', userId);
      userId = crypto.randomUUID();
    }
    if (!isValidUUID(tenantId)) {
      console.warn('Invalid tenant ID, generating new UUID:', tenantId);
      tenantId = crypto.randomUUID();
    }
    
    const supabase = getSupabaseClient();
    const { error } = await supabase
      .from('sessions')
      .upsert({ 
        id: sessionId, 
        user_id: userId, 
        tenant_id: tenantId, 
        session_data: sessionData,
        expires_at: expiresAt 
      }, { onConflict: 'id' });
    
    if (error) {
      console.error('Error setting session in Supabase:', error);
      return false;
    }
    return true;
  } catch (error) {
    console.error('Error setting session in Supabase:', error);
    return false;
  }
}

// Helper function to validate UUID format
function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

export async function getSession(sessionId: string): Promise<any | null> {
  try {
    // Validate session ID format
    if (!isValidUUID(sessionId)) {
      console.warn('Invalid session ID format:', sessionId);
      return null;
    }
    
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('sessions')
      .select('user_id, tenant_id, session_data, expires_at')
      .eq('id', sessionId)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') { // Record not found
        return null;
      }
      console.error('Error getting session from Supabase:', error);
      return null;
    }
    
    // Check if session is expired
    if (data.expires_at && new Date() > new Date(data.expires_at)) {
      await deleteSession(sessionId);
      return null;
    }
    
    return {
      id: sessionId,
      userId: data.user_id,
      tenantId: data.tenant_id,
      data: data.session_data,
    };
  } catch (error) {
    console.error('Error getting session from Supabase:', error);
    return null;
  }
}

export async function deleteSession(sessionId: string): Promise<boolean> {
  try {
    // Validate session ID format before attempting deletion
    if (!isValidUUID(sessionId)) {
      console.warn('Invalid session ID format for deletion:', sessionId);
      return false;
    }
    
    const supabase = getSupabaseClient();
    const { error } = await supabase
      .from('sessions')
      .delete()
      .eq('id', sessionId);
    
    if (error) {
      console.error('Error deleting session from Supabase:', error);
      return false;
    }
    return true;
  } catch (error) {
    console.error('Error deleting session from Supabase:', error);
    return false;
  }
}

// Cache helpers
export async function setCache(key: string, value: any, ttl?: number): Promise<boolean> {
  try {
    const expiresAt = typeof ttl === 'number'
      ? new Date(Date.now() + ttl * 1000).toISOString()
      : null;
    
    const supabase = getSupabaseClient();
    const { error } = await supabase
      .from('cache')
      .upsert({ key, value, expires_at: expiresAt }, { onConflict: 'key' });
    
    if (error) {
      console.error('Error setting cache in Supabase:', error);
      return false;
    }
    return true;
  } catch (error) {
    console.error('Error setting cache in Supabase:', error);
    return false;
  }
}

export async function getCache(key: string): Promise<any | null> {
  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('cache')
      .select('value, expires_at')
      .eq('key', key)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') { // Record not found
        return null;
      }
      console.error('Error getting cache from Supabase:', error);
      return null;
    }
    
    // Check if cache is expired
    if (data.expires_at && new Date() > new Date(data.expires_at)) {
      await deleteCache(key);
      return null;
    }
    
    return data.value;
  } catch (error) {
    console.error('Error getting cache from Supabase:', error);
    return null;
  }
}

export async function deleteCache(key: string): Promise<boolean> {
  try {
    const supabase = getSupabaseClient();
    const { error } = await supabase
      .from('cache')
      .delete()
      .eq('key', key);
    
    if (error) {
      console.error('Error deleting cache from Supabase:', error);
      return false;
    }
    return true;
  } catch (error) {
    console.error('Error deleting cache from Supabase:', error);
    return false;
  }
}

// Cleanup helpers
export async function cleanupExpiredData(): Promise<boolean> {
  try {
    const supabase = getSupabaseClient();
    // Hapus session yang kadaluarsa
    const { error: sessionError } = await supabase
      .from('sessions')
      .delete()
      .or(`expires_at.lt.${new Date().toISOString()},expires_at.is.null`);
    
    if (sessionError) {
      console.error('Error cleaning up expired sessions:', sessionError);
    }
    
    // Hapus cache yang kadaluarsa
    const { error: cacheError } = await supabase
      .from('cache')
      .delete()
      .or(`expires_at.lt.${new Date().toISOString()},expires_at.is.null`);
    
    if (cacheError) {
      console.error('Error cleaning up expired cache:', cacheError);
    }
    
    return !sessionError && !cacheError;
  } catch (error) {
    console.error('Error cleaning up expired data:', error);
    return false;
  }
}

// Fungsi tambahan untuk cache pattern
export async function deleteCacheByPattern(pattern: string): Promise<number> {
  try {
    // Convert * to % for SQL LIKE
    const sqlPattern = pattern.replace(/\*/g, '%');
    
    // First get keys matching the pattern
    const supabase = getSupabaseClient();
    const { data: keys, error } = await supabase
      .from('cache')
      .select('key')
      .like('key', sqlPattern);
    
    if (error) {
      console.error('Error getting cache keys by pattern:', error);
      return 0;
    }
    
    if (!keys || keys.length === 0) {
      return 0;
    }
    
    const keysToDelete = keys.map(item => item.key);
    
    // Delete all matching keys
    const { error: deleteError } = await supabase
      .from('cache')
      .delete()
      .in('key', keysToDelete);
    
    if (deleteError) {
      console.error('Error deleting cache by pattern:', deleteError);
      return 0;
    }
    
    return keysToDelete.length;
  } catch (error) {
    console.error('Error deleting cache by pattern:', error);
    return 0;
  }
}

export async function listCacheKeys(pattern: string = '%'): Promise<string[]> {
  try {
    // Convert * to % for SQL LIKE
    const sqlPattern = pattern.replace(/\*/g, '%');
    
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('cache')
      .select('key')
      .like('key', sqlPattern);
    
    if (error) {
      console.error('Error listing cache keys:', error);
      return [];
    }
    
    return data ? data.map(item => item.key) : [];
  } catch (error) {
    console.error('Error listing cache keys:', error);
    return [];
  }
}

export async function listTenantSubdomains(pattern: string = '%'): Promise<string[]> {
  try {
    // Convert * to % for SQL LIKE
    const sqlPattern = pattern.replace(/\*/g, '%');
    
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('tenant_subdomains')
      .select('subdomain')
      .like('subdomain', sqlPattern);
    
    if (error) {
      console.error('Error listing tenant subdomains:', error);
      return [];
    }
    
    return data ? data.map(item => item.subdomain) : [];
  } catch (error) {
    console.error('Error listing tenant subdomains:', error);
    return [];
  }
}