'use client';

import { useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';

export default function StaffLoginPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const subdomain = searchParams?.get('subdomain') || '';
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/auth/staff-login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Tenant-ID': subdomain,
        },
        body: JSON.stringify({
          email,
          password,
          subdomain,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Login gagal');
      }

      // Redirect to staff dashboard
      router.push(`/tenant/staff?subdomain=${subdomain}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-white to-primary/10 dark:from-[#232333] dark:via-[#2b2c40] dark:to-[#232333] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo/Brand */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-primary mx-auto flex items-center justify-center mb-4 shadow-lg shadow-primary/30">
            <i className='bx bx-user-check text-3xl text-white'></i>
          </div>
          <h1 className="text-2xl font-bold text-txt-primary dark:text-[#d5d5e2]">Staff Portal</h1>
          <p className="text-sm text-txt-muted dark:text-[#7e7f96] mt-1">
            Masuk untuk melihat jadwal booking Anda
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-white dark:bg-[#2b2c40] rounded-xl shadow-card border border-gray-100 dark:border-[#4e4f6c] p-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Error Alert */}
            {error && (
              <div className="flex items-center gap-3 p-4 bg-red-50 dark:bg-[#4d2f3a] border border-red-200 dark:border-red-800/50 rounded-lg">
                <i className='bx bx-error-circle text-xl text-danger'></i>
                <p className="text-sm text-danger flex-1">{error}</p>
              </div>
            )}

            {/* Email */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-txt-primary dark:text-[#d5d5e2]">
                Email
              </label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-txt-muted dark:text-[#7e7f96]">
                  <i className='bx bx-envelope text-lg'></i>
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="staff@example.com"
                  required
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-[#232333] border border-gray-200 dark:border-[#4e4f6c] rounded-lg text-txt-primary dark:text-[#d5d5e2] placeholder-txt-muted dark:placeholder-[#7e7f96] focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-txt-primary dark:text-[#d5d5e2]">
                Password
              </label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-txt-muted dark:text-[#7e7f96]">
                  <i className='bx bx-lock-alt text-lg'></i>
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full pl-10 pr-12 py-3 bg-gray-50 dark:bg-[#232333] border border-gray-200 dark:border-[#4e4f6c] rounded-lg text-txt-primary dark:text-[#d5d5e2] placeholder-txt-muted dark:placeholder-[#7e7f96] focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-txt-muted dark:text-[#7e7f96] hover:text-txt-primary dark:hover:text-[#d5d5e2] transition-colors"
                >
                  <i className={`bx ${showPassword ? 'bx-hide' : 'bx-show'} text-lg`}></i>
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-primary text-white rounded-lg font-medium shadow-md shadow-primary/20 hover:bg-[#5f61e6] hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <i className='bx bx-loader-alt animate-spin'></i>
                  Memproses...
                </>
              ) : (
                <>
                  <i className='bx bx-log-in'></i>
                  Masuk
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200 dark:border-[#4e4f6c]"></div>
            </div>
            <div className="relative flex justify-center">
              <span className="px-3 text-xs text-txt-muted dark:text-[#7e7f96] bg-white dark:bg-[#2b2c40]">
                atau
              </span>
            </div>
          </div>

          {/* Admin Login Link */}
          <Link
            href={`/tenant/login?subdomain=${subdomain}`}
            className="block w-full py-3 border border-gray-200 dark:border-[#4e4f6c] text-txt-secondary dark:text-[#b2b2c4] rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-[#232333] transition-colors text-center"
          >
            Login sebagai Admin
          </Link>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-txt-muted dark:text-[#7e7f96] mt-6">
          &copy; {new Date().getFullYear()} Booqing Platform
        </p>
      </div>
    </div>
  );
}
