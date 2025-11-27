'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import type { TenantSession } from '@/lib/auth/types';

interface SuperAdminLayoutProps {
  children: React.ReactNode;
  session: TenantSession;
}

interface NavigationItem {
  name: string;
  href: string;
  icon: string;
  badge?: string;
  badgeColor?: 'primary' | 'success' | 'warning' | 'danger' | 'info';
}

interface NavigationGroup {
  title: string;
  items: NavigationItem[];
}

const navigationGroups: NavigationGroup[] = [
  {
    title: 'Overview',
    items: [
      { name: 'Dashboard', href: '/admin', icon: 'bx-home-circle' },
      { name: 'Analytics', href: '/admin/analytics', icon: 'bx-bar-chart-alt-2' },
    ]
  },
  {
    title: 'Management',
    items: [
      { name: 'Tenants', href: '/admin/tenants', icon: 'bx-building-house' },
      { name: 'Super Admins', href: '/admin/superadmins', icon: 'bx-user-check' },
    ]
  },
  {
    title: 'System',
    items: [
      { name: 'WhatsApp', href: '/admin/whatsapp', icon: 'bxl-whatsapp' },
      { name: 'Monitoring', href: '/admin/monitoring', icon: 'bx-pulse' },
      { name: 'Security', href: '/admin/security', icon: 'bx-shield-quarter' },
      { name: 'Audit Logs', href: '/admin/audit', icon: 'bx-list-check' },
    ]
  },
  {
    title: 'Settings',
    items: [
      { name: 'Platform Settings', href: '/admin/settings', icon: 'bx-cog' },
    ]
  }
];

