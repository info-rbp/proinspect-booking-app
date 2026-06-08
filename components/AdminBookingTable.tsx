import { StatusBadge } from './StatusBadge';
import type { BookingRecord } from '@/lib/types';

export function AdminBookingTable({ bookings }: { bookings: BookingRecord[] }) {
  if (bookings.length === 0) {
    return (
      <div className="card">
        <p>No bookings have been submitted in this runtime yet. The temporary memory store resets when the service restarts, because apparently persistence requires a database. Cloud SQL is the next step.</p>
      </div>
    );
  }

  return (
    <div className="card" style={{ overflowX: 'auto' }}>
      <table className="table">
        <thead>
          <tr>
            <th>Booking</th>
            <th>Service</th>
            <th>Property</th>
            <th>Status</th>
            <th>Summary</th>
          </tr>
        </thead>
        <tbody>
          {bookings.map((booking) => (
            <tr key={booking.id}>
              <td>{booking.id}</td>
              <td>{booking.serviceType}</td>
              <td>{booking.propertyAddress}</td>
              <td><StatusBadge status={booking.status} /></td>
              <td>{booking.aiSummary}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
