'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  BarChart3,
  BookOpen,
  Users,
  Settings,
  MessageSquare,
  LogOut,
  Home,
} from 'lucide-react';

export default function TenantAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const searchParams = useSearchParams();
  const subdomain = searchParams.get('subdomain') || '';

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
      href: `/tenant/admin/messages?subdomain=${subdomain}`,
      label: 'Messages',
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

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className="w-64 bg-white shadow-md overflow-y-auto">
        <div className="p-6">
          <Link href={`https://${subdomain}.booqing.my.id`} target="_blank" className="block mb-6">
            <h2 className="text-xl font-bold text-gray-900">Admin Panel</h2>
            <p className="text-xs text-gray-500 mt-1">{subdomain}.booqing.my.id</p>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="space-y-2 px-4">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link key={item.href} href={item.href}>
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
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t bg-gray-50">
          <Button asChild variant="outline" className="w-full justify-start text-red-600 hover:text-red-700">
            <Link href="/login">
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Link>
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-8">
        {children}
      </main>
    </div>
  );
}
