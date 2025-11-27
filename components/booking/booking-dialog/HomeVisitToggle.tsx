'use client';

import { HomeVisitAddressSelector } from '@/components/location/HomeVisitAddressSelector';
import { TravelEstimateCard } from '@/components/location/TravelEstimateCard';
import { Service } from '@/types/booking';
import { TravelCalculation } from '@/types/location';
import { BookingFormData } from './types';

interface HomeVisitToggleProps {
  service: Service;
  formData: BookingFormData;
  tenantId: string;
  businessCoordinates: { lat: number; lng: number } | null;
  onInputChange: (field: keyof BookingFormData, value: any) => void;
  onFormDataChange: (updates: Partial<BookingFormData>) => void;
  onTravelCalculation: (calc: TravelCalculation) => void;
}

export function HomeVisitToggle({
  service,
  formData,
  tenantId,
  businessCoordinates,
  onInputChange,
  onFormDataChange,
  onTravelCalculation,
}: HomeVisitToggleProps) {
  if (!service.homeVisitAvailable) return null;

  return (
    <div className="space-y-4 border border-gray-200 dark:border-[#4e4f6c] rounded-card p-4 bg-primary-light dark:bg-[#35365f]">
      {/* Toggle Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-white dark:bg-[#2b2c40] flex items-center justify-center">
            <i className='bx bx-home-heart text-xl text-primary dark:text-[#a5a7ff]'></i>
          </div>
          <div>
            <p className="font-medium text-txt-primary dark:text-[#d5d5e2]">Home Visit</p>
            <p className="text-xs text-txt-muted dark:text-[#7e7f96]">Layanan di lokasi Anda</p>
          </div>
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={formData.isHomeVisit}
            onChange={(e) => onInputChange('isHomeVisit', e.target.checked)}
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-gray-200 dark:bg-[#4e4f6c] peer-focus:ring-2 peer-focus:ring-primary/20 rounded-full peer peer-checked:bg-primary transition-colors duration-200 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all after:duration-200 peer-checked:after:translate-x-5"></div>
        </label>
      </div>
      
      {/* Home Visit Details */}
      {formData.isHomeVisit && (
        <>
          <HomeVisitAddressSelector
            address={formData.homeVisitAddress}
            latitude={formData.homeVisitLat}
            longitude={formData.homeVisitLng}
            tenantId={tenantId}
            onAddressChange={(addr) => onFormDataChange({ homeVisitAddress: addr })}
            onCoordinatesChange={(lat, lng) => onFormDataChange({ homeVisitLat: lat, homeVisitLng: lng })}
          />

          {/* Travel Estimate Placeholder */}
          {(!formData.homeVisitAddress || formData.homeVisitLat === undefined || formData.homeVisitLng === undefined) && (
            <div className="p-4 bg-white dark:bg-[#2b2c40] border border-gray-200 dark:border-[#4e4f6c] rounded-lg text-center">
              <i className='bx bx-map text-2xl text-txt-muted dark:text-[#7e7f96] mb-2'></i>
              <p className="text-sm text-txt-muted dark:text-[#7e7f96]">
                Masukkan alamat untuk melihat estimasi biaya transport
              </p>
            </div>
          )}

          {/* Travel Estimate Card */}
          {formData.homeVisitAddress && 
           typeof formData.homeVisitLat === 'number' && 
           typeof formData.homeVisitLng === 'number' && 
           businessCoordinates && (
            <TravelEstimateCard
              tenantId={tenantId}
              origin={businessCoordinates}
              destination={formData.homeVisitAddress}
              destinationCoordinates={{
                lat: formData.homeVisitLat,
                lng: formData.homeVisitLng
              }}
              serviceId={service.id}
              onCalculationComplete={onTravelCalculation}
              onConfirm={onTravelCalculation}
              autoCalculate={true}
            />
          )}
        </>
      )}
    </div>
  );
}
