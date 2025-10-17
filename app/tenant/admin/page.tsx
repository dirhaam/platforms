export const runtime = 'nodejs';

import { redirect } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  BarChart3,
  BookOpen,
  Users,
  Settings,
  MessageSquare,
  TrendingUp,
  Calendar,
  DollarSign,
  Clock,
  AlertCircle,
} from 'lucide-react';
import Link from 'next/link';

export default async function TenantAdminDashboard({
  searchParams,
}: {
  searchParams: Promise<{ subdomain?: string }>;
}) {
  const params = await searchParams;
  const subdomain = params.subdomain;

  if (!subdomain) {
    redirect('/tenant/login?subdomain=unknown');
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Get tenant data
  const { data: tenant, error: tenantError } = await supabase
    .from('tenants')
    .select('*')
    .eq('subdomain', subdomain.toLowerCase())
    .single();

  if (tenantError || !tenant) {
    redirect(`/tenant/login?subdomain=${subdomain}`);
  }

  // Get booking stats
  const { data: bookings } = await supabase
    .from('bookings')
    .select('id, status, scheduled_at')
    .eq('tenant_id', tenant.id);

  const { data: customers } = await supabase
    .from('customers')
    .select('id')
    .eq('tenant_id', tenant.id);

  const { data: services } = await supabase
    .from('services')
    .select('id')
    .eq('tenant_id', tenant.id);

  const { data: staff } = await supabase
    .from('staff')
    .select('id')
    .eq('tenant_id', tenant.id);

  // Calculate stats
  const todayBookings = bookings?.filter((b) => {
    const bookingDate = new Date(b.scheduled_at).toDateString();
    return bookingDate === new Date().toDateString();
  }).length || 0;

  const pendingBookings = bookings?.filter((b) => b.status === 'pending').length || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <span className="text-3xl">{tenant.emoji}</span>
          <h1 className="text-3xl font-bold text-gray-900">{tenant.business_name}</h1>
        </div>
        <p className="text-gray-600">Welcome back! Here's what's happening with your business today.</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Today's Bookings</p>
                <p className="text-2xl font-bold text-gray-900 mt-2">{todayBookings}</p>
              </div>
              <Calendar className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending Bookings</p>
                <p className="text-2xl font-bold text-gray-900 mt-2">{pendingBookings}</p>
              </div>
              <Clock className="w-8 h-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Customers</p>
                <p className="text-2xl font-bold text-gray-900 mt-2">{customers?.length || 0}</p>
              </div>
              <Users className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Services</p>
                <p className="text-2xl font-bold text-gray-900 mt-2">{services?.length || 0}</p>
              </div>
              <BarChart3 className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Features */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Bookings */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-blue-600" />
              Bookings
            </CardTitle>
            <CardDescription>Manage customer bookings and appointments</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <p className="text-sm text-gray-600">
                {bookings?.length || 0} total booking{(bookings?.length || 0) !== 1 ? 's' : ''}
              </p>
              <Button asChild className="w-full justify-start">
                <Link href={`/tenant/admin/bookings?subdomain=${subdomain}`}>
                  <BookOpen className="w-4 h-4 mr-2" />
                  View Bookings
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full justify-start">
                <Link href={`/tenant/admin/bookings/new?subdomain=${subdomain}`}>
                  <BookOpen className="w-4 h-4 mr-2" />
                  New Booking
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Customers */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-green-600" />
              Customers
            </CardTitle>
            <CardDescription>Manage customer database and information</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <p className="text-sm text-gray-600">
                {customers?.length || 0} customer{(customers?.length || 0) !== 1 ? 's' : ''}
              </p>
              <Button asChild className="w-full justify-start">
                <Link href={`/tenant/admin/customers?subdomain=${subdomain}`}>
                  <Users className="w-4 h-4 mr-2" />
                  View Customers
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full justify-start">
                <Link href={`/tenant/admin/customers/new?subdomain=${subdomain}`}>
                  <Users className="w-4 h-4 mr-2" />
                  Add Customer
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Services */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-purple-600" />
              Services
            </CardTitle>
            <CardDescription>Manage your business services and pricing</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <p className="text-sm text-gray-600">
                {services?.length || 0} service{(services?.length || 0) !== 1 ? 's' : ''}
              </p>
              <Button asChild className="w-full justify-start">
                <Link href={`/tenant/admin/services?subdomain=${subdomain}`}>
                  <BarChart3 className="w-4 h-4 mr-2" />
                  View Services
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full justify-start">
                <Link href={`/tenant/admin/services/new?subdomain=${subdomain}`}>
                  <BarChart3 className="w-4 h-4 mr-2" />
                  Add Service
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Messages */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-green-600" />
              Messages
            </CardTitle>
            <CardDescription>WhatsApp conversations and communications</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <p className="text-sm text-gray-600">Stay connected with your customers</p>
              <Button asChild className="w-full justify-start">
                <Link href={`/tenant/admin/messages?subdomain=${subdomain}`}>
                  <MessageSquare className="w-4 h-4 mr-2" />
                  View Messages
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Staff */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-600" />
              Staff
            </CardTitle>
            <CardDescription>Manage team members and permissions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <p className="text-sm text-gray-600">
                {staff?.length || 0} staff member{(staff?.length || 0) !== 1 ? 's' : ''}
              </p>
              <Button asChild className="w-full justify-start">
                <Link href={`/tenant/admin/staff?subdomain=${subdomain}`}>
                  <Users className="w-4 h-4 mr-2" />
                  View Staff
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Settings */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5 text-gray-600" />
              Settings
            </CardTitle>
            <CardDescription>Configure your business settings</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <p className="text-sm text-gray-600">Manage business configuration</p>
              <Button asChild className="w-full justify-start">
                <Link href={`/tenant/admin/settings?subdomain=${subdomain}`}>
                  <Settings className="w-4 h-4 mr-2" />
                  Settings
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Info Card */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-blue-900 flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            Getting Started
          </CardTitle>
        </CardHeader>
        <CardContent className="text-blue-800 space-y-2">
          <p>Welcome to your tenant dashboard! Here you can:</p>
          <ul className="list-disc list-inside space-y-1 text-sm">
            <li>View and manage customer bookings</li>
            <li>Maintain your customer database</li>
            <li>Update services and pricing</li>
            <li>Communicate with customers via WhatsApp</li>
            <li>Manage your team members</li>
            <li>Configure business settings and preferences</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
