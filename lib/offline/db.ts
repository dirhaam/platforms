const DB_NAME = 'booqing-offline';
const DB_VERSION = 1;

export interface OfflineQueueItem {
  id: string;
  type: 'booking' | 'sale';
  action: 'create' | 'update' | 'delete';
  data: any;
  tenantId: string;
  subdomain: string;
  createdAt: number;
  retryCount: number;
  status: 'pending' | 'syncing' | 'failed';
}

export interface CachedData {
  id: string;
  type: 'services' | 'customers' | 'staff';
  tenantId: string;
  data: any[];
  updatedAt: number;
}

let dbInstance: IDBDatabase | null = null;

export async function openDB(): Promise<IDBDatabase> {
  if (dbInstance) return dbInstance;

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    
    request.onsuccess = () => {
      dbInstance = request.result;
      resolve(request.result);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // Store for offline queue (pending sync items)
      if (!db.objectStoreNames.contains('offlineQueue')) {
        const queueStore = db.createObjectStore('offlineQueue', { keyPath: 'id' });
        queueStore.createIndex('status', 'status', { unique: false });
        queueStore.createIndex('type', 'type', { unique: false });
        queueStore.createIndex('tenantId', 'tenantId', { unique: false });
      }

      // Store for cached data (services, customers, staff)
      if (!db.objectStoreNames.contains('cachedData')) {
        const cacheStore = db.createObjectStore('cachedData', { keyPath: 'id' });
        cacheStore.createIndex('type', 'type', { unique: false });
        cacheStore.createIndex('tenantId', 'tenantId', { unique: false });
      }

      // Store for offline bookings (local view)
      if (!db.objectStoreNames.contains('offlineBookings')) {
        const bookingsStore = db.createObjectStore('offlineBookings', { keyPath: 'id' });
        bookingsStore.createIndex('tenantId', 'tenantId', { unique: false });
        bookingsStore.createIndex('status', 'status', { unique: false });
      }

      // Store for offline sales (local view)
      if (!db.objectStoreNames.contains('offlineSales')) {
        const salesStore = db.createObjectStore('offlineSales', { keyPath: 'id' });
        salesStore.createIndex('tenantId', 'tenantId', { unique: false });
      }
    };
  });
}

// Generic CRUD operations
export async function addToStore<T>(storeName: string, data: T): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);
    const request = store.put(data);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
}

export async function getFromStore<T>(storeName: string, id: string): Promise<T | undefined> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readonly');
    const store = transaction.objectStore(storeName);
    const request = store.get(id);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
}

export async function getAllFromStore<T>(storeName: string): Promise<T[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readonly');
    const store = transaction.objectStore(storeName);
    const request = store.getAll();
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
}

export async function getByIndex<T>(storeName: string, indexName: string, value: string): Promise<T[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readonly');
    const store = transaction.objectStore(storeName);
    const index = store.index(indexName);
    const request = index.getAll(value);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
}

export async function deleteFromStore(storeName: string, id: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);
    const request = store.delete(id);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
}

export async function clearStore(storeName: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);
    const request = store.clear();
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
}
