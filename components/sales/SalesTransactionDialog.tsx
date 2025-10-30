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
import {
  SalesPaymentMethod,
  SalesTransaction,
} from "@/types/sales";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type TransactionType = "on_the_spot" | "from_booking";

interface TransactionItem {
  serviceId: string;
  quantity: number;
  unitPrice: number;
}

interface PaymentEntry {
  method: SalesPaymentMethod;
  amount: number;
  reference?: string;
}

interface SalesTransactionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tenantId: string;
  subdomain?: string;
  allowedTypes?: TransactionType[];
  defaultType?: TransactionType;
  onCreated?: (transaction: SalesTransaction) => Promise<void> | void;
  onError?: (message: string | null) => void;
}

const DEFAULT_ALLOWED_TYPES: TransactionType[] = ["on_the_spot", "from_booking"];

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
  const [customers, setCustomers] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [loadingData, setLoadingData] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showNewCustomerDialog, setShowNewCustomerDialog] = useState(false);

  const [newOnTheSpotTransaction, setNewOnTheSpotTransaction] = useState({
    customerId: "",
    items: [] as TransactionItem[],
    totalAmount: 0,
    payments: [] as PaymentEntry[], // Multiple payment methods
    notes: "",
  });

  const [newTransactionFromBooking, setNewTransactionFromBooking] = useState({
    bookingId: "",
    customerId: "",
    serviceId: "",
    scheduledAt: "",
    isHomeVisit: false,
    totalAmount: 0,
    payments: [] as PaymentEntry[], // Multiple payment methods
    notes: "",
  });

  useEffect(() => {
    if (!allowedTypes.includes(transactionType)) {
      setTransactionType(allowedTypes[0]);
    }
  }, [allowedTypes, transactionType]);

  const shouldFetchBookings = useMemo(
    () => allowedTypes.includes("from_booking"),
    [allowedTypes]
  );

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

  const fetchCustomers = useCallback(async () => {
    if (!tenantId) return;
    const response = await fetch(`/api/customers?tenantId=${tenantId}`);
    if (!response.ok) {
      throw new Error("Failed to fetch customers");
    }
    const data = await response.json();
    setCustomers(data.customers || []);
  }, [tenantId]);

  const fetchServices = useCallback(async () => {
    if (!tenantId) return;
    const response = await fetch(`/api/services?tenantId=${tenantId}`);
    if (!response.ok) {
      throw new Error("Failed to fetch services");
    }
    const data = await response.json();
    setServices(data.services || []);
  }, [tenantId]);

  const fetchBookings = useCallback(async () => {
    if (!tenantId || !shouldFetchBookings) return;
    const response = await fetch(
      `/api/bookings?tenantId=${tenantId}&status=completed`
    );
    if (!response.ok) {
      throw new Error("Failed to fetch bookings");
    }
    const data = await response.json();
    setBookings(data.bookings || []);
  }, [tenantId, shouldFetchBookings]);

  const loadData = useCallback(async () => {
    if (!tenantId) return;
    setLoadingData(true);
    try {
      await Promise.all([
        fetchCustomers(),
        fetchServices(),
        fetchBookings(),
      ]);
    } catch (error) {
      console.error("Error loading transaction dialog data:", error);
      const message =
        error instanceof Error ? error.message : "Failed to load dialog data";
      toast.error(message);
    } finally {
      setLoadingData(false);
    }
  }, [tenantId, fetchCustomers, fetchServices, fetchBookings]);

  useEffect(() => {
    if (open) {
      loadData();
    }
  }, [open, loadData]);

  useEffect(() => {
    if (!open) {
      setNewOnTheSpotTransaction({
        customerId: "",
        items: [],
        totalAmount: 0,
        payments: [],
        notes: "",
      });
      setNewTransactionFromBooking({
        bookingId: "",
        customerId: "",
        serviceId: "",
        scheduledAt: "",
        isHomeVisit: false,
        totalAmount: 0,
        payments: [],
        notes: "",
      });
      setShowNewCustomerDialog(false);
    }
  }, [open]);

  const handleCreateTransaction = useCallback(async () => {
    if (!tenantId) return;

    try {
      setSubmitting(true);
      onError?.(null);

      // Validation for on-the-spot transactions
      if (transactionType === "on_the_spot") {
        if (!newOnTheSpotTransaction.customerId) {
          throw new Error("Please select a customer");
        }
        if (!newOnTheSpotTransaction.items || newOnTheSpotTransaction.items.length === 0) {
          throw new Error("Please add at least one service item");
        }
        const totalAmount = calculateOnTheSpotTotal();
        if (totalAmount <= 0) {
          throw new Error("Total amount must be greater than 0");
        }
        if (!newOnTheSpotTransaction.payments || newOnTheSpotTransaction.payments.length === 0) {
          throw new Error("Please add at least one payment method");
        }
        const totalPayment = calculateTotalPayment(newOnTheSpotTransaction.payments);
        if (totalPayment <= 0) {
          throw new Error("Total payment amount must be greater than 0");
        }
        if (totalPayment > totalAmount) {
          throw new Error("Total payment cannot exceed service total amount");
        }
      }

      // Validation for from-booking transactions
      if (transactionType === "from_booking") {
        if (!newTransactionFromBooking.bookingId) {
          throw new Error("Please select a booking");
        }
        if (!newTransactionFromBooking.customerId) {
          throw new Error("Please select a customer");
        }
        if (newTransactionFromBooking.totalAmount <= 0) {
          throw new Error("Total amount must be greater than 0");
        }
        if (!newTransactionFromBooking.payments || newTransactionFromBooking.payments.length === 0) {
          throw new Error("Please add at least one payment method");
        }
        const totalPayment = calculateTotalPayment(newTransactionFromBooking.payments);
        if (totalPayment <= 0) {
          throw new Error("Total payment amount must be greater than 0");
        }
        if (totalPayment > newTransactionFromBooking.totalAmount) {
          throw new Error("Total payment cannot exceed service total amount");
        }
      }

      const requestBody =
        transactionType === "on_the_spot"
          ? {
              type: "on_the_spot",
              customerId: newOnTheSpotTransaction.customerId,
              items: newOnTheSpotTransaction.items,
              totalAmount: calculateOnTheSpotTotal(),
              paymentAmount: calculateTotalPayment(newOnTheSpotTransaction.payments),
              payments: newOnTheSpotTransaction.payments,
              notes: newOnTheSpotTransaction.notes,
              tenantId,
            }
          : {
              type: "from_booking",
              bookingId: newTransactionFromBooking.bookingId,
              customerId: newTransactionFromBooking.customerId,
              serviceId: newTransactionFromBooking.serviceId,
              scheduledAt: newTransactionFromBooking.scheduledAt,
              totalAmount: newTransactionFromBooking.totalAmount,
              paymentAmount: calculateTotalPayment(newTransactionFromBooking.payments),
              payments: newTransactionFromBooking.payments,
              notes: newTransactionFromBooking.notes,
              tenantId,
            };

      console.log("[SalesDialog] Submitting transaction request with payments:", {
        paymentsCount: requestBody.payments?.length,
        payments: requestBody.payments,
        totalPayment: requestBody.paymentAmount,
      });

      const response = await fetch("/api/sales/transactions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.error || "Failed to create transaction");
      }

      const data = await response.json();

      onOpenChange(false);

      if (transactionType === "on_the_spot") {
        setNewOnTheSpotTransaction({
          customerId: "",
          items: [],
          totalAmount: 0,
          payments: [],
          notes: "",
        });
      } else {
        setNewTransactionFromBooking({
          bookingId: "",
          customerId: "",
          serviceId: "",
          scheduledAt: "",
          isHomeVisit: false,
          totalAmount: 0,
          payments: [],
          notes: "",
        });
      }

      await onCreated?.(data.transaction);
    } catch (error) {
      console.error("Error creating transaction:", error);
      handleError(
        error instanceof Error ? error.message : "Failed to create transaction"
      );
    } finally {
      setSubmitting(false);
    }
  }, [
    tenantId,
    transactionType,
    newOnTheSpotTransaction,
    newTransactionFromBooking,
    onOpenChange,
    onCreated,
    handleError,
  ]);

  const calculateOnTheSpotTotal = () => {
    return newOnTheSpotTransaction.items.reduce(
      (sum, item) => sum + item.quantity * item.unitPrice,
      0
    );
  };

  const calculateTotalPayment = (payments: PaymentEntry[]) => {
    return payments.reduce((sum, payment) => sum + payment.amount, 0);
  };

  const addPaymentEntry = () => {
    setNewOnTheSpotTransaction((prev) => ({
      ...prev,
      payments: [...prev.payments, { method: SalesPaymentMethod.CASH, amount: 0 }],
    }));
  };

  const removePaymentEntry = (index: number) => {
    setNewOnTheSpotTransaction((prev) => ({
      ...prev,
      payments: prev.payments.filter((_, i) => i !== index),
    }));
  };

  const updatePaymentEntry = (index: number, field: keyof PaymentEntry, value: any) => {
    setNewOnTheSpotTransaction((prev) => {
      const updatedPayments = [...prev.payments];
      updatedPayments[index] = { ...updatedPayments[index], [field]: value };
      return { ...prev, payments: updatedPayments };
    });
  };

  const addPaymentEntryFromBooking = () => {
    setNewTransactionFromBooking((prev) => ({
      ...prev,
      payments: [...prev.payments, { method: SalesPaymentMethod.CASH, amount: 0 }],
    }));
  };

  const removePaymentEntryFromBooking = (index: number) => {
    setNewTransactionFromBooking((prev) => ({
      ...prev,
      payments: prev.payments.filter((_, i) => i !== index),
    }));
  };

  const updatePaymentEntryFromBooking = (index: number, field: keyof PaymentEntry, value: any) => {
    setNewTransactionFromBooking((prev) => {
      const updatedPayments = [...prev.payments];
      updatedPayments[index] = { ...updatedPayments[index], [field]: value };
      return { ...prev, payments: updatedPayments };
    });
  };

  const canSubmit = useMemo(() => {
    if (transactionType === "on_the_spot") {
      const hasValidItems = newOnTheSpotTransaction.items.length > 0;
      const totalAmount = calculateOnTheSpotTotal();
      const totalPayment = calculateTotalPayment(newOnTheSpotTransaction.payments);
      const hasValidPayments = newOnTheSpotTransaction.payments.length > 0 && totalPayment > 0;
      return (
        newOnTheSpotTransaction.customerId !== "" &&
        hasValidItems &&
        totalAmount > 0 &&
        hasValidPayments
      );
    }

    const totalPaymentFromBooking = calculateTotalPayment(newTransactionFromBooking.payments);
    const hasValidPayments = newTransactionFromBooking.payments.length > 0 && totalPaymentFromBooking > 0;
    return (
      newTransactionFromBooking.bookingId !== "" &&
      newTransactionFromBooking.totalAmount > 0 &&
      hasValidPayments
    );
  }, [transactionType, newOnTheSpotTransaction, newTransactionFromBooking]);

  // Helper functions for managing items
  const addItem = () => {
    setNewOnTheSpotTransaction((prev) => ({
      ...prev,
      items: [...prev.items, { serviceId: "", quantity: 1, unitPrice: 0 }],
    }));
  };

  const removeItem = (index: number) => {
    setNewOnTheSpotTransaction((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }));
  };

  const updateItem = (
    index: number,
    field: keyof TransactionItem,
    value: any
  ) => {
    setNewOnTheSpotTransaction((prev) => {
      const updatedItems = [...prev.items];
      updatedItems[index] = { ...updatedItems[index], [field]: value };
      return { ...prev, items: updatedItems };
    });
  };

  const getServicePrice = (serviceId: string): number => {
    const service = services.find((s) => s.id === serviceId);
    return service?.price || 0;
  };

  const transactionTypeOptions = allowedTypes.length > 1;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="w-[95vw] max-w-2xl max-h-[95vh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader className="mb-6">
          <DialogTitle>Create New Transaction</DialogTitle>
          <DialogDescription>
            Enter transaction details below
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {transactionTypeOptions && (
            <div className="space-y-2">
              <Label>Transaction Type</Label>
              <Select
                value={transactionType}
                onValueChange={(value) =>
                  setTransactionType(value as TransactionType)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {allowedTypes.includes("on_the_spot") && (
                    <SelectItem value="on_the_spot">
                      On-the-Spot Transaction
                    </SelectItem>
                  )}
                  {allowedTypes.includes("from_booking") && (
                    <SelectItem value="from_booking">
                      From Booking
                    </SelectItem>
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
                  value={newOnTheSpotTransaction.customerId}
                  onValueChange={(value) =>
                    setNewOnTheSpotTransaction((prev) => ({
                      ...prev,
                      customerId: value,
                    }))
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

              {/* Services Items */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label>Services *</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addItem}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add Service
                  </Button>
                </div>
                <div className="space-y-3 p-3 border rounded-md bg-gray-50">
                  {newOnTheSpotTransaction.items.length === 0 ? (
                    <p className="text-sm text-gray-500">No services added yet</p>
                  ) : (
                    newOnTheSpotTransaction.items.map((item, index) => (
                      <div key={index} className="grid grid-cols-12 gap-1 sm:gap-2 items-end border-b pb-2 sm:pb-3">
                        <div className="col-span-6 sm:col-span-6">
                          <Label className="text-xs">Service</Label>
                          <Select
                            value={item.serviceId}
                            onValueChange={(value) => {
                              updateItem(index, "serviceId", value);
                              const price = getServicePrice(value);
                              updateItem(index, "unitPrice", price);
                            }}
                          >
                            <SelectTrigger className="h-8 text-xs">
                              <SelectValue placeholder="Select" />
                            </SelectTrigger>
                            <SelectContent>
                              {services.map((service) => (
                                <SelectItem key={service.id} value={service.id}>
                                  {service.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="col-span-2">
                          <Label className="text-xs">Qty</Label>
                          <Input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) =>
                              updateItem(index, "quantity", parseInt(e.target.value) || 1)
                            }
                            className="h-8 text-xs"
                          />
                        </div>
                        <div className="col-span-3 sm:col-span-3">
                          <Label className="text-xs">Price (Rp)</Label>
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.unitPrice}
                            onChange={(e) =>
                              updateItem(index, "unitPrice", parseFloat(e.target.value) || 0)
                            }
                            className="h-8 text-xs"
                          />
                        </div>
                        <div className="col-span-1 text-center">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeItem(index)}
                            className="h-8 w-8 p-0"
                          >
                            <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Totals */}
              {newOnTheSpotTransaction.items.length > 0 && (
                <div className="p-3 bg-gray-50 rounded-lg border text-sm">
                  <div className="flex justify-between font-semibold">
                    <span>Total Amount:</span>
                    <span>Rp {calculateOnTheSpotTotal().toLocaleString("id-ID")}</span>
                  </div>
                </div>
              )}

              {/* Multiple Payment Entries */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label>Payment Methods *</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addPaymentEntry}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add Payment
                  </Button>
                </div>
                <div className="space-y-3 p-3 border rounded-md bg-gray-50">
                  {newOnTheSpotTransaction.payments.length === 0 ? (
                    <p className="text-sm text-gray-500">No payments added. Click "Add Payment" to add.</p>
                  ) : (
                    newOnTheSpotTransaction.payments.map((payment, index) => (
                      <div key={index} className="grid grid-cols-12 gap-1 sm:gap-2 items-end border-b pb-2 sm:pb-3 last:border-b-0">
                        <div className="col-span-5 sm:col-span-6">
                          <Label className="text-xs">Method</Label>
                          <Select
                            value={payment.method}
                            onValueChange={(value) =>
                              updatePaymentEntry(index, "method", value as SalesPaymentMethod)
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
                              updatePaymentEntry(index, "amount", parseFloat(e.target.value) || 0)
                            }
                            className="h-8 text-xs"
                          />
                        </div>
                        <div className="col-span-1 text-center">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removePaymentEntry(index)}
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
                                updatePaymentEntry(index, "reference", e.target.value)
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

              {/* Total Payment Summary */}
              {newOnTheSpotTransaction.payments.length > 0 && (
                <div className="p-3 bg-blue-50 rounded-lg border border-blue-200 text-sm">
                  <div className="flex justify-between font-semibold text-blue-900">
                    <span>Total Payment:</span>
                    <span>Rp {calculateTotalPayment(newOnTheSpotTransaction.payments).toLocaleString("id-ID")}</span>
                  </div>
                  {calculateTotalPayment(newOnTheSpotTransaction.payments) < calculateOnTheSpotTotal() && (
                    <div className="flex justify-between text-orange-600 text-xs font-medium">
                      <span>Remaining:</span>
                      <span>Rp {(calculateOnTheSpotTotal() - calculateTotalPayment(newOnTheSpotTransaction.payments)).toLocaleString("id-ID")}</span>
                    </div>
                  )}
                  {calculateTotalPayment(newOnTheSpotTransaction.payments) > calculateOnTheSpotTotal() && (
                    <div className="flex justify-between text-red-600 text-xs font-medium">
                      <span>Overpay:</span>
                      <span>Rp {(calculateTotalPayment(newOnTheSpotTransaction.payments) - calculateOnTheSpotTotal()).toLocaleString("id-ID")}</span>
                    </div>
                  )}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="notes">Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  value={newOnTheSpotTransaction.notes}
                  onChange={(e) =>
                    setNewOnTheSpotTransaction((prev) => ({
                      ...prev,
                      notes: e.target.value,
                    }))
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
                  value={newTransactionFromBooking.bookingId}
                  onValueChange={(value) =>
                    setNewTransactionFromBooking((prev) => ({
                      ...prev,
                      bookingId: value,
                    }))
                  }
                  disabled={loadingData}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select booking" />
                  </SelectTrigger>
                  <SelectContent>
                    {bookings.map((booking) => (
                      <SelectItem key={booking.id} value={booking.id}>
                        {(booking.customer?.name || "Unknown") + " - " +
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
                  value={newTransactionFromBooking.scheduledAt}
                  onChange={(e) =>
                    setNewTransactionFromBooking((prev) => ({
                      ...prev,
                      scheduledAt: e.target.value,
                    }))
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
                  value={newTransactionFromBooking.totalAmount}
                  onChange={(e) =>
                    setNewTransactionFromBooking((prev) => ({
                      ...prev,
                      totalAmount: parseFloat(e.target.value) || 0,
                    }))
                  }
                  placeholder="0"
                />
              </div>

              {/* Multiple Payment Entries */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label>Payment Methods *</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addPaymentEntryFromBooking}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add Payment
                  </Button>
                </div>
                <div className="space-y-3 p-3 border rounded-md bg-gray-50">
                  {newTransactionFromBooking.payments.length === 0 ? (
                    <p className="text-sm text-gray-500">No payments added. Click "Add Payment" to add.</p>
                  ) : (
                    newTransactionFromBooking.payments.map((payment, index) => (
                      <div key={index} className="grid grid-cols-12 gap-1 sm:gap-2 items-end border-b pb-2 sm:pb-3 last:border-b-0">
                        <div className="col-span-5 sm:col-span-6">
                          <Label className="text-xs">Method</Label>
                          <Select
                            value={payment.method}
                            onValueChange={(value) =>
                              updatePaymentEntryFromBooking(index, "method", value as SalesPaymentMethod)
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
                              updatePaymentEntryFromBooking(index, "amount", parseFloat(e.target.value) || 0)
                            }
                            className="h-8 text-xs"
                          />
                        </div>
                        <div className="col-span-1 text-center">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removePaymentEntryFromBooking(index)}
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
                                updatePaymentEntryFromBooking(index, "reference", e.target.value)
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

              {/* Total Payment Summary */}
              {newTransactionFromBooking.payments.length > 0 && (
                <div className="p-3 bg-blue-50 rounded-lg border border-blue-200 text-sm">
                  <div className="flex justify-between font-semibold text-blue-900">
                    <span>Total Payment:</span>
                    <span>Rp {calculateTotalPayment(newTransactionFromBooking.payments).toLocaleString("id-ID")}</span>
                  </div>
                  {calculateTotalPayment(newTransactionFromBooking.payments) < newTransactionFromBooking.totalAmount && (
                    <div className="flex justify-between text-orange-600 text-xs font-medium">
                      <span>Remaining:</span>
                      <span>Rp {(newTransactionFromBooking.totalAmount - calculateTotalPayment(newTransactionFromBooking.payments)).toLocaleString("id-ID")}</span>
                    </div>
                  )}
                  {calculateTotalPayment(newTransactionFromBooking.payments) > newTransactionFromBooking.totalAmount && (
                    <div className="flex justify-between text-red-600 text-xs font-medium">
                      <span>Overpay:</span>
                      <span>Rp {(calculateTotalPayment(newTransactionFromBooking.payments) - newTransactionFromBooking.totalAmount).toLocaleString("id-ID")}</span>
                    </div>
                  )}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="notes">Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  value={newTransactionFromBooking.notes}
                  onChange={(e) =>
                    setNewTransactionFromBooking((prev) => ({
                      ...prev,
                      notes: e.target.value,
                    }))
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
              setCustomers((prev) => [customer, ...prev]);
              setNewOnTheSpotTransaction((prev) => ({
                ...prev,
                customerId: customer.id,
              }));
              setShowNewCustomerDialog(false);
            }}
            onCancel={() => setShowNewCustomerDialog(false)}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
