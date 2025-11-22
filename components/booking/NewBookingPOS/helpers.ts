import { TimeSlot } from '@/types/booking';
import type { InvoiceSettingsData } from '@/lib/invoice/invoice-settings-service';

export const formatTime = (date: Date): string => {
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
};

export const groupSlotsByPeriod = (slots: TimeSlot[]) => {
  const morning = slots.filter(slot => {
    const hour = slot.start.getHours();
    return hour >= 6 && hour < 12;
  });
  const afternoon = slots.filter(slot => {
    const hour = slot.start.getHours();
    return hour >= 12 && hour < 17;
  });
  const evening = slots.filter(slot => {
    const hour = slot.start.getHours();
    return hour >= 17 && hour < 22;
  });
  return { morning, afternoon, evening };
};

export const calculateTotal = (
  selectedService: any,
  booking: any,
  invoiceSettings: InvoiceSettingsData | null
): number => {
  if (!selectedService) return 0;
  
  const basePrice = Number(selectedService.price);
  const travelSurcharge = (booking.isHomeVisit && booking.travelCalculation) 
    ? Number(booking.travelCalculation.surcharge) 
    : 0;
  let subtotal = basePrice + travelSurcharge;
  let total = subtotal;
  
  if (invoiceSettings?.taxServiceCharge?.taxPercentage) {
    total += subtotal * (invoiceSettings.taxServiceCharge.taxPercentage / 100);
  }
  
  if (invoiceSettings?.taxServiceCharge?.serviceChargeRequired && invoiceSettings?.taxServiceCharge?.serviceChargeValue) {
    if (invoiceSettings.taxServiceCharge.serviceChargeType === 'fixed') {
      total += invoiceSettings.taxServiceCharge.serviceChargeValue;
    } else {
      total += subtotal * ((invoiceSettings.taxServiceCharge.serviceChargeValue || 0) / 100);
    }
  }
  
  if (invoiceSettings?.additionalFees && invoiceSettings.additionalFees.length > 0) {
    invoiceSettings.additionalFees.forEach(fee => {
      if (fee.type === 'fixed') {
        total += fee.value;
      } else {
        total += subtotal * (fee.value / 100);
      }
    });
  }
  
  return Math.round(total);
};