export default function SuperAdminLayout({ children, session }: SuperAdminLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const handleLogout = async () => {
    try {
      const response = await fetch('/api/auth/logout', { method: 'POST' });
      if (response.ok) {
        router.push('/login');
        router.refresh();
      }
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const getUserInitials = (name: string) => {
    return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const isActiveRoute = (href: string) => {
    if (href === '/admin') return pathname === '/admin';
    return pathname?.startsWith(href);
  };

  return (
    <div className="flex h-screen bg-body dark:bg-[#232333]">
      {/* Desktop Sidebar */}
      <aside className={`hidden lg:flex flex-col bg-white dark:bg-[#2b2c40] border-r border-gray-100 dark:border-[#4e4f6c] transition-all duration-300 ease-in-out ${
        sidebarCollapsed ? 'w-20' : 'w-64'
      }`}>
        {/* Sidebar Header */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-gray-100 dark:border-[#4e4f6c]">
          {!sidebarCollapsed && (
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-primary to-[#5f61e6] flex items-center justify-center shadow-md shadow-primary/30">
                <i className='bx bxs-shield text-white text-lg'></i>
              </div>
              <div>
                <span className="font-bold text-txt-primary dark:text-[#d5d5e2]">Booqing</span>
                <p className="text-[10px] text-txt-muted dark:text-[#7e7f96] -mt-0.5">Platform Admin</p>
              </div>
            </div>
          )}
          {sidebarCollapsed && (
            <div className="w-full flex justify-center">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-primary to-[#5f61e6] flex items-center justify-center shadow-md shadow-primary/30">
                <i className='bx bxs-shield text-white text-lg'></i>
              </div>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4">
          {navigationGroups.map((group, groupIndex) => (
            <div key={group.title} className={groupIndex > 0 ? 'mt-4' : ''}>
              {!sidebarCollapsed && (
                <p className="px-6 mb-2 text-[10px] font-semibold text-txt-muted dark:text-[#7e7f96] uppercase tracking-wider">
                  {group.title}
                </p>
              )}
              <div className="px-3 space-y-1">
                {group.items.map((item) => {
                  const isActive = isActiveRoute(item.href);
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-150 ease-in-out group ${
                        isActive
                          ? 'bg-primary-light dark:bg-[#35365f] text-primary dark:text-[#a5a7ff]'
                          : 'text-txt-secondary dark:text-[#b2b2c4] hover:bg-gray-50 dark:hover:bg-[#232333] hover:text-primary dark:hover:text-[#a5a7ff]'
                      } ${sidebarCollapsed ? 'justify-center' : ''}`}
                      title={sidebarCollapsed ? item.name : undefined}
                    >
                      <div className={`w-8 h-8 rounded flex items-center justify-center flex-shrink-0 transition-colors duration-150 ${
                        isActive 
                          ? 'bg-primary/10 dark:bg-primary/20' 
                          : 'bg-gray-100 dark:bg-[#35365f] group-hover:bg-primary/10 dark:group-hover:bg-primary/20'
                      }`}>
                        <i className={`bx ${item.icon} text-lg ${
                          isActive 
                            ? 'text-primary dark:text-[#a5a7ff]' 
                            : 'text-txt-muted dark:text-[#7e7f96] group-hover:text-primary dark:group-hover:text-[#a5a7ff]'
                        }`}></i>
                      </div>
                      {!sidebarCollapsed && (
                        <>
                          <span className="text-sm font-medium flex-1">{item.name}</span>
                          {item.badge && (
                            <span className={`px-2 py-0.5 text-[10px] font-semibold rounded-full ${
                              item.badgeColor === 'success' ? 'bg-success/10 text-success' :
                              item.badgeColor === 'warning' ? 'bg-warning/10 text-warning' :
                              item.badgeColor === 'danger' ? 'bg-danger/10 text-danger' :
                              item.badgeColor === 'info' ? 'bg-info/10 text-info' :
                              'bg-primary-light text-primary'
                            }`}>
                              {item.badge}
                            </span>
                          )}
                        </>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Sidebar Footer - User */}
        <div className="border-t border-gray-100 dark:border-[#4e4f6c] p-3">
          <div className={`flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-[#232333] transition-colors cursor-pointer ${
            sidebarCollapsed ? 'justify-center' : ''
          }`}>
            <div className="w-9 h-9 rounded-full bg-primary-light dark:bg-[#35365f] flex items-center justify-center flex-shrink-0">
              <span className="text-sm font-semibold text-primary dark:text-[#a5a7ff]">
                {getUserInitials(session.name)}
              </span>
            </div>
            {!sidebarCollapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-txt-primary dark:text-[#d5d5e2] truncate">{session.name}</p>
                <p className="text-xs text-txt-muted dark:text-[#7e7f96] truncate">Super Admin</p>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Main Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Navbar */}
        <header className="h-16 bg-white dark:bg-[#2b2c40] border-b border-gray-100 dark:border-[#4e4f6c] flex items-center px-4 gap-4 sticky top-0 z-30">
          {/* Hamburger - Desktop */}
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="hidden lg:flex w-10 h-10 rounded-lg hover:bg-gray-100 dark:hover:bg-[#35365f] items-center justify-center transition-colors"
          >
            <i className='bx bx-menu text-xl text-txt-secondary dark:text-[#b2b2c4]'></i>
          </button>

          {/* Hamburger - Mobile */}
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="lg:hidden w-10 h-10 rounded-lg hover:bg-gray-100 dark:hover:bg-[#35365f] flex items-center justify-center transition-colors"
          >
            <i className='bx bx-menu text-xl text-txt-secondary dark:text-[#b2b2c4]'></i>
          </button>

          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-[#5f61e6] flex items-center justify-center">
              <i className='bx bxs-shield text-white text-sm'></i>
            </div>
            <span className="font-bold text-txt-primary dark:text-[#d5d5e2]">Booqing</span>
          </div>

          {/* Search Bar */}
          <div className="hidden md:flex flex-1 max-w-md">
            <div className="relative w-full">
              <i className='bx bx-search absolute left-3 top-1/2 -translate-y-1/2 text-txt-muted dark:text-[#7e7f96]'></i>
              <input
                type="text"
                placeholder="Search..."
                className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-[#232333] border border-transparent rounded-lg text-sm text-txt-primary dark:text-[#d5d5e2] placeholder-txt-muted dark:placeholder-[#7e7f96] focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-150"
              />
            </div>
          </div>

          <div className="flex-1 md:hidden"></div>

          {/* Right Actions */}
          <div className="flex items-center gap-2">
            {/* Notifications */}
            <button className="relative w-10 h-10 rounded-lg hover:bg-gray-100 dark:hover:bg-[#35365f] flex items-center justify-center transition-colors">
              <i className='bx bx-bell text-xl text-txt-secondary dark:text-[#b2b2c4]'></i>
              <span className="absolute top-2 right-2 w-2 h-2 bg-danger rounded-full"></span>
            </button>

            {/* User Menu */}
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-[#35365f] transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-primary-light dark:bg-[#35365f] flex items-center justify-center">
                  <span className="text-xs font-semibold text-primary dark:text-[#a5a7ff]">
                    {getUserInitials(session.name)}
                  </span>
                </div>
                <i className={`bx bx-chevron-down text-txt-muted dark:text-[#7e7f96] transition-transform duration-200 ${userMenuOpen ? 'rotate-180' : ''}`}></i>
              </button>

              {/* User Dropdown */}
              {userMenuOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setUserMenuOpen(false)}></div>
                  <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-[#2b2c40] rounded-lg shadow-lg border border-gray-100 dark:border-[#4e4f6c] py-2 z-50">
                    <div className="px-4 py-3 border-b border-gray-100 dark:border-[#4e4f6c]">
                      <p className="text-sm font-medium text-txt-primary dark:text-[#d5d5e2]">{session.name}</p>
                      <p className="text-xs text-txt-muted dark:text-[#7e7f96]">{session.email}</p>
                      <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 text-[10px] font-semibold rounded-full bg-primary-light dark:bg-[#35365f] text-primary dark:text-[#a5a7ff]">
                        <i className='bx bxs-shield text-xs'></i>
                        Super Admin
                      </span>
                    </div>
                    <div className="py-1">
                      <Link
                        href="/admin/profile"
                        className="flex items-center gap-2 px-4 py-2 text-sm text-txt-secondary dark:text-[#b2b2c4] hover:bg-gray-50 dark:hover:bg-[#232333]"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        <i className='bx bx-user'></i>
                        Profile
                      </Link>
                      <Link
                        href="/admin/settings"
                        className="flex items-center gap-2 px-4 py-2 text-sm text-txt-secondary dark:text-[#b2b2c4] hover:bg-gray-50 dark:hover:bg-[#232333]"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        <i className='bx bx-cog'></i>
                        Settings
                      </Link>
                    </div>
                    <div className="border-t border-gray-100 dark:border-[#4e4f6c] pt-1">
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2 px-4 py-2 text-sm text-danger hover:bg-red-50 dark:hover:bg-red-900/20"
                      >
                        <i className='bx bx-log-out'></i>
                        Logout
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>

      {/* Mobile Sidebar Overlay */}
      {mobileMenuOpen && (
        <>
          <div 
            className="lg:hidden fixed inset-0 bg-black/50 z-40"
            onClick={() => setMobileMenuOpen(false)}
          ></div>
          <aside className="lg:hidden fixed inset-y-0 left-0 w-64 bg-white dark:bg-[#2b2c40] z-50 shadow-xl">
            {/* Mobile Sidebar Header */}
            <div className="h-16 flex items-center justify-between px-4 border-b border-gray-100 dark:border-[#4e4f6c]">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-primary to-[#5f61e6] flex items-center justify-center shadow-md shadow-primary/30">
                  <i className='bx bxs-shield text-white text-lg'></i>
                </div>
                <div>
                  <span className="font-bold text-txt-primary dark:text-[#d5d5e2]">Booqing</span>
                  <p className="text-[10px] text-txt-muted dark:text-[#7e7f96] -mt-0.5">Platform Admin</p>
                </div>
              </div>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="w-8 h-8 rounded-lg hover:bg-gray-100 dark:hover:bg-[#35365f] flex items-center justify-center transition-colors"
              >
                <i className='bx bx-x text-xl text-txt-muted dark:text-[#7e7f96]'></i>
              </button>
            </div>

            {/* Mobile Navigation */}
            <nav className="flex-1 overflow-y-auto py-4">
              {navigationGroups.map((group, groupIndex) => (
                <div key={group.title} className={groupIndex > 0 ? 'mt-4' : ''}>
                  <p className="px-6 mb-2 text-[10px] font-semibold text-txt-muted dark:text-[#7e7f96] uppercase tracking-wider">
                    {group.title}
                  </p>
                  <div className="px-3 space-y-1">
                    {group.items.map((item) => {
                      const isActive = isActiveRoute(item.href);
                      return (
                        <Link
                          key={item.name}
                          href={item.href}
                          onClick={() => setMobileMenuOpen(false)}
                          className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-150 ease-in-out ${
                            isActive
                              ? 'bg-primary-light dark:bg-[#35365f] text-primary dark:text-[#a5a7ff]'
                              : 'text-txt-secondary dark:text-[#b2b2c4] hover:bg-gray-50 dark:hover:bg-[#232333]'
                          }`}
                        >
                          <div className={`w-8 h-8 rounded flex items-center justify-center ${
                            isActive ? 'bg-primary/10 dark:bg-primary/20' : 'bg-gray-100 dark:bg-[#35365f]'
                          }`}>
                            <i className={`bx ${item.icon} text-lg ${
                              isActive ? 'text-primary dark:text-[#a5a7ff]' : 'text-txt-muted dark:text-[#7e7f96]'
                            }`}></i>
                          </div>
                          <span className="text-sm font-medium">{item.name}</span>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ))}
            </nav>

            {/* Mobile User Section */}
            <div className="border-t border-gray-100 dark:border-[#4e4f6c] p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-primary-light dark:bg-[#35365f] flex items-center justify-center">
                  <span className="text-sm font-semibold text-primary dark:text-[#a5a7ff]">
                    {getUserInitials(session.name)}
                  </span>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-txt-primary dark:text-[#d5d5e2]">{session.name}</p>
                  <p className="text-xs text-txt-muted dark:text-[#7e7f96]">Super Admin</p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 py-2 text-sm font-medium text-danger bg-red-50 dark:bg-red-900/20 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
              >
                <i className='bx bx-log-out'></i>
                Logout
              </button>
            </div>
          </aside>
        </>
      )}
    </div>
  );
}
