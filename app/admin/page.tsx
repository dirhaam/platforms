import { redirect } from 'next/navigation';
import { getServerSession } from '@/lib/auth/auth-middleware';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Shield, 
  Users, 
  Building2, 
  BarChart3, 
  Settings, 
  MessageSquare,
  Database,
  Activity,
  Globe,
  Lock
} from 'lucide-react';
import Link from 'next/link';

export default async function AdminDashboard() {
  const session = await getServerSession();

  // Redirect if not authenticated or not superadmin
  if (!session || session.role !== 'superadmin' || !session.isSuperAdmin) {
    redirect('/login?type=superadmin');
  }

  return (
    <>
      {/* Welcome Section */}
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">
          Welcome back, {session.name}!
        </h2>
        <p className="text-gray-600">
          You have platform-wide access to all tenants and administrative features.
        </p>
      </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Tenants</p>
                  <p className="text-2xl font-bold text-gray-900">--</p>
                </div>
                <Building2 className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active Users</p>
                  <p className="text-2xl font-bold text-gray-900">--</p>
                </div>
                <Users className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Bookings</p>
                  <p className="text-2xl font-bold text-gray-900">--</p>
                </div>
                <BarChart3 className="w-8 h-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">System Health</p>
                  <p className="text-2xl font-bold text-green-600">Healthy</p>
                </div>
                <Activity className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Admin Features */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Tenant Management */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-blue-600" />
                Tenant Management
              </CardTitle>
              <CardDescription>
                Manage all business tenants, subscriptions, and configurations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <Button asChild className="w-full justify-start">
                  <Link href="/admin/tenants">
                    <Building2 className="w-4 h-4 mr-2" />
                    View All Tenants
                  </Link>
                </Button>
                <Button asChild variant="outline" className="w-full justify-start">
                  <Link href="/admin/tenants/create">
                    <Building2 className="w-4 h-4 mr-2" />
                    Create New Tenant
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Platform Analytics */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-purple-600" />
                Platform Analytics
              </CardTitle>
              <CardDescription>
                View platform-wide analytics and performance metrics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <Button asChild className="w-full justify-start">
                  <Link href="/admin/analytics">
                    <BarChart3 className="w-4 h-4 mr-2" />
                    View Analytics
                  </Link>
                </Button>
                <Button asChild variant="outline" className="w-full justify-start">
                  <Link href="/admin/reports">
                    <BarChart3 className="w-4 h-4 mr-2" />
                    Generate Reports
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* System Monitoring */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-green-600" />
                System Monitoring
              </CardTitle>
              <CardDescription>
                Monitor system health, performance, and security
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <Button asChild className="w-full justify-start">
                  <Link href="/admin/monitoring">
                    <Activity className="w-4 h-4 mr-2" />
                    System Health
                  </Link>
                </Button>
                <Button asChild variant="outline" className="w-full justify-start">
                  <Link href="/admin/logs">
                    <Database className="w-4 h-4 mr-2" />
                    View Logs
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* WhatsApp Integration */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-green-600" />
                WhatsApp Integration
              </CardTitle>
              <CardDescription>
                Manage WhatsApp endpoints and device connections
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <Button asChild className="w-full justify-start">
                  <Link href="/admin/whatsapp">
                    <MessageSquare className="w-4 h-4 mr-2" />
                    WhatsApp Status
                  </Link>
                </Button>
                <Button asChild variant="outline" className="w-full justify-start">
                  <Link href="/admin/whatsapp/health">
                    <Activity className="w-4 h-4 mr-2" />
                    Health Monitor
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Security & Audit */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="w-5 h-5 text-red-600" />
                Security & Audit
              </CardTitle>
              <CardDescription>
                Security monitoring, audit logs, and access control
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <Button asChild className="w-full justify-start">
                  <Link href="/admin/security">
                    <Lock className="w-4 h-4 mr-2" />
                    Security Dashboard
                  </Link>
                </Button>
                <Button asChild variant="outline" className="w-full justify-start">
                  <Link href="/admin/audit">
                    <Database className="w-4 h-4 mr-2" />
                    Audit Logs
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Platform Settings */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5 text-gray-600" />
                Platform Settings
              </CardTitle>
              <CardDescription>
                Configure platform-wide settings and preferences
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <Button asChild className="w-full justify-start">
                  <Link href="/admin/settings">
                    <Settings className="w-4 h-4 mr-2" />
                    Global Settings
                  </Link>
                </Button>
                <Button asChild variant="outline" className="w-full justify-start">
                  <Link href="/admin/superadmins">
                    <Shield className="w-4 h-4 mr-2" />
                    Manage SuperAdmins
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="mt-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="w-5 h-5 text-blue-600" />
                Quick Actions
              </CardTitle>
              <CardDescription>
                Common administrative tasks and shortcuts
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Button asChild variant="outline" className="h-auto p-4 flex-col">
                  <Link href="/admin/tenants/create">
                    <Building2 className="w-6 h-6 mb-2" />
                    <span>Create Tenant</span>
                  </Link>
                </Button>
                <Button asChild variant="outline" className="h-auto p-4 flex-col">
                  <Link href="/admin/superadmins/create">
                    <Shield className="w-6 h-6 mb-2" />
                    <span>Add SuperAdmin</span>
                  </Link>
                </Button>
                <Button asChild variant="outline" className="h-auto p-4 flex-col">
                  <Link href="/admin/monitoring">
                    <Activity className="w-6 h-6 mb-2" />
                    <span>System Status</span>
                  </Link>
                </Button>
                <Button asChild variant="outline" className="h-auto p-4 flex-col">
                  <Link href="/admin/analytics">
                    <BarChart3 className="w-6 h-6 mb-2" />
                    <span>View Reports</span>
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
    </>
  );
}