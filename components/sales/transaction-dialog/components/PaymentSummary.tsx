"use client";

interface PaymentSummaryProps {
  totalPayment: number;
  totalAmount: number;
}

export function PaymentSummary({ totalPayment, totalAmount }: PaymentSummaryProps) {
  if (totalPayment === 0) return null;

  const remaining = totalAmount - totalPayment;
  const overpay = totalPayment - totalAmount;

  return (
    <div className="p-3 bg-blue-50 rounded-lg border border-blue-200 text-sm">
      <div className="flex justify-between font-semibold text-blue-900">
        <span>Total Payment:</span>
        <span>Rp {totalPayment.toLocaleString("id-ID")}</span>
      </div>
      {remaining > 0 && (
        <div className="flex justify-between text-orange-600 text-xs font-medium">
          <span>Remaining:</span>
          <span>Rp {remaining.toLocaleString("id-ID")}</span>
        </div>
      )}
      {overpay > 0 && (
        <div className="flex justify-between text-red-600 text-xs font-medium">
          <span>Overpay:</span>
          <span>Rp {overpay.toLocaleString("id-ID")}</span>
        </div>
      )}
    </div>
  );
}
