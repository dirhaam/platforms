import React from 'react';
import { createPortal } from 'react-dom';
import { Button } from '@/components/ui/button';
import { HomeVisitAddressSelector } from '@/components/location/HomeVisitAddressSelector';
import { TravelEstimateCard } from '@/components/location/TravelEstimateCard';
import { TravelCalculation } from '@/types/location';

interface HomeVisitModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  address: string;
  onAddressChange: (address: string) => void;
  latitude: number | undefined;
  longitude: number | undefined;
  onCoordinatesChange: (lat: number, lng: number) => void;
  isHomeVisit: boolean;
  businessCoordinates: { lat: number; lng: number } | null;
  serviceId: string;
  subdomain: string;
  onTravelCalculationChange: (calc: TravelCalculation) => void;
}

export function HomeVisitModal({
  open,
  onOpenChange,
  address,
  onAddressChange,
  latitude,
  longitude,
  onCoordinatesChange,
  isHomeVisit,
  businessCoordinates,
  serviceId,
  subdomain,
  onTravelCalculationChange,
}: HomeVisitModalProps) {
  if (!open) return null;
  
  // Use portal to render above Radix Dialog
  if (typeof document === 'undefined') return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50"
        onClick={() => onOpenChange(false)}
      />
      
      {/* Modal Content */}
      <div 
        className="relative z-10 w-full max-w-2xl max-h-[95vh] overflow-hidden flex flex-col bg-white rounded-card shadow-lg mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-white px-6 py-4 border-b border-gray-100 flex justify-between items-center">
          <div>
            <h4 className="text-lg font-bold text-txt-primary">Alamat Home Visit</h4>
            <p className="text-xs text-txt-secondary mt-0.5">Masukkan lokasi pelanggan untuk perhitungan biaya travel</p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onOpenChange(false)}
            className="text-txt-muted hover:bg-gray-100 hover:text-txt-primary rounded-full"
          >
            <i className='bx bx-x text-2xl'></i>
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-white">
          <HomeVisitAddressSelector
            address={address}
            latitude={latitude}
            longitude={longitude}
            tenantId={subdomain}
            onAddressChange={onAddressChange}
            onCoordinatesChange={onCoordinatesChange}
          />

          {address && typeof latitude === 'number' && typeof longitude === 'number' && businessCoordinates && (
            <div className="mt-4 space-y-3 animate-in fade-in slide-in-from-bottom-4">
              <h3 className="font-bold text-sm text-txt-primary">Estimasi Travel</h3>
              <div className="rounded-lg border border-gray-200 shadow-sm overflow-hidden">
                <TravelEstimateCard
                  tenantId={subdomain}
                  origin={businessCoordinates}
                  destination={address}
                  destinationCoordinates={{
                    lat: latitude,
                    lng: longitude
                  }}
                  serviceId={serviceId}
                  onCalculationComplete={onTravelCalculationChange}
                  onConfirm={onTravelCalculationChange}
                  autoCalculate={true}
                />
              </div>
            </div>
          )}
        </div>

        <div className="border-t border-gray-100 p-4 flex gap-3 justify-end bg-gray-50">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="text-txt-secondary bg-white border-gray-300"
          >
            Batal
          </Button>
          <Button
            onClick={() => onOpenChange(false)}
            disabled={isHomeVisit && !address}
            className="bg-primary hover:bg-primary-dark text-white shadow-md shadow-primary/30"
          >
            Konfirmasi Lokasi
          </Button>
        </div>
      </div>
    </div>,
    document.body
  );
}
