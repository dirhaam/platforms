export const runtime = 'nodejs';

import { redirect } from 'next/navigation';
import { getServerSession } from '@/lib/auth/auth-middleware';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MessageSquare, Smartphone, Activity, Settings } from 'lucide-react';

export default async function WhatsAppPage() {
  const session = await getServerSession();

  // Redirect if not authenticated or not superadmin
  if (!session || session.role !== 'superadmin' || !session.isSuperAdmin) {
    redirect('/login?type=superadmin');
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">WhatsApp Integration</h1>
        <p className="text-gray-600">
          Manage WhatsApp API integrations across all tenants
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Devices</p>
                <p className="text-2xl font-bold text-gray-900">--</p>
              </div>
              <Smartphone className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Endpoints</p>
                <p className="text-2xl font-bold text-gray-900">--</p>
              </div>
              <MessageSquare className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Messages Today</p>
                <p className="text-2xl font-bold text-gray-900">--</p>
              </div>
              <Activity className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Health Status</p>
                <p className="text-2xl font-bold text-green-600">Good</p>
              </div>
              <Settings className="w-8 h-8 text-gray-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>WhatsApp Integration Status</CardTitle>
          <CardDescription>
            Overview of WhatsApp API integrations across all tenants
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            WhatsApp integration management interface will be implemented here.
            <br />
            This will include device management, endpoint configuration, and health monitoring.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}