import { requirePermission } from '@/lib/auth/auth-middleware';
import TenantSettings from '@/components/settings/TenantSettings';

export default async function SettingsPage() {
  const session = await requirePermission('manage_settings');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Business Settings</h1>
        <p className="text-gray-600">
          Manage your business profile, services, and customization options.
        </p>
      </div>

      <TenantSettings session={session} />
    </div>
  );
}