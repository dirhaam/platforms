import { 
  OfflineQueueItem, 
  addToStore, 
  getByIndex, 
  deleteFromStore, 
  getAllFromStore 
} from './db';

export type { OfflineQueueItem };

function generateId(): string {
  return `offline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export async function addToOfflineQueue(
  type: 'booking' | 'sale',
  action: 'create' | 'update' | 'delete',
  data: any,
  tenantId: string,
  subdomain: string
): Promise<string> {
  const id = generateId();
  const item: OfflineQueueItem = {
    id,
    type,
    action,
    data: { ...data, offlineId: id },
    tenantId,
    subdomain,
    createdAt: Date.now(),
    retryCount: 0,
    status: 'pending',
  };

  await addToStore('offlineQueue', item);
  
  // Also store in local view
  if (type === 'booking') {
    await addToStore('offlineBookings', {
      ...data,
      id,
      offlineId: id,
      tenantId,
      isOffline: true,
      status: 'PENDING_SYNC',
      createdAt: new Date().toISOString(),
    });
  } else if (type === 'sale') {
    await addToStore('offlineSales', {
      ...data,
      id,
      offlineId: id,
      tenantId,
      isOffline: true,
      status: 'PENDING_SYNC',
      createdAt: new Date().toISOString(),
    });
  }

  return id;
}

export async function getPendingItems(): Promise<OfflineQueueItem[]> {
  return getByIndex<OfflineQueueItem>('offlineQueue', 'status', 'pending');
}

export async function getFailedItems(): Promise<OfflineQueueItem[]> {
  return getByIndex<OfflineQueueItem>('offlineQueue', 'status', 'failed');
}

export async function getAllQueueItems(): Promise<OfflineQueueItem[]> {
  return getAllFromStore<OfflineQueueItem>('offlineQueue');
}

export async function updateQueueItemStatus(
  id: string, 
  status: 'pending' | 'syncing' | 'failed',
  retryCount?: number
): Promise<void> {
  const items = await getAllFromStore<OfflineQueueItem>('offlineQueue');
  const item = items.find(i => i.id === id);
  if (item) {
    item.status = status;
    if (retryCount !== undefined) {
      item.retryCount = retryCount;
    }
    await addToStore('offlineQueue', item);
  }
}

export async function removeFromQueue(id: string): Promise<void> {
  await deleteFromStore('offlineQueue', id);
}

export async function syncQueueItem(item: OfflineQueueItem): Promise<{ success: boolean; serverId?: string; error?: string }> {
  try {
    await updateQueueItemStatus(item.id, 'syncing');

    let endpoint = '';
    let method = 'POST';
    let body = item.data;

    if (item.type === 'booking') {
      if (item.action === 'create') {
        endpoint = '/api/bookings';
        method = 'POST';
      }
    } else if (item.type === 'sale') {
      if (item.action === 'create') {
        endpoint = '/api/sales';
        method = 'POST';
      }
    }

    const response = await fetch(endpoint, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'x-tenant-id': item.subdomain,
      },
      body: JSON.stringify(body),
    });

    if (response.ok) {
      const result = await response.json();
      
      // Remove from queue
      await removeFromQueue(item.id);
      
      // Update local view to mark as synced
      if (item.type === 'booking') {
        await deleteFromStore('offlineBookings', item.id);
      } else if (item.type === 'sale') {
        await deleteFromStore('offlineSales', item.id);
      }

      return { success: true, serverId: result.id || result.booking?.id || result.sale?.id };
    } else {
      const error = await response.text();
      await updateQueueItemStatus(item.id, 'failed', item.retryCount + 1);
      return { success: false, error };
    }
  } catch (error) {
    await updateQueueItemStatus(item.id, 'failed', item.retryCount + 1);
    return { success: false, error: String(error) };
  }
}

export async function syncAllPending(): Promise<{ synced: number; failed: number }> {
  const pending = await getPendingItems();
  let synced = 0;
  let failed = 0;

  for (const item of pending) {
    const result = await syncQueueItem(item);
    if (result.success) {
      synced++;
    } else {
      failed++;
    }
  }

  return { synced, failed };
}
