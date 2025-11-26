"use client";

import { useCallback, useState } from "react";
import type { InvoiceSettingsData } from "@/lib/invoice/invoice-settings-service";
import { toast } from "sonner";

interface Customer {
  id: string;
  name: string;
}

interface Service {
  id: string;
  name: string;
  price: number;
}

interface Booking {
  id: string;
  customer?: { name: string };
  service?: { name: string };
}

export function useTransactionData(tenantId: string, shouldFetchBookings: boolean) {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [invoiceSettings, setInvoiceSettings] = useState<InvoiceSettingsData | null>(null);
  const [loadingData, setLoadingData] = useState(false);

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

  const fetchInvoiceSettings = useCallback(async () => {
    if (!tenantId) return;
    try {
      const response = await fetch(`/api/settings/invoice-config?tenantId=${tenantId}`);
      if (!response.ok) {
        console.warn("Failed to fetch invoice settings");
        return;
      }
      const data = await response.json();
      setInvoiceSettings(data.settings || null);
    } catch (error) {
      console.warn("Error fetching invoice settings:", error);
    }
  }, [tenantId]);

  const loadData = useCallback(async () => {
    if (!tenantId) return;
    setLoadingData(true);
    try {
      await Promise.all([
        fetchCustomers(),
        fetchServices(),
        fetchBookings(),
        fetchInvoiceSettings(),
      ]);
    } catch (error) {
      console.error("Error loading transaction dialog data:", error);
      const message =
        error instanceof Error ? error.message : "Failed to load dialog data";
      toast.error(message);
    } finally {
      setLoadingData(false);
    }
  }, [tenantId, fetchCustomers, fetchServices, fetchBookings, fetchInvoiceSettings]);

  const addCustomer = useCallback((customer: Customer) => {
    setCustomers((prev) => [customer, ...prev]);
  }, []);

  const getServicePrice = useCallback((serviceId: string): number => {
    const service = services.find((s) => s.id === serviceId);
    return service?.price || 0;
  }, [services]);

  return {
    customers,
    services,
    bookings,
    invoiceSettings,
    loadingData,
    loadData,
    addCustomer,
    getServicePrice,
  };
}
