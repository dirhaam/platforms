"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Trash2 } from "lucide-react";
import { SalesPaymentMethod } from "@/types/sales";
import { PaymentEntry } from "../types";

interface PaymentEntriesFormProps {
  payments: PaymentEntry[];
  onAddPayment: () => void;
  onRemovePayment: (index: number) => void;
  onUpdatePayment: (index: number, field: keyof PaymentEntry, value: any) => void;
}

export function PaymentEntriesForm({
  payments,
  onAddPayment,
  onRemovePayment,
  onUpdatePayment,
}: PaymentEntriesFormProps) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <Label>Payment Methods *</Label>
        <Button type="button" variant="outline" size="sm" onClick={onAddPayment}>
          <Plus className="h-4 w-4 mr-1" />
          Add Payment
        </Button>
      </div>
      <div className="space-y-3 p-3 border rounded-md bg-gray-50">
        {payments.length === 0 ? (
          <p className="text-sm text-gray-500">
            No payments added. Click "Add Payment" to add.
          </p>
        ) : (
          payments.map((payment, index) => (
            <div
              key={index}
              className="grid grid-cols-12 gap-1 sm:gap-2 items-end border-b pb-2 sm:pb-3 last:border-b-0"
            >
              <div className="col-span-5 sm:col-span-6">
                <Label className="text-xs">Method</Label>
                <Select
                  value={payment.method}
                  onValueChange={(value) =>
                    onUpdatePayment(index, "method", value as SalesPaymentMethod)
                  }
                >
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={SalesPaymentMethod.CASH}>Cash</SelectItem>
                    <SelectItem value={SalesPaymentMethod.CARD}>Card</SelectItem>
                    <SelectItem value={SalesPaymentMethod.TRANSFER}>Transfer</SelectItem>
                    <SelectItem value={SalesPaymentMethod.QRIS}>QRIS</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-6 sm:col-span-5">
                <Label className="text-xs">Amount (Rp)</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={payment.amount}
                  onChange={(e) =>
                    onUpdatePayment(index, "amount", parseFloat(e.target.value) || 0)
                  }
                  className="h-8 text-xs"
                />
              </div>
              <div className="col-span-1 text-center">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => onRemovePayment(index)}
                  className="h-8 w-8 p-0"
                >
                  <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                </Button>
              </div>
              {payment.reference && (
                <div className="col-span-12">
                  <Label className="text-xs">Reference</Label>
                  <Input
                    type="text"
                    value={payment.reference}
                    onChange={(e) =>
                      onUpdatePayment(index, "reference", e.target.value)
                    }
                    placeholder="Receipt/Transaction ID (Optional)"
                    className="h-8"
                  />
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
