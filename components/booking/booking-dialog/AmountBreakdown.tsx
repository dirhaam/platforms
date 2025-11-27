'use client';

import { Service } from '@/types/booking';
import type { InvoiceSettingsData } from '@/lib/invoice/invoice-settings-service';

interface AmountBreakdownProps {
  service: Service;
  isHomeVisit: boolean;
  travelSurcharge: number;
  invoiceSettings: InvoiceSettingsData | null;
  calculateTotal: () => number;
}

export function AmountBreakdown({
  service,
  isHomeVisit,
  travelSurcharge,
  invoiceSettings,
  calculateTotal,
}: AmountBreakdownProps) {
  const basePrice = Number(service.price);
  const subtotal = basePrice + (isHomeVisit ? travelSurcharge : 0);

  return (
    <div className="p-5 bg-gray-50 dark:bg-[#232333] rounded-card border border-gray-200 dark:border-[#4e4f6c] space-y-3">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded bg-primary-light dark:bg-[#35365f] flex items-center justify-center">
          <i className='bx bx-receipt text-primary dark:text-[#a5a7ff]'></i>
        </div>
        <h3 className="font-semibold text-txt-primary dark:text-[#d5d5e2]">Rincian Biaya</h3>
      </div>

      {/* Base Price */}
      <div className="flex justify-between text-sm">
        <span className="text-txt-secondary dark:text-[#b2b2c4]">Biaya Layanan</span>
        <span className="text-txt-primary dark:text-[#d5d5e2]">IDR {basePrice.toLocaleString('id-ID')}</span>
      </div>

      {/* Travel Surcharge */}
      {isHomeVisit && travelSurcharge > 0 && (
        <div className="flex justify-between text-sm">
          <span className="text-txt-secondary dark:text-[#b2b2c4]">Biaya Transport</span>
          <span className="text-txt-primary dark:text-[#d5d5e2]">IDR {travelSurcharge.toLocaleString('id-ID')}</span>
        </div>
      )}

      {/* Tax */}
      {invoiceSettings?.taxServiceCharge?.taxPercentage ? (
        <div className="flex justify-between text-sm">
          <span className="text-txt-muted dark:text-[#7e7f96]">
            Pajak {Number(invoiceSettings.taxServiceCharge.taxPercentage).toFixed(0)}%
          </span>
          <span className="text-txt-secondary dark:text-[#b2b2c4]">
            IDR {(subtotal * (invoiceSettings.taxServiceCharge.taxPercentage / 100)).toLocaleString('id-ID')}
          </span>
        </div>
      ) : null}

      {/* Service Charge */}
      {invoiceSettings?.taxServiceCharge?.serviceChargeRequired && invoiceSettings?.taxServiceCharge?.serviceChargeValue ? (
        <div className="flex justify-between text-sm">
          <span className="text-txt-muted dark:text-[#7e7f96]">Service Charge</span>
          <span className="text-txt-secondary dark:text-[#b2b2c4]">
            {invoiceSettings.taxServiceCharge.serviceChargeType === 'fixed'
              ? `IDR ${invoiceSettings.taxServiceCharge.serviceChargeValue.toLocaleString('id-ID')}`
              : `IDR ${(subtotal * (invoiceSettings.taxServiceCharge.serviceChargeValue / 100)).toLocaleString('id-ID')}`}
          </span>
        </div>
      ) : null}

      {/* Additional Fees */}
      {invoiceSettings?.additionalFees?.map(fee => (
        <div key={fee.id} className="flex justify-between text-sm">
          <span className="text-txt-muted dark:text-[#7e7f96]">{fee.name}</span>
          <span className="text-txt-secondary dark:text-[#b2b2c4]">
            {fee.type === 'fixed'
              ? `IDR ${fee.value.toLocaleString('id-ID')}`
              : `IDR ${(subtotal * (fee.value / 100)).toLocaleString('id-ID')}`}
          </span>
        </div>
      ))}

      {/* Total */}
      <div className="border-t border-gray-200 dark:border-[#4e4f6c] pt-3 flex justify-between">
        <span className="font-semibold text-txt-primary dark:text-[#d5d5e2]">Total</span>
        <span className="font-bold text-lg text-primary dark:text-[#a5a7ff]">
          IDR {Number(calculateTotal()).toLocaleString('id-ID')}
        </span>
      </div>
    </div>
  );
}
