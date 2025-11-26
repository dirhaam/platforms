"use client";

import type { InvoiceSettingsData } from "@/lib/invoice/invoice-settings-service";

interface AmountBreakdownProps {
  subtotal: number;
  taxAmount: number;
  serviceChargeAmount: number;
  totalAmount: number;
  invoiceSettings: InvoiceSettingsData | null;
}

export function AmountBreakdown({
  subtotal,
  taxAmount,
  serviceChargeAmount,
  totalAmount,
  invoiceSettings,
}: AmountBreakdownProps) {
  if (subtotal === 0) return null;

  return (
    <div className="p-4 bg-gray-50 rounded-lg border space-y-2 text-sm">
      <h3 className="font-semibold mb-3">Amount Breakdown</h3>
      <div className="flex justify-between">
        <span className="text-gray-600">Subtotal</span>
        <span>Rp {subtotal.toLocaleString("id-ID")}</span>
      </div>
      {invoiceSettings?.taxServiceCharge?.taxPercentage ? (
        <div className="flex justify-between text-gray-600">
          <span>Tax {Number(invoiceSettings.taxServiceCharge.taxPercentage).toFixed(2)}%</span>
          <span>Rp {taxAmount.toLocaleString("id-ID")}</span>
        </div>
      ) : null}
      {invoiceSettings?.taxServiceCharge?.serviceChargeRequired &&
      invoiceSettings?.taxServiceCharge?.serviceChargeValue ? (
        <div className="flex justify-between text-gray-600">
          <span>Service Charge</span>
          <span>Rp {serviceChargeAmount.toLocaleString("id-ID")}</span>
        </div>
      ) : null}
      {invoiceSettings?.additionalFees &&
        invoiceSettings.additionalFees.length > 0 && (
          <>
            {invoiceSettings.additionalFees.map((fee) => (
              <div key={fee.id} className="flex justify-between text-gray-600">
                <span>{fee.name}</span>
                <span>
                  {fee.type === "fixed"
                    ? `Rp ${fee.value.toLocaleString("id-ID")}`
                    : `Rp ${(subtotal * (fee.value / 100)).toLocaleString("id-ID")}`}
                </span>
              </div>
            ))}
          </>
        )}
      <div className="border-t pt-2 flex justify-between font-semibold">
        <span>Total Amount</span>
        <span>Rp {totalAmount.toLocaleString("id-ID")}</span>
      </div>
    </div>
  );
}
