'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { addToStore, getByIndex, CachedData } from '@/lib/offline/db';

type UserRole = 'owner' | 'admin' | 'staff' | 'superadmin';

interface UserSession {
    name: string;
    email: string;
    role: UserRole | null;
    userId?: string;
}

interface BookingNotification {
    id: string;
    title: string;
    message: string;
    time: string;
    read: boolean;
    bookingId: string;
}

interface CachedService {
    id: string;
    name: string;
    price: number;
    duration?: number;
    description?: string;
}

interface CachedCustomer {
    id: string;
    name: string;
    phone: string;
    email?: string;
}

interface CachedStaff {
    id: string;
    name: string;
    email?: string;
    phone?: string;
    role?: string;
}

interface TenantContextValue {
    user: UserSession;
    userLoading: boolean;
    pendingBookingsCount: number;
    notifications: BookingNotification[];
    refreshPendingBookings: () => Promise<void>;
    // Pre-cached data
    services: CachedService[];
    customers: CachedCustomer[];
    staff: CachedStaff[];
    dataLoading: boolean;
    isOnline: boolean;
    lastCacheUpdate: Date | null;
    refreshCache: () => Promise<void>;
}

const TenantContext = createContext<TenantContextValue | null>(null);

export function useTenantContext() {
    const context = useContext(TenantContext);
    if (!context) {
        throw new Error('useTenantContext must be used within TenantProvider');
    }
    return context;
}

