'use client';

import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';

interface PendingBookingsBadgeProps {
  tenantId: string;
  subdomain: string;
}

export function PendingBookingsBadge({ tenantId, subdomain }: PendingBookingsBadgeProps) {
  const [pendingCount, setPendingCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!tenantId || !subdomain) {
      setLoading(false);
      return;
    }

    const fetchPendingCount = async () => {
      try {
        setLoading(true);
        const response = await fetch(
          `/api/bookings?tenantId=${encodeURIComponent(tenantId)}&status=pending`,
          {
            headers: { 'x-tenant-id': tenantId }
          }
        );

        if (!response.ok) {
          console.warn('Failed to fetch pending bookings count');
          setLoading(false);
          return;
        }

        const data = await response.json();
        const bookings = data.bookings || [];
        const pending = bookings.filter((b: any) => b.status === 'pending').length;
        setPendingCount(pending);
      } catch (error) {
        console.warn('Error fetching pending bookings:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPendingCount();

    // Refresh every 30 seconds
    const interval = setInterval(fetchPendingCount, 30000);
    return () => clearInterval(interval);
  }, [tenantId, subdomain]);

  if (loading || pendingCount === 0) {
    return null;
  }

  return (
    <Badge 
      className="ml-2 bg-red-500 text-white hover:bg-red-600 text-xs py-0.5 px-2 rounded-full"
    >
      {pendingCount}
    </Badge>
  );
}
