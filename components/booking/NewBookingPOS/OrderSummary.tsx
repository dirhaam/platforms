import React, { useMemo } from 'react';
import { Service } from '@/types/booking';
import type { InvoiceSettingsData } from '@/lib/invoice/invoice-settings-service';
import { calculateTotal } from './helpers';

interface NewBooking {
  customerId: string;
  serviceId: string;
  scheduledAt: string;
  scheduledTime: string;
  selectedTimeSlot?: any;
  isHomeVisit: boolean;
  homeVisitAddress: string;
  homeVisitLat?: number;
  homeVisitLng?: number;
  paymentMethod: string;
  dpAmount: number;
  notes: string;
  travelCalculation?: any;
}

interface OrderSummaryProps {
  selectedService: Service | undefined;
  booking: NewBooking;
  invoiceSettings: InvoiceSettingsData | null;
}

export function OrderSummary({
  selectedService,
  booking,
  invoiceSettings,
}: OrderSummaryProps) {
  const total = useMemo(
    () => calculateTotal(selectedService, booking, invoiceSettings),
    [selectedService, booking, invoiceSettings]
  );

  return (
    <div className="bg-white rounded-card shadow-card p-5 border border-gray-100">
      <h5 className="text-sm font-bold text-txt-primary uppercase tracking-wide mb-4 border-b border-gray-100 pb-2">Order Summary</h5>
      
      {!selectedService ? (
        <div className="text-center py-8 text-txt-muted bg-gray-50 rounded-lg border border-dashed border-gray-200">
          <i className='bx bx-cart text-3xl mb-2 opacity-50'></i>
          <p className="text-sm">Select a service to view breakdown</p>
        </div>
      ) : (
        <div className="space-y-3">
          {(() => {
            const basePrice = Number(selectedService.price);
            const travelSurcharge = booking.travelCalculation?.surcharge || 0;
            const subtotal = basePrice + travelSurcharge;
            const tax = subtotal * ((invoiceSettings?.taxServiceCharge?.taxPercentage || 0) / 100);
            
            return (
              <div className="text-sm space-y-3">
                <div className="flex justify-between items-center text-txt-secondary">
                  <span>Service Fee</span>
                  <span className="font-medium text-txt-primary">IDR {basePrice.toLocaleString('id-ID')}</span>
                </div>
                
                {booking.isHomeVisit && travelSurcharge > 0 && (
                  <div className="flex justify-between items-center text-txt-secondary">
                    <span className="flex items-center gap-1">
                      <i className='bx bx-trip'></i> Travel ({booking.travelCalculation?.distance.toFixed(1)}km)
                    </span>
                    <span className="font-medium text-txt-primary">IDR {Number(travelSurcharge).toLocaleString('id-ID')}</span>
                  </div>
                )}

                {tax > 0 && (
                  <div className="flex justify-between items-center text-txt-secondary">
                    <span>Tax ({invoiceSettings?.taxServiceCharge?.taxPercentage.toFixed(1)}%)</span>
                    <span className="font-medium text-txt-primary">IDR {tax.toLocaleString('id-ID')}</span>
                  </div>
                )}

                {invoiceSettings?.taxServiceCharge?.serviceChargeRequired && invoiceSettings?.taxServiceCharge?.serviceChargeValue && (
                  <div className="flex justify-between items-center text-txt-secondary">
                    <span>Service Charge</span>
                    <span className="font-medium text-txt-primary">
                      {invoiceSettings.taxServiceCharge.serviceChargeType === 'fixed'
                        ? `IDR ${(invoiceSettings.taxServiceCharge.serviceChargeValue || 0).toLocaleString('id-ID')}`
                        : `IDR ${(subtotal * ((invoiceSettings.taxServiceCharge.serviceChargeValue || 0) / 100)).toLocaleString('id-ID')}`}
                    </span>
                  </div>
                )}

                {invoiceSettings?.additionalFees && invoiceSettings.additionalFees.length > 0 && (
                  invoiceSettings.additionalFees.map(fee => (
                    <div key={fee.id} className="flex justify-between items-center text-txt-secondary">
                      <span>{fee.name}</span>
                      <span className="font-medium text-txt-primary">
                        {fee.type === 'fixed'
                          ? `IDR ${fee.value.toLocaleString('id-ID')}`
                          : `IDR ${(subtotal * (fee.value / 100)).toLocaleString('id-ID')}`}
                      </span>
                    </div>
                  ))
                )}

                <div className="border-t border-dashed border-gray-200 pt-3 mt-2 flex justify-between items-center">
                  <span className="font-bold text-lg text-txt-primary">Total Amount</span>
                  <span className="font-bold text-lg text-primary">IDR {total.toLocaleString('id-ID')}</span>
                </div>
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
}
