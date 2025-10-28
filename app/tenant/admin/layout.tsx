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

  const SidebarContent = () => (
    <>
      <div className="p-6 border-b">
        <Link href={`https://${subdomain}.booqing.my.id`} target="_blank" className="block">
          <h2 className="text-xl font-bold text-gray-900">Admin Panel</h2>
          <p className="text-xs text-gray-500 mt-1">{subdomain}.booqing.my.id</p>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="space-y-2 px-4 py-4 flex-1">
        {navigationItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link key={item.href} href={item.href} onClick={() => setSidebarOpen(false)}>
              <Button
                variant="ghost"
                className="w-full justify-start text-gray-700 hover:text-gray-900"
              >
                <Icon className="w-4 h-4 mr-2" />
                {item.label}
              </Button>
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t bg-gray-50">
        <Button asChild variant="outline" className="w-full justify-start text-red-600 hover:text-red-700">
          <Link href={`/tenant/login?subdomain=${subdomain}`}>
            <LogOut className="w-4 h-4 mr-2" />
            Logout
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
            <SidebarContent />
          </div>
        </SheetContent>
      </Sheet>

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex md:w-64 bg-white shadow-md overflow-y-auto flex-col">
        <SidebarContent />
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-4 md:p-8 pt-16 md:pt-8">
        {children}
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
