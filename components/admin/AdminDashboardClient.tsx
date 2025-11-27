'use client';

import { useState } from 'react';
import Link from 'next/link';

interface SecurityLog {
  id: string;
  tenantId: string;
  userId: string;
  action: string;
  success: boolean;
  ipAddress: string;
  userAgent: string;
  resource: string | null;
  details: any;
  createdAt: string;
}

interface DashboardData {
  tenants: {
    total: number;
    active: number;
    suspended: number;
    byPlan: {
      basic: number;
      premium: number;
      enterprise: number;
    };
  };
  securityLogs: SecurityLog[];
}

interface AdminDashboardClientProps {
  session: {
    name: string;
    email: string;
    role: string;
  };
  initialData: DashboardData;
}

export function AdminDashboardClient({ session, initialData }: AdminDashboardClientProps) {
  const [data, setData] = useState<DashboardData>(initialData);
  const [loading, setLoading] = useState(false);
  const [systemHealth, setSystemHealth] = useState<'healthy' | 'degraded' | 'critical'>('healthy');

  const refreshData = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/dashboard');
      if (response.ok) {
        const result = await response.json();
        setData({
          tenants: result.tenants,
          securityLogs: result.security.recentLogs,
        });
        setSystemHealth(result.systemHealth.database === 'healthy' ? 'healthy' : 'degraded');
      }
    } catch (error) {
      console.error('Failed to refresh:', error);
    } finally {
      setLoading(false);
    }
  };

  const getActionIcon = (action: string, success: boolean) => {
    if (!success) return <i className='bx bx-x-circle text-danger'></i>;
    switch (action) {
      case 'login':
        return <i className='bx bx-log-in text-success'></i>;
      case 'logout':
        return <i className='bx bx-log-out text-info'></i>;
      default:
        return <i className='bx bx-pulse text-txt-muted dark:text-[#7e7f96]'></i>;
    }
  };

  const getActionLabel = (action: string) => {
    const labels: Record<string, string> = {
      login: 'Login',
      logout: 'Logout',
      password_change: 'Password Changed',
      password_reset: 'Password Reset',
    };
    return labels[action] || action;
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Baru saja';
    if (diffMins < 60) return `${diffMins} menit lalu`;
    if (diffHours < 24) return `${diffHours} jam lalu`;
    return `${diffDays} hari lalu`;
  };

  const failedLogins = data.securityLogs.filter(log => log.action === 'login' && !log.success);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-txt-primary dark:text-[#d5d5e2]">
            Selamat datang, {session.name}
          </h1>
          <p className="text-sm text-txt-muted dark:text-[#7e7f96]">Platform Administration Dashboard</p>
        </div>
        <button
          onClick={refreshData}
          disabled={loading}
          className="inline-flex items-center gap-2 px-4 py-2 border border-gray-200 dark:border-[#4e4f6c] rounded-lg text-sm font-medium text-txt-secondary dark:text-[#b2b2c4] hover:bg-gray-50 dark:hover:bg-[#232333] transition-colors disabled:opacity-50"
        >
          <i className={`bx bx-refresh ${loading ? 'animate-spin' : ''}`}></i>
          Refresh
        </button>
      </div>

      {/* System Health Banner */}
      <div className={`p-4 rounded-lg border-l-4 ${
        systemHealth === 'healthy' 
          ? 'bg-green-50 dark:bg-[#36483f] border-l-success' 
          : systemHealth === 'degraded' 
          ? 'bg-yellow-50 dark:bg-[#4d4036] border-l-warning' 
          : 'bg-red-50 dark:bg-[#4d2f3a] border-l-danger'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
              systemHealth === 'healthy' 
                ? 'bg-success/20' 
                : systemHealth === 'degraded' 
                ? 'bg-warning/20' 
                : 'bg-danger/20'
            }`}>
              <i className={`bx text-xl ${
                systemHealth === 'healthy' 
                  ? 'bx-check-circle text-success' 
                  : systemHealth === 'degraded' 
                  ? 'bx-error text-warning' 
                  : 'bx-x-circle text-danger'
              }`}></i>
            </div>
            <div>
              <p className="font-semibold text-txt-primary dark:text-[#d5d5e2]">
                System Status: {systemHealth === 'healthy' ? 'Sehat' : systemHealth === 'degraded' ? 'Degraded' : 'Critical'}
              </p>
              <p className="text-sm text-txt-muted dark:text-[#7e7f96]">
                Semua layanan berjalan normal
              </p>
            </div>
          </div>
          <Link
            href="/admin/monitoring"
            className="hidden sm:inline-flex items-center gap-2 px-4 py-2 border border-gray-200 dark:border-[#4e4f6c] rounded-lg text-sm font-medium text-txt-secondary dark:text-[#b2b2c4] hover:bg-white/50 dark:hover:bg-[#232333] transition-colors"
          >
            <i className='bx bx-pulse'></i>
            Lihat Detail
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {/* Total Tenants */}
        <Link href="/admin/tenants" className="bg-white dark:bg-[#2b2c40] rounded-lg p-4 border border-gray-100 dark:border-[#4e4f6c] shadow-card hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 cursor-pointer">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-lg bg-primary-light dark:bg-[#35365f] flex items-center justify-center">
              <i className='bx bx-building-house text-xl text-primary dark:text-[#a5a7ff]'></i>
            </div>
            <span className="px-2 py-0.5 text-[10px] font-semibold rounded-full bg-gray-100 dark:bg-[#35365f] text-txt-muted dark:text-[#7e7f96]">
              All
            </span>
          </div>
          <p className="text-2xl font-bold text-txt-primary dark:text-[#d5d5e2]">{data.tenants.total}</p>
          <p className="text-xs text-txt-muted dark:text-[#7e7f96]">Total Tenants</p>
        </Link>

        {/* Active */}
        <div className="bg-white dark:bg-[#2b2c40] rounded-lg p-4 border border-gray-100 dark:border-[#4e4f6c] shadow-card">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-lg bg-success/10 dark:bg-success/20 flex items-center justify-center">
              <i className='bx bx-check-circle text-xl text-success'></i>
            </div>
            <span className="px-2 py-0.5 text-[10px] font-semibold rounded-full bg-success/10 text-success">
              Active
            </span>
          </div>
          <p className="text-2xl font-bold text-success">{data.tenants.active}</p>
          <p className="text-xs text-txt-muted dark:text-[#7e7f96]">Active Tenants</p>
        </div>

        {/* Suspended */}
        <div className="bg-white dark:bg-[#2b2c40] rounded-lg p-4 border border-gray-100 dark:border-[#4e4f6c] shadow-card">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-lg bg-danger/10 dark:bg-danger/20 flex items-center justify-center">
              <i className='bx bx-block text-xl text-danger'></i>
            </div>
            <span className="px-2 py-0.5 text-[10px] font-semibold rounded-full bg-danger/10 text-danger">
              Suspended
            </span>
          </div>
          <p className="text-2xl font-bold text-danger">{data.tenants.suspended}</p>
          <p className="text-xs text-txt-muted dark:text-[#7e7f96]">Suspended</p>
        </div>

        {/* Basic Plan */}
        <div className="bg-white dark:bg-[#2b2c40] rounded-lg p-4 border border-gray-100 dark:border-[#4e4f6c] shadow-card">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-[#35365f] flex items-center justify-center">
              <i className='bx bx-package text-xl text-txt-muted dark:text-[#7e7f96]'></i>
            </div>
            <span className="px-2 py-0.5 text-[10px] font-semibold rounded-full bg-gray-100 dark:bg-[#35365f] text-txt-muted dark:text-[#7e7f96]">
              Basic
            </span>
          </div>
          <p className="text-2xl font-bold text-txt-primary dark:text-[#d5d5e2]">{data.tenants.byPlan.basic}</p>
          <p className="text-xs text-txt-muted dark:text-[#7e7f96]">Basic Plan</p>
        </div>

        {/* Premium Plan */}
        <div className="bg-white dark:bg-[#2b2c40] rounded-lg p-4 border border-gray-100 dark:border-[#4e4f6c] shadow-card">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
              <i className='bx bx-star text-xl text-purple-600 dark:text-purple-400'></i>
            </div>
            <span className="px-2 py-0.5 text-[10px] font-semibold rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400">
              Premium
            </span>
          </div>
          <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{data.tenants.byPlan.premium}</p>
          <p className="text-xs text-txt-muted dark:text-[#7e7f96]">Premium Plan</p>
        </div>

        {/* Enterprise Plan */}
        <div className="bg-white dark:bg-[#2b2c40] rounded-lg p-4 border border-gray-100 dark:border-[#4e4f6c] shadow-card">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
              <i className='bx bx-crown text-xl text-amber-600 dark:text-amber-400'></i>
            </div>
            <span className="px-2 py-0.5 text-[10px] font-semibold rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400">
              Enterprise
            </span>
          </div>
          <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{data.tenants.byPlan.enterprise}</p>
          <p className="text-xs text-txt-muted dark:text-[#7e7f96]">Enterprise</p>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Actions */}
        <div className="bg-white dark:bg-[#2b2c40] rounded-lg border border-gray-100 dark:border-[#4e4f6c] shadow-card">
          <div className="p-5 border-b border-gray-100 dark:border-[#4e4f6c]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary-light dark:bg-[#35365f] flex items-center justify-center">
                <i className='bx bx-zap text-xl text-primary dark:text-[#a5a7ff]'></i>
              </div>
              <div>
                <h5 className="font-semibold text-txt-primary dark:text-[#d5d5e2]">Quick Actions</h5>
                <p className="text-xs text-txt-muted dark:text-[#7e7f96]">Aksi administratif umum</p>
              </div>
            </div>
          </div>
          <div className="p-4 space-y-2">
            <Link
              href="/admin/tenants/create"
              className="flex items-center gap-3 p-3 rounded-lg bg-primary text-white hover:bg-[#5f61e6] transition-colors"
            >
              <i className='bx bx-plus-circle text-lg'></i>
              <span className="text-sm font-medium">Buat Tenant Baru</span>
            </Link>
            <Link
              href="/admin/tenants"
              className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 dark:border-[#4e4f6c] text-txt-secondary dark:text-[#b2b2c4] hover:bg-gray-50 dark:hover:bg-[#232333] transition-colors"
            >
              <i className='bx bx-building-house text-lg'></i>
              <span className="text-sm font-medium">Kelola Tenants</span>
            </Link>
            <Link
              href="/admin/monitoring"
              className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 dark:border-[#4e4f6c] text-txt-secondary dark:text-[#b2b2c4] hover:bg-gray-50 dark:hover:bg-[#232333] transition-colors"
            >
              <i className='bx bx-pulse text-lg'></i>
              <span className="text-sm font-medium">System Monitoring</span>
            </Link>
            <Link
              href="/admin/superadmins"
              className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 dark:border-[#4e4f6c] text-txt-secondary dark:text-[#b2b2c4] hover:bg-gray-50 dark:hover:bg-[#232333] transition-colors"
            >
              <i className='bx bx-shield-quarter text-lg'></i>
              <span className="text-sm font-medium">Kelola Admins</span>
            </Link>
            <Link
              href="/admin/settings"
              className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 dark:border-[#4e4f6c] text-txt-secondary dark:text-[#b2b2c4] hover:bg-gray-50 dark:hover:bg-[#232333] transition-colors"
            >
              <i className='bx bx-cog text-lg'></i>
              <span className="text-sm font-medium">Platform Settings</span>
            </Link>
          </div>
        </div>

        {/* Security & Login Activity */}
        <div className="lg:col-span-2 bg-white dark:bg-[#2b2c40] rounded-lg border border-gray-100 dark:border-[#4e4f6c] shadow-card">
          <div className="p-5 border-b border-gray-100 dark:border-[#4e4f6c]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-info/10 dark:bg-info/20 flex items-center justify-center">
                  <i className='bx bx-shield text-xl text-info'></i>
                </div>
                <div>
                  <h5 className="font-semibold text-txt-primary dark:text-[#d5d5e2]">Security & Login Activity</h5>
                  <p className="text-xs text-txt-muted dark:text-[#7e7f96]">Aktivitas autentikasi terbaru</p>
                </div>
              </div>
              {failedLogins.length > 0 && (
                <span className="flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-full bg-danger/10 text-danger">
                  <i className='bx bx-error text-sm'></i>
                  {failedLogins.length} Failed
                </span>
              )}
            </div>
          </div>
          <div className="p-4">
            {data.securityLogs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-[#35365f] flex items-center justify-center mb-4">
                  <i className='bx bx-shield text-3xl text-txt-muted dark:text-[#7e7f96]'></i>
                </div>
                <p className="text-txt-muted dark:text-[#7e7f96]">Tidak ada log keamanan</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {data.securityLogs.map((log) => (
                  <div
                    key={log.id}
                    className={`flex items-start gap-3 p-3 rounded-lg border transition-colors ${
                      !log.success 
                        ? 'bg-red-50 dark:bg-[#4d2f3a]/50 border-red-200 dark:border-red-800/30' 
                        : 'bg-gray-50 dark:bg-[#232333] border-gray-200 dark:border-[#4e4f6c]'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded flex items-center justify-center flex-shrink-0 ${
                      !log.success ? 'bg-danger/10' : 'bg-success/10'
                    }`}>
                      {getActionIcon(log.action, log.success)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium text-txt-primary dark:text-[#d5d5e2]">
                          {getActionLabel(log.action)}
                        </span>
                        <span className={`px-2 py-0.5 text-[10px] font-semibold rounded-full ${
                          log.success 
                            ? 'bg-success/10 text-success' 
                            : 'bg-danger/10 text-danger'
                        }`}>
                          {log.success ? 'Success' : 'Failed'}
                        </span>
                        {log.resource && (
                          <span className="px-2 py-0.5 text-[10px] font-medium rounded-full bg-gray-100 dark:bg-[#35365f] text-txt-muted dark:text-[#7e7f96]">
                            {log.resource}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-txt-muted dark:text-[#7e7f96] mt-1 truncate">
                        {log.tenantId !== 'platform' && log.tenantId !== 'unknown' 
                          ? `Tenant: ${log.tenantId.slice(0, 8)}...` 
                          : 'Platform'}
                        {log.ipAddress && ` • IP: ${log.ipAddress}`}
                      </p>
                      {log.details && typeof log.details === 'object' && log.details.email && (
                        <p className="text-xs text-txt-secondary dark:text-[#b2b2c4] mt-0.5">
                          Email: {log.details.email}
                        </p>
                      )}
                      {!log.success && log.details?.reason && (
                        <p className="text-xs text-danger mt-0.5">
                          Reason: {log.details.reason}
                        </p>
                      )}
                    </div>
                    <span className="text-xs text-txt-muted dark:text-[#7e7f96] whitespace-nowrap">
                      {formatTimeAgo(log.createdAt)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer Links */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Link
          href="/admin/analytics"
          className="flex flex-col items-center justify-center p-6 bg-white dark:bg-[#2b2c40] rounded-lg border border-gray-100 dark:border-[#4e4f6c] shadow-card hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200"
        >
          <div className="w-12 h-12 rounded-lg bg-primary-light dark:bg-[#35365f] flex items-center justify-center mb-3">
            <i className='bx bx-bar-chart-alt-2 text-2xl text-primary dark:text-[#a5a7ff]'></i>
          </div>
          <span className="text-sm font-medium text-txt-primary dark:text-[#d5d5e2]">Analytics</span>
        </Link>
        <Link
          href="/admin/audit"
          className="flex flex-col items-center justify-center p-6 bg-white dark:bg-[#2b2c40] rounded-lg border border-gray-100 dark:border-[#4e4f6c] shadow-card hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200"
        >
          <div className="w-12 h-12 rounded-lg bg-info/10 dark:bg-info/20 flex items-center justify-center mb-3">
            <i className='bx bx-list-check text-2xl text-info'></i>
          </div>
          <span className="text-sm font-medium text-txt-primary dark:text-[#d5d5e2]">Audit Logs</span>
        </Link>
        <Link
          href="/admin/security"
          className="flex flex-col items-center justify-center p-6 bg-white dark:bg-[#2b2c40] rounded-lg border border-gray-100 dark:border-[#4e4f6c] shadow-card hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200"
        >
          <div className="w-12 h-12 rounded-lg bg-warning/10 dark:bg-warning/20 flex items-center justify-center mb-3">
            <i className='bx bx-shield-quarter text-2xl text-warning'></i>
          </div>
          <span className="text-sm font-medium text-txt-primary dark:text-[#d5d5e2]">Security</span>
        </Link>
        <Link
          href="/admin/whatsapp"
          className="flex flex-col items-center justify-center p-6 bg-white dark:bg-[#2b2c40] rounded-lg border border-gray-100 dark:border-[#4e4f6c] shadow-card hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200"
        >
          <div className="w-12 h-12 rounded-lg bg-success/10 dark:bg-success/20 flex items-center justify-center mb-3">
            <i className='bx bxl-whatsapp text-2xl text-success'></i>
          </div>
          <span className="text-sm font-medium text-txt-primary dark:text-[#d5d5e2]">WhatsApp</span>
        </Link>
      </div>
    </div>
  );
}
