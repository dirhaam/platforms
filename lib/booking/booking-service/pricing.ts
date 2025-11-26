import { InvoiceSettingsService } from '@/lib/invoice/invoice-settings-service';
import { LocationService } from '@/lib/location/location-service';
import { getSupabaseClient } from './utils';
import { PricingCalculation, TravelData } from './types';

export async function calculateTravelData(
  tenantId: string,
  serviceId: string,
  homeVisitAddress: string,
  frontendTravelData?: Partial<TravelData>
): Promise<TravelData> {
  // Use pre-calculated travel data from frontend if provided
  if (frontendTravelData?.travelSurcharge !== undefined || 
      frontendTravelData?.travelDistance !== undefined || 
      frontendTravelData?.travelDuration !== undefined) {
    console.log('[calculateTravelData] Using frontend-provided travel data:', frontendTravelData);
    return {
      travelSurcharge: frontendTravelData.travelSurcharge ?? 0,
      travelDistance: frontendTravelData.travelDistance ?? 0,
      travelDuration: frontendTravelData.travelDuration ?? 0
    };
  }

  // Recalculate if frontend didn't provide travel data
  try {
    console.log('[calculateTravelData] No travel data provided, recalculating...');
    const supabase = getSupabaseClient();
    
    const { data: tenantData, error: tenantError } = await supabase
      .from('tenants')
      .select('address, business_location')
      .eq('id', tenantId)
      .single();

    if (tenantData && !tenantError) {
      const businessLocation = tenantData.business_location || tenantData.address;

      if (businessLocation) {
        console.log('[calculateTravelData] Calculating travel from:', { businessLocation, destination: homeVisitAddress });
        const travelCalc = await LocationService.calculateTravel({
          origin: businessLocation,
          destination: homeVisitAddress,
          tenantId,
          serviceId
        });

        if (travelCalc) {
          const result = {
            travelSurcharge: travelCalc.surcharge || 0,
            travelDistance: travelCalc.distance || 0,
            travelDuration: travelCalc.duration || 0
          };
          console.log('[calculateTravelData] Travel recalculated:', result);
          return result;
        }
      }
    }
  } catch (error) {
    console.warn('[calculateTravelData] Could not calculate travel surcharge:', error);
  }

  return { travelSurcharge: 0, travelDistance: 0, travelDuration: 0 };
}

export async function calculatePricing(
  tenantId: string,
  basePrice: number,
  travelSurcharge: number = 0
): Promise<PricingCalculation> {
  // Step 1: Calculate subtotal = base price + travel surcharge
  const subtotal = basePrice + travelSurcharge;

  // Step 2: Fetch invoice settings (tax, service charge, additional fees)
  const settings = await InvoiceSettingsService.getSettings(tenantId);

  // Step 3: Calculate tax on subtotal
  const taxPercentage = settings?.taxServiceCharge?.taxPercentage || 0;
  const taxAmount = subtotal * (taxPercentage / 100);

  // Step 4: Calculate service charge on subtotal
  let serviceChargeAmount = 0;
  if (settings?.taxServiceCharge?.serviceChargeRequired) {
    if (settings.taxServiceCharge.serviceChargeType === 'fixed') {
      serviceChargeAmount = settings.taxServiceCharge.serviceChargeValue || 0;
    } else {
      serviceChargeAmount = subtotal * ((settings.taxServiceCharge.serviceChargeValue || 0) / 100);
    }
  }

  // Step 5: Calculate additional fees on subtotal
  let additionalFeesAmount = 0;
  (settings?.additionalFees || []).forEach(fee => {
    if (fee.type === 'fixed') {
      additionalFeesAmount += fee.value;
    } else {
      additionalFeesAmount += subtotal * (fee.value / 100);
    }
  });

  // Step 6: Calculate total = subtotal + all taxes/fees
  const totalAmount = subtotal + taxAmount + serviceChargeAmount + additionalFeesAmount;

  return {
    basePrice,
    travelSurcharge,
    subtotal,
    taxPercentage,
    taxAmount,
    serviceChargeAmount,
    additionalFeesAmount,
    totalAmount
  };
}

export function calculatePaymentStatus(paidAmount: number, totalAmount: number): string {
  if (paidAmount >= totalAmount) {
    return 'paid';
  } else if (paidAmount > 0) {
    return 'partial';
  }
  return 'pending';
}
