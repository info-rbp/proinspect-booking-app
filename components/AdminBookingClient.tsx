'use client';

import { useEffect, useState } from 'react';
import { AdminBookingTable } from './AdminBookingTable';
import type { BookingRecord } from '@/lib/types';

export function AdminBookingClient() {
  const [bookings, setBookings] = useState<BookingRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadBookings() {
      try {
        const response = await fetch('/api/bookings', { cache: 'no-store' });
        const data = await response.json().catch(() => null);

        if (!response.ok) {
          const backendMessage = data?.message || data?.error || `HTTP ${response.status}`;
          throw new Error(`Failed to load bookings: ${backendMessage}`);
        }

        if (isMounted) {
          setBookings(data?.bookings ?? []);
          setError(null);
        }
      } catch (loadError) {
        if (isMounted) {
          setError(loadError instanceof Error ? loadError.message : 'Failed to load bookings.');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadBookings();

    return () => {
      isMounted = false;
    };
  }, []);

  if (isLoading) {
    return <div className="card"><p>Loading bookings...</p></div>;
  }

  if (error) {
    return (
      <div className="card">
        <h2>Unable to load bookings</h2>
        <p>{error}</p>
        <p>Check Cloud Run runtime secrets, Cloud SQL connection settings, and database user permissions.</p>
      </div>
    );
  }

  return <AdminBookingTable bookings={bookings} />;
}
