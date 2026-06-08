import { AdminBookingTable } from '@/components/AdminBookingTable';
import { listBookings } from '@/lib/database';

export default async function AdminPage() {
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
