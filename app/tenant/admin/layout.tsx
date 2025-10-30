'use client';

import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import {
  BarChart3,
  BookOpen,
  Users,
  Settings,
  MessageSquare,
  LogOut,
  Home,
  TrendingUp,
  Menu,
  X,
  FileText,
  Wallet,
} from 'lucide-react';

function TenantAdminLayoutContent({
  children,
}: {
  children: React.ReactNode;
}) {
  const searchParams = useSearchParams();
  const subdomain = searchParams?.get('subdomain') || '';
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const navigationItems = [
    {
      href: `/tenant/admin?subdomain=${subdomain}`,
      label: 'Dashboard',
      icon: Home,
      exact: true,
    },
    {
      href: `/tenant/admin/bookings?subdomain=${subdomain}`,
      label: 'Bookings',
      icon: BookOpen,
    },
    {
      href: `/tenant/admin/customers?subdomain=${subdomain}`,
      label: 'Customers',
      icon: Users,
    },
    {
      href: `/tenant/admin/services?subdomain=${subdomain}`,
      label: 'Services',
      icon: BarChart3,
    },
    {
      href: `/tenant/admin/sales?subdomain=${subdomain}`,
      label: 'Sales',
      icon: TrendingUp,
    },
    {
      href: `/tenant/admin/finance?subdomain=${subdomain}`,
      label: 'Finance',
      icon: Wallet,
    },
    {
      href: `/tenant/admin/invoices?subdomain=${subdomain}`,
      label: 'Invoices',
      icon: FileText,
    },
    {
      href: `/tenant/admin/whatsapp?subdomain=${subdomain}`,
      label: 'WhatsApp',
      icon: MessageSquare,
    },
    {
      href: `/tenant/admin/staff?subdomain=${subdomain}`,
      label: 'Staff',
      icon: Users,
    },
    {
      href: `/tenant/admin/settings?subdomain=${subdomain}`,
      label: 'Settings',
      icon: Settings,
    },
  ];

  const SidebarContent = ({ isCollapsed }: { isCollapsed: boolean }) => (
    <>
      {/* Header */}
      <div className={`border-b transition-all duration-300 ${isCollapsed ? 'p-3' : 'p-6'}`}>
        {!isCollapsed && (
          <Link href={`https://${subdomain}.booqing.my.id`} target="_blank" className="block">
            <h2 className="text-xl font-bold text-gray-900">Admin Panel</h2>
            <p className="text-xs text-gray-500 mt-1">{subdomain}.booqing.my.id</p>
          </Link>
        )}
        {isCollapsed && (
          <Link href={`https://${subdomain}.booqing.my.id`} target="_blank" title="Admin Panel">
            <div className="w-8 h-8 bg-gray-900 rounded-lg flex items-center justify-center text-white font-bold text-sm">
              A
            </div>
          </Link>
        )}
      </div>

      {/* Navigation */}
      <nav className={`space-y-2 ${isCollapsed ? 'px-3 py-3' : 'px-4 py-4'} flex-1 transition-all duration-300`}>
        {navigationItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link key={item.href} href={item.href} onClick={() => setSidebarOpen(false)}>
              <Button
                variant="ghost"
                size={isCollapsed ? "icon" : "default"}
                className={`${isCollapsed ? 'w-10 h-10 p-0' : 'w-full justify-start'} text-gray-700 hover:text-gray-900 transition-all duration-300`}
                title={isCollapsed ? item.label : undefined}
              >
                <Icon className="w-5 h-5" />
                {!isCollapsed && <span className="ml-2">{item.label}</span>}
              </Button>
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className={`border-t bg-gray-50 transition-all duration-300 ${isCollapsed ? 'p-2' : 'p-4'}`}>
        <Button 
          asChild 
          variant="outline" 
          size={isCollapsed ? "icon" : "default"}
          className={`${isCollapsed ? 'w-10 h-10 p-0' : 'w-full justify-start'} text-red-600 hover:text-red-700 transition-all duration-300`}
          title={isCollapsed ? "Logout" : undefined}
        >
          <Link href={`/tenant/login?subdomain=${subdomain}`}>
            <LogOut className="w-5 h-5" />
            {!isCollapsed && <span className="ml-2">Logout</span>}
          </Link>
        </Button>
      </div>
    </>
  );

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Mobile Sidebar Sheet */}
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden absolute top-4 left-4 z-40"
          >
            <Menu className="h-6 w-6" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-64 p-0">
          <div className="flex flex-col h-full">
            <SidebarContent isCollapsed={false} />
          </div>
        </SheetContent>
      </Sheet>

      {/* Desktop Sidebar */}
      <aside className={`hidden md:flex bg-white shadow-md overflow-y-auto flex-col transition-all duration-300 ${
        sidebarCollapsed ? 'w-16' : 'w-64'
      }`}>
        <SidebarContent isCollapsed={sidebarCollapsed} />
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto flex flex-col">
        {/* Top Bar with Toggle Button */}
        <div className="hidden md:flex items-center justify-between bg-white border-b border-gray-200 px-6 py-4 sticky top-0 z-30">
          <div className="flex-1" />
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="text-gray-600 hover:text-gray-900"
            title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {sidebarCollapsed ? (
              <Menu className="h-5 w-5" />
            ) : (
              <X className="h-5 w-5" />
            )}
          </Button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 pt-16 md:pt-6">
          {children}
        </div>
      </main>
    </div>
  );
}

export default function TenantAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center">Loading...</div>}>
      <TenantAdminLayoutContent>{children}</TenantAdminLayoutContent>
    </Suspense>
  );
}
