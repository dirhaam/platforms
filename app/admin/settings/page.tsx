export const runtime = 'nodejs';

import { redirect } from 'next/navigation';
import { getServerSession } from '@/lib/auth/auth-middleware';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Settings, Save } from 'lucide-react';
import Link from 'next/link';

export default async function SettingsPage() {
  const session = await getServerSession();

  if (!session || session.role !== 'superadmin' || !session.isSuperAdmin) {
    redirect('/login?type=superadmin');
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Platform Settings</h1>
          <p className="text-gray-600">
            Configure global platform settings and preferences
          </p>
        </div>
        <Button asChild>
          <Link href="/admin">
            Back to Dashboard
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            General Settings
          </CardTitle>
          <CardDescription>
            Basic platform configuration
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium">Platform Name</label>
            <input
              type="text"
              placeholder="Booqing"
              className="w-full border rounded p-2"
              disabled
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Support Email</label>
            <input
              type="email"
              placeholder="support@booqing.my.id"
              className="w-full border rounded p-2"
              disabled
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Default Timezone</label>
            <select className="w-full border rounded p-2" disabled>
              <option>Asia/Jakarta</option>
            </select>
          </div>
          <Button disabled>
            <Save className="w-4 h-4 mr-2" />
            Save Settings
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Email Configuration</CardTitle>
          <CardDescription>
            Configure email settings for notifications
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium">SMTP Server</label>
            <input
              type="text"
              placeholder="smtp.gmail.com"
              className="w-full border rounded p-2"
              disabled
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">SMTP Port</label>
            <input
              type="number"
              placeholder="587"
              className="w-full border rounded p-2"
              disabled
            />
          </div>
          <Button disabled>
            <Save className="w-4 h-4 mr-2" />
            Save Email Config
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
