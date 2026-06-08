import { BookingForm } from '@/components/BookingForm';

export default function BookingPage() {
  return (
    <main>
      <div className="header">
        <div>
          <span className="badge">Customer intake</span>
          <h1>Book an inspection</h1>
          <p>Submit the service, property, access and preferred timing details. The system will classify the booking and route it for scheduling or review.</p>
        </div>
      </div>
      <BookingForm />
    </main>
  );
}
