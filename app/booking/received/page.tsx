import Link from 'next/link';

export default function BookingReceivedPage({ searchParams }: { searchParams: { id?: string; status?: string } }) {
  return (
    <main>
      <section className="card">
        <span className="badge">Request received</span>
        <h1>Booking request submitted</h1>
        <p>Your request has been logged for scheduling or review.</p>
        <p><strong>Booking ID:</strong> {searchParams.id ?? 'Pending'}</p>
        <p><strong>Status:</strong> {searchParams.status ?? 'Pending'}</p>
        <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
          <Link className="button" href="/booking">Submit another</Link>
          <Link className="button secondary" href="/admin">View admin dashboard</Link>
        </div>
      </section>
    </main>
  );
}
