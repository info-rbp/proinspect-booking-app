import { AdminBookingClient } from '@/components/AdminBookingClient';

export default function AdminPage() {
  return (
    <main>
      <div className="header">
        <div>
          <span className="badge">Admin</span>
          <h1>Booking dashboard</h1>
          <p>Review booking requests, OFI route-review items and scheduling status.</p>
        </div>
      </div>
      <AdminBookingClient />
    </main>
  );
}
