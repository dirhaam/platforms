'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Avatar, AvatarFallback, AvatarInitials } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Calendar,
  Users,
  Settings,
  BarChart3,
  MessageSquare,
  Home,
  Menu,
  LogOut,
  User,
  Shield,
  Briefcase,
} from 'lucide-react';
import type { TenantSession } from '@/lib/auth/types';
import { RBAC } from '@/lib/auth/rbac';

interface TenantDashboardLayoutProps {
  children: React.ReactNode;
  session: TenantSession;
}

interface NavigationItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  permission?: string;
  roles?: string[];
}

const navigation: NavigationItem[] = [
  {
    name: 'Dashboard',
    href: '/admin/dashboard',
    icon: Home,
  },
  {
    name: 'Bookings',
    href: '/admin/bookings',
    icon: Calendar,
    permission: 'manage_bookings',
  },
  {
    name: 'Customers',
    href: '/admin/customers',
    icon: Users,
    permission: 'view_customers',
  },
  {
    name: 'Services',
    href: '/admin/services',
    icon: Briefcase,
    permission: 'manage_services',
    roles: ['owner', 'admin'],
  },
  {
    name: 'Messages',
    href: '/admin/messages',
    icon: MessageSquare,
    permission: 'send_messages',
  },
  {
    name: 'Analytics',
    href: '/admin/analytics',
    icon: BarChart3,
    permission: 'view_analytics',
    roles: ['owner', 'admin'],
  },
  {
    name: 'Staff',
    href: '/admin/staff',
    icon: Shield,
    permission: 'manage_staff',
    roles: ['owner', 'admin'],
  },
  {
    name: 'Settings',
    href: '/admin/settings',
    icon: Settings,
    permission: 'manage_settings',
    roles: ['owner', 'admin'],
  },
];

export default function TenantDashboardLayout({
  children,
  session,
}: TenantDashboardLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Filter navigation items based on user permissions
  const filteredNavigation = navigation.filter((item) => {
    if (item.permission && !RBAC.hasPermission(session, item.permission as any)) {
      return false;
    }
    if (item.roles && !RBAC.hasAnyRole(session, item.roles)) {
      return false;
    }
    return true;
  });

  const handleLogout = async () => {
    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
      });

      if (response.ok) {
        router.push('/login');
        router.refresh();
      }
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const getUserInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case 'owner':
        return 'Business Owner';
      case 'admin':
        return 'Administrator';
      case 'staff':
        return 'Staff Member';
      default:
        return role;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar */}
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent side="left" className="w-64 p-0">
          <div className="flex h-full flex-col">
            <div className="flex h-16 items-center px-6 border-b">
              <h2 className="text-lg font-semibold">Dashboard</h2>
            </div>
            <nav className="flex-1 space-y-1 px-3 py-4">
              {filteredNavigation.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setSidebarOpen(false)}
                    className={`group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                      isActive
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                    }`}
                  >
                    <item.icon
                      className={`mr-3 h-5 w-5 ${
                        isActive ? 'text-blue-500' : 'text-gray-400 group-hover:text-gray-500'
                      }`}
                    />
                    {item.name}
                  </Link>
                );
              })}
            </nav>
          </div>
        </SheetContent>
      </Sheet>

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <div className="flex min-h-0 flex-1 flex-col bg-white border-r border-gray-200">
          <div className="flex h-16 items-center px-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Dashboard</h2>
          </div>
          <nav className="flex-1 space-y-1 px-3 py-4">
            {filteredNavigation.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                    isActive
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  <item.icon
                    className={`mr-3 h-5 w-5 ${
                      isActive ? 'text-blue-500' : 'text-gray-400 group-hover:text-gray-500'
                    }`}
                  />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top navigation */}
        <div className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-gray-200 bg-white px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
          <Button 
            variant="ghost" 
            size="sm" 
            className="lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </Button>

          <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
            <div className="flex flex-1"></div>
            <div className="flex items-center gap-x-4 lg:gap-x-6">
              {/* User menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback>
                        {getUserInitials(session.name)}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{session.name}</p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {session.email}
                      </p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {getRoleDisplayName(session.role)}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/admin/profile">
                      <User className="mr-2 h-4 w-4" />
                      Profile
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/admin/settings">
                      <Settings className="mr-2 h-4 w-4" />
                      Settings
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Log out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="py-6">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}