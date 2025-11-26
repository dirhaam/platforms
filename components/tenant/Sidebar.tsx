'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { cn } from '@/lib/utils';
import { BoxIcon } from '@/components/ui/box-icon';

interface PendingBooking {
    id: string;
    status: string;
}

interface SidebarProps {
    collapsed: boolean;
    setCollapsed: (val: boolean) => void;
    subdomain?: string;
    logo?: string;
    businessName?: string;
}

type UserRole = 'owner' | 'admin' | 'staff' | 'superadmin';

interface NavItem {
    title: string;
    path: string;
    icon: string;
    iconType?: 'regular' | 'solid' | 'logos';
    feature: string;
    roles: UserRole[];
    children?: {
        title: string;
        path: string;
        icon: string;
    }[];
}

// Navigation items with role-based access
const NAV_ITEMS: NavItem[] = [
    {
        title: 'Dashboard',
        path: '',
        icon: 'home',
        feature: 'dashboard',
        roles: ['owner', 'admin', 'staff', 'superadmin']
    },
    {
        title: 'Bookings',
        path: '/bookings',
        icon: 'calendar',
        feature: 'bookings',
        roles: ['owner', 'admin', 'staff', 'superadmin'],
        children: [
            { title: 'Calendar', path: '/bookings?view=calendar', icon: 'calendar' },
            { title: 'Booking', path: '/bookings?view=booking', icon: 'list-ul' },
            { title: 'Sales', path: '/bookings?view=sales', icon: 'receipt' },
            { title: 'Home Visit', path: '/bookings?view=home-visits', icon: 'home' },
        ]
    },
    {
        title: 'Customers',
        path: '/customers',
        icon: 'group',
        feature: 'customers',
        roles: ['owner', 'admin', 'staff', 'superadmin']
    },
    {
        title: 'Services',
        path: '/services',
        icon: 'briefcase',
        feature: 'services',
        roles: ['owner', 'admin', 'superadmin']
    },
    {
        title: 'Staff',
        path: '/staff',
        icon: 'user-id-card',
        feature: 'staff',
        roles: ['owner', 'admin', 'superadmin']
    },
    {
        title: 'Sales',
        path: '/sales',
        icon: 'trending-up',
        feature: 'sales',
        roles: ['owner', 'admin', 'superadmin']
    },
    {
        title: 'WhatsApp',
        path: '/whatsapp',
        icon: 'whatsapp',
        iconType: 'logos',
        feature: 'whatsapp',
        roles: ['owner', 'admin', 'superadmin']
    },
    {
        title: 'Analytics',
        path: '/analytics',
        icon: 'bar-chart',
        feature: 'analytics',
        roles: ['owner', 'admin', 'superadmin']
    },
    {
        title: 'Settings',
        path: '/settings',
        icon: 'cog',
        feature: 'settings',
        roles: ['owner', 'admin', 'superadmin']
    },
    {
        title: 'Profile',
        path: '/profile',
        icon: 'user-circle',
        feature: 'profile',
        roles: ['owner', 'admin', 'staff', 'superadmin']
    },
];

