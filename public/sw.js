const CACHE_NAME = 'booqing-admin-v2';
const OFFLINE_URL = '/offline.html';
const SYNC_TAG = 'booqing-sync';

const STATIC_ASSETS = [
  '/offline.html',
  '/pwa/icon-192x192.png',
  '/pwa/icon-512x512.png',
];

// IndexedDB for background sync
const DB_NAME = 'booqing-offline';
const DB_VERSION = 1;

function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
}

async function getPendingItems() {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction('offlineQueue', 'readonly');
      const store = transaction.objectStore('offlineQueue');
      const index = store.index('status');
      const request = index.getAll('pending');
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result || []);
    });
  } catch (error) {
    console.log('[SW] Error getting pending items:', error);
    return [];
  }
}

async function updateItemStatus(id, status) {
  try {
    const db = await openDB();
    const transaction = db.transaction('offlineQueue', 'readwrite');
    const store = transaction.objectStore('offlineQueue');
    const item = await new Promise((resolve, reject) => {
      const request = store.get(id);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
    if (item) {
      item.status = status;
      item.retryCount = (item.retryCount || 0) + 1;
      store.put(item);
    }
  } catch (error) {
    console.log('[SW] Error updating item status:', error);
  }
}

async function deleteItem(id) {
  try {
    const db = await openDB();
    const transaction = db.transaction('offlineQueue', 'readwrite');
    const store = transaction.objectStore('offlineQueue');
    store.delete(id);
  } catch (error) {
    console.log('[SW] Error deleting item:', error);
  }
}

async function syncItem(item) {
  let endpoint = '';
  let method = 'POST';

  if (item.type === 'booking' && item.action === 'create') {
    endpoint = '/api/bookings';
  } else if (item.type === 'sale' && item.action === 'create') {
    endpoint = '/api/sales';
  } else {
    return false;
  }

  try {
    const response = await fetch(endpoint, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'x-tenant-id': item.subdomain,
      },
      body: JSON.stringify(item.data),
    });

    if (response.ok) {
      await deleteItem(item.id);
      return true;
    } else {
      await updateItemStatus(item.id, 'failed');
      return false;
    }
  } catch (error) {
    await updateItemStatus(item.id, 'failed');
    return false;
  }
}

async function syncAllPending() {
  const pending = await getPendingItems();
  let synced = 0;
  let failed = 0;

  for (const item of pending) {
    const success = await syncItem(item);
    if (success) synced++;
    else failed++;
  }

  console.log(`[SW] Sync complete: ${synced} synced, ${failed} failed`);
  
  // Notify clients about sync completion
  const clients = await self.clients.matchAll();
  clients.forEach(client => {
    client.postMessage({
      type: 'SYNC_COMPLETE',
      synced,
      failed,
    });
  });

  return { synced, failed };
}

// Install event - cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Caching static assets');
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

// Activate event - cleanup old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

// Fetch event - network first, fallback to cache
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') return;

  // Skip API requests - always go to network
  if (url.pathname.startsWith('/api/')) return;

  // For navigation requests (HTML pages)
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Cache successful responses
          if (response.ok) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return response;
        })
        .catch(() => {
          // Return cached version or offline page
          return caches.match(request).then((cachedResponse) => {
            return cachedResponse || caches.match(OFFLINE_URL);
          });
        })
    );
    return;
  }

  // For other assets (JS, CSS, images) - stale while revalidate
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      const fetchPromise = fetch(request).then((networkResponse) => {
        if (networkResponse.ok) {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseClone);
          });
        }
        return networkResponse;
      });

      return cachedResponse || fetchPromise;
    })
  );
});

// Handle push notifications
self.addEventListener('push', (event) => {
  if (!event.data) return;

  const data = event.data.json();
  const options = {
    body: data.body || 'New notification',
    icon: '/pwa/icon-192x192.png',
    badge: '/pwa/icon-72x72.png',
    vibrate: [100, 50, 100],
    data: {
      url: data.url || '/tenant/admin',
    },
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'Booqing', options)
  );
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const url = event.notification.data?.url || '/tenant/admin';

  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((clientList) => {
      // If a window is already open, focus it
      for (const client of clientList) {
        if (client.url.includes('/tenant/admin') && 'focus' in client) {
          return client.focus();
        }
      }
      // Otherwise open a new window
      if (clients.openWindow) {
        return clients.openWindow(url);
      }
    })
  );
});

// Background sync event
self.addEventListener('sync', (event) => {
  if (event.tag === SYNC_TAG) {
    console.log('[SW] Background sync triggered');
    event.waitUntil(syncAllPending());
  }
});

// Listen for messages from clients
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'TRIGGER_SYNC') {
    console.log('[SW] Manual sync requested');
    syncAllPending();
  }
});
