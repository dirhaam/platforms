'use client';

import { Suspense, useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { PendingBookingsBadge } from '@/components/booking/PendingBookingsBadge';
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
  const [logoUrl, setLogoUrl] = useState<string>('');
  const [tenantId, setTenantId] = useState<string>('');

  // Fetch tenant ID and logo from invoice settings
  useEffect(() => {
    if (!subdomain) return;

    const fetchLogo = async () => {
      try {
        // First resolve tenant ID
        const tenantRes = await fetch(`/api/tenants/${subdomain}`);
        if (!tenantRes.ok) return;
        const tenantData = await tenantRes.json();
        setTenantId(tenantData.id);

        // Then fetch logo from invoice settings
        const logoUrl = new URL('/api/settings/invoice-config', window.location.origin);
        logoUrl.searchParams.set('tenantId', tenantData.id);
        const logoRes = await fetch(logoUrl.toString(), {
          headers: { 'x-tenant-id': tenantData.id }
        });
        if (logoRes.ok) {
          const logoData = await logoRes.json();
          setLogoUrl(logoData.settings?.branding?.logoUrl || '');
        }
      } catch (error) {
        console.error('Error fetching logo:', error);
      }
    };

    fetchLogo();
  }, [subdomain]);

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
            <div className="flex items-center gap-2 mb-2">
              {logoUrl ? (
                <img
                  src={logoUrl}
                  alt="Logo"
                  className="h-6 w-6 object-contain rounded"
                />
              ) : (
                <div className="w-6 h-6 bg-gray-900 rounded-lg flex items-center justify-center text-white font-bold text-xs">
                  A
                </div>
              )}
            </div>
            <h2 className="text-xl font-bold text-gray-900">Admin Panel</h2>
            <p className="text-xs text-gray-500 mt-1">{subdomain}.booqing.my.id</p>
          </Link>
        )}
        {isCollapsed && (
          <Link href={`https://${subdomain}.booqing.my.id`} target="_blank" title="Admin Panel">
            {logoUrl ? (
              <img
                src={logoUrl}
                alt="Logo"
                className="w-8 h-8 object-contain rounded-lg"
              />
            ) : (
              <div className="w-8 h-8 bg-gray-900 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                A
              </div>
            )}
          </Link>
        )}
      </div>

      {/* Navigation */}
      <nav className={`space-y-2 ${isCollapsed ? 'px-3 py-3' : 'px-4 py-4'} flex-1 transition-all duration-300`}>
        {navigationItems.map((item) => {
          const Icon = item.icon;
          const isBookingsMenu = item.label === 'Bookings';
          return (
            <Link key={item.href} href={item.href} onClick={() => setSidebarOpen(false)}>
              <Button
                variant="ghost"
                size={isCollapsed ? "icon" : "default"}
                className={`${isCollapsed ? 'w-10 h-10 p-0' : 'w-full justify-start'} text-gray-700 hover:text-gray-900 transition-all duration-300`}
                title={isCollapsed ? item.label : undefined}
              >
                <Icon className="w-5 h-5" />
                {!isCollapsed && (
                  <span className="ml-2 flex items-center">
                    {item.label}
                    {isBookingsMenu && tenantId && (
                      <PendingBookingsBadge tenantId={tenantId} subdomain={subdomain} />
                    )}
                  </span>
                )}
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
    <div className="flex h-screen bg-gray-50">
      {/* Mobile Sidebar Sheet */}
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden fixed top-4 left-4 z-40 text-gray-700"
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

      {/* Desktop Top Bar + Sidebar (YouTube Style) */}
      <div className="hidden md:flex flex-col w-full">
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

            <Link 
              href={`https://${subdomain}.booqing.my.id`} 
              target="_blank" 
              className="flex items-center gap-2 flex-shrink-0"
            >
              {logoUrl ? (
                <img
                  src={logoUrl}
                  alt="Logo"
                  className="h-8 w-8 object-contain rounded-lg"
                />
              ) : (
                <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                  A
                </div>
              )}
              <span className="font-semibold text-gray-900 hidden lg:inline">Admin</span>
            </Link>
          </div>
        </div>

        {/* Content with Sidebar */}
        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar */}
          <aside className={`bg-white border-r border-gray-200 transition-all duration-300 overflow-y-auto ${
            sidebarCollapsed ? 'w-20' : 'w-64'
          }`}>
            <nav className="py-2 space-y-1">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                const isBookingsMenu = item.label === 'Bookings';
                return (
                  <Link key={item.href} href={item.href} onClick={() => setSidebarOpen(false)}>
                    <Button
                      variant="ghost"
                      className={`text-gray-700 hover:text-gray-900 hover:bg-gray-100 transition-colors ${
                        sidebarCollapsed 
                          ? 'w-full justify-center h-12 rounded-none' 
                          : 'w-full justify-start px-4 h-12 rounded-none'
                      }`}
                      title={sidebarCollapsed ? item.label : undefined}
                    >
                      <Icon className="w-6 h-6 flex-shrink-0" />
                      {!sidebarCollapsed && (
                        <span className="ml-4 text-sm font-medium flex items-center">
                          {item.label}
                          {isBookingsMenu && tenantId && (
                            <PendingBookingsBadge tenantId={tenantId} subdomain={subdomain} />
                          )}
                        </span>
                      )}
                    </Button>
                  </Link>
                );
              })}
            </nav>

            {/* Logout Section */}
            <div className="border-t border-gray-200 py-2">
              <Button 
                asChild 
                variant="ghost"
                className={`text-gray-700 hover:text-red-600 hover:bg-red-50 transition-colors ${
                  sidebarCollapsed 
                    ? 'w-full justify-center h-12 rounded-none' 
                    : 'w-full justify-start px-4 h-12 rounded-none'
                }`}
                title={sidebarCollapsed ? "Logout" : undefined}
              >
                <Link href={`/tenant/login?subdomain=${subdomain}`}>
                  <LogOut className="w-6 h-6 flex-shrink-0" />
                  {!sidebarCollapsed && <span className="ml-4 text-sm font-medium">Logout</span>}
                </Link>
              </Button>
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
