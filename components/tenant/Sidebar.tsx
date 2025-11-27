'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { cn } from '@/lib/utils';
import { BoxIcon } from '@/components/ui/box-icon';
import { useTenantContext } from '@/lib/contexts/TenantContext';

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
        roles: ['owner', 'admin', 'superadmin'],
        children: [
            { title: 'Appearance', path: '/settings?tab=appearance', icon: 'palette' },
            { title: 'Contact', path: '/settings?tab=contact', icon: 'phone' },
            { title: 'Invoice', path: '/settings?tab=invoice', icon: 'receipt' },
            { title: 'Media', path: '/settings?tab=media', icon: 'image' },
            { title: 'Calendar', path: '/settings?tab=calendar', icon: 'calendar' },
        ]
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
    const { user, userLoading, pendingBookingsCount } = useTenantContext();
    const userRole = user.role;
    const [expandedMenus, setExpandedMenus] = useState<string[]>(['Bookings', 'Settings']);

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
                "fixed left-0 top-0 h-full bg-white dark:bg-[#2b2c40] shadow-lg z-50 transition-all duration-300 ease-in-out border-r border-gray-200 dark:border-[#4e4f6c] flex flex-col",
                collapsed ? "w-20" : "w-64"
            )}
        >
            {/* Brand Logo */}
            <div className="h-20 flex items-center justify-center px-6 relative flex-shrink-0">
                <Link href={`/tenant/admin?subdomain=${subdomain}`} className="flex items-center gap-2 cursor-pointer">
                    {logo ? (
                        <img src={logo} alt={businessName || 'Logo'} className="w-8 h-8 object-contain" />
                    ) : (
                        <div className="text-primary text-3xl">
                            <BoxIcon name="command" size={32} />
                        </div>
                    )}
                    {!collapsed && (
                        <span className="text-xl font-bold text-txt-primary dark:text-[#d5d5e2] tracking-tight truncate max-w-[150px]">
                            {businessName || 'NamaWebsite'}
                        </span>
                    )}
                </Link>

                {/* Toggle Button */}
                <button
                    onClick={() => setCollapsed(!collapsed)}
                    className={cn(
                        "absolute -right-3 top-8 w-6 h-6 bg-primary rounded-full text-white flex items-center justify-center shadow-md transition-all duration-200 ease-in-out hover:bg-[#5f61e6] hover:shadow-lg z-50",
                        collapsed && "rotate-180"
                    )}
                >
                    <BoxIcon name="chevron-left" size={16} />
                </button>
            </div>

            {/* Role Badge */}
            {!collapsed && userRole && (
                <div className="px-6 pb-2 flex-shrink-0">
                    <span className={cn(
                        "text-xs px-2 py-1 rounded font-medium",
                        userRole === 'owner' && "bg-purple-100 dark:bg-[#35365f] text-purple-700 dark:text-[#a5a7ff]",
                        userRole === 'admin' && "bg-blue-100 dark:bg-[#25445c] text-blue-700 dark:text-[#68dbf4]",
                        userRole === 'staff' && "bg-green-100 dark:bg-[#36483f] text-green-700 dark:text-[#aaeb87]",
                        userRole === 'superadmin' && "bg-red-100 dark:bg-[#4d2f3a] text-red-700 dark:text-[#ff8b77]",
                    )}>
                        {userRole === 'superadmin' ? 'Super Admin' : userRole.charAt(0).toUpperCase() + userRole.slice(1)}
                    </span>
                </div>
            )}

            {/* Navigation */}
            <div className="flex-1 overflow-y-auto py-2 px-4 custom-scrollbar min-h-0">
                {userLoading ? (
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
                                                "w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors duration-150 ease-in-out group font-medium relative",
                                                isActive
                                                    ? "bg-primary-light dark:bg-[#35365f] text-primary dark:text-[#a5a7ff]"
                                                    : "text-txt-secondary dark:text-[#b2b2c4] hover:bg-gray-100 dark:hover:bg-[#4e4f6c] hover:text-txt-primary dark:hover:text-[#d5d5e2]",
                                                collapsed ? "justify-center px-2" : ""
                                            )}
                                            title={collapsed ? item.title : ''}
                                        >
                                            <div className="relative">
                                                <BoxIcon
                                                    name={item.icon}
                                                    type={item.iconType || 'regular'}
                                                    size={30}
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
                                                            <span className="flex h-5 min-w-5 px-1.5 items-center justify-center rounded-lg bg-destructive text-[10px] font-medium text-white">
                                                                {pendingBookingsCount > 99 ? '99+' : pendingBookingsCount}
                                                            </span>
                                                        )}
                                                        <BoxIcon
                                                            name="chevron-down"
                                                            size={16}
                                                            className={cn("transition-transform duration-200 ease-in-out", isExpanded ? "rotate-180" : "")}
                                                        />
                                                    </div>
                                                </div>
                                            )}
                                        </button>

                                        {/* Submenu */}
                                        {!collapsed && (
                                            <div className={cn(
                                                "overflow-hidden transition-all duration-300 ease-in-out",
                                                isExpanded ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
                                            )}>
                                                <div className="pl-11 space-y-1 pt-1">
                                                    {item.children!.map((child) => {
                                                        const childFullPath = `/tenant/admin${child.path}`;
                                                        const currentView = searchParams.get('view');
                                                        const currentTab = searchParams.get('tab');
                                                        const childParams = new URLSearchParams(child.path.split('?')[1]);
                                                        const childView = childParams.get('view');
                                                        const childTab = childParams.get('tab');
                                                        const isChildActive = pathname === fullPath && (currentView === childView || currentTab === childTab);

                                                        return (
                                                            <Link
                                                                key={child.title}
                                                                href={`${childFullPath}${childFullPath.includes('?') ? '&' : '?'}subdomain=${subdomain}`}
                                                                className={cn(
                                                                    "flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors duration-150 ease-in-out",
                                                                    isChildActive
                                                                        ? "text-primary dark:text-[#a5a7ff] font-medium bg-primary/5 dark:bg-[#35365f]/50"
                                                                        : "text-txt-secondary dark:text-[#b2b2c4] hover:text-txt-primary dark:hover:text-[#d5d5e2] hover:bg-gray-50 dark:hover:bg-[#4e4f6c]"
                                                                )}
                                                            >
                                                                <BoxIcon name={child.icon} size={26} className="opacity-70" />
                                                                <span>{child.title}</span>
                                                            </Link>
                                                        );
                                                    })}
                                                </div>
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
                                        "flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors duration-150 ease-in-out group font-medium relative",
                                        isActive
                                            ? "bg-primary-light dark:bg-[#35365f] text-primary dark:text-[#a5a7ff]"
                                            : "text-txt-secondary dark:text-[#b2b2c4] hover:bg-gray-100 dark:hover:bg-[#4e4f6c] hover:text-txt-primary dark:hover:text-[#d5d5e2]",
                                        collapsed ? "justify-center px-2" : ""
                                    )}
                                    title={collapsed ? item.title : ''}
                                >
                                    <div className="relative">
                                        <BoxIcon
                                            name={item.icon}
                                            type={item.iconType || 'regular'}
                                            size={28}
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
                                                <span className="ml-auto flex h-5 min-w-5 px-1.5 items-center justify-center rounded-lg bg-destructive text-[10px] font-medium text-white">
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
                <div className="p-4 border-t border-gray-200 dark:border-[#4e4f6c] flex-shrink-0">
                    <p className="text-xs text-txt-muted dark:text-[#7e7f96] text-center">
                        Akses terbatas untuk staff
                    </p>
                </div>
            )}
        </aside>
    );
}
