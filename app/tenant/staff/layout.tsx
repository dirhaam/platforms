'use client';

import { Suspense, useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ThemeProvider } from '@/lib/contexts/ThemeContext';
import { TenantProvider } from '@/lib/contexts/TenantContext';

interface StaffUser {
  id: string;
  name: string;
  email: string;
  role: string;
  tenantId: string;
}

interface TenantData {
  id: string;
  businessName: string;
  logo?: string;
}

function StaffLayoutContent({ children }: { children: React.ReactNode }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const subdomain = searchParams?.get('subdomain') || '';
  
  const [user, setUser] = useState<StaffUser | null>(null);
  const [tenant, setTenant] = useState<TenantData | null>(null);
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    checkAuth();
  }, [subdomain]);

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/auth/me', {
        headers: { 'X-Tenant-ID': subdomain },
      });

      if (!response.ok) {
        router.push(`/tenant/staff/login?subdomain=${subdomain}`);
        return;
      }

      const data = await response.json();
      setUser(data.user);
      setTenant(data.tenant);
    } catch (error) {
      console.error('Auth check failed:', error);
      router.push(`/tenant/staff/login?subdomain=${subdomain}`);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push(`/tenant/staff/login?subdomain=${subdomain}`);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-body dark:bg-[#232333] flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 rounded-lg bg-primary-light dark:bg-[#35365f] flex items-center justify-center mb-3 mx-auto">
            <i className='bx bx-loader-alt text-xl text-primary dark:text-[#a5a7ff] animate-spin'></i>
          </div>
          <p className="text-sm text-txt-muted dark:text-[#7e7f96]">Memuat...</p>
        </div>
      </div>
    );
  }

  // Login page doesn't need layout
  const isLoginPage = typeof window !== 'undefined' && window.location.pathname.includes('/login');
  if (isLoginPage || !user) {
    return <>{children}</>;
  }

  return (
    <ThemeProvider>
      <TenantProvider subdomain={subdomain}>
        <div className="min-h-screen bg-body dark:bg-[#232333]">
          {/* Header */}
          <header className="bg-white dark:bg-[#2b2c40] border-b border-gray-100 dark:border-[#4e4f6c] sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4">
              <div className="flex items-center justify-between h-16">
                {/* Logo */}
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
                    <i className='bx bx-calendar-check text-xl text-white'></i>
                  </div>
                  <div>
                    <h1 className="font-semibold text-txt-primary dark:text-[#d5d5e2]">
                      {tenant?.businessName || 'Staff Portal'}
                    </h1>
                    <p className="text-xs text-txt-muted dark:text-[#7e7f96]">Staff Portal</p>
                  </div>
                </div>

                {/* Nav Links - Desktop */}
                <nav className="hidden md:flex items-center gap-1">
                  <Link
                    href={`/tenant/staff?subdomain=${subdomain}`}
                    className="px-4 py-2 text-sm font-medium text-txt-secondary dark:text-[#b2b2c4] hover:text-primary dark:hover:text-[#a5a7ff] hover:bg-gray-50 dark:hover:bg-[#35365f] rounded-lg transition-colors"
                  >
                    <i className='bx bx-home-alt mr-2'></i>
                    Dashboard
                  </Link>
                  <Link
                    href={`/tenant/staff/bookings?subdomain=${subdomain}`}
                    className="px-4 py-2 text-sm font-medium text-txt-secondary dark:text-[#b2b2c4] hover:text-primary dark:hover:text-[#a5a7ff] hover:bg-gray-50 dark:hover:bg-[#35365f] rounded-lg transition-colors"
                  >
                    <i className='bx bx-calendar mr-2'></i>
                    Semua Booking
                  </Link>
                </nav>

                {/* User Menu */}
                <div className="relative">
                  <button
                    onClick={() => setMenuOpen(!menuOpen)}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-[#35365f] transition-colors"
                  >
                    <div className="w-8 h-8 rounded-full bg-primary-light dark:bg-[#35365f] flex items-center justify-center">
                      <span className="text-sm font-medium text-primary dark:text-[#a5a7ff]">
                        {user.name?.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <span className="hidden sm:block text-sm font-medium text-txt-primary dark:text-[#d5d5e2]">
                      {user.name}
                    </span>
                    <i className={`bx bx-chevron-down text-txt-muted dark:text-[#7e7f96] transition-transform ${menuOpen ? 'rotate-180' : ''}`}></i>
                  </button>

                  {/* Dropdown */}
                  {menuOpen && (
                    <>
                      <div 
                        className="fixed inset-0 z-40" 
                        onClick={() => setMenuOpen(false)}
                      />
                      <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-[#2b2c40] rounded-lg shadow-lg border border-gray-100 dark:border-[#4e4f6c] py-2 z-50">
                        <div className="px-4 py-2 border-b border-gray-100 dark:border-[#4e4f6c]">
                          <p className="text-sm font-medium text-txt-primary dark:text-[#d5d5e2]">{user.name}</p>
                          <p className="text-xs text-txt-muted dark:text-[#7e7f96]">{user.email}</p>
                        </div>
                        
                        {/* Mobile Nav Links */}
                        <div className="md:hidden py-2 border-b border-gray-100 dark:border-[#4e4f6c]">
                          <Link
                            href={`/tenant/staff?subdomain=${subdomain}`}
                            className="flex items-center gap-2 px-4 py-2 text-sm text-txt-secondary dark:text-[#b2b2c4] hover:bg-gray-50 dark:hover:bg-[#35365f]"
                            onClick={() => setMenuOpen(false)}
                          >
                            <i className='bx bx-home-alt'></i>
                            Dashboard
                          </Link>
                          <Link
                            href={`/tenant/staff/bookings?subdomain=${subdomain}`}
                            className="flex items-center gap-2 px-4 py-2 text-sm text-txt-secondary dark:text-[#b2b2c4] hover:bg-gray-50 dark:hover:bg-[#35365f]"
                            onClick={() => setMenuOpen(false)}
                          >
                            <i className='bx bx-calendar'></i>
                            Semua Booking
                          </Link>
                        </div>

                        <button
                          onClick={handleLogout}
                          className="w-full flex items-center gap-2 px-4 py-2 text-sm text-danger hover:bg-red-50 dark:hover:bg-red-900/20"
                        >
                          <i className='bx bx-log-out'></i>
                          Keluar
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </header>

          {/* Main Content */}
          <main className="max-w-7xl mx-auto px-4 py-6">
            {children}
          </main>

          {/* Footer */}
          <footer className="border-t border-gray-100 dark:border-[#4e4f6c] mt-auto">
            <div className="max-w-7xl mx-auto px-4 py-4">
              <p className="text-center text-xs text-txt-muted dark:text-[#7e7f96]">
                &copy; {new Date().getFullYear()} {tenant?.businessName || 'Booqing'} - Staff Portal
              </p>
            </div>
          </footer>
        </div>
      </TenantProvider>
    </ThemeProvider>
  );
}

export default function StaffLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-body dark:bg-[#232333] flex items-center justify-center">
        <div className="w-10 h-10 rounded-lg bg-primary-light flex items-center justify-center">
          <i className='bx bx-loader-alt text-xl text-primary animate-spin'></i>
        </div>
      </div>
    }>
      <StaffLayoutContent>{children}</StaffLayoutContent>
    </Suspense>
  );
}
