'use client';

import { BoxIcon } from '@/components/ui/box-icon';

interface ExpiredOverlayProps {
  businessName: string;
  expiresAt?: string;
  isAdmin?: boolean;
}

export function ExpiredOverlay({ businessName, expiresAt, isAdmin = false }: ExpiredOverlayProps) {
  const formattedDate = expiresAt 
    ? new Date(expiresAt).toLocaleDateString('id-ID', { 
        day: 'numeric', 
        month: 'long', 
        year: 'numeric' 
      })
    : null;

  return (
    <div className="fixed inset-0 z-[9999] pointer-events-auto">
      {/* Grey overlay */}
      <div className="absolute inset-0 bg-gray-900/70 backdrop-blur-sm" />
      
      {/* Content */}
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 text-center">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <BoxIcon name="lock" size={40} className="text-red-600" />
          </div>
          
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Website Tidak Aktif
          </h1>
          
          <p className="text-gray-600 mb-4">
            Layanan <span className="font-semibold">{businessName}</span> sedang tidak tersedia karena subscription telah berakhir.
          </p>

          {formattedDate && (
            <div className="flex items-center justify-center gap-2 text-sm text-red-600 mb-6">
              <BoxIcon name="error" size={16} />
              <span>Berakhir pada {formattedDate}</span>
            </div>
          )}

          <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-500">
            {isAdmin ? (
              <p>
                Silakan perpanjang subscription Anda untuk mengaktifkan kembali website dan semua fitur admin.
              </p>
            ) : (
              <p>
                Silakan hubungi pemilik bisnis untuk informasi lebih lanjut.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// For landing page - wraps content with grey filter
export function ExpiredLandingWrapper({ 
  children, 
  businessName,
  expiresAt 
}: { 
  children: React.ReactNode;
  businessName: string;
  expiresAt?: string;
}) {
  return (
    <div className="relative">
      {/* Content with grey filter and disabled interactions */}
      <div className="grayscale pointer-events-none select-none">
        {children}
      </div>
      
      {/* Overlay */}
      <ExpiredOverlay businessName={businessName} expiresAt={expiresAt} />
    </div>
  );
}

// For admin panel - full block
export function ExpiredAdminBlock({ 
  businessName,
  expiresAt,
  onRenew 
}: { 
  businessName: string;
  expiresAt?: string;
  onRenew?: () => void;
}) {
  const formattedDate = expiresAt 
    ? new Date(expiresAt).toLocaleDateString('id-ID', { 
        day: 'numeric', 
        month: 'long', 
        year: 'numeric' 
      })
    : null;

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-8 text-center">
        <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <BoxIcon name="lock" size={48} className="text-red-600" />
        </div>
        
        <h1 className="text-3xl font-bold text-gray-900 mb-3">
          Subscription Berakhir
        </h1>
        
        <p className="text-gray-600 mb-4 text-lg">
          Akses admin untuk <span className="font-semibold">{businessName}</span> telah dinonaktifkan.
        </p>

        {formattedDate && (
          <div className="inline-flex items-center gap-2 text-sm text-red-600 bg-red-50 px-4 py-2 rounded-full mb-6">
            <BoxIcon name="error" size={16} />
            <span>Berakhir pada {formattedDate}</span>
          </div>
        )}

        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
          <p className="text-amber-800 text-sm">
            Semua data Anda tetap aman. Perpanjang subscription untuk mengakses kembali dashboard, data pelanggan, booking, dan semua fitur lainnya.
          </p>
        </div>

        <div className="space-y-3">
          <button
            onClick={onRenew}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <BoxIcon name="refresh" size={20} />
            Perpanjang Subscription
          </button>
          
          <p className="text-xs text-gray-400">
            Hubungi support jika Anda memerlukan bantuan
          </p>
        </div>
      </div>
    </div>
  );
}
