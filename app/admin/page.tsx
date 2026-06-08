import { unstable_noStore as noStore } from 'next/cache';
import { AdminBookingTable } from '@/components/AdminBookingTable';
import { listBookings } from '@/lib/database';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function AdminPage() {
  noStore();
  const bookings = await listBookings();

  return (
    <main>
      <div className="header">
        <div>
          <span className="badge">Admin</span>
          <h1>Booking dashboard</h1>
          <p>Review booking requests, OFI route-review items and scheduling status.</p>
        </div>
      </div>
      <AdminBookingTable bookings={bookings} />
    </main>
  );
}
