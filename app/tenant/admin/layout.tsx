'use client';

import { Suspense, useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Sidebar } from '@/components/tenant/Sidebar';
import { Navbar } from '@/components/tenant/Navbar';
import { cn } from '@/lib/utils';
import { ExpiredAdminBlock } from '@/components/tenant/ExpiredOverlay';
import { PWAProvider } from '@/components/pwa/PWAProvider';
import { TenantProvider } from '@/lib/contexts/TenantContext';
import { ThemeProvider } from '@/lib/contexts/ThemeContext';

import { fetchTenantBySubdomain } from '@/lib/subdomain-fetcher';

interface TenantData {
  id?: string;
  logo?: string;
  businessName?: string;
  subscriptionStatus?: string;
  subscriptionExpiresAt?: string;
  isExpired?: boolean;
}

function TenantAdminLayoutContent({
  children,
}: {
  children: React.ReactNode;
}) {
  const searchParams = useSearchParams();
  const subdomain = searchParams?.get('subdomain') || '';
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [tenantData, setTenantData] = useState<TenantData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setMounted(true);

    const loadTenantData = async () => {
      if (subdomain) {
        try {
          const data = await fetchTenantBySubdomain(subdomain);
          if (data) {
            // Check if subscription is expired
            const subscriptionStatus = data.subscriptionStatus || 'active';
            const subscriptionExpiresAt = data.subscriptionExpiresAt;
            const isExpired = subscriptionStatus === 'suspended' ||
              subscriptionStatus === 'cancelled' ||
              (subscriptionExpiresAt && new Date(subscriptionExpiresAt) < new Date());

            setTenantData({
              id: data.id,
              logo: data.logo,
              businessName: data.businessName,
              subscriptionStatus,
              subscriptionExpiresAt: subscriptionExpiresAt ? String(subscriptionExpiresAt) : undefined,
              isExpired,
            });
          }
        } catch (error) {
          console.error('Error loading tenant data:', error);
        }
      }
      setLoading(false);
    };

    loadTenantData();
  }, [subdomain]);

  if (!mounted || loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }

  // Show expired block if subscription is expired
  if (tenantData?.isExpired) {
    return (
      <ExpiredAdminBlock
        businessName={tenantData.businessName || 'Business'}
        expiresAt={tenantData.subscriptionExpiresAt}
        onRenew={() => {
          // Redirect to contact or show contact info
          window.location.href = 'mailto:support@booqing.my.id?subject=Perpanjang Subscription';
        }}
      />
    );
  }

  return (
    <ThemeProvider>
      <PWAProvider>
        <TenantProvider subdomain={subdomain}>
          <div className="flex min-h-screen bg-body dark:bg-gray-900 font-sans">
            <Sidebar
              collapsed={sidebarCollapsed}
              setCollapsed={setSidebarCollapsed}
              subdomain={subdomain}
              logo={tenantData?.logo}
              businessName={tenantData?.businessName}
            />

            <div
              className={cn(
                "flex-1 flex flex-col transition-all duration-300 ease-in-out relative",
                sidebarCollapsed ? "ml-20" : "ml-64"
              )}
            >
              <Navbar tenantId={tenantData?.id} subdomain={subdomain} />

              {/* Main Content */}
              <main className="flex-1 p-6 overflow-y-auto">
                {children}

                {/* Footer */}
                <footer className="mt-12 flex flex-col md:flex-row justify-between items-center text-sm text-txt-muted dark:text-gray-400">
                  <p>&copy; {new Date().getFullYear()} {tenantData?.businessName || 'Booqing'}, made with ❤️ by Booqing</p>
                  <div className="flex gap-4 mt-2 md:mt-0">
                    <a href="#" className="hover:text-primary">License</a>
                    <a href="#" className="hover:text-primary">Documentation</a>
                    <a href="#" className="hover:text-primary">Support</a>
                  </div>
                </footer>
              </main>
            </div>
          </div>
        </TenantProvider>
      </PWAProvider>
    </ThemeProvider>
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
