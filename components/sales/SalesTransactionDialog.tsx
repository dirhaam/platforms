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
    paymentMethod: SalesPaymentMethod.CASH,
    paymentAmount: 0, // Initial payment (untuk split payment)
    paymentReference: "",
    notes: "",
  });

  const [newTransactionFromBooking, setNewTransactionFromBooking] = useState({
    bookingId: "",
    customerId: "",
    serviceId: "",
    scheduledAt: "",
    isHomeVisit: false,
    totalAmount: 0,
    paymentMethod: SalesPaymentMethod.CASH,
    paymentAmount: 0,
    paymentReference: "",
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
        paymentMethod: SalesPaymentMethod.CASH,
        paymentAmount: 0,
        paymentReference: "",
        notes: "",
      });
      setNewTransactionFromBooking({
        bookingId: "",
        customerId: "",
        serviceId: "",
        scheduledAt: "",
        isHomeVisit: false,
        totalAmount: 0,
        paymentMethod: SalesPaymentMethod.CASH,
        paymentAmount: 0,
        paymentReference: "",
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

      const requestBody =
        transactionType === "on_the_spot"
          ? {
              type: "on_the_spot",
              customerId: newOnTheSpotTransaction.customerId,
              items: newOnTheSpotTransaction.items,
              totalAmount: calculateOnTheSpotTotal(),
              paymentAmount: newOnTheSpotTransaction.paymentAmount,
              paymentMethod: newOnTheSpotTransaction.paymentMethod,
              paymentReference: newOnTheSpotTransaction.paymentReference,
              notes: newOnTheSpotTransaction.notes,
              tenantId,
            }
          : {
              type: "from_booking",
              bookingId: newTransactionFromBooking.bookingId,
              customerId: newTransactionFromBooking.customerId,
              totalAmount: newTransactionFromBooking.totalAmount,
              paymentAmount: newTransactionFromBooking.paymentAmount,
              paymentMethod: newTransactionFromBooking.paymentMethod,
              paymentReference: newTransactionFromBooking.paymentReference,
              notes: newTransactionFromBooking.notes,
              tenantId,
            };

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
          paymentMethod: SalesPaymentMethod.CASH,
          paymentAmount: 0,
          paymentReference: "",
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
          paymentMethod: SalesPaymentMethod.CASH,
          paymentAmount: 0,
          paymentReference: "",
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

  const canSubmit = useMemo(() => {
    if (transactionType === "on_the_spot") {
      const hasValidItems = newOnTheSpotTransaction.items.length > 0;
      const totalAmount = calculateOnTheSpotTotal();
      const hasPayment = newOnTheSpotTransaction.paymentAmount > 0;
      return (
        newOnTheSpotTransaction.customerId !== "" &&
        hasValidItems &&
        totalAmount > 0 &&
        hasPayment
      );
    }

    return (
      newTransactionFromBooking.bookingId !== "" &&
      newTransactionFromBooking.totalAmount > 0 &&
      newTransactionFromBooking.paymentAmount > 0
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
        <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create New Transaction</DialogTitle>
          <DialogDescription>
            Choose transaction type and enter details below.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {transactionTypeOptions && (
            <div className="grid gap-2">
              <Label>Transaction Type</Label>
              <Select
                value={transactionType}
                onValueChange={(value) =>
                  setTransactionType(value as TransactionType)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select transaction type" />
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
            <>
              <div className="grid gap-2">
                <div className="flex justify-between items-center">
                  <Label htmlFor="customerId">Customer *</Label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowNewCustomerDialog(true)}
                    className="h-8 w-8 p-0"
                  >
                    <Plus className="w-4 h-4" />
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
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-sm">Services</CardTitle>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addItem}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Service
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {newOnTheSpotTransaction.items.length === 0 ? (
                    <p className="text-sm text-gray-500">No services added yet</p>
                  ) : (
                    newOnTheSpotTransaction.items.map((item, index) => (
                      <div key={index} className="grid grid-cols-12 gap-2 items-end border-b pb-3">
                        <div className="col-span-5">
                          <Label className="text-xs">Service</Label>
                          <Select
                            value={item.serviceId}
                            onValueChange={(value) => {
                              updateItem(index, "serviceId", value);
                              // Auto-populate unit price
                              const price = getServicePrice(value);
                              updateItem(index, "unitPrice", price);
                            }}
                          >
                            <SelectTrigger className="h-8">
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
                            className="h-8"
                          />
                        </div>
                        <div className="col-span-3">
                          <Label className="text-xs">Price</Label>
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.unitPrice}
                            onChange={(e) =>
                              updateItem(index, "unitPrice", parseFloat(e.target.value) || 0)
                            }
                            className="h-8"
                          />
                        </div>
                        <div className="col-span-2 text-right">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeItem(index)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>

              {/* Totals */}
              {newOnTheSpotTransaction.items.length > 0 && (
                <div className="grid gap-2 p-3 bg-gray-50 rounded-lg text-sm">
                  <div className="flex justify-between font-semibold">
                    <span>Total Amount:</span>
                    <span>Rp {calculateOnTheSpotTotal().toLocaleString("id-ID")}</span>
                  </div>
                </div>
              )}

              {/* Split Payment Section */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Payment Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid gap-2">
                    <Label htmlFor="paymentMethod">Payment Method *</Label>
                    <Select
                      value={newOnTheSpotTransaction.paymentMethod}
                      onValueChange={(value) =>
                        setNewOnTheSpotTransaction((prev) => ({
                          ...prev,
                          paymentMethod: value as SalesPaymentMethod,
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select payment method" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={SalesPaymentMethod.CASH}>Cash</SelectItem>
                        <SelectItem value={SalesPaymentMethod.CARD}>Card</SelectItem>
                        <SelectItem value={SalesPaymentMethod.TRANSFER}>
                          Transfer
                        </SelectItem>
                        <SelectItem value={SalesPaymentMethod.QRIS}>QRIS</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="paymentAmount">Payment Amount (Rp) *</Label>
                    <Input
                      id="paymentAmount"
                      type="number"
                      min="0"
                      step="0.01"
                      value={newOnTheSpotTransaction.paymentAmount}
                      onChange={(e) =>
                        setNewOnTheSpotTransaction((prev) => ({
                          ...prev,
                          paymentAmount: parseFloat(e.target.value) || 0,
                        }))
                      }
                      placeholder="Amount received"
                    />
                    {newOnTheSpotTransaction.paymentAmount > 0 &&
                      newOnTheSpotTransaction.paymentAmount < calculateOnTheSpotTotal() && (
                        <p className="text-xs text-orange-600">
                          Remaining: Rp{" "}
                          {(
                            calculateOnTheSpotTotal() -
                            newOnTheSpotTransaction.paymentAmount
                          ).toLocaleString("id-ID")}
                        </p>
                      )}
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="paymentReference">Payment Reference (Optional)</Label>
                    <Input
                      id="paymentReference"
                      value={newOnTheSpotTransaction.paymentReference}
                      onChange={(e) =>
                        setNewOnTheSpotTransaction((prev) => ({
                          ...prev,
                          paymentReference: e.target.value,
                        }))
                      }
                      placeholder="Receipt/Transaction ID"
                    />
                  </div>
                </CardContent>
              </Card>

              <div className="grid gap-2">
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
            </>
          )}

          {transactionType === "from_booking" && (
            <>
              <div className="grid gap-2">
                <Label htmlFor="bookingId">Booking</Label>
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

              <div className="grid gap-2">
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

              <div className="grid gap-2">
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
                  placeholder="Enter total service amount"
                />
              </div>

              {/* Split Payment Section */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Payment Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid gap-2">
                    <Label htmlFor="paymentMethod">Payment Method *</Label>
                    <Select
                      value={newTransactionFromBooking.paymentMethod}
                      onValueChange={(value) =>
                        setNewTransactionFromBooking((prev) => ({
                          ...prev,
                          paymentMethod: value as SalesPaymentMethod,
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select payment method" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={SalesPaymentMethod.CASH}>Cash</SelectItem>
                        <SelectItem value={SalesPaymentMethod.CARD}>Card</SelectItem>
                        <SelectItem value={SalesPaymentMethod.TRANSFER}>
                          Transfer
                        </SelectItem>
                        <SelectItem value={SalesPaymentMethod.QRIS}>QRIS</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="bookingPaymentAmount">Payment Amount (Rp) *</Label>
                    <Input
                      id="bookingPaymentAmount"
                      type="number"
                      min="0"
                      step="0.01"
                      value={newTransactionFromBooking.paymentAmount}
                      onChange={(e) =>
                        setNewTransactionFromBooking((prev) => ({
                          ...prev,
                          paymentAmount: parseFloat(e.target.value) || 0,
                        }))
                      }
                      placeholder="Amount received"
                    />
                    {newTransactionFromBooking.paymentAmount > 0 &&
                      newTransactionFromBooking.paymentAmount <
                        newTransactionFromBooking.totalAmount && (
                        <p className="text-xs text-orange-600">
                          Remaining: Rp{" "}
                          {(
                            newTransactionFromBooking.totalAmount -
                            newTransactionFromBooking.paymentAmount
                          ).toLocaleString("id-ID")}
                        </p>
                      )}
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="bookingPaymentReference">Payment Reference (Optional)</Label>
                    <Input
                      id="bookingPaymentReference"
                      value={newTransactionFromBooking.paymentReference}
                      onChange={(e) =>
                        setNewTransactionFromBooking((prev) => ({
                          ...prev,
                          paymentReference: e.target.value,
                        }))
                      }
                      placeholder="Receipt/Transaction ID"
                    />
                  </div>
                </CardContent>
              </Card>

              <div className="grid gap-2">
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
                />
              </div>
            </>
          )}
        </div>

        <DialogFooter>
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
