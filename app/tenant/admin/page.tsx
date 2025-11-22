export const runtime = 'nodejs';

import { redirect } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  DollarSign,
  Wallet,
  CreditCard,
  TrendingUp,
  ChevronDown,
  ArrowUp,
  MoreVertical,
} from 'lucide-react';
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

  // Get booking stats
  const { data: bookings } = await supabase
    .from('bookings')
    .select('id, status, scheduled_at, total_price')
    .eq('tenant_id', tenant.id);

  // Calculate real stats
  const totalRevenue = bookings?.reduce((acc, curr) => acc + (Number(curr.total_price) || 0), 0) || 0;
  const bookingCount = bookings?.length || 0;

  // Mock data for charts (since we don't have historical data aggregation yet)
  const revenueData = [
    { name: 'Jan', value: 4000, value2: 2400 },
    { name: 'Feb', value: 3000, value2: 1398 },
    { name: 'Mar', value: 2000, value2: 9800 },
    { name: 'Apr', value: 2780, value2: 3908 },
    { name: 'May', value: 1890, value2: 4800 },
    { name: 'Jun', value: 2390, value2: 3800 },
    { name: 'Jul', value: 3490, value2: 4300 },
  ];

  const bookingTrends = [
    { name: 'Mon', value: 24 },
    { name: 'Tue', value: 18 },
    { name: 'Wed', value: 32 },
    { name: 'Thu', value: 45 },
    { name: 'Fri', value: 38 },
    { name: 'Sat', value: 55 },
    { name: 'Sun', value: 48 },
  ];

  const transactions = [
    { id: 1, title: 'Paypal', subtitle: 'Send money', amount: '-82.60', currency: 'USD', icon: 'bx bxl-paypal', color: 'text-destructive', bg: 'bg-red-100', iconComp: DollarSign },
    { id: 2, title: 'Wallet', subtitle: "Mac'D", amount: '+270.69', currency: 'USD', icon: 'bx bx-wallet', color: 'text-primary', bg: 'bg-primary/10', iconComp: Wallet },
    { id: 3, title: 'Transfer', subtitle: 'Refund', amount: '+637.91', currency: 'USD', icon: 'bx bx-transfer', color: 'text-green-500', bg: 'bg-green-100', iconComp: ArrowUp },
    { id: 4, title: 'Credit Card', subtitle: 'Ordered Food', amount: '-838.71', currency: 'USD', icon: 'bx bx-credit-card', color: 'text-blue-500', bg: 'bg-blue-100', iconComp: CreditCard },
    { id: 5, title: 'Wallet', subtitle: 'Starbucks', amount: '+203.33', currency: 'USD', icon: 'bx bx-wallet', color: 'text-yellow-500', bg: 'bg-yellow-100', iconComp: Wallet },
    { id: 6, title: 'Mastercard', subtitle: 'Ordered Food', amount: '-92.45', currency: 'USD', icon: 'bx bxl-mastercard', color: 'text-gray-500', bg: 'bg-gray-200', iconComp: CreditCard },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

      {/* Welcome / Congratulations Card */}
      <div className="lg:col-span-8 md:col-span-6 col-span-12">
        <Card className="h-full relative overflow-hidden border-none shadow-sm">
          <div className="p-6 flex-1 z-10 relative">
            <h5 className="text-primary font-bold text-lg mb-1">Congratulations {tenant.business_name}! 🎉</h5>
            <p className="text-muted-foreground text-sm mb-4 max-w-md">
              You have done <span className="font-bold text-foreground">72%</span> more sales today. Check your new badge in your profile.
            </p>
            <Button variant="outline" className="text-primary border-primary/30 hover:bg-primary/10">
              View Badges
            </Button>
          </div>
          <div className="absolute right-0 bottom-0 h-full w-1/3 pointer-events-none flex items-end justify-end p-4">
            <div className="text-9xl opacity-20 transform translate-x-4 translate-y-4">
              🏆
            </div>
          </div>
        </Card>
      </div>

      {/* Stats: Profit & Sales (Right Side Column top) */}
      <div className="lg:col-span-2 md:col-span-3 col-span-6">
        <Card className="h-full border-none shadow-sm">
          <CardContent className="p-5">
            <div className="flex justify-between items-start mb-4">
              <div className="w-10 h-10 rounded bg-green-100 flex items-center justify-center text-green-500">
                <DollarSign className="w-6 h-6" />
              </div>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </div>
            <span className="block text-muted-foreground font-semibold mb-1 text-sm">Total Revenue</span>
            <h3 className="text-2xl font-bold text-foreground mb-1">${totalRevenue.toLocaleString()}</h3>
            <p className="text-green-500 text-xs font-medium">+72.80%</p>
          </CardContent>
        </Card>
      </div>

      <div className="lg:col-span-2 md:col-span-3 col-span-6">
        <Card className="h-full border-none shadow-sm">
          <CardContent className="p-5">
            <div className="flex justify-between items-start mb-4">
              <div className="w-10 h-10 rounded bg-blue-100 flex items-center justify-center text-blue-500">
                <Wallet className="w-6 h-6" />
              </div>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </div>
            <span className="block text-muted-foreground font-semibold mb-1 text-sm">Bookings</span>
            <h3 className="text-2xl font-bold text-foreground mb-1">{bookingCount}</h3>
            <p className="text-green-500 text-xs font-medium">+28.42%</p>
          </CardContent>
        </Card>
      </div>

      {/* Total Revenue Chart (Big Area) */}
      <div className="lg:col-span-8 col-span-12">
        <DashboardCharts type="bar" title="Total Revenue" description="Yearly earnings overview" data={revenueData} />
      </div>

      {/* More Stats (Grid of 2x2 on right side) */}
      <div className="lg:col-span-4 col-span-12">
        <div className="grid grid-cols-2 gap-6 h-full">

          <Card className="border-none shadow-sm">
            <CardContent className="p-5">
              <div className="w-10 h-10 rounded bg-red-100 flex items-center justify-center text-destructive mb-3">
                <CreditCard className="w-6 h-6" />
              </div>
              <span className="block text-muted-foreground font-semibold mb-1 text-sm">Payments</span>
              <h3 className="text-xl font-bold text-foreground mb-1">$2,468</h3>
              <p className="text-destructive text-xs font-medium">-14.82%</p>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm">
            <CardContent className="p-5">
              <div className="w-10 h-10 rounded bg-gray-100 flex items-center justify-center text-gray-500 mb-3">
                <CreditCard className="w-6 h-6" />
              </div>
              <span className="block text-muted-foreground font-semibold mb-1 text-sm">Transactions</span>
              <h3 className="text-xl font-bold text-foreground mb-1">$14,857</h3>
              <p className="text-green-500 text-xs font-medium">+28.14%</p>
            </CardContent>
          </Card>

          <Card className="col-span-2 border-none shadow-sm">
            <CardContent className="p-5">
              <div className="flex justify-between mb-4">
                <div>
                  <h5 className="text-lg font-semibold text-foreground">Profile Report</h5>
                  <span className="text-xs bg-yellow-100 text-yellow-600 px-2 py-0.5 rounded-md font-bold">YEAR 2024</span>
                </div>
                <ChevronDown className="text-muted-foreground w-5 h-5" />
              </div>
              <div className="flex items-center gap-2 mb-2">
                <ArrowUp className="text-green-500 w-4 h-4" />
                <span className="text-green-500 font-medium">68.2%</span>
              </div>
              <h3 className="text-2xl font-bold text-foreground">$84,686k</h3>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Booking / Order Statistics */}
      <div className="md:col-span-6 lg:col-span-8 col-span-12">
        <DashboardCharts type="area" title="Order Statistics" description="42.82k Total Sales" data={bookingTrends} />
      </div>

      {/* Transactions List */}
      <div className="md:col-span-6 lg:col-span-4 col-span-12">
        <Card className="h-full border-none shadow-sm">
          <div className="p-6 flex justify-between items-center">
            <h5 className="text-lg font-semibold text-foreground">Transactions</h5>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
              <MoreVertical className="w-4 h-4" />
            </Button>
          </div>
          <div className="px-6 pb-6 space-y-6">
            {transactions.map((t) => (
              <div key={t.id} className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded flex items-center justify-center ${t.bg} ${t.color}`}>
                    <t.iconComp className="w-6 h-6" />
                  </div>
                  <div>
                    <h6 className="text-sm font-semibold text-foreground">{t.title}</h6>
                    <span className="text-xs text-muted-foreground">{t.subtitle}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`font-semibold text-sm ${t.amount.startsWith('-') ? 'text-foreground' : 'text-green-500'}`}>
                    {t.amount}
                  </span>
                  <span className="text-xs text-muted-foreground uppercase">{t.currency}</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

    </div>
  );
}

