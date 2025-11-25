export const runtime = 'nodejs';

import { redirect } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { DashboardCharts } from '@/components/tenant/DashboardCharts';

export default async function TenantAdminDashboard({
  searchParams,
}: {
  searchParams: Promise<{ subdomain?: string }>;
}) {
  const params = await searchParams;
  const subdomain = params?.subdomain;

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

  // 1. Fetch Bookings (for Revenue & Stats)
  const { data: bookings } = await supabase
    .from('bookings')
    .select('id, status, total_amount, created_at, scheduled_at, payment_status')
    .eq('tenant_id', tenant.id)
    .order('created_at', { ascending: false });

  // 2. Fetch Recent Payments (for Transactions List)
  const { data: payments } = await supabase
    .from('payments')
    .select('id, payment_amount, payment_method, created_at, notes, booking_id')
    .eq('tenant_id', tenant.id)
    .order('created_at', { ascending: false })
    .limit(6);

  // --- CALCULATIONS ---

  const totalRevenue = bookings?.reduce((acc, curr) => acc + (Number(curr.total_amount) || 0), 0) || 0;
  const bookingCount = bookings?.length || 0;

  const paidBookings = bookings?.filter(b => b.payment_status === 'PAID') || [];
  const totalPaymentsReceived = paidBookings.reduce((acc, curr) => acc + (Number(curr.total_amount) || 0), 0);

  // Calculate Monthly Revenue for Chart
  const revenueByMonth: Record<string, number> = {};
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  bookings?.forEach(b => {
    const date = new Date(b.created_at);
    const monthIndex = date.getMonth();
    const monthName = months[monthIndex];
    revenueByMonth[monthName] = (revenueByMonth[monthName] || 0) + (Number(b.total_amount) || 0);
  });

  const revenueData = months.map(m => ({
    name: m,
    value: revenueByMonth[m] || 0
  }));

  // Calculate Daily Bookings for Chart (Last 7 Days)
  const bookingsByDay: Record<string, number> = {};
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const today = new Date();

  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const dayName = days[d.getDay()];
    bookingsByDay[dayName] = 0; // Initialize
  }

  bookings?.forEach(b => {
    const date = new Date(b.created_at);
    // Check if within last 7 days
    const diffTime = Math.abs(today.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays <= 7) {
      const dayName = days[date.getDay()];
      bookingsByDay[dayName] = (bookingsByDay[dayName] || 0) + 1;
    }
  });

  const bookingTrends = Object.keys(bookingsByDay).map(day => ({
    name: day,
    value: bookingsByDay[day]
  }));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

      {/* Welcome Card */}
      <div className="lg:col-span-8 md:col-span-6 col-span-12">
        <Card className="h-full relative overflow-hidden border-none shadow-card bg-white rounded-card">
          <div className="p-6 flex-1 z-10 relative">
            <h5 className="text-primary font-bold text-lg mb-1">Welcome back, {tenant.business_name}! 👋</h5>
            <p className="text-txt-secondary text-sm mb-4 max-w-md">
              Here's what's happening with your store today. You have <span className="font-bold text-primary">{bookings?.filter(b => b.status === 'PENDING').length} pending</span> bookings to review.
            </p>
            <Link href={`/tenant/admin/bookings?subdomain=${subdomain}`}>
              <Button size="sm" className="bg-primary hover:bg-primary-dark text-white shadow-md shadow-primary/20">
                View Bookings
              </Button>
            </Link>
          </div>
          <div className="absolute right-0 bottom-0 h-full w-1/3 pointer-events-none flex items-end justify-end p-4">
            <div className="w-24 h-24 bg-primary-light/50 rounded-full blur-2xl absolute -bottom-4 -right-4"></div>
            <i className='bx bx-store text-8xl text-primary/10 transform translate-x-2 translate-y-2'></i>
          </div>
        </Card>
      </div>

      {/* Stats: Revenue (Right Side Column top) */}
      <div className="lg:col-span-2 md:col-span-3 col-span-6">
        <Card className="h-full border-none shadow-card bg-white rounded-card">
          <CardContent className="p-5">
            <div className="flex justify-between items-start mb-4">
              <div className="w-10 h-10 rounded bg-green-100 flex items-center justify-center text-success">
                <i className='bx bx-dollar text-xl'></i>
              </div>
              <div className="p-1 rounded hover:bg-gray-50 cursor-pointer">
                <i className='bx bx-dots-vertical-rounded text-txt-muted'></i>
              </div>
            </div>
            <span className="block text-txt-muted font-semibold mb-1 text-sm">Total Revenue</span>
            <h3 className="text-2xl font-bold text-txt-primary mb-1">Rp {totalRevenue.toLocaleString('id-ID')}</h3>
            <p className="text-success text-xs font-medium flex items-center gap-1">
              <i className='bx bx-up-arrow-alt'></i> +12.5%
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Stats: Bookings (Right Side Column top) */}
      <div className="lg:col-span-2 md:col-span-3 col-span-6">
        <Card className="h-full border-none shadow-card bg-white rounded-card">
          <CardContent className="p-5">
            <div className="flex justify-between items-start mb-4">
              <div className="w-10 h-10 rounded bg-blue-100 flex items-center justify-center text-info">
                <i className='bx bx-calendar text-xl'></i>
              </div>
              <div className="p-1 rounded hover:bg-gray-50 cursor-pointer">
                <i className='bx bx-dots-vertical-rounded text-txt-muted'></i>
              </div>
            </div>
            <span className="block text-txt-muted font-semibold mb-1 text-sm">Total Bookings</span>
            <h3 className="text-2xl font-bold text-txt-primary mb-1">{bookingCount}</h3>
            <p className="text-success text-xs font-medium flex items-center gap-1">
              <i className='bx bx-up-arrow-alt'></i> +5.2%
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Total Revenue Chart (Big Area) */}
      <div className="lg:col-span-8 col-span-12">
        <DashboardCharts type="bar" title="Revenue Overview" description="Monthly revenue performance" data={revenueData} />
      </div>

      {/* More Stats (Grid of 2x2 on right side) */}
      <div className="lg:col-span-4 col-span-12">
        <div className="grid grid-cols-2 gap-6 h-full">

          <Card className="border-none shadow-card bg-white rounded-card">
            <CardContent className="p-5">
              <div className="w-10 h-10 rounded bg-red-100 flex items-center justify-center text-danger mb-3">
                <i className='bx bx-credit-card text-xl'></i>
              </div>
              <span className="block text-txt-muted font-semibold mb-1 text-sm">Payments</span>
              <h3 className="text-lg font-bold text-txt-primary mb-1">Rp {totalPaymentsReceived.toLocaleString('id-ID')}</h3>
              <p className="text-danger text-xs font-medium flex items-center gap-1">
                <i className='bx bx-down-arrow-alt'></i> -2.4%
              </p>
            </CardContent>
          </Card>

          <Card className="border-none shadow-card bg-white rounded-card">
            <CardContent className="p-5">
              <div className="w-10 h-10 rounded bg-yellow-100 flex items-center justify-center text-warning mb-3">
                <i className='bx bx-wallet text-xl'></i>
              </div>
              <span className="block text-txt-muted font-semibold mb-1 text-sm">Pending</span>
              <h3 className="text-lg font-bold text-txt-primary mb-1">{bookings?.filter(b => b.payment_status !== 'PAID').length}</h3>
              <p className="text-txt-muted text-xs">Unpaid Bookings</p>
            </CardContent>
          </Card>

          <Card className="col-span-2 border-none shadow-card bg-white rounded-card">
            <CardContent className="p-5">
              <div className="flex justify-between mb-4">
                <div>
                  <h5 className="text-lg font-semibold text-txt-primary">Growth Report</h5>
                  <span className="text-xs bg-primary-light text-primary px-2 py-0.5 rounded font-bold">YEAR 2024</span>
                </div>
                <i className='bx bx-chevron-down text-txt-muted text-xl'></i>
              </div>
              <div className="flex items-center gap-2 mb-2">
                <i className='bx bx-trending-up text-success text-lg'></i>
                <span className="text-success font-medium">78.2% Growth</span>
              </div>
              <p className="text-sm text-txt-secondary">Compared to last year</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Booking / Order Statistics */}
      <div className="md:col-span-6 lg:col-span-8 col-span-12">
        <DashboardCharts type="area" title="Booking Trends" description="Weekly booking activity" data={bookingTrends} />
      </div>

      {/* Transactions List */}
      <div className="md:col-span-6 lg:col-span-4 col-span-12">
        <Card className="h-full border-none shadow-card bg-white rounded-card">
          <div className="p-6 flex justify-between items-center border-b border-gray-100">
            <h5 className="text-lg font-semibold text-txt-primary">Recent Transactions</h5>
            <div className="p-1 rounded hover:bg-gray-50 cursor-pointer">
              <i className='bx bx-dots-vertical-rounded text-txt-muted'></i>
            </div>
          </div>
          <div className="px-6 py-4 space-y-4">
            {payments && payments.length > 0 ? (
              payments.map((t) => (
                <div key={t.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded flex items-center justify-center bg-gray-50 text-txt-secondary`}>
                      {t.payment_method === 'cash' && <i className='bx bx-money text-xl text-green-600'></i>}
                      {t.payment_method === 'transfer' && <i className='bx bxs-bank text-xl text-blue-600'></i>}
                      {t.payment_method === 'qris' && <i className='bx bx-qr-scan text-xl text-orange-600'></i>}
                      {(!['cash', 'transfer', 'qris'].includes(t.payment_method || '')) && <i className='bx bx-credit-card text-xl'></i>}
                    </div>
                    <div>
                      <h6 className="text-sm font-semibold text-txt-primary capitalize">{t.payment_method || 'Unknown'}</h6>
                      <span className="text-xs text-txt-muted">{new Date(t.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`font-semibold text-sm text-success`}>
                      +Rp {Number(t.payment_amount).toLocaleString('id-ID')}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <p className="text-sm text-txt-muted">No recent transactions</p>
              </div>
            )}
          </div>
        </Card>
      </div>

    </div>
  );
}
