"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { NewCustomerForm } from "@/components/forms/NewCustomerForm";
import { SalesPaymentMethod } from "@/types/sales";
import { Plus } from "lucide-react";
import { toast } from "sonner";

import {
  SalesTransactionDialogProps,
  TransactionType,
  TransactionItem,
  PaymentEntry,
  OnTheSpotTransaction,
  FromBookingTransaction,
  DEFAULT_ALLOWED_TYPES,
  DEFAULT_ON_THE_SPOT,
  DEFAULT_FROM_BOOKING,
} from "./types";
import { useTransactionData, useTransactionCalculations } from "./hooks";
import {
  ServiceItemsForm,
  PaymentEntriesForm,
  AmountBreakdown,
  PaymentSummary,
} from "./components";

export function SalesTransactionDialog({
  open,
  onOpenChange,
  tenantId,
  subdomain,
  allowedTypes = DEFAULT_ALLOWED_TYPES,
  defaultType = "on_the_spot",
  onCreated,
  onError,
}: SalesTransactionDialogProps) {
  const [transactionType, setTransactionType] = useState<TransactionType>(() =>
    allowedTypes.includes(defaultType) ? defaultType : allowedTypes[0]
  );
  const [submitting, setSubmitting] = useState(false);
  const [showNewCustomerDialog, setShowNewCustomerDialog] = useState(false);

  const [onTheSpotTx, setOnTheSpotTx] = useState<OnTheSpotTransaction>(DEFAULT_ON_THE_SPOT);
  const [fromBookingTx, setFromBookingTx] = useState<FromBookingTransaction>(DEFAULT_FROM_BOOKING);

  const shouldFetchBookings = useMemo(
    () => allowedTypes.includes("from_booking"),
    [allowedTypes]
  );

  const {
    customers,
    services,
    bookings,
    invoiceSettings,
    loadingData,
    loadData,
    addCustomer,
    getServicePrice,
  } = useTransactionData(tenantId, shouldFetchBookings);

  const {
    subtotal,
    taxAmount,
    serviceChargeAmount,
    totalAmount,
    calculateTotalPayment,
  } = useTransactionCalculations(onTheSpotTx.items, invoiceSettings);

  useEffect(() => {
    if (!allowedTypes.includes(transactionType)) {
      setTransactionType(allowedTypes[0]);
    }
  }, [allowedTypes, transactionType]);

  const handleError = useCallback(
    (message: string) => {
      if (onError) {
        onError(message);
      } else {
        toast.error(message);
      }
    },
    [onError]
  );

  useEffect(() => {
    if (open) {
      loadData();
    }
  }, [open, loadData]);

  useEffect(() => {
    if (!open) {
      setOnTheSpotTx(DEFAULT_ON_THE_SPOT);
      setFromBookingTx(DEFAULT_FROM_BOOKING);
      setShowNewCustomerDialog(false);
    }
  }, [open]);

  const handleCreateTransaction = useCallback(async () => {
    if (!tenantId) return;

    try {
      setSubmitting(true);
      onError?.(null);

      if (transactionType === "on_the_spot") {
        if (!onTheSpotTx.customerId) throw new Error("Please select a customer");
        if (!onTheSpotTx.items.length) throw new Error("Please add at least one service item");
        if (totalAmount <= 0) throw new Error("Total amount must be greater than 0");
        if (!onTheSpotTx.payments.length) throw new Error("Please add at least one payment method");
        const totalPayment = calculateTotalPayment(onTheSpotTx.payments);
        if (totalPayment <= 0) throw new Error("Total payment amount must be greater than 0");
        if (totalPayment > totalAmount) throw new Error("Total payment cannot exceed service total amount");
      }

      if (transactionType === "from_booking") {
        if (!fromBookingTx.bookingId) throw new Error("Please select a booking");
        if (!fromBookingTx.customerId) throw new Error("Please select a customer");
        if (fromBookingTx.totalAmount <= 0) throw new Error("Total amount must be greater than 0");
        if (!fromBookingTx.payments.length) throw new Error("Please add at least one payment method");
        const totalPayment = calculateTotalPayment(fromBookingTx.payments);
        if (totalPayment <= 0) throw new Error("Total payment amount must be greater than 0");
        if (totalPayment > fromBookingTx.totalAmount) throw new Error("Total payment cannot exceed service total amount");
      }

      const requestBody =
        transactionType === "on_the_spot"
          ? {
              type: "on_the_spot",
              customerId: onTheSpotTx.customerId,
              items: onTheSpotTx.items,
              totalAmount,
              paymentAmount: calculateTotalPayment(onTheSpotTx.payments),
              payments: onTheSpotTx.payments,
              notes: onTheSpotTx.notes,
              tenantId,
            }
          : {
              type: "from_booking",
              bookingId: fromBookingTx.bookingId,
              customerId: fromBookingTx.customerId,
              serviceId: fromBookingTx.serviceId,
              scheduledAt: fromBookingTx.scheduledAt,
              totalAmount: fromBookingTx.totalAmount,
              paymentAmount: calculateTotalPayment(fromBookingTx.payments),
              payments: fromBookingTx.payments,
              notes: fromBookingTx.notes,
              tenantId,
            };

      const response = await fetch("/api/sales/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.error || "Failed to create transaction");
      }

      const data = await response.json();
      onOpenChange(false);
      setOnTheSpotTx(DEFAULT_ON_THE_SPOT);
      setFromBookingTx(DEFAULT_FROM_BOOKING);
      await onCreated?.(data.transaction);
    } catch (error) {
      console.error("Error creating transaction:", error);
      handleError(error instanceof Error ? error.message : "Failed to create transaction");
    } finally {
      setSubmitting(false);
    }
  }, [tenantId, transactionType, onTheSpotTx, fromBookingTx, totalAmount, onOpenChange, onCreated, handleError, calculateTotalPayment, onError]);

  // Item handlers
  const addItem = () => {
    setOnTheSpotTx((prev) => ({
      ...prev,
      items: [...prev.items, { serviceId: "", quantity: 1, unitPrice: 0 }],
    }));
  };

  const removeItem = (index: number) => {
    setOnTheSpotTx((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }));
  };

  const updateItem = (index: number, field: keyof TransactionItem, value: any) => {
    setOnTheSpotTx((prev) => {
      const items = [...prev.items];
      items[index] = { ...items[index], [field]: value };
      return { ...prev, items };
    });
  };

  // Payment handlers for on-the-spot
  const addPayment = () => {
    setOnTheSpotTx((prev) => ({
      ...prev,
      payments: [...prev.payments, { method: SalesPaymentMethod.CASH, amount: 0 }],
    }));
  };

  const removePayment = (index: number) => {
    setOnTheSpotTx((prev) => ({
      ...prev,
      payments: prev.payments.filter((_, i) => i !== index),
    }));
  };

  const updatePayment = (index: number, field: keyof PaymentEntry, value: any) => {
    setOnTheSpotTx((prev) => {
      const payments = [...prev.payments];
      payments[index] = { ...payments[index], [field]: value };
      return { ...prev, payments };
    });
  };

  // Payment handlers for from-booking
  const addPaymentFromBooking = () => {
    setFromBookingTx((prev) => ({
      ...prev,
      payments: [...prev.payments, { method: SalesPaymentMethod.CASH, amount: 0 }],
    }));
  };

  const removePaymentFromBooking = (index: number) => {
    setFromBookingTx((prev) => ({
      ...prev,
      payments: prev.payments.filter((_, i) => i !== index),
    }));
  };

  const updatePaymentFromBooking = (index: number, field: keyof PaymentEntry, value: any) => {
    setFromBookingTx((prev) => {
      const payments = [...prev.payments];
      payments[index] = { ...payments[index], [field]: value };
      return { ...prev, payments };
    });
  };

  const canSubmit = useMemo(() => {
    if (transactionType === "on_the_spot") {
      const hasItems = onTheSpotTx.items.length > 0;
      const totalPayment = calculateTotalPayment(onTheSpotTx.payments);
      const hasPayments = onTheSpotTx.payments.length > 0 && totalPayment > 0;
      return onTheSpotTx.customerId !== "" && hasItems && totalAmount > 0 && hasPayments;
    }
    const totalPayment = calculateTotalPayment(fromBookingTx.payments);
    const hasPayments = fromBookingTx.payments.length > 0 && totalPayment > 0;
    return fromBookingTx.bookingId !== "" && fromBookingTx.totalAmount > 0 && hasPayments;
  }, [transactionType, onTheSpotTx, fromBookingTx, totalAmount, calculateTotalPayment]);

  const transactionTypeOptions = allowedTypes.length > 1;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="w-[95vw] max-w-2xl max-h-[95vh] overflow-y-auto p-4 sm:p-6">
          <DialogHeader className="mb-6">
            <DialogTitle>Create New Transaction</DialogTitle>
            <DialogDescription>Enter transaction details below</DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {transactionTypeOptions && (
              <div className="space-y-2">
                <Label>Transaction Type</Label>
                <Select
                  value={transactionType}
                  onValueChange={(value) => setTransactionType(value as TransactionType)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {allowedTypes.includes("on_the_spot") && (
                      <SelectItem value="on_the_spot">On-the-Spot Transaction</SelectItem>
                    )}
                    {allowedTypes.includes("from_booking") && (
                      <SelectItem value="from_booking">From Booking</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
            )}

            {transactionType === "on_the_spot" && (
              <div className="space-y-6">
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <Label htmlFor="customerId">Customer *</Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setShowNewCustomerDialog(true)}
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      New Customer
                    </Button>
                  </div>
                  <Select
                    value={onTheSpotTx.customerId}
                    onValueChange={(value) =>
                      setOnTheSpotTx((prev) => ({ ...prev, customerId: value }))
                    }
                    disabled={loadingData}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select customer" />
                    </SelectTrigger>
                    <SelectContent>
                      {customers.map((customer) => (
                        <SelectItem key={customer.id} value={customer.id}>
                          {customer.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <ServiceItemsForm
                  items={onTheSpotTx.items}
                  services={services}
                  onAddItem={addItem}
                  onRemoveItem={removeItem}
                  onUpdateItem={updateItem}
                  getServicePrice={getServicePrice}
                />

                {onTheSpotTx.items.length > 0 && (
                  <AmountBreakdown
                    subtotal={subtotal}
                    taxAmount={taxAmount}
                    serviceChargeAmount={serviceChargeAmount}
                    totalAmount={totalAmount}
                    invoiceSettings={invoiceSettings}
                  />
                )}

                <PaymentEntriesForm
                  payments={onTheSpotTx.payments}
                  onAddPayment={addPayment}
                  onRemovePayment={removePayment}
                  onUpdatePayment={updatePayment}
                />

                {onTheSpotTx.payments.length > 0 && (
                  <PaymentSummary
                    totalPayment={calculateTotalPayment(onTheSpotTx.payments)}
                    totalAmount={totalAmount}
                  />
                )}

                <div className="space-y-2">
                  <Label htmlFor="notes">Notes (Optional)</Label>
                  <Textarea
                    id="notes"
                    value={onTheSpotTx.notes}
                    onChange={(e) =>
                      setOnTheSpotTx((prev) => ({ ...prev, notes: e.target.value }))
                    }
                    placeholder="Add any notes..."
                    rows={3}
                  />
                </div>
              </div>
            )}

            {transactionType === "from_booking" && (
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="bookingId">Booking *</Label>
                  <Select
                    value={fromBookingTx.bookingId}
                    onValueChange={(value) =>
                      setFromBookingTx((prev) => ({ ...prev, bookingId: value }))
                    }
                    disabled={loadingData}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select booking" />
                    </SelectTrigger>
                    <SelectContent>
                      {bookings.map((booking) => (
                        <SelectItem key={booking.id} value={booking.id}>
                          {(booking.customer?.name || "Unknown") +
                            " - " +
                            (booking.service?.name || "Unknown Service")}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="scheduledAt">Scheduled Date</Label>
                  <Input
                    id="scheduledAt"
                    type="datetime-local"
                    value={fromBookingTx.scheduledAt}
                    onChange={(e) =>
                      setFromBookingTx((prev) => ({ ...prev, scheduledAt: e.target.value }))
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="totalAmount">Total Amount (Rp) *</Label>
                  <Input
                    id="totalAmount"
                    type="number"
                    min="0"
                    step="0.01"
                    value={fromBookingTx.totalAmount}
                    onChange={(e) =>
                      setFromBookingTx((prev) => ({
                        ...prev,
                        totalAmount: parseFloat(e.target.value) || 0,
                      }))
                    }
                    placeholder="0"
                  />
                </div>

                <PaymentEntriesForm
                  payments={fromBookingTx.payments}
                  onAddPayment={addPaymentFromBooking}
                  onRemovePayment={removePaymentFromBooking}
                  onUpdatePayment={updatePaymentFromBooking}
                />

                {fromBookingTx.payments.length > 0 && (
                  <PaymentSummary
                    totalPayment={calculateTotalPayment(fromBookingTx.payments)}
                    totalAmount={fromBookingTx.totalAmount}
                  />
                )}

                <div className="space-y-2">
                  <Label htmlFor="notes">Notes (Optional)</Label>
                  <Textarea
                    id="notes"
                    value={fromBookingTx.notes}
                    onChange={(e) =>
                      setFromBookingTx((prev) => ({ ...prev, notes: e.target.value }))
                    }
                    placeholder="Add any notes..."
                    rows={3}
                  />
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleCreateTransaction}
              disabled={!canSubmit || submitting || loadingData}
            >
              {submitting ? "Creating..." : "Create Transaction"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showNewCustomerDialog} onOpenChange={setShowNewCustomerDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add New Customer</DialogTitle>
            <DialogDescription>
              Create a new customer and add them to the system.
            </DialogDescription>
          </DialogHeader>
          <NewCustomerForm
            subdomain={subdomain || ""}
            tenantId={tenantId}
            compact
            onSuccess={(customer) => {
              addCustomer(customer);
              setOnTheSpotTx((prev) => ({ ...prev, customerId: customer.id }));
              setShowNewCustomerDialog(false);
            }}
            onCancel={() => setShowNewCustomerDialog(false)}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
