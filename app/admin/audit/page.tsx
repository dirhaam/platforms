export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { redirect } from 'next/navigation';
import { getServerSession } from '@/lib/auth/auth-middleware';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Lock, Download, AlertCircle } from 'lucide-react';
import Link from 'next/link';

export default async function AuditPage() {
  const session = await getServerSession();

  if (!session || session.role !== 'superadmin' || !session.isSuperAdmin) {
    redirect('/login?type=superadmin');
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Audit Logs</h1>
          <p className="text-gray-600">
            Security and compliance audit trail
          </p>
        </div>
        <Button asChild>
          <Link href="/admin">
            Back to Dashboard
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Events</p>
                <p className="text-2xl font-bold text-gray-900">--</p>
              </div>
              <Lock className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Today's Events</p>
                <p className="text-2xl font-bold text-gray-900">--</p>
              </div>
              <AlertCircle className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Failures</p>
                <p className="text-2xl font-bold text-gray-900">0</p>
              </div>
              <AlertCircle className="w-8 h-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="w-5 h-5" />
            Recent Audit Events
          </CardTitle>
          <CardDescription>
            Security-relevant events and actions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="border-b pb-4">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-medium text-gray-900">User Login</p>
                  <p className="text-sm text-gray-600">{session.email}</p>
                </div>
                <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">Success</span>
              </div>
              <p className="text-xs text-gray-500 mt-2">Just now</p>
            </div>
            <div className="border-b pb-4">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-medium text-gray-900">SuperAdmin Created</p>
                  <p className="text-sm text-gray-600">New superadmin account added</p>
                </div>
                <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">Info</span>
              </div>
              <p className="text-xs text-gray-500 mt-2">Earlier today</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Button variant="outline">
        <Download className="w-4 h-4 mr-2" />
        Export Audit Log
      </Button>
    </div>
  );
}
