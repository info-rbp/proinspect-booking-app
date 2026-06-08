import { serviceTypes } from '@/lib/types';

export function BookingForm() {
  return (
    <form className="card grid" action="/api/bookings" method="post">
      <div className="grid grid-2">
        <label>
          Service type
          <select name="serviceType" required defaultValue="Routine Inspection">
            {serviceTypes.map((service) => (
              <option key={service} value={service}>{service}</option>
            ))}
          </select>
        </label>
        <label>
          Preferred date
          <input type="date" name="preferredDate" />
        </label>
        <label>
          Customer name
          <input name="customerName" required placeholder="Jane Smith" />
        </label>
        <label>
          Email
          <input type="email" name="customerEmail" required placeholder="jane@example.com" />
        </label>
        <label>
          Phone
          <input name="customerPhone" required placeholder="0400 000 000" />
        </label>
        <label>
          Agency
          <input name="agency" placeholder="ABC Realty" />
        </label>
      </div>

      <label>
        Full property address
        <input name="propertyAddress" required placeholder="12 Example Street, Balga WA 6061" />
      </label>

      <div className="grid grid-2">
        <label>
          Preferred window
          <select name="preferredWindow" defaultValue="">
            <option value="">No preference</option>
            <option value="Morning">Morning</option>
            <option value="Midday">Midday</option>
            <option value="Afternoon">Afternoon</option>
          </select>
        </label>
        <label>
          Occupancy status
          <select name="occupancyStatus" defaultValue="">
            <option value="">Unknown</option>
            <option value="Vacant">Vacant</option>
            <option value="Tenanted">Tenanted</option>
            <option value="Owner occupied">Owner occupied</option>
          </select>
        </label>
      </div>

      <label>
        Access method
        <textarea name="accessMethod" placeholder="Lockbox, keys, tenant details, parking, pets, gate code or alarm details" />
      </label>

      <label>
        Additional notes
        <textarea name="notes" placeholder="Anything else the booking team needs to know" />
      </label>

      <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <input style={{ width: 'auto' }} type="checkbox" name="signageRequired" value="true" />
        Signage required for Open For Inspection
      </label>

      <button type="submit">Submit booking request</button>
    </form>
  );
}
