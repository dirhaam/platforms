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
  X,
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
    name: 'WhatsApp',
    href: '/admin/whatsapp',
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
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

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
    <div className="flex h-screen bg-gray-50">
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

      {/* Desktop Layout (YouTube Style) */}
      <div className="hidden lg:flex flex-col w-full">
        {/* Top Bar */}
        <div className="h-16 bg-white border-b border-gray-200 flex items-center px-4 sticky top-0 z-30 shadow-sm">
          {/* Hamburger + Logo Section */}
          <div className="flex items-center gap-4 flex-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="text-gray-600 hover:text-gray-900 w-10 h-10 rounded-lg"
              title={sidebarCollapsed ? "Expand" : "Collapse"}
            >
              <Menu className="h-6 w-6" />
            </Button>

            <div className="flex items-center gap-2 flex-shrink-0">
              <div className="w-8 h-8 bg-gray-900 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                D
              </div>
              <span className="font-semibold text-gray-900 hidden lg:inline">Dashboard</span>
            </div>
          </div>
        </div>

        {/* Content with Sidebar */}
        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar */}
          <aside className={`bg-white border-r border-gray-200 transition-all duration-300 overflow-y-auto ${
            sidebarCollapsed ? 'w-20' : 'w-64'
          }`}>
            <nav className="py-2 space-y-1">
              {filteredNavigation.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link key={item.name} href={item.href}>
                    <Button
                      variant="ghost"
                      className={`text-gray-700 hover:text-gray-900 transition-colors ${
                        isActive
                          ? 'bg-blue-100 text-blue-700'
                          : 'hover:bg-gray-100'
                      } ${
                        sidebarCollapsed 
                          ? 'w-full justify-center h-12 rounded-none' 
                          : 'w-full justify-start px-4 h-12 rounded-none'
                      }`}
                      title={sidebarCollapsed ? item.name : undefined}
                    >
                      <item.icon className="w-6 h-6 flex-shrink-0" />
                      {!sidebarCollapsed && <span className="ml-4 text-sm font-medium">{item.name}</span>}
                    </Button>
                  </Link>
                );
              })}
            </nav>

            {/* User Menu */}
            <div className="border-t border-gray-200 py-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className={`text-gray-700 hover:text-gray-900 transition-colors ${
                    sidebarCollapsed 
                      ? 'w-full justify-center h-12 rounded-none' 
                      : 'w-full justify-start px-4 h-12 rounded-none'
                  }`} title="User menu">
                    <Avatar className="h-8 w-8 flex-shrink-0">
                      <AvatarFallback className="text-xs font-semibold">
                        {getUserInitials(session.name)}
                      </AvatarFallback>
                    </Avatar>
                    {!sidebarCollapsed && <span className="ml-4 text-sm text-gray-700 font-medium">{session.name}</span>}
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
          </aside>

          {/* Main Content */}
          <main className="flex-1 overflow-y-auto">
            <div className="p-6">
              {children}
            </div>
          </main>
        </div>
      </div>

      {/* Mobile Top Navigation */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-white border-b border-gray-200 flex items-center px-4 shadow-sm z-40">
        <Button 
          variant="ghost" 
          size="icon"
          onClick={() => setSidebarOpen(true)}
        >
          <Menu className="h-5 w-5" />
        </Button>
        <span className="font-semibold text-gray-900 ml-4">Dashboard</span>
        <div className="flex-1" />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0 rounded-full">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="text-xs font-semibold">
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
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/admin/profile">
                <User className="mr-2 h-4 w-4" />
                Profile
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

      {/* Mobile Content */}
      <main className="lg:hidden mt-16 flex-1 overflow-y-auto">
        <div className="p-4">
          {children}
        </div>
      </main>
    </div>
  );
}
