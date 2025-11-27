'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { BookingFormData } from './types';
import { ThemeConfig } from './theme-config';

interface PaymentSectionProps {
  formData: BookingFormData;
  onInputChange: (field: keyof BookingFormData, value: string | number) => void;
  calculateTotal: () => number;
  themeConfig: ThemeConfig;
}

export function PaymentSection({
  formData,
  onInputChange,
  calculateTotal,
  themeConfig,
}: PaymentSectionProps) {
  const total = calculateTotal();
  const remaining = total - (formData.dpAmount || 0);

  return (
    <div className="space-y-4 bg-[#d7f5fc] dark:bg-[#25445c] p-5 rounded-card border border-info/30">
      {/* Header */}
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded bg-white dark:bg-[#2b2c40] flex items-center justify-center">
          <i className='bx bx-credit-card text-info'></i>
        </div>
        <h3 className="font-semibold text-txt-primary dark:text-[#d5d5e2]">Informasi Pembayaran</h3>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Payment Method */}
        <div>
          <Label className="text-txt-primary dark:text-[#d5d5e2]">Metode Pembayaran *</Label>
          <select
            value={formData.paymentMethod || 'cash'}
            onChange={(e) => onInputChange('paymentMethod', e.target.value)}
            className="w-full px-3 py-2 mt-1 bg-white dark:bg-[#2b2c40] border border-gray-200 dark:border-[#4e4f6c] rounded-md text-txt-primary dark:text-[#d5d5e2] focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-150"
          >
            <option value="cash">💵 Tunai</option>
            <option value="card">💳 Kartu Kredit/Debit</option>
            <option value="transfer">🏦 Transfer Bank</option>
            <option value="qris">📱 QRIS</option>
          </select>
          <p className="text-xs text-txt-muted dark:text-[#7e7f96] mt-1">Pilih metode pembayaran</p>
        </div>

        {/* Down Payment */}
        <div>
          <Label className="text-txt-primary dark:text-[#d5d5e2]">Uang Muka (DP) - Opsional</Label>
          <div className="flex gap-2 mt-1">
            <Input
              type="number"
              min="0"
              max={total}
              value={formData.dpAmount || 0}
              onChange={(e) => onInputChange('dpAmount', parseInt(e.target.value) || 0)}
              placeholder="Masukkan jumlah DP"
              className={themeConfig.inputClass}
            />
            <div className="flex items-center justify-center px-3 py-2 bg-white dark:bg-[#2b2c40] rounded-md border border-gray-200 dark:border-[#4e4f6c] text-sm font-semibold text-txt-secondary dark:text-[#b2b2c4] whitespace-nowrap">
              / {total.toLocaleString('id-ID')}
            </div>
          </div>
          <p className="text-xs text-txt-muted dark:text-[#7e7f96] mt-1">Kosongkan atau 0 jika tanpa DP</p>
        </div>
      </div>

      {/* DP Summary */}
      {formData.dpAmount && formData.dpAmount > 0 && (
        <div className="bg-white dark:bg-[#2b2c40] p-4 rounded-lg border border-gray-200 dark:border-[#4e4f6c]">
          <div className="flex justify-between text-sm">
            <span className="text-txt-secondary dark:text-[#b2b2c4]">Total Layanan:</span>
            <span className="font-semibold text-txt-primary dark:text-[#d5d5e2]">IDR {total.toLocaleString('id-ID')}</span>
          </div>
          <div className="flex justify-between text-sm mt-2">
            <span className="text-txt-secondary dark:text-[#b2b2c4]">Uang Muka:</span>
            <span className="font-semibold text-primary dark:text-[#a5a7ff]">IDR {formData.dpAmount.toLocaleString('id-ID')}</span>
          </div>
          <div className="flex justify-between text-sm mt-2 pt-2 border-t border-gray-200 dark:border-[#4e4f6c]">
            <span className="text-txt-secondary dark:text-[#b2b2c4]">Sisa Pembayaran:</span>
            <span className="font-semibold text-warning">IDR {remaining.toLocaleString('id-ID')}</span>
          </div>
        </div>
      )}
    </div>
  );
}