interface TenantProviderProps {
    children: ReactNode;
    subdomain: string;
}

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export function TenantProvider({ children, subdomain }: TenantProviderProps) {
    const [user, setUser] = useState<UserSession>({
        name: 'User',
        email: '',
        role: null,
    });
    const [userLoading, setUserLoading] = useState(true);
    const [pendingBookingsCount, setPendingBookingsCount] = useState(0);
    const [notifications, setNotifications] = useState<BookingNotification[]>([]);
    
    // Pre-cached data state
    const [services, setServices] = useState<CachedService[]>([]);
    const [customers, setCustomers] = useState<CachedCustomer[]>([]);
    const [staff, setStaff] = useState<CachedStaff[]>([]);
    const [dataLoading, setDataLoading] = useState(true);
    const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);
    const [lastCacheUpdate, setLastCacheUpdate] = useState<Date | null>(null);

    // Load from IndexedDB cache
    const loadFromCache = useCallback(async () => {
        try {
            // Load session from storage first to ensure sidebar works offline
            const storedSession = localStorage.getItem('last_user_session');
            if (storedSession) {
                try {
                    const parsedSession = JSON.parse(storedSession);
                    setUser(parsedSession);
                    // Don't set userLoading to false yet, wait for potential API update if online
                } catch (e) {
                    console.error('[TenantContext] Failed to parse stored session', e);
                }
            }

            const [cachedServices, cachedCustomers, cachedStaff] = await Promise.all([
                getByIndex<CachedData>('cachedData', 'type', 'services'),
                getByIndex<CachedData>('cachedData', 'type', 'customers'),
                getByIndex<CachedData>('cachedData', 'type', 'staff'),
            ]);

            const serviceCache = cachedServices.find(c => c.id === `services_${subdomain}`);
            const customerCache = cachedCustomers.find(c => c.id === `customers_${subdomain}`);
            const staffCache = cachedStaff.find(c => c.id === `staff_${subdomain}`);

            if (serviceCache?.data) setServices(serviceCache.data);
            if (customerCache?.data) setCustomers(customerCache.data);
            if (staffCache?.data) setStaff(staffCache.data);

            // Check if cache is fresh
            const cacheTime = serviceCache?.updatedAt || customerCache?.updatedAt || 0;
            if (cacheTime) {
                setLastCacheUpdate(new Date(cacheTime));
            }

            return {
                hasServices: (serviceCache?.data?.length || 0) > 0,
                hasCustomers: (customerCache?.data?.length || 0) > 0,
                hasStaff: (staffCache?.data?.length || 0) > 0,
                isFresh: Date.now() - cacheTime < CACHE_DURATION,
            };
        } catch (error) {
            console.error('[TenantContext] Error loading from cache:', error);
            return { hasServices: false, hasCustomers: false, hasStaff: false, isFresh: false };
        }
    }, [subdomain]);

    // Save to IndexedDB cache
    const saveToCache = useCallback(async (type: 'services' | 'customers' | 'staff', data: any[]) => {
        try {
            await addToStore<CachedData>('cachedData', {
                id: `${type}_${subdomain}`,
                type,
                tenantId: subdomain,
                data,
                updatedAt: Date.now(),
            });
        } catch (error) {
            console.error(`[TenantContext] Error caching ${type}:`, error);
        }
    }, [subdomain]);

    // Fetch and cache all data
    const fetchAndCacheData = useCallback(async () => {
        if (!subdomain || !navigator.onLine) return;

        console.log('[TenantContext] Fetching fresh data from API...');

        try {
            const [servicesRes, customersRes, staffRes] = await Promise.all([
                fetch('/api/services?limit=500', { headers: { 'x-tenant-id': subdomain } }),
                fetch('/api/customers?limit=500', { headers: { 'x-tenant-id': subdomain } }),
                fetch('/api/staff?limit=100', { headers: { 'x-tenant-id': subdomain } }),
            ]);

            if (servicesRes.ok) {
                const data = await servicesRes.json();
                const serviceList = data.services || [];
                setServices(serviceList);
                await saveToCache('services', serviceList);
                console.log(`[TenantContext] Cached ${serviceList.length} services`);
            }

            if (customersRes.ok) {
                const data = await customersRes.json();
                const customerList = data.customers || [];
                setCustomers(customerList);
                await saveToCache('customers', customerList);
                console.log(`[TenantContext] Cached ${customerList.length} customers`);
            }

            if (staffRes.ok) {
                const data = await staffRes.json();
                const staffList = data.staff || [];
                setStaff(staffList);
                await saveToCache('staff', staffList);
                console.log(`[TenantContext] Cached ${staffList.length} staff`);
            }

            setLastCacheUpdate(new Date());
        } catch (error) {
            console.error('[TenantContext] Error fetching data:', error);
        }
    }, [subdomain, saveToCache]);

    // Refresh cache (manual trigger)
    const refreshCache = useCallback(async () => {
        setDataLoading(true);
        await fetchAndCacheData();
        setDataLoading(false);
    }, [fetchAndCacheData]);

    const fetchPendingBookings = useCallback(async () => {
        if (!subdomain) return;
        try {
            const response = await fetch(`/api/bookings?status=pending&limit=10`, {
                headers: { 'x-tenant-id': subdomain }
            });
            if (response.ok) {
                const data = await response.json();
                const bookings = data.bookings || [];
                setPendingBookingsCount(bookings.length);
                
                const bookingNotifications: BookingNotification[] = bookings.map((booking: any) => {
                    const createdAt = new Date(booking.createdAt);
                    const now = new Date();
                    const diffMs = now.getTime() - createdAt.getTime();
                    const diffMins = Math.floor(diffMs / 60000);
                    const diffHours = Math.floor(diffMins / 60);
                    const diffDays = Math.floor(diffHours / 24);
                    
                    let timeAgo = '';
                    if (diffDays > 0) timeAgo = `${diffDays} hari lalu`;
                    else if (diffHours > 0) timeAgo = `${diffHours} jam lalu`;
                    else if (diffMins > 0) timeAgo = `${diffMins} menit lalu`;
                    else timeAgo = 'Baru saja';

                    return {
                        id: booking.id,
                        title: 'Booking Baru',
                        message: `${booking.customerName || 'Pelanggan'} - ${booking.serviceName || 'Layanan'}`,
                        time: timeAgo,
                        read: false,
                        bookingId: booking.id,
                    };
                });
                setNotifications(bookingNotifications);
            }
        } catch (error) {
            console.error('Failed to fetch pending bookings:', error);
        }
    }, [subdomain]);

    // Online/offline listener
    useEffect(() => {
        const handleOnline = () => {
            setIsOnline(true);
            // Refresh cache when back online
            fetchAndCacheData();
        };
        const handleOffline = () => setIsOnline(false);

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, [fetchAndCacheData]);

    // Initial data load
    useEffect(() => {
        const initializeData = async () => {
            // First, load from cache (instant)
            const cacheStatus = await loadFromCache();
            
            // If we have cached data, show it immediately
            if (cacheStatus.hasServices || cacheStatus.hasCustomers) {
                setDataLoading(false);
            }

            // Then, fetch fresh data if online and cache is stale
            if (navigator.onLine && !cacheStatus.isFresh) {
                await fetchAndCacheData();
            }

            setDataLoading(false);
        };

        if (subdomain) {
            initializeData();
        }
    }, [subdomain, loadFromCache, fetchAndCacheData]);

    // Session and pending bookings
    useEffect(() => {
        const fetchSession = async () => {
            try {
                const response = await fetch('/api/auth/session');
                if (response.ok) {
                    const data = await response.json();
                    const session = data.session || data;
                    const userSession = {
                        name: session.name || 'User',
                        email: session.email || '',
                        role: session.role || null,
                        userId: session.userId,
                    };
                    setUser(userSession);
                    // Persist session for offline use
                    localStorage.setItem('last_user_session', JSON.stringify(userSession));
                }
            } catch (error) {
                console.error('Failed to fetch session:', error);
                // If offline and we haven't loaded from storage yet (redundant check but safe)
                if (!navigator.onLine) {
                    const storedSession = localStorage.getItem('last_user_session');
                    if (storedSession) {
                        setUser(JSON.parse(storedSession));
                    }
                }
            } finally {
                setUserLoading(false);
            }
        };

        fetchSession();
        fetchPendingBookings();

        // Single interval for pending bookings refresh
        const interval = setInterval(fetchPendingBookings, 30000);
        return () => clearInterval(interval);
    }, [fetchPendingBookings]);

    const value: TenantContextValue = {
        user,
        userLoading,
        pendingBookingsCount,
        notifications,
        refreshPendingBookings: fetchPendingBookings,
        // Pre-cached data
        services,
        customers,
        staff,
        dataLoading,
        isOnline,
        lastCacheUpdate,
        refreshCache,
    };

    return (
        <TenantContext.Provider value={value}>
            {children}
        </TenantContext.Provider>
    );
}
