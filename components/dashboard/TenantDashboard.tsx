import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Calendar,
  Users,
  DollarSign,
  TrendingUp,
  Clock,
  MessageSquare,
  AlertCircle,
  CheckCircle,
  XCircle,
  Plus,
} from 'lucide-react';
import Link from 'next/link';
import type { TenantSession } from '@/lib/auth/types';
import { DashboardService } from '@/lib/dashboard/dashboard-service';
import { RBAC } from '@/lib/auth/rbac';

interface TenantDashboardProps {
  session: TenantSession;
}

export default async function TenantDashboard({ session }: TenantDashboardProps) {
  // Get dashboard data
  const [
    todayStats,
    recentBookings,
    upcomingBookings,
    recentCustomers,
    pendingActions,
  ] = await Promise.all([
    DashboardService.getTodayStats(session.tenantId),
    DashboardService.getRecentBookings(session.tenantId, 5),
    DashboardService.getUpcomingBookings(session.tenantId, 5),
    DashboardService.getRecentCustomers(session.tenantId, 5),
    DashboardService.getPendingActions(session.tenantId),
  ]);

  const canManageBookings = RBAC.hasPermission(session, 'manage_bookings');
  const canViewAnalytics = RBAC.hasPermission(session, 'view_analytics');
  const canManageCustomers = RBAC.hasPermission(session, 'manage_customers');

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Bookings</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{todayStats.todayBookings}</div>
            <p className="text-xs text-muted-foreground">
              {todayStats.todayBookingsChange > 0 ? '+' : ''}
              {todayStats.todayBookingsChange}% from yesterday
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{todayStats.totalCustomers}</div>
            <p className="text-xs text-muted-foreground">
              {todayStats.newCustomersThisWeek} new this week
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              Rp {todayStats.todayRevenue.toLocaleString('id-ID')}
            </div>
            <p className="text-xs text-muted-foreground">
              {todayStats.revenueChange > 0 ? '+' : ''}
              {todayStats.revenueChange}% from yesterday
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{todayStats.completionRate}%</div>
            <p className="text-xs text-muted-foreground">
              This week's completion rate
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Pending Actions */}
      {pendingActions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-orange-500" />
              Pending Actions
            </CardTitle>
            <CardDescription>
              Items that need your attention
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {pendingActions.map((action) => (
                <div
                  key={action.id}
                  className="flex items-center justify-between p-3 bg-orange-50 rounded-lg border border-orange-200"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex-shrink-0">
                      {action.type === 'booking_confirmation' && (
                        <Calendar className="h-4 w-4 text-orange-600" />
                      )}
                      {action.type === 'payment_overdue' && (
                        <DollarSign className="h-4 w-4 text-red-600" />
                      )}
                      {action.type === 'customer_message' && (
                        <MessageSquare className="h-4 w-4 text-blue-600" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {action.title}
                      </p>
                      <p className="text-xs text-gray-600">{action.description}</p>
                    </div>
                  </div>
                  <Button size="sm" variant="outline" asChild>
                    <Link href={action.actionUrl}>
                      {action.actionText}
                    </Link>
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        {/* Today's Schedule */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Today's Schedule</CardTitle>
              <CardDescription>
                {upcomingBookings.length} appointments scheduled
              </CardDescription>
            </div>
            {canManageBookings && (
              <Button size="sm" asChild>
                <Link href="/admin/bookings/new">
                  <Plus className="h-4 w-4 mr-2" />
                  New Booking
                </Link>
              </Button>
            )}
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {upcomingBookings.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No appointments scheduled for today
                </p>
              ) : (
                upcomingBookings.map((booking) => (
                  <div
                    key={booking.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex-shrink-0">
                        <Clock className="h-4 w-4 text-gray-500" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">
                          {new Date(booking.scheduledAt).toLocaleTimeString('id-ID', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                        <p className="text-xs text-gray-600">
                          {booking.customer.name} - {booking.service.name}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={
                          booking.status === 'confirmed'
                            ? 'default'
                            : booking.status === 'pending'
                            ? 'secondary'
                            : 'destructive'
                        }
                      >
                        {booking.status}
                      </Badge>
                      {canManageBookings && (
                        <Button size="sm" variant="ghost" asChild>
                          <Link href={`/admin/bookings/${booking.id}`}>
                            View
                          </Link>
                        </Button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
            {upcomingBookings.length > 0 && canManageBookings && (
              <div className="mt-4 pt-4 border-t">
                <Button variant="outline" className="w-full" asChild>
                  <Link href="/admin/bookings">View All Bookings</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>
                Latest bookings and customer interactions
              </CardDescription>
            </div>
            {canViewAnalytics && (
              <Button size="sm" variant="outline" asChild>
                <Link href="/admin/analytics">
                  View Analytics
                </Link>
              </Button>
            )}
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentBookings.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No recent activity
                </p>
              ) : (
                recentBookings.map((booking) => (
                  <div
                    key={booking.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex-shrink-0">
                        {booking.status === 'completed' && (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        )}
                        {booking.status === 'cancelled' && (
                          <XCircle className="h-4 w-4 text-red-500" />
                        )}
                        {booking.status === 'confirmed' && (
                          <Calendar className="h-4 w-4 text-blue-500" />
                        )}
                        {booking.status === 'pending' && (
                          <Clock className="h-4 w-4 text-orange-500" />
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium">
                          {booking.customer.name}
                        </p>
                        <p className="text-xs text-gray-600">
                          {booking.service.name} - {' '}
                          {new Date(booking.scheduledAt).toLocaleDateString('id-ID')}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">
                        Rp {booking.totalAmount.toLocaleString('id-ID')}
                      </p>
                      <Badge
                        variant={
                          booking.status === 'completed'
                            ? 'default'
                            : booking.status === 'confirmed'
                            ? 'secondary'
                            : booking.status === 'cancelled'
                            ? 'destructive'
                            : 'outline'
                        }
                        className="text-xs"
                      >
                        {booking.status}
                      </Badge>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Customers */}
      {canManageCustomers && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Recent Customers</CardTitle>
              <CardDescription>
                Customers who recently booked or visited
              </CardDescription>
            </div>
            <Button size="sm" variant="outline" asChild>
              <Link href="/admin/customers">
                View All Customers
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentCustomers.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No recent customers
                </p>
              ) : (
                recentCustomers.map((customer) => (
                  <div
                    key={customer.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-xs font-medium text-blue-600">
                            {customer.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      </div>
                      <div>
                        <p className="text-sm font-medium">{customer.name}</p>
                        <p className="text-xs text-gray-600">
                          {customer.phone} • {customer.totalBookings} bookings
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-600">
                        Last visit: {' '}
                        {customer.lastBookingAt
                          ? new Date(customer.lastBookingAt).toLocaleDateString('id-ID')
                          : 'Never'
                        }
                      </p>
                      <Button size="sm" variant="ghost" asChild>
                        <Link href={`/admin/customers/${customer.id}`}>
                          View
                        </Link>
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}