'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BookOpen } from 'lucide-react';
import { BookingManagement } from '@/components/booking/BookingManagement';
import { Service, Customer } from '@/types/booking';

export default function BookingsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const subdomain = searchParams.get('subdomain');
  
  const [services, setServices] = useState<Service[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!subdomain) {
      router.push('/tenant/login');
      return;
    }

    fetchTenantData();
  }, [subdomain, router]);

  const fetchTenantData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [servicesRes, customersRes] = await Promise.all([
        fetch('/api/services', {
          headers: {
            'x-tenant-id': subdomain!
          }
        }),
        fetch('/api/customers', {
          headers: {
            'x-tenant-id': subdomain!
          }
        })
      ]);

      if (!servicesRes.ok || !customersRes.ok) {
        throw new Error('Failed to fetch tenant data');
      }

      const servicesData = await servicesRes.json();
      const customersData = await customersRes.json();

      setServices(servicesData.services || []);
      setCustomers(customersData.customers || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Error fetching tenant data:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!subdomain) {
    return null;
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Bookings</h1>
          <p className="text-gray-600 mt-2">Manage customer bookings and appointments</p>
        </div>
        <Card>
          <CardContent className="pt-6">
            <p className="text-gray-600">Loading...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Bookings</h1>
          <p className="text-gray-600 mt-2">Manage customer bookings and appointments</p>
        </div>
        <Card>
          <CardContent className="pt-6">
            <p className="text-red-600">Error: {error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Bookings</h1>
        <p className="text-gray-600 mt-2">Manage customer bookings and appointments</p>
      </div>

      <BookingManagement
        tenantId={subdomain}
        services={services}
        customers={customers}
        onBookingCreate={async (booking) => {
          await fetchTenantData();
        }}
        onBookingUpdate={async (bookingId, updates) => {
          await fetchTenantData();
        }}
        onBookingDelete={async (bookingId) => {
          await fetchTenantData();
        }}
      />
    </div>
  );
}
