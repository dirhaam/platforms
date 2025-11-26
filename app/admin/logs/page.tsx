export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { redirect } from 'next/navigation';
import { getServerSession } from '@/lib/auth/auth-middleware';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Database, Download, Filter } from 'lucide-react';
import Link from 'next/link';

export default async function LogsPage() {
  const session = await getServerSession();

  if (!session || session.role !== 'superadmin' || !session.isSuperAdmin) {
    redirect('/login?type=superadmin');
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">System Logs</h1>
          <p className="text-gray-600">
            View and monitor application logs
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
            <Database className="w-5 h-5" />
            Log Filters
          </CardTitle>
          <CardDescription>
            Filter logs by type, date, and severity
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Log Type</label>
              <select className="w-full border rounded p-2">
                <option>All Types</option>
                <option>API Requests</option>
                <option>Database</option>
                <option>Authentication</option>
                <option>Errors</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Severity</label>
              <select className="w-full border rounded p-2">
                <option>All Levels</option>
                <option>Info</option>
                <option>Warning</option>
                <option>Error</option>
                <option>Critical</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Date Range</label>
              <input type="date" className="w-full border rounded p-2" />
            </div>
            <div className="flex items-end gap-2">
              <Button className="w-full">
                <Filter className="w-4 h-4 mr-2" />
                Apply Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Application Logs</CardTitle>
          <CardDescription>
            Recent system activity and events
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="border-b pb-4">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-medium text-gray-900">API Request</p>
                  <p className="text-sm text-gray-600">POST /api/bookings</p>
                </div>
                <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">Success</span>
              </div>
              <p className="text-xs text-gray-500 mt-2">2 hours ago</p>
            </div>
            <div className="border-b pb-4">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-medium text-gray-900">Database Query</p>
                  <p className="text-sm text-gray-600">SELECT * FROM tenants</p>
                </div>
                <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">Info</span>
              </div>
              <p className="text-xs text-gray-500 mt-2">3 hours ago</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Button variant="outline">
        <Download className="w-4 h-4 mr-2" />
        Export Logs
      </Button>
    </div>
  );
}
