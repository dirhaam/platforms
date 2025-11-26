'use client';

import { useState, useEffect, useCallback } from 'react';
import { addToOfflineQueue, syncAllPending, getPendingItems, OfflineQueueItem } from './queue';
import { addToStore, getByIndex, CachedData } from './db';

interface UseOfflineSyncOptions {
  tenantId: string;
  subdomain: string;
}

interface UseOfflineSyncReturn {
  isOnline: boolean;
  pendingCount: number;
  isSyncing: boolean;
  lastSyncTime: Date | null;
  createBookingOffline: (data: any) => Promise<string>;
  createSaleOffline: (data: any) => Promise<string>;
  syncNow: () => Promise<{ synced: number; failed: number }>;
  getCachedServices: () => Promise<any[]>;
  getCachedCustomers: () => Promise<any[]>;
  getCachedStaff: () => Promise<any[]>;
  cacheServices: (services: any[]) => Promise<void>;
  cacheCustomers: (customers: any[]) => Promise<void>;
  cacheStaff: (staff: any[]) => Promise<void>;
}

export function useOfflineSync({ tenantId, subdomain }: UseOfflineSyncOptions): UseOfflineSyncReturn {
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [pendingCount, setPendingCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);

  // Update pending count
  const updatePendingCount = useCallback(async () => {
    try {
      const pending = await getPendingItems();
      setPendingCount(pending.length);
    } catch (error) {
      console.error('[Offline] Error getting pending count:', error);
    }
  }, []);

  // Listen for online/offline events
  useEffect(() => {
    const handleOnline = async () => {
      setIsOnline(true);
      console.log('[Offline] Back online, syncing...');
      // Auto-sync when back online
      const result = await syncAllPending();
      if (result.synced > 0) {
        setLastSyncTime(new Date());
      }
      updatePendingCount();
    };

    const handleOffline = () => {
      setIsOnline(false);
      console.log('[Offline] Gone offline');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial pending count
    updatePendingCount();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [updatePendingCount]);

  // Create booking (works offline)
  const createBookingOffline = useCallback(async (data: any): Promise<string> => {
    if (isOnline) {
      // Try online first
      try {
        const response = await fetch('/api/bookings', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-tenant-id': subdomain,
          },
          body: JSON.stringify(data),
        });

        if (response.ok) {
          const result = await response.json();
          return result.booking?.id || result.id;
        }
      } catch (error) {
        console.log('[Offline] Online request failed, saving offline:', error);
      }
    }

    // Save offline
    const offlineId = await addToOfflineQueue('booking', 'create', data, tenantId, subdomain);
    await updatePendingCount();
    return offlineId;
  }, [isOnline, tenantId, subdomain, updatePendingCount]);

  // Create sale (works offline)
  const createSaleOffline = useCallback(async (data: any): Promise<string> => {
    if (isOnline) {
      // Try online first
      try {
        const response = await fetch('/api/sales', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-tenant-id': subdomain,
          },
          body: JSON.stringify(data),
        });

        if (response.ok) {
          const result = await response.json();
          return result.sale?.id || result.id;
        }
      } catch (error) {
        console.log('[Offline] Online request failed, saving offline:', error);
      }
    }

    // Save offline
    const offlineId = await addToOfflineQueue('sale', 'create', data, tenantId, subdomain);
    await updatePendingCount();
    return offlineId;
  }, [isOnline, tenantId, subdomain, updatePendingCount]);

  // Manual sync
  const syncNow = useCallback(async () => {
    if (!isOnline) {
      return { synced: 0, failed: 0 };
    }

    setIsSyncing(true);
    try {
      const result = await syncAllPending();
      if (result.synced > 0) {
        setLastSyncTime(new Date());
      }
      await updatePendingCount();
      return result;
    } finally {
      setIsSyncing(false);
    }
  }, [isOnline, updatePendingCount]);

  // Cache management
  const cacheServices = useCallback(async (services: any[]) => {
    await addToStore<CachedData>('cachedData', {
      id: `services_${tenantId}`,
      type: 'services',
      tenantId,
      data: services,
      updatedAt: Date.now(),
    });
  }, [tenantId]);

  const cacheCustomers = useCallback(async (customers: any[]) => {
    await addToStore<CachedData>('cachedData', {
      id: `customers_${tenantId}`,
      type: 'customers',
      tenantId,
      data: customers,
      updatedAt: Date.now(),
    });
  }, [tenantId]);

  const cacheStaff = useCallback(async (staff: any[]) => {
    await addToStore<CachedData>('cachedData', {
      id: `staff_${tenantId}`,
      type: 'staff',
      tenantId,
      data: staff,
      updatedAt: Date.now(),
    });
  }, [tenantId]);

  const getCachedServices = useCallback(async (): Promise<any[]> => {
    try {
      const cached = await getByIndex<CachedData>('cachedData', 'type', 'services');
      const tenantCache = cached.find(c => c.tenantId === tenantId);
      return tenantCache?.data || [];
    } catch {
      return [];
    }
  }, [tenantId]);

  const getCachedCustomers = useCallback(async (): Promise<any[]> => {
    try {
      const cached = await getByIndex<CachedData>('cachedData', 'type', 'customers');
      const tenantCache = cached.find(c => c.tenantId === tenantId);
      return tenantCache?.data || [];
    } catch {
      return [];
    }
  }, [tenantId]);

  const getCachedStaff = useCallback(async (): Promise<any[]> => {
    try {
      const cached = await getByIndex<CachedData>('cachedData', 'type', 'staff');
      const tenantCache = cached.find(c => c.tenantId === tenantId);
      return tenantCache?.data || [];
    } catch {
      return [];
    }
  }, [tenantId]);

  return {
    isOnline,
    pendingCount,
    isSyncing,
    lastSyncTime,
    createBookingOffline,
    createSaleOffline,
    syncNow,
    getCachedServices,
    getCachedCustomers,
    getCachedStaff,
    cacheServices,
    cacheCustomers,
    cacheStaff,
  };
}
