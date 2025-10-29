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
import { Plus } from "lucide-react";
import { toast } from "sonner";

type TransactionType = "on_the_spot" | "from_booking";

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
    serviceId: "",
    paymentMethod: SalesPaymentMethod.CASH,
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
        serviceId: "",
        paymentMethod: SalesPaymentMethod.CASH,
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
              ...newOnTheSpotTransaction,
              tenantId,
            }
          : {
              type: "from_booking",
              ...newTransactionFromBooking,
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
          serviceId: "",
          paymentMethod: SalesPaymentMethod.CASH,
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

  const canSubmit = useMemo(() => {
    if (transactionType === "on_the_spot") {
      return (
        newOnTheSpotTransaction.customerId !== "" &&
        newOnTheSpotTransaction.serviceId !== ""
      );
    }

    return (
      newTransactionFromBooking.bookingId !== "" &&
      newTransactionFromBooking.totalAmount > 0
    );
  }, [transactionType, newOnTheSpotTransaction, newTransactionFromBooking]);

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
                  <Label htmlFor="customerId">Customer</Label>
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

              <div className="grid gap-2">
                <Label htmlFor="serviceId">Service</Label>
                <Select
                  value={newOnTheSpotTransaction.serviceId}
                  onValueChange={(value) =>
                    setNewOnTheSpotTransaction((prev) => ({
                      ...prev,
                      serviceId: value,
                    }))
                  }
                  disabled={loadingData}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select service" />
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

              <div className="grid gap-2">
                <Label htmlFor="paymentMethod">Payment Method</Label>
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
                <Label htmlFor="totalAmount">Total Amount</Label>
                <Input
                  id="totalAmount"
                  type="number"
                  min="0"
                  value={newTransactionFromBooking.totalAmount}
                  onChange={(e) =>
                    setNewTransactionFromBooking((prev) => ({
                      ...prev,
                      totalAmount: parseFloat(e.target.value) || 0,
                    }))
                  }
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="paymentMethod">Payment Method</Label>
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
