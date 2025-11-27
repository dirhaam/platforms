'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { PermissionGate } from '@/components/tenant/permission-gate';

interface MenuItem {
  id: string;
  title: string;
  icon: string;
  description: string;
  href: string;
  badge?: string;
  badgeColor?: string;
  disabled?: boolean;
}

interface MenuGroup {
  title: string;
  items: MenuItem[];
}

const MENU_GROUPS: MenuGroup[] = [
  {
    title: 'Landing Page',
    items: [
      { id: 'appearance', title: 'Tampilan', icon: 'bx-palette', description: 'Tema dan style landing page', href: '/tenant/admin/settings/appearance' },
      { id: 'media', title: 'Media', icon: 'bx-image', description: 'Video, galeri, dan media', href: '/tenant/admin/settings/media' },
      { id: 'contact', title: 'Contact Link', icon: 'bx-link', description: 'Halaman link kontak', href: '/tenant/admin/settings/contact' },
    ]
  },
  {
    title: 'Operasional',
    items: [
      { id: 'calendar', title: 'Kalender', icon: 'bx-calendar', description: 'Jam operasional & libur', href: '/tenant/admin/settings/calendar' },
      { id: 'invoice', title: 'Invoice', icon: 'bx-receipt', description: 'Pengaturan faktur', href: '/tenant/admin/settings/invoice' },
    ]
  },
  {
    title: 'Lainnya',
    items: [
      { id: 'notifications', title: 'Notifikasi', icon: 'bx-bell', description: 'Pengaturan notifikasi', href: '#', badge: 'Soon', badgeColor: 'warning', disabled: true },
      { id: 'integrations', title: 'Integrasi', icon: 'bx-plug', description: 'Koneksi eksternal', href: '#', badge: 'Soon', badgeColor: 'warning', disabled: true },
    ]
  }
];

export default function SettingsPageContent() {
  return (
    <PermissionGate feature="settings">
      <SettingsPageInner />
    </PermissionGate>
  );
}

function SettingsPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const subdomain = searchParams?.get('subdomain');

  const handleNavigate = (item: MenuItem) => {
    if (item.disabled) return;
    router.push(`${item.href}?subdomain=${subdomain}`);
  };

  if (!subdomain) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-primary-light dark:bg-[#35365f] flex items-center justify-center">
          <i className='bx bx-cog text-xl text-primary dark:text-[#a5a7ff]'></i>
        </div>
        <div>
          <h4 className="text-xl font-bold text-txt-primary dark:text-[#d5d5e2]">Pengaturan</h4>
          <p className="text-sm text-txt-muted dark:text-[#7e7f96]">Kelola pengaturan bisnis Anda</p>
        </div>
      </div>

      {/* Menu Groups */}
      {MENU_GROUPS.map((group) => (
        <div key={group.title} className="space-y-3">
          <h5 className="text-sm font-semibold text-txt-muted dark:text-[#7e7f96] uppercase tracking-wider px-1">
            {group.title}
          </h5>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {group.items.map((item) => (
              <button
                key={item.id}
                onClick={() => handleNavigate(item)}
                disabled={item.disabled}
                className={`relative bg-white dark:bg-[#2b2c40] rounded-card shadow-card p-5 text-left transition-all duration-200 ease-in-out ${
                  item.disabled
                    ? 'opacity-60 cursor-not-allowed'
                    : 'hover:shadow-lg hover:-translate-y-0.5 cursor-pointer'
                }`}
              >
                {item.badge && (
                  <span className={`absolute top-3 right-3 px-2 py-0.5 text-[10px] font-semibold rounded-full ${
                    item.badgeColor === 'warning' 
                      ? 'bg-warning/10 text-warning' 
                      : 'bg-primary-light text-primary'
                  }`}>
                    {item.badge}
                  </span>
                )}
                <div className="flex items-start gap-4">
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    item.disabled
                      ? 'bg-gray-100 dark:bg-[#35365f]'
                      : 'bg-primary-light dark:bg-[#35365f]'
                  }`}>
                    <i className={`bx ${item.icon} text-2xl ${
                      item.disabled
                        ? 'text-txt-muted dark:text-[#7e7f96]'
                        : 'text-primary dark:text-[#a5a7ff]'
                    }`}></i>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-base font-semibold text-txt-primary dark:text-[#d5d5e2] mb-1">
                      {item.title}
                    </p>
                    <p className="text-sm text-txt-muted dark:text-[#7e7f96]">
                      {item.description}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
