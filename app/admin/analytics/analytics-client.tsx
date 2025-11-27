'use client';

import { useState } from 'react';
import Link from 'next/link';

interface LoginHourData {
  hour: string;
  success: number;
  failed: number;
}

interface AnalyticsData {
  overview: {
    totalTenants: number;
    activeTenants: number;
    suspendedTenants: number;
    newTenantsThisMonth: number;
  };
  security: {
    totalLogins24h: number;
    failedLogins24h: number;
    loginsByHour: LoginHourData[];
    actionCounts: Record<string, number>;
    suspiciousIPs: [string, number][];
  };
  recentLogs: Array<{
    id: string;
    action: string;
    success: boolean;
    ipAddress: string;
    userAgent: string;
    tenantId: string;
    details: any;
    createdAt: string;
  }>;
}

interface Props {
  initialData: AnalyticsData;
}

export function AnalyticsClient({ initialData }: Props) {
  const [data] = useState<AnalyticsData>(initialData);
  const [activeTab, setActiveTab] = useState<'overview' | 'security' | 'logs'>('overview');

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'login': return 'bx-log-in';
      case 'logout': return 'bx-log-out';
      case 'password_change': return 'bx-key';
      case 'password_reset': return 'bx-reset';
      default: return 'bx-cog';
    }
  };

  const getActionLabel = (action: string) => {
    const labels: Record<string, string> = {
      login: 'Login',
      logout: 'Logout',
      password_change: 'Password Change',
      password_reset: 'Password Reset',
      tenant_create: 'Tenant Created',
      tenant_update: 'Tenant Updated',
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
    if (diffMins < 60) return `${diffMins}m lalu`;
    if (diffHours < 24) return `${diffHours}h lalu`;
    return `${diffDays}d lalu`;
  };

  // Calculate max for chart scaling
  const maxLoginValue = Math.max(
    ...data.security.loginsByHour.map(h => Math.max(h.success, h.failed)),
    1
  );

  // Health score calculation (simple)
  const failRate = data.security.totalLogins24h > 0 
    ? (data.security.failedLogins24h / (data.security.totalLogins24h + data.security.failedLogins24h)) * 100 
    : 0;
  const healthScore = Math.max(0, Math.min(100, 100 - failRate * 2 - (data.security.suspiciousIPs.length * 5)));
  const healthStatus = healthScore >= 80 ? 'healthy' : healthScore >= 50 ? 'warning' : 'critical';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-txt-primary dark:text-[#d5d5e2]">Platform Analytics</h1>
          <p className="text-sm text-txt-muted dark:text-[#7e7f96]">Monitor kesehatan sistem dan aktivitas keamanan</p>
        </div>
        <Link
          href="/admin"
          className="inline-flex items-center gap-2 px-4 py-2 border border-gray-200 dark:border-[#4e4f6c] rounded-lg text-sm font-medium text-txt-secondary dark:text-[#b2b2c4] hover:bg-gray-50 dark:hover:bg-[#232333] transition-colors"
        >
          <i className='bx bx-arrow-back'></i>
          Kembali
        </Link>
      </div>

      {/* Health Score Banner */}
      <div className={`p-5 rounded-lg border-l-4 ${
        healthStatus === 'healthy' 
          ? 'bg-green-50 dark:bg-[#36483f] border-l-success' 
          : healthStatus === 'warning' 
          ? 'bg-yellow-50 dark:bg-[#4d4036] border-l-warning' 
          : 'bg-red-50 dark:bg-[#4d2f3a] border-l-danger'
      }`}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center ${
              healthStatus === 'healthy' 
                ? 'bg-success/20' 
                : healthStatus === 'warning' 
                ? 'bg-warning/20' 
                : 'bg-danger/20'
            }`}>
              <span className={`text-2xl font-bold ${
                healthStatus === 'healthy' ? 'text-success' : healthStatus === 'warning' ? 'text-warning' : 'text-danger'
              }`}>
                {Math.round(healthScore)}
              </span>
            </div>
            <div>
              <p className="font-semibold text-txt-primary dark:text-[#d5d5e2]">
                Platform Health Score
              </p>
              <p className="text-sm text-txt-muted dark:text-[#7e7f96]">
                {healthStatus === 'healthy' 
                  ? 'Sistem berjalan dengan baik' 
                  : healthStatus === 'warning' 
                  ? 'Beberapa masalah perlu perhatian' 
                  : 'Masalah kritis terdeteksi'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-6 text-sm">
            <div className="text-center">
              <p className="text-2xl font-bold text-success">{data.security.totalLogins24h}</p>
              <p className="text-txt-muted dark:text-[#7e7f96]">Login Sukses (24h)</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-danger">{data.security.failedLogins24h}</p>
              <p className="text-txt-muted dark:text-[#7e7f96]">Login Gagal (24h)</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200 dark:border-[#4e4f6c]">
        {[
          { id: 'overview', label: 'Overview', icon: 'bx-home-circle' },
          { id: 'security', label: 'Security', icon: 'bx-shield-quarter' },
          { id: 'logs', label: 'Activity Logs', icon: 'bx-list-check' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 -mb-[2px] transition-colors ${
              activeTab === tab.id
                ? 'border-primary text-primary dark:text-[#a5a7ff]'
                : 'border-transparent text-txt-muted dark:text-[#7e7f96] hover:text-txt-secondary dark:hover:text-[#b2b2c4]'
            }`}
          >
            <i className={`bx ${tab.icon}`}></i>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Tenant Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-[#2b2c40] rounded-lg p-5 border border-gray-100 dark:border-[#4e4f6c] shadow-card">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-primary-light dark:bg-[#35365f] flex items-center justify-center">
                  <i className='bx bx-building-house text-xl text-primary dark:text-[#a5a7ff]'></i>
                </div>
              </div>
              <p className="text-2xl font-bold text-txt-primary dark:text-[#d5d5e2]">{data.overview.totalTenants}</p>
              <p className="text-xs text-txt-muted dark:text-[#7e7f96]">Total Tenants</p>
            </div>

            <div className="bg-white dark:bg-[#2b2c40] rounded-lg p-5 border border-gray-100 dark:border-[#4e4f6c] shadow-card">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-success/10 dark:bg-success/20 flex items-center justify-center">
                  <i className='bx bx-check-circle text-xl text-success'></i>
                </div>
              </div>
              <p className="text-2xl font-bold text-success">{data.overview.activeTenants}</p>
              <p className="text-xs text-txt-muted dark:text-[#7e7f96]">Aktif (7 hari)</p>
            </div>

            <div className="bg-white dark:bg-[#2b2c40] rounded-lg p-5 border border-gray-100 dark:border-[#4e4f6c] shadow-card">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-danger/10 dark:bg-danger/20 flex items-center justify-center">
                  <i className='bx bx-block text-xl text-danger'></i>
                </div>
              </div>
              <p className="text-2xl font-bold text-danger">{data.overview.suspendedTenants}</p>
              <p className="text-xs text-txt-muted dark:text-[#7e7f96]">Suspended</p>
            </div>

            <div className="bg-white dark:bg-[#2b2c40] rounded-lg p-5 border border-gray-100 dark:border-[#4e4f6c] shadow-card">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-info/10 dark:bg-info/20 flex items-center justify-center">
                  <i className='bx bx-trending-up text-xl text-info'></i>
                </div>
              </div>
              <p className="text-2xl font-bold text-info">{data.overview.newTenantsThisMonth}</p>
              <p className="text-xs text-txt-muted dark:text-[#7e7f96]">Baru (30 hari)</p>
            </div>
          </div>

          {/* Login Activity Chart */}
          <div className="bg-white dark:bg-[#2b2c40] rounded-lg border border-gray-100 dark:border-[#4e4f6c] shadow-card">
            <div className="p-5 border-b border-gray-100 dark:border-[#4e4f6c]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary-light dark:bg-[#35365f] flex items-center justify-center">
                  <i className='bx bx-line-chart text-xl text-primary dark:text-[#a5a7ff]'></i>
                </div>
                <div>
                  <h5 className="font-semibold text-txt-primary dark:text-[#d5d5e2]">Login Activity (24 jam)</h5>
                  <p className="text-xs text-txt-muted dark:text-[#7e7f96]">Aktivitas login per jam</p>
                </div>
              </div>
            </div>
            <div className="p-5">
              <div className="flex items-center gap-4 mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-success"></div>
                  <span className="text-xs text-txt-muted dark:text-[#7e7f96]">Sukses</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-danger"></div>
                  <span className="text-xs text-txt-muted dark:text-[#7e7f96]">Gagal</span>
                </div>
              </div>
              <div className="flex items-end gap-1 h-40 overflow-x-auto pb-2">
                {data.security.loginsByHour.map((hourData, index) => (
                  <div key={index} className="flex flex-col items-center gap-1 min-w-[24px]">
                    <div className="flex flex-col-reverse gap-0.5 h-32">
                      <div 
                        className="w-4 bg-success rounded-t transition-all duration-300"
                        style={{ height: `${(hourData.success / maxLoginValue) * 100}%`, minHeight: hourData.success > 0 ? '4px' : '0' }}
                        title={`Sukses: ${hourData.success}`}
                      ></div>
                      <div 
                        className="w-4 bg-danger rounded-t transition-all duration-300"
                        style={{ height: `${(hourData.failed / maxLoginValue) * 100}%`, minHeight: hourData.failed > 0 ? '4px' : '0' }}
                        title={`Gagal: ${hourData.failed}`}
                      ></div>
                    </div>
                    <span className="text-[9px] text-txt-muted dark:text-[#7e7f96] transform -rotate-45 origin-top-left whitespace-nowrap">
                      {hourData.hour}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Activity by Type */}
          <div className="bg-white dark:bg-[#2b2c40] rounded-lg border border-gray-100 dark:border-[#4e4f6c] shadow-card">
            <div className="p-5 border-b border-gray-100 dark:border-[#4e4f6c]">
              <h5 className="font-semibold text-txt-primary dark:text-[#d5d5e2]">Aktivitas per Tipe (7 hari)</h5>
            </div>
            <div className="p-5">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {Object.entries(data.security.actionCounts).map(([action, count]) => (
                  <div key={action} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-[#232333] rounded-lg">
                    <div className="w-10 h-10 rounded-lg bg-primary-light dark:bg-[#35365f] flex items-center justify-center">
                      <i className={`bx ${getActionIcon(action)} text-lg text-primary dark:text-[#a5a7ff]`}></i>
                    </div>
                    <div>
                      <p className="text-lg font-bold text-txt-primary dark:text-[#d5d5e2]">{count}</p>
                      <p className="text-xs text-txt-muted dark:text-[#7e7f96]">{getActionLabel(action)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Security Tab */}
      {activeTab === 'security' && (
        <div className="space-y-6">
          {/* Suspicious IPs */}
          <div className="bg-white dark:bg-[#2b2c40] rounded-lg border border-gray-100 dark:border-[#4e4f6c] shadow-card">
            <div className="p-5 border-b border-gray-100 dark:border-[#4e4f6c]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-danger/10 dark:bg-danger/20 flex items-center justify-center">
                    <i className='bx bx-error-circle text-xl text-danger'></i>
                  </div>
                  <div>
                    <h5 className="font-semibold text-txt-primary dark:text-[#d5d5e2]">IP Mencurigakan</h5>
                    <p className="text-xs text-txt-muted dark:text-[#7e7f96]">IP dengan 3+ percobaan login gagal (24h)</p>
                  </div>
                </div>
                {data.security.suspiciousIPs.length > 0 && (
                  <span className="px-3 py-1 text-xs font-semibold rounded-full bg-danger/10 text-danger">
                    {data.security.suspiciousIPs.length} IP
                  </span>
                )}
              </div>
            </div>
            <div className="p-5">
              {data.security.suspiciousIPs.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8">
                  <div className="w-16 h-16 rounded-full bg-success/10 dark:bg-success/20 flex items-center justify-center mb-4">
                    <i className='bx bx-check-shield text-3xl text-success'></i>
                  </div>
                  <p className="text-txt-muted dark:text-[#7e7f96]">Tidak ada IP mencurigakan terdeteksi</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {data.security.suspiciousIPs.map(([ip, count]) => (
                    <div 
                      key={ip} 
                      className="flex items-center justify-between p-3 bg-red-50 dark:bg-[#4d2f3a]/50 rounded-lg border border-red-200 dark:border-red-800/30"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded bg-danger/10 flex items-center justify-center">
                          <i className='bx bx-globe text-danger'></i>
                        </div>
                        <div>
                          <p className="font-mono text-sm font-medium text-txt-primary dark:text-[#d5d5e2]">{ip}</p>
                          <p className="text-xs text-danger">{count} percobaan gagal</p>
                        </div>
                      </div>
                      <button className="px-3 py-1 text-xs font-medium text-danger border border-danger/30 rounded hover:bg-danger/10 transition-colors">
                        Block IP
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Security Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white dark:bg-[#2b2c40] rounded-lg p-5 border border-gray-100 dark:border-[#4e4f6c] shadow-card">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-success/10 dark:bg-success/20 flex items-center justify-center">
                  <i className='bx bx-shield-alt-2 text-xl text-success'></i>
                </div>
                <div>
                  <p className="text-sm text-txt-muted dark:text-[#7e7f96]">Login Success Rate</p>
                  <p className="text-2xl font-bold text-success">
                    {data.security.totalLogins24h + data.security.failedLogins24h > 0
                      ? Math.round((data.security.totalLogins24h / (data.security.totalLogins24h + data.security.failedLogins24h)) * 100)
                      : 100}%
                  </p>
                </div>
              </div>
              <div className="h-2 bg-gray-100 dark:bg-[#35365f] rounded-full overflow-hidden">
                <div 
                  className="h-full bg-success rounded-full transition-all duration-500"
                  style={{ 
                    width: `${data.security.totalLogins24h + data.security.failedLogins24h > 0
                      ? (data.security.totalLogins24h / (data.security.totalLogins24h + data.security.failedLogins24h)) * 100
                      : 100}%` 
                  }}
                ></div>
              </div>
            </div>

            <div className="bg-white dark:bg-[#2b2c40] rounded-lg p-5 border border-gray-100 dark:border-[#4e4f6c] shadow-card">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-warning/10 dark:bg-warning/20 flex items-center justify-center">
                  <i className='bx bx-error text-xl text-warning'></i>
                </div>
                <div>
                  <p className="text-sm text-txt-muted dark:text-[#7e7f96]">Suspicious IPs</p>
                  <p className="text-2xl font-bold text-warning">{data.security.suspiciousIPs.length}</p>
                </div>
              </div>
              <p className="text-xs text-txt-muted dark:text-[#7e7f96]">IP dengan multiple failed attempts</p>
            </div>

            <div className="bg-white dark:bg-[#2b2c40] rounded-lg p-5 border border-gray-100 dark:border-[#4e4f6c] shadow-card">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-info/10 dark:bg-info/20 flex items-center justify-center">
                  <i className='bx bx-time text-xl text-info'></i>
                </div>
                <div>
                  <p className="text-sm text-txt-muted dark:text-[#7e7f96]">Total Events (7d)</p>
                  <p className="text-2xl font-bold text-info">{data.recentLogs.length}</p>
                </div>
              </div>
              <p className="text-xs text-txt-muted dark:text-[#7e7f96]">Security events tercatat</p>
            </div>
          </div>
        </div>
      )}

      {/* Logs Tab */}
      {activeTab === 'logs' && (
        <div className="bg-white dark:bg-[#2b2c40] rounded-lg border border-gray-100 dark:border-[#4e4f6c] shadow-card">
          <div className="p-5 border-b border-gray-100 dark:border-[#4e4f6c]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary-light dark:bg-[#35365f] flex items-center justify-center">
                <i className='bx bx-list-check text-xl text-primary dark:text-[#a5a7ff]'></i>
              </div>
              <div>
                <h5 className="font-semibold text-txt-primary dark:text-[#d5d5e2]">Activity Logs</h5>
                <p className="text-xs text-txt-muted dark:text-[#7e7f96]">50 aktivitas terbaru</p>
              </div>
            </div>
          </div>
          <div className="divide-y divide-gray-100 dark:divide-[#4e4f6c] max-h-[600px] overflow-y-auto">
            {data.recentLogs.map((log) => (
              <div 
                key={log.id} 
                className={`p-4 hover:bg-gray-50 dark:hover:bg-[#232333] transition-colors ${
                  !log.success ? 'bg-red-50/50 dark:bg-[#4d2f3a]/30' : ''
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`w-8 h-8 rounded flex items-center justify-center flex-shrink-0 ${
                    log.success ? 'bg-success/10' : 'bg-danger/10'
                  }`}>
                    <i className={`bx ${getActionIcon(log.action)} ${log.success ? 'text-success' : 'text-danger'}`}></i>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium text-txt-primary dark:text-[#d5d5e2]">
                        {getActionLabel(log.action)}
                      </span>
                      <span className={`px-2 py-0.5 text-[10px] font-semibold rounded-full ${
                        log.success ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'
                      }`}>
                        {log.success ? 'Success' : 'Failed'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-1 text-xs text-txt-muted dark:text-[#7e7f96]">
                      {log.ipAddress && (
                        <span className="flex items-center gap-1">
                          <i className='bx bx-globe'></i>
                          {log.ipAddress}
                        </span>
                      )}
                      {log.tenantId && log.tenantId !== 'platform' && (
                        <span className="flex items-center gap-1">
                          <i className='bx bx-building-house'></i>
                          {log.tenantId.slice(0, 8)}...
                        </span>
                      )}
                    </div>
                    {log.details?.email && (
                      <p className="text-xs text-txt-secondary dark:text-[#b2b2c4] mt-1">
                        {log.details.email}
                      </p>
                    )}
                    {!log.success && log.details?.reason && (
                      <p className="text-xs text-danger mt-1">
                        {log.details.reason}
                      </p>
                    )}
                  </div>
                  <span className="text-xs text-txt-muted dark:text-[#7e7f96] whitespace-nowrap">
                    {formatTimeAgo(log.createdAt)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
