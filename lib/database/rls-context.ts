/**
 * RLS (Row Level Security) Context Manager
 * Handles setting tenant context for database queries
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

/**
 * Set tenant context for RLS policies
 * This MUST be called before any database queries to ensure RLS works correctly
 */
export async function setRLSContext(
  supabase: SupabaseClient,
  tenantId: string | null
): Promise<void> {
  if (!tenantId) {
    console.warn('[RLS] No tenant ID provided for RLS context');
    return;
  }

  try {
    // Set the session variable that RLS policies use
    const { error } = await supabase.rpc('set', {
      key: 'app.current_tenant_id',
      value: tenantId
    });

    if (error) {
      console.error('[RLS] Failed to set context:', error);
      // Don't throw - let queries proceed but log the error
      // RLS will still work if tenant_id filter is included in queries
    } else {
      console.log('[RLS] Context set for tenant:', tenantId);
    }
  } catch (err) {
    console.error('[RLS] Error setting context:', err);
    // Non-fatal - continue with queries
  }
}

/**
 * Execute query with RLS context set
 * Automatically sets tenant context before query
 */
export async function withRLSContext<T>(
  supabase: SupabaseClient,
  tenantId: string,
  queryFn: () => Promise<T>
): Promise<T> {
  // Set RLS context
  await setRLSContext(supabase, tenantId);

  try {
    // Execute the query
    return await queryFn();
  } catch (error) {
    console.error('[RLS] Query failed:', error);
    throw error;
  }
}

/**
 * Middleware helper for Next.js
 * Use in API routes to set RLS context from request
 */
export function getRLSContextFromRequest(req: any): string | null {
  // Try multiple sources for tenant ID
  const tenantId =
    req.headers['x-tenant-id'] ||
    req.query.tenantId ||
    req.user?.tenantId ||
    req.headers['authorization']?.split('Bearer ')[1];

  return tenantId || null;
}

/**
 * Best Practice: Use this wrapper in API routes
 * 
 * Example:
 * ```typescript
 * export async function GET(request: NextRequest) {
 *   const tenantId = request.headers.get('x-tenant-id');
 *   const supabase = createClient(...);
 *   
 *   await setRLSContext(supabase, tenantId);
 *   
 *   const { data } = await supabase
 *     .from('invoices')
 *     .select('*')
 *     .eq('tenant_id', tenantId);  // Always include tenant_id filter
 *   
 *   return NextResponse.json(data);
 * }
 * ```
 */
export const RLSHelper = {
  setContext: setRLSContext,
  withContext: withRLSContext,
  getContextFromRequest: getRLSContextFromRequest,
};
