/**
 * Client-side session hook to get current user session
 * This retrieves session data that was persisted during login
 */

'use client';

import { useEffect, useState } from 'react';
import type { TenantSession } from './types';

/**
 * Hook to get current session from stored session data
 * Session is fetched from the session store via API
 */
export function useSession() {
  const [session, setSession] = useState<TenantSession | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getSession = async () => {
      try {
        // Get session ID from cookie (if available via fetch)
        const response = await fetch('/api/auth/session', {
          method: 'GET',
          credentials: 'include' // Include cookies
        });

        if (response.ok) {
          const data = await response.json();
          setSession(data.session || null);
        }
      } catch (error) {
        console.error('Failed to fetch session:', error);
      } finally {
        setLoading(false);
      }
    };

    getSession();
  }, []);

  return { session, loading };
}

/**
 * Get user name for header requests
 * This can be called from client components to get the current user's name
 */
export async function getUserName(): Promise<string> {
  try {
    const response = await fetch('/api/auth/session', {
      method: 'GET',
      credentials: 'include'
    });

    if (response.ok) {
      const data = await response.json();
      return data.session?.name || 'System';
    }
  } catch (error) {
    console.error('Failed to get user name:', error);
  }

  return 'System';
}

/**
 * Get user session - returns session or null if not authenticated
 */
export async function getSessionData(): Promise<TenantSession | null> {
  try {
    const response = await fetch('/api/auth/session', {
      method: 'GET',
      credentials: 'include'
    });

    if (response.ok) {
      const data = await response.json();
      return data.session || null;
    }
  } catch (error) {
    console.error('Failed to get session:', error);
  }

  return null;
}
