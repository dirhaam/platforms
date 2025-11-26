"use client";

import { useMemo, useCallback } from "react";
import type { InvoiceSettingsData } from "@/lib/invoice/invoice-settings-service";
import { TransactionItem, PaymentEntry } from "../types";

export function useTransactionCalculations(
  items: TransactionItem[],
  invoiceSettings: InvoiceSettingsData | null
) {
  const subtotal = useMemo(() => {
    return items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  }, [items]);

  const taxAmount = useMemo(() => {
    if (!invoiceSettings?.taxServiceCharge?.taxPercentage) return 0;
    return subtotal * (invoiceSettings.taxServiceCharge.taxPercentage / 100);
  }, [subtotal, invoiceSettings]);

  const serviceChargeAmount = useMemo(() => {
    if (!invoiceSettings?.taxServiceCharge?.serviceChargeRequired) return 0;
    if (invoiceSettings.taxServiceCharge.serviceChargeType === 'fixed') {
      return invoiceSettings.taxServiceCharge.serviceChargeValue || 0;
    }
    return subtotal * ((invoiceSettings.taxServiceCharge.serviceChargeValue || 0) / 100);
  }, [subtotal, invoiceSettings]);

  const additionalFeesAmount = useMemo(() => {
    if (!invoiceSettings?.additionalFees) return 0;
    return invoiceSettings.additionalFees.reduce((total, fee) => {
      if (fee.type === 'fixed') {
        return total + fee.value;
      }
      return total + subtotal * (fee.value / 100);
    }, 0);
  }, [subtotal, invoiceSettings]);

  const totalAmount = useMemo(() => {
    return subtotal + taxAmount + serviceChargeAmount + additionalFeesAmount;
  }, [subtotal, taxAmount, serviceChargeAmount, additionalFeesAmount]);

  const calculateTotalPayment = useCallback((payments: PaymentEntry[]) => {
    return payments.reduce((sum, payment) => sum + payment.amount, 0);
  }, []);

  return {
    subtotal,
    taxAmount,
    serviceChargeAmount,
    additionalFeesAmount,
    totalAmount,
    calculateTotalPayment,
  };
}
