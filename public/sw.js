const CACHE_NAME = 'booqing-admin-v3';
const OFFLINE_URL = '/offline.html';
const SYNC_TAG = 'booqing-sync';
const API_CACHE_NAME = 'booqing-api-cache-v1';
const RUNTIME_CACHE_NAME = 'booqing-runtime-v1';

// Static assets to pre-cache
const STATIC_ASSETS = [
  '/offline.html',
  '/pwa/icon-72x72.png',
  '/pwa/icon-96x96.png',
  '/pwa/icon-128x128.png',
  '/pwa/icon-144x144.png',
  '/pwa/icon-152x152.png',
  '/pwa/icon-192x192.png',
  '/pwa/icon-384x384.png',
  '/pwa/icon-512x512.png',
  '/manifest.json',
];

// API endpoints to cache for offline reading
const CACHEABLE_API_PATTERNS = [
  '/api/services',
  '/api/customers',
  '/api/staff',
  '/api/bookings',
  '/api/tenants/',
];

// Max age for cached API responses (5 minutes)
const API_CACHE_MAX_AGE = 5 * 60 * 1000;

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
  const currentCaches = [CACHE_NAME, API_CACHE_NAME, RUNTIME_CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => !currentCaches.includes(name))
          .map((name) => {
            console.log('[SW] Deleting old cache:', name);
            return caches.delete(name);
          })
      );
    })
  );
  self.clients.claim();
});

// Helper: Check if URL matches cacheable API patterns
function isCacheableAPI(url) {
  return CACHEABLE_API_PATTERNS.some(pattern => url.pathname.startsWith(pattern));
}

// Helper: Cache API response with timestamp
async function cacheAPIResponse(request, response) {
  const cache = await caches.open(API_CACHE_NAME);
  const headers = new Headers(response.headers);
  headers.set('sw-cached-at', Date.now().toString());
  
  const cachedResponse = new Response(response.clone().body, {
    status: response.status,
    statusText: response.statusText,
    headers
  });
  
  await cache.put(request, cachedResponse);
}

// Helper: Get cached API response if still valid
async function getCachedAPIResponse(request) {
  const cache = await caches.open(API_CACHE_NAME);
  const cachedResponse = await cache.match(request);
  
  if (!cachedResponse) return null;
  
  const cachedAt = parseInt(cachedResponse.headers.get('sw-cached-at') || '0');
  if (Date.now() - cachedAt > API_CACHE_MAX_AGE) {
    // Cache expired, but return stale data if offline
    if (!navigator.onLine) {
      return cachedResponse;
    }
    return null;
  }
  
  return cachedResponse;
}

// Fetch event - network first, fallback to cache
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests (let them pass through for offline queue)
  if (request.method !== 'GET') return;

  // Skip chrome-extension and other non-http
  if (!url.protocol.startsWith('http')) return;

  // Handle cacheable API requests (GET only)
  if (url.pathname.startsWith('/api/') && isCacheableAPI(url)) {
    event.respondWith(
      (async () => {
        // Try network first
        try {
          const networkResponse = await fetch(request);
          if (networkResponse.ok) {
            // Cache successful response
            await cacheAPIResponse(request, networkResponse);
            return networkResponse;
          }
          throw new Error('Network response not ok');
        } catch (error) {
          // Network failed, try cache
          console.log('[SW] API request failed, trying cache:', url.pathname);
          const cachedResponse = await getCachedAPIResponse(request);
          if (cachedResponse) {
            console.log('[SW] Returning cached API response:', url.pathname);
            return cachedResponse;
          }
          // No cache, return error
          return new Response(JSON.stringify({ 
            error: 'Offline', 
            message: 'You are offline and no cached data is available',
            offline: true 
          }), {
            status: 503,
            headers: { 'Content-Type': 'application/json' }
          });
        }
      })()
    );
    return;
  }

  // Skip non-cacheable API requests
  if (url.pathname.startsWith('/api/')) return;

  // For navigation requests (HTML pages)
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Cache successful responses
          if (response.ok) {
            const responseClone = response.clone();
            caches.open(RUNTIME_CACHE_NAME).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return response;
        })
        .catch(async () => {
          // Return cached version or offline page
          const cachedResponse = await caches.match(request);
          if (cachedResponse) {
            console.log('[SW] Returning cached page:', url.pathname);
            return cachedResponse;
          }
          console.log('[SW] Returning offline page');
          return caches.match(OFFLINE_URL);
        })
    );
    return;
  }

  // For static assets (JS, CSS, images) - stale while revalidate
  if (url.pathname.startsWith('/_next/') || 
      url.pathname.match(/\.(js|css|png|jpg|jpeg|svg|gif|ico|woff|woff2)$/)) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        const fetchPromise = fetch(request)
          .then((networkResponse) => {
            if (networkResponse.ok) {
              const responseClone = networkResponse.clone();
              caches.open(RUNTIME_CACHE_NAME).then((cache) => {
                cache.put(request, responseClone);
              });
            }
            return networkResponse;
          })
          .catch(() => {
            // If fetch fails and we have cache, that's fine
            // If no cache, this will throw
            if (cachedResponse) return cachedResponse;
            throw new Error('No cache available');
          });

        // Return cached version immediately if available
        return cachedResponse || fetchPromise;
      })
    );
    return;
  }

  // For other requests - network first with cache fallback
  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response.ok) {
          const responseClone = response.clone();
          caches.open(RUNTIME_CACHE_NAME).then((cache) => {
            cache.put(request, responseClone);
          });
        }
        return response;
      })
      .catch(() => caches.match(request))
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
