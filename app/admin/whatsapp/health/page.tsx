export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { redirect } from 'next/navigation';
import { getServerSession } from '@/lib/auth/auth-middleware';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BoxIcon } from '@/components/ui/box-icon';
import Link from 'next/link';

export default async function WhatsAppHealthPage() {
  const session = await getServerSession();

  if (!session || session.role !== 'superadmin' || !session.isSuperAdmin) {
    redirect('/login?type=superadmin');
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-purple-100 dark:bg-[#3a3361] flex items-center justify-center">
            <BoxIcon name="pulse" size={24} className="text-purple-600 dark:text-[#c4a5ff]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-[#d5d5e2]">Health Monitor</h1>
            <p className="text-sm text-gray-500 dark:text-[#7e7f96]">
              Monitor kesehatan integrasi WhatsApp
            </p>
          </div>
        </div>
        <Button asChild variant="outline" className="dark:border-[#4e4f6c] dark:hover:bg-[#4e4f6c]">
          <Link href="/admin/whatsapp" className="flex items-center gap-2">
            <BoxIcon name="arrow-back" size={18} />
            Kembali
          </Link>
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="dark:bg-[#2b2c40] dark:border-[#4e4f6c]">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-green-100 dark:bg-[#36483f] flex items-center justify-center">
                <BoxIcon name="check-circle" size={24} className="text-green-600 dark:text-[#aaeb87]" />
              </div>
              <div>
                <p className="text-2xl font-bold text-green-600 dark:text-[#aaeb87]">0</p>
                <p className="text-sm text-gray-500 dark:text-[#7e7f96]">Device Aktif</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="dark:bg-[#2b2c40] dark:border-[#4e4f6c]">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-red-100 dark:bg-[#4d2f3a] flex items-center justify-center">
                <BoxIcon name="wifi-off" size={24} className="text-red-600 dark:text-[#ff8b77]" />
              </div>
              <div>
                <p className="text-2xl font-bold text-red-600 dark:text-[#ff8b77]">0</p>
                <p className="text-sm text-gray-500 dark:text-[#7e7f96]">Terputus</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="dark:bg-[#2b2c40] dark:border-[#4e4f6c]">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-[#25445c] flex items-center justify-center">
                <BoxIcon name="message-dots" size={24} className="text-blue-600 dark:text-[#68dbf4]" />
              </div>
              <div>
                <p className="text-2xl font-bold text-blue-600 dark:text-[#68dbf4]">--</p>
                <p className="text-sm text-gray-500 dark:text-[#7e7f96]">Pesan/Jam</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="dark:bg-[#2b2c40] dark:border-[#4e4f6c]">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-green-100 dark:bg-[#36483f] flex items-center justify-center">
                <BoxIcon name="time" size={24} className="text-green-600 dark:text-[#aaeb87]" />
              </div>
              <div>
                <p className="text-2xl font-bold text-green-600 dark:text-[#aaeb87]">100%</p>
                <p className="text-sm text-gray-500 dark:text-[#7e7f96]">Uptime</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Connection Status */}
      <Card className="dark:bg-[#2b2c40] dark:border-[#4e4f6c]">
        <CardHeader className="border-b dark:border-[#4e4f6c]">
          <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-[#d5d5e2]">
            <BoxIcon name="wifi" size={20} />
            Status Koneksi
          </CardTitle>
          <CardDescription className="dark:text-[#7e7f96]">
            Status real-time device dan koneksi WhatsApp
          </CardDescription>
        </CardHeader>
        <CardContent className="py-12">
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-[#35365f] flex items-center justify-center mx-auto mb-4">
              <BoxIcon name="devices" size={32} className="text-gray-400 dark:text-[#7e7f96]" />
            </div>
            <p className="text-gray-500 dark:text-[#7e7f96]">Belum ada device WhatsApp yang dikonfigurasi.</p>
            <p className="text-sm text-gray-400 dark:text-[#6e6f86] mt-1">
              Konfigurasi device WhatsApp untuk memonitor status kesehatan.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Performance Metrics */}
      <Card className="dark:bg-[#2b2c40] dark:border-[#4e4f6c]">
        <CardHeader className="border-b dark:border-[#4e4f6c]">
          <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-[#d5d5e2]">
            <BoxIcon name="line-chart" size={20} />
            Metrik Performa
          </CardTitle>
          <CardDescription className="dark:text-[#7e7f96]">
            Performa integrasi WhatsApp dari waktu ke waktu
          </CardDescription>
        </CardHeader>
        <CardContent className="py-12">
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-[#35365f] flex items-center justify-center mx-auto mb-4">
              <BoxIcon name="bar-chart-alt-2" size={32} className="text-gray-400 dark:text-[#7e7f96]" />
            </div>
            <p className="text-gray-500 dark:text-[#7e7f96]">
              Metrik performa akan ditampilkan setelah device aktif.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Health Indicators Legend */}
      <Card className="dark:bg-[#2b2c40] dark:border-[#4e4f6c]">
        <CardHeader className="border-b dark:border-[#4e4f6c]">
          <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-[#d5d5e2]">
            <BoxIcon name="info-circle" size={20} />
            Keterangan Status
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-green-50 dark:bg-[#36483f]/50">
              <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-[#36483f] flex items-center justify-center">
                <BoxIcon name="check-circle" size={20} className="text-green-600 dark:text-[#aaeb87]" />
              </div>
              <div>
                <p className="font-medium text-green-700 dark:text-[#aaeb87]">Sehat</p>
                <p className="text-xs text-green-600 dark:text-[#8acb67]">Koneksi stabil</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-amber-50 dark:bg-[#4d422f]/50">
              <div className="w-10 h-10 rounded-lg bg-amber-100 dark:bg-[#4d422f] flex items-center justify-center">
                <BoxIcon name="error" size={20} className="text-amber-600 dark:text-[#ffd377]" />
              </div>
              <div>
                <p className="font-medium text-amber-700 dark:text-[#ffd377]">Peringatan</p>
                <p className="text-xs text-amber-600 dark:text-[#dfb357]">Ada masalah kecil</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-red-50 dark:bg-[#4d2f3a]/50">
              <div className="w-10 h-10 rounded-lg bg-red-100 dark:bg-[#4d2f3a] flex items-center justify-center">
                <BoxIcon name="x-circle" size={20} className="text-red-600 dark:text-[#ff8b77]" />
              </div>
              <div>
                <p className="font-medium text-red-700 dark:text-[#ff8b77]">Error</p>
                <p className="text-xs text-red-600 dark:text-[#df6b57]">Koneksi terputus</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