export function Sidebar({ collapsed, setCollapsed, subdomain, logo, businessName }: SidebarProps) {
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const [userRole, setUserRole] = useState<UserRole | null>(null);
    const [loading, setLoading] = useState(true);
    const [pendingBookingsCount, setPendingBookingsCount] = useState(0);
    const [expandedMenus, setExpandedMenus] = useState<string[]>(['Bookings']); // Default expand Bookings

    const fetchPendingBookings = useCallback(async () => {
        if (!subdomain) return;
        try {
            const response = await fetch(`/api/bookings?status=pending`, {
                headers: { 'x-tenant-id': subdomain }
            });
            if (response.ok) {
                const data = await response.json();
                setPendingBookingsCount(data.bookings?.length || 0);
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
                    setUserRole(data.session?.role || data.role || null);
                }
            } catch (error) {
                console.error('Failed to fetch session:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchSession();
        fetchPendingBookings();

        // Refresh pending bookings every 30 seconds
        const interval = setInterval(fetchPendingBookings, 30000);
        return () => clearInterval(interval);
    }, [fetchPendingBookings]);

    // Filter nav items based on user role
    const visibleNavItems = NAV_ITEMS.filter(item => {
        if (!userRole) return false;
        return item.roles.includes(userRole);
    });

    const toggleMenu = (title: string) => {
        if (collapsed) {
            setCollapsed(false);
            setExpandedMenus([title]);
        } else {
            setExpandedMenus(prev =>
                prev.includes(title)
                    ? prev.filter(t => t !== title)
                    : [...prev, title]
            );
        }
    };

    return (
        <aside
            className={cn(
                "fixed left-0 top-0 h-full bg-white shadow-lg z-50 transition-all duration-300 ease-in-out",
                collapsed ? "w-20" : "w-64"
            )}
        >
            {/* Brand Logo */}
            <div className="h-20 flex items-center justify-center px-6 relative">
                <Link href={`/tenant/admin?subdomain=${subdomain}`} className="flex items-center gap-2 cursor-pointer">
                    {logo ? (
                        <img src={logo} alt={businessName || 'Logo'} className="w-8 h-8 object-contain" />
                    ) : (
                        <div className="text-primary text-3xl">
                            <BoxIcon name="command" size={32} />
                        </div>
                    )}
                    {!collapsed && (
                        <span className="text-xl font-bold text-foreground tracking-tight truncate max-w-[150px]">
                            {businessName || 'NamaWebsite'}
                        </span>
                    )}
                </Link>

                {/* Toggle Button */}
                <button
                    onClick={() => setCollapsed(!collapsed)}
                    className={cn(
                        "absolute -right-3 top-8 w-6 h-6 bg-primary rounded-full text-white flex items-center justify-center shadow-md hover:bg-primary/90 transition-colors z-50",
                        collapsed && "rotate-180"
                    )}
                >
                    <BoxIcon name="chevron-left" size={16} />
                </button>
            </div>

            {/* Role Badge */}
            {!collapsed && userRole && (
                <div className="px-6 pb-2">
                    <span className={cn(
                        "text-xs px-2 py-1 rounded-full font-medium",
                        userRole === 'owner' && "bg-purple-100 text-purple-700",
                        userRole === 'admin' && "bg-blue-100 text-blue-700",
                        userRole === 'staff' && "bg-green-100 text-green-700",
                        userRole === 'superadmin' && "bg-red-100 text-red-700",
                    )}>
                        {userRole === 'superadmin' ? 'Super Admin' : userRole.charAt(0).toUpperCase() + userRole.slice(1)}
                    </span>
                </div>
            )}

            {/* Navigation */}
            <div className="flex-1 overflow-y-auto py-2 px-4 custom-scrollbar">
                {loading ? (
                    <div className="flex items-center justify-center py-8">
                        <BoxIcon name="loader-alt" size={20} className="animate-spin opacity-50" />
                    </div>
                ) : (
                    <nav className="space-y-1">
                        {visibleNavItems.map((item) => {
                            const fullPath = `/tenant/admin${item.path}`;
                            const isActive = item.path === ''
                                ? pathname === fullPath
                                : pathname?.startsWith(fullPath);

                            const showBadge = item.feature === 'bookings' && pendingBookingsCount > 0;
                            const hasChildren = item.children && item.children.length > 0;
                            const isExpanded = expandedMenus.includes(item.title);

                            if (hasChildren) {
                                return (
                                    <div key={item.path} className="space-y-1">
                                        <button
                                            onClick={() => toggleMenu(item.title)}
                                            className={cn(
                                                "w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-200 group font-medium relative",
                                                isActive
                                                    ? "bg-primary/10 text-primary shadow-none"
                                                    : "text-muted-foreground hover:bg-gray-100 hover:text-foreground",
                                                collapsed ? "justify-center px-2" : ""
                                            )}
                                            title={collapsed ? item.title : ''}
                                        >
                                            <div className="relative">
                                                <BoxIcon
                                                    name={item.icon}
                                                    type={item.iconType || 'regular'}
                                                    size={20}
                                                    className={cn(
                                                        isActive ? "opacity-100" : "opacity-60 group-hover:opacity-100"
                                                    )}
                                                />
                                                {showBadge && collapsed && (
                                                    <span className="absolute -top-1 -right-1 w-2 h-2 bg-destructive rounded-full ring-2 ring-background animate-pulse"></span>
                                                )}
                                            </div>
                                            {!collapsed && (
                                                <div className="flex items-center justify-between flex-1">
                                                    <span>{item.title}</span>
                                                    <div className="flex items-center gap-2">
                                                        {showBadge && (
                                                            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-[10px] font-medium text-destructive-foreground">
                                                                {pendingBookingsCount > 99 ? '99+' : pendingBookingsCount}
                                                            </span>
                                                        )}
                                                        <BoxIcon
                                                            name="chevron-down"
                                                            size={16}
                                                            className={cn("transition-transform duration-200", isExpanded ? "rotate-180" : "")}
                                                        />
                                                    </div>
                                                </div>
                                            )}
                                        </button>

                                        {/* Submenu */}
                                        {!collapsed && isExpanded && (
                                            <div className="pl-11 space-y-1 animate-in slide-in-from-top-2 duration-200">
                                                {item.children!.map((child) => {
                                                    const childFullPath = `/tenant/admin${child.path}`;
                                                    // Check if active based on query param if present
                                                    const currentView = searchParams.get('view');
                                                    const childView = new URLSearchParams(child.path.split('?')[1]).get('view');
                                                    const isChildActive = pathname === fullPath && currentView === childView;

                                                    return (
                                                        <Link
                                                            key={child.title}
                                                            href={`${childFullPath}${childFullPath.includes('?') ? '&' : '?'}subdomain=${subdomain}`}
                                                            className={cn(
                                                                "flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors",
                                                                isChildActive
                                                                    ? "text-primary font-medium bg-primary/5"
                                                                    : "text-muted-foreground hover:text-foreground hover:bg-gray-50"
                                                            )}
                                                        >
                                                            <BoxIcon name={child.icon} size={16} className="opacity-70" />
                                                            <span>{child.title}</span>
                                                        </Link>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                );
                            }

                            return (
                                <Link
                                    key={item.path}
                                    href={`${fullPath}?subdomain=${subdomain}`}
                                    className={cn(
                                        "flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-200 group font-medium relative",
                                        isActive
                                            ? "bg-primary/10 text-primary shadow-none"
                                            : "text-muted-foreground hover:bg-gray-100 hover:text-foreground",
                                        collapsed ? "justify-center px-2" : ""
                                    )}
                                    title={collapsed ? item.title : ''}
                                >
                                    <div className="relative">
                                        <BoxIcon
                                            name={item.icon}
                                            type={item.iconType || 'regular'}
                                            size={20}
                                            className={cn(
                                                isActive ? "opacity-100" : "opacity-60 group-hover:opacity-100"
                                            )}
                                        />
                                        {showBadge && collapsed && (
                                            <span className="absolute -top-1 -right-1 w-2 h-2 bg-destructive rounded-full ring-2 ring-background animate-pulse"></span>
                                        )}
                                    </div>
                                    {!collapsed && (
                                        <div className="flex items-center justify-between flex-1">
                                            <span>{item.title}</span>
                                            {showBadge && (
                                                <span className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-[10px] font-medium text-destructive-foreground">
                                                    {pendingBookingsCount > 99 ? '99+' : pendingBookingsCount}
                                                </span>
                                            )}
                                        </div>
                                    )}
                                </Link>
                            );
                        })}
                    </nav>
                )}
            </div>

            {/* Footer with restricted access note for staff */}
            {!collapsed && userRole === 'staff' && (
                <div className="p-4 border-t">
                    <p className="text-xs text-gray-400 text-center">
                        Akses terbatas untuk staff
                    </p>
                </div>
            )}
        </aside>
    );
}
