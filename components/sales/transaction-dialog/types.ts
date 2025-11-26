import { SalesPaymentMethod, SalesTransaction } from "@/types/sales";
import type { InvoiceSettingsData } from "@/lib/invoice/invoice-settings-service";

export type TransactionType = "on_the_spot" | "from_booking";

export interface TransactionItem {
  serviceId: string;
  quantity: number;
  unitPrice: number;
}

export interface PaymentEntry {
  method: SalesPaymentMethod;
  amount: number;
  reference?: string;
}

export interface OnTheSpotTransaction {
  customerId: string;
  items: TransactionItem[];
  totalAmount: number;
  payments: PaymentEntry[];
  notes: string;
}

export interface FromBookingTransaction {
  bookingId: string;
  customerId: string;
  serviceId: string;
  scheduledAt: string;
  isHomeVisit: boolean;
  totalAmount: number;
  payments: PaymentEntry[];
  notes: string;
}

export interface SalesTransactionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tenantId: string;
  subdomain?: string;
  allowedTypes?: TransactionType[];
  defaultType?: TransactionType;
  onCreated?: (transaction: SalesTransaction) => Promise<void> | void;
  onError?: (message: string | null) => void;
}

export const DEFAULT_ALLOWED_TYPES: TransactionType[] = ["on_the_spot", "from_booking"];

export const DEFAULT_ON_THE_SPOT: OnTheSpotTransaction = {
  customerId: "",
  items: [],
  totalAmount: 0,
  payments: [],
  notes: "",
};

export const DEFAULT_FROM_BOOKING: FromBookingTransaction = {
  bookingId: "",
  customerId: "",
  serviceId: "",
  scheduledAt: "",
  isHomeVisit: false,
  totalAmount: 0,
  payments: [],
  notes: "",
};
