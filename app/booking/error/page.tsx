import Link from 'next/link';

export default function BookingErrorPage({ searchParams }: { searchParams: { reason?: string } }) {
  return (
    <main>
      <section className="card">
        <span className="badge">Booking not saved</span>
        <h1>We could not submit the booking request</h1>
        <p>The booking form loaded correctly, but the server could not save the request.</p>
        {searchParams.reason ? <p><strong>Reason:</strong> {searchParams.reason}</p> : null}
        <p>Check the Cloud Run logs for <code>/api/bookings</code>, then verify the database URL, Cloud SQL connection, and database permissions.</p>
        <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
          <Link className="button" href="/booking">Back to booking form</Link>
          <Link className="button secondary" href="/api/health">Check app health</Link>
        </div>
      </section>
    </main>
  );
}
