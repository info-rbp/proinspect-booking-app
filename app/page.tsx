import Link from 'next/link';

export default function HomePage() {
  return (
    <main>
      <div className="header">
        <div>
          <span className="badge">ProInspect</span>
          <h1>Booking App</h1>
          <p>Customer booking intake, admin review, Calendar scheduling and OFI route batching scaffold.</p>
        </div>
      </div>
      <div className="grid grid-2">
        <section className="card">
          <h2>Customer booking</h2>
          <p>Submit an inspection request with service, property and access details.</p>
          <Link className="button" href="/booking">Open booking form</Link>
        </section>
        <section className="card">
          <h2>Admin dashboard</h2>
          <p>Review pending bookings, OFI route requests and scheduling status.</p>
          <Link className="button secondary" href="/admin">Open admin</Link>
        </section>
      </div>
    </main>
  );
}
