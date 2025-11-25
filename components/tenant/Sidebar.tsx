'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    Home,
    Calendar,
    Users,
    Briefcase,
    Contact,
    TrendingUp,
    Wallet,
    FileText,
    MessageSquare,
    MessageCircle,
    BarChart2,
    Settings,
    Command,
    ChevronLeft,
    ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface SidebarProps {
    collapsed: boolean;
    setCollapsed: (val: boolean) => void;
    subdomain?: string;
    logo?: string;
    businessName?: string;
}

const NAV_ITEMS = [
    { title: 'Dashboard', path: '', icon: Home },
    { title: 'Bookings', path: '/bookings', icon: Calendar },
    { title: 'Customers', path: '/customers', icon: Users },
    { title: 'Services', path: '/services', icon: Briefcase },
    { title: 'Staff', path: '/staff', icon: Contact },
    { title: 'Sales', path: '/sales', icon: TrendingUp },
    { title: 'Finance', path: '/finance', icon: Wallet },
    { title: 'Invoices', path: '/invoices', icon: FileText },
    { title: 'Messages', path: '/messages', icon: MessageSquare },
    { title: 'WhatsApp', path: '/whatsapp', icon: MessageCircle },
    { title: 'Analytics', path: '/analytics', icon: BarChart2 },
    { title: 'Settings', path: '/settings', icon: Settings },
];

export function Sidebar({ collapsed, setCollapsed, subdomain, logo, businessName }: SidebarProps) {
    const pathname = usePathname();

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
                            <Command className="w-8 h-8" />
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
                    <ChevronLeft className="w-4 h-4" />
                </button>
            </div>

            {/* Navigation */}
            <div className="flex-1 overflow-y-auto py-2 px-4 custom-scrollbar">
                <nav className="space-y-1">
                    {NAV_ITEMS.map((item) => {
                        // Construct absolute path for comparison and linking
                        // Base path is /tenant/admin
                        // Item path is relative to admin, e.g., /bookings
                        const fullPath = `/tenant/admin${item.path}`;

                        // Check active state
                        // Exact match for dashboard ('') or startsWith for others
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
                                <item.icon className={cn("w-5 h-5", isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground")} />
                                {!collapsed && <span>{item.title}</span>}
                            </Link>
                        );
                    })}
                </nav>
            </div>
        </aside>
    );
}
