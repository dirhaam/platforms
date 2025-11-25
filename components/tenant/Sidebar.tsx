'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { BoxIcon } from '@/components/ui/box-icon';

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
        roles: ['owner', 'admin', 'staff', 'superadmin']
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
];

export function Sidebar({ collapsed, setCollapsed, subdomain, logo, businessName }: SidebarProps) {
    const pathname = usePathname();
    const [userRole, setUserRole] = useState<UserRole | null>(null);
    const [loading, setLoading] = useState(true);

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
    }, []);

    // Filter nav items based on user role
    const visibleNavItems = NAV_ITEMS.filter(item => {
        if (!userRole) return false;
        return item.roles.includes(userRole);
    });

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

                            return (
                                <Link
                                    key={item.path}
                                    href={`${fullPath}?subdomain=${subdomain}`}
                                    className={cn(
                                        "flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-200 group font-medium",
                                        isActive
                                            ? "bg-primary/10 text-primary shadow-none"
                                            : "text-muted-foreground hover:bg-gray-100 hover:text-foreground",
                                        collapsed ? "justify-center px-2" : ""
                                    )}
                                    title={collapsed ? item.title : ''}
                                >
                                    <BoxIcon 
                                        name={item.icon} 
                                        type={item.iconType || 'regular'}
                                        size={20} 
                                        className={cn(
                                            isActive ? "opacity-100" : "opacity-60 group-hover:opacity-100"
                                        )}
                                    />
                                    {!collapsed && <span>{item.title}</span>}
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
