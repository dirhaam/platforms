'use client';

import { Suspense, useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Sidebar } from '@/components/tenant/Sidebar';
import { Navbar } from '@/components/tenant/Navbar';
import { cn } from '@/lib/utils';

import { fetchTenantBySubdomain } from '@/lib/subdomain-fetcher';

function TenantAdminLayoutContent({
  children,
}: {
  children: React.ReactNode;
}) {
  const searchParams = useSearchParams();
  const subdomain = searchParams?.get('subdomain') || '';
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [tenantData, setTenantData] = useState<{ logo?: string; businessName?: string } | null>(null);

  useEffect(() => {
    setMounted(true);

    const loadTenantData = async () => {
      if (subdomain) {
        const data = await fetchTenantBySubdomain(subdomain);
        if (data) {
          setTenantData({
            logo: data.logo,
            businessName: data.businessName
          });
        }
      }
    };

    loadTenantData();
  }, [subdomain]);

  if (!mounted) {
    return null;
  }

  return (
    <div className="flex min-h-screen bg-background font-sans">
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
        <Navbar />

        {/* Main Content */}
        <main className="flex-1 p-6 overflow-y-auto">
          {children}

          {/* Footer */}
          <footer className="mt-12 flex flex-col md:flex-row justify-between items-center text-sm text-muted-foreground">
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

