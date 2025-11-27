import { Service, TimeSlot } from '@/types/booking';
import { TravelCalculation } from '@/types/location';
import type { InvoiceSettingsData } from '@/lib/invoice/invoice-settings-service';
import { BookingDialogTemplate, ThemeConfig } from './theme-config';

export interface TenantData {
  id: string;
  subdomain: string;
  businessName: string;
  phone: string;
  email: string;
  address?: string;
}

export interface BookingDialogProps {
  service?: Service;
  tenant: TenantData;
  trigger?: React.ReactNode;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  template?: BookingDialogTemplate;
}

export interface BookingFormData {
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  preferredDate: string;
  preferredTime?: string;
  selectedTimeSlot?: TimeSlot;
  isHomeVisit: boolean;
  homeVisitAddress: string;
  homeVisitCoordinates?: { lat: number; lng: number };
  homeVisitLat?: number;
  homeVisitLng?: number;
  notes: string;
  paymentMethod?: 'cash' | 'card' | 'transfer' | 'qris';
  dpAmount?: number;
  travelCalculation?: TravelCalculation;
}

export type BookingStep = 'service' | 'details' | 'confirmation';

export interface BookingDialogState {
  step: BookingStep;
  selectedService: Service | undefined;
  formData: BookingFormData;
  calculatedPrice: number;
  travelSurcharge: number;
  invoiceSettings: InvoiceSettingsData | null;
  isLoading: boolean;
  error: string | null;
  validationErrors: Record<string, string>;
  businessCoordinates: { lat: number; lng: number } | null;
  travelCalculation: TravelCalculation | undefined;
  blockedDates: Map<string, string>;
  calendarOpen: boolean;
}

export const initialFormData: BookingFormData = {
  customerName: '',
  customerPhone: '',
  customerEmail: '',
  preferredDate: '',
  preferredTime: '',
  selectedTimeSlot: undefined,
  isHomeVisit: false,
  homeVisitAddress: '',
  homeVisitCoordinates: undefined,
  homeVisitLat: undefined,
  homeVisitLng: undefined,
  notes: '',
  paymentMethod: 'cash',
  dpAmount: 0,
  travelCalculation: undefined,
};
