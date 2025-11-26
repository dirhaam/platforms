'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';

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

interface TenantContextValue {
    user: UserSession;
    userLoading: boolean;
    pendingBookingsCount: number;
    notifications: BookingNotification[];
    refreshPendingBookings: () => Promise<void>;
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

export function TenantProvider({ children, subdomain }: TenantProviderProps) {
    const [user, setUser] = useState<UserSession>({
        name: 'User',
        email: '',
        role: null,
    });
    const [userLoading, setUserLoading] = useState(true);
    const [pendingBookingsCount, setPendingBookingsCount] = useState(0);
    const [notifications, setNotifications] = useState<BookingNotification[]>([]);

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

    useEffect(() => {
        const fetchSession = async () => {
            try {
                const response = await fetch('/api/auth/session');
                if (response.ok) {
                    const data = await response.json();
                    const session = data.session || data;
                    setUser({
                        name: session.name || 'User',
                        email: session.email || '',
                        role: session.role || null,
                        userId: session.userId,
                    });
                }
            } catch (error) {
                console.error('Failed to fetch session:', error);
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
    };

    return (
        <TenantContext.Provider value={value}>
            {children}
        </TenantContext.Provider>
    );
}
