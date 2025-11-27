'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Service } from '@/types/booking';
import { BookingFormData } from './types';
import { ThemeConfig } from './theme-config';

interface ConfirmationStepProps {
  selectedService: Service | undefined;
  formData: BookingFormData;
  calculateTotal: () => number;
  resetForm: () => void;
  onClose: () => void;
  themeConfig: ThemeConfig;
}

export function ConfirmationStep({
  selectedService,
  formData,
  calculateTotal,
  resetForm,
  onClose,
  themeConfig,
}: ConfirmationStepProps) {
  return (
    <div className="text-center space-y-6">
      {/* Success Icon */}
      <div className="w-16 h-16 bg-[#e8fadf] dark:bg-[#36483f] rounded-full flex items-center justify-center mx-auto">
        <i className='bx bx-check-circle text-4xl text-success'></i>
      </div>
      
      {/* Success Message */}
      <div>
        <h3 className="text-xl font-semibold text-success mb-2">
          Booking Berhasil Diajukan!
        </h3>
        <p className="text-txt-secondary dark:text-[#b2b2c4] mb-4">
          Terima kasih atas booking Anda. Kami akan menghubungi Anda segera untuk konfirmasi.
        </p>
      </div>

      {/* Booking Summary */}
      <Card className={`text-left ${themeConfig.cardClass}`}>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <i className='bx bx-receipt text-primary'></i>
            Ringkasan Booking
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-txt-secondary dark:text-[#b2b2c4]">Layanan:</span>
            <span className="font-semibold text-txt-primary dark:text-[#d5d5e2]">{selectedService?.name}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-txt-secondary dark:text-[#b2b2c4]">Tanggal & Waktu:</span>
            <span className="font-semibold text-txt-primary dark:text-[#d5d5e2]">
              {formData.selectedTimeSlot && (
                <>
                  {formData.selectedTimeSlot.start.toLocaleDateString('id-ID')} pukul{' '}
                  {formData.selectedTimeSlot.start.toLocaleTimeString('id-ID', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </>
              )}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-txt-secondary dark:text-[#b2b2c4]">Durasi:</span>
            <span className="font-semibold text-txt-primary dark:text-[#d5d5e2]">{selectedService?.duration} menit</span>
          </div>
          {formData.isHomeVisit && (
            <div className="flex justify-between text-sm">
              <span className="text-txt-secondary dark:text-[#b2b2c4]">Lokasi:</span>
              <span className="font-semibold text-primary dark:text-[#a5a7ff]">Home Visit</span>
            </div>
          )}
          <div className="flex justify-between text-lg font-bold border-t border-gray-200 dark:border-[#4e4f6c] pt-3">
            <span className="text-txt-primary dark:text-[#d5d5e2]">Total:</span>
            <span className="text-primary dark:text-[#a5a7ff]">IDR {Number(calculateTotal()).toLocaleString('id-ID')}</span>
          </div>
        </CardContent>
      </Card>

      {/* Contact Info */}
      <div className="bg-gray-50 dark:bg-[#232333] p-4 rounded-card border border-gray-200 dark:border-[#4e4f6c]">
        <p className="text-sm text-txt-secondary dark:text-[#b2b2c4] mb-2">
          <strong>Kami akan menghubungi Anda di:</strong>
        </p>
        <div className="space-y-1 text-sm">
          <div className="flex items-center justify-center gap-2 text-txt-primary dark:text-[#d5d5e2]">
            <i className='bx bx-phone'></i>
            <span>{formData.customerPhone}</span>
          </div>
          {formData.customerEmail && (
            <div className="flex items-center justify-center gap-2 text-txt-primary dark:text-[#d5d5e2]">
              <i className='bx bx-envelope'></i>
              <span>{formData.customerEmail}</span>
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <Button onClick={resetForm} className={`flex-1 ${themeConfig.buttonClass}`}>
          <i className='bx bx-plus mr-2'></i>
          Booking Lagi
        </Button>
        <Button onClick={onClose} variant="outline" className="flex-1">
          Tutup
        </Button>
      </div>
    </div>
  );
}
