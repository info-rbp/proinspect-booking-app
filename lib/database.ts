import { Pool } from 'pg';
import type { BookingRecord, BookingStatus, ServiceType } from './types';

let pool: Pool | null = null;

function getDatabaseUrl(): string {
  const databaseUrl = process.env.DATABASE_URL_PROINSPECT;

  if (!databaseUrl) {
    throw new Error('DATABASE_URL_PROINSPECT is not configured. Add it to Cloud Run as a Secret Manager-backed environment variable.');
  }

  return databaseUrl;
}

function getPool(): Pool {
  if (!pool) {
    pool = new Pool({
      connectionString: getDatabaseUrl(),
      max: 5,
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 10_000
    });
  }

  return pool;
}

function toDbDate(value?: string): string | null {
  return value && value.trim() ? value : null;
}

function rowToBookingRecord(row: Record<string, any>): BookingRecord {
  return {
    id: row.id,
    status: row.status as BookingStatus,
    serviceType: row.service_type as ServiceType,
    customerName: row.customer_name,
    customerEmail: row.customer_email,
    customerPhone: row.customer_phone,
    agency: row.agency ?? '',
    propertyAddress: row.property_address_raw,
    preferredDate: row.preferred_date ? new Date(row.preferred_date).toISOString().slice(0, 10) : '',
    preferredWindow: row.preferred_window ?? '',
    accessMethod: row.access_method ?? '',
    occupancyStatus: row.occupancy_status ?? '',
    signageRequired: Boolean(row.signage_required),
    notes: row.notes ?? '',
    missingInformation: Array.isArray(row.missing_information) ? row.missing_information : [],
    durationMinutes: Number(row.duration_minutes),
    bufferMinutes: Number(row.buffer_minutes),
    aiSummary: row.ai_summary ?? '',
    createdAt: new Date(row.created_at).toISOString(),
    updatedAt: new Date(row.updated_at).toISOString()
  };
}

export async function saveBooking(record: BookingRecord): Promise<BookingRecord> {
  const client = await getPool().connect();

  try {
    await client.query('begin');

    const result = await client.query(
      `
        insert into bookings (
          id,
          status,
          service_type,
          customer_name,
          customer_email,
          customer_phone,
          agency,
          property_address_raw,
          preferred_date,
          preferred_window,
          duration_minutes,
          buffer_minutes,
          access_method,
          occupancy_status,
          signage_required,
          notes,
          ai_summary,
          created_at,
          updated_at
        ) values (
          $1, $2, $3, $4, $5, $6, $7, $8, $9,
          $10, $11, $12, $13, $14, $15, $16,
          $17, $18, $19
        )
        returning *
      `,
      [
        record.id,
        record.status,
        record.serviceType,
        record.customerName,
        record.customerEmail,
        record.customerPhone,
        record.agency ?? '',
        record.propertyAddress,
        toDbDate(record.preferredDate),
        record.preferredWindow ?? '',
        record.durationMinutes,
        record.bufferMinutes,
        record.accessMethod ?? '',
        record.occupancyStatus ?? '',
        record.signageRequired ?? false,
        record.notes ?? '',
        record.aiSummary,
        record.createdAt,
        record.updatedAt
      ]
    );

    await client.query(
      `
        insert into booking_status_history (booking_id, from_status, to_status, note)
        values ($1, null, $2, $3)
      `,
      [record.id, record.status, 'Booking request created']
    );

    await client.query('commit');
    return rowToBookingRecord(result.rows[0]);
  } catch (error) {
    await client.query('rollback');
    throw error;
  } finally {
    client.release();
  }
}

export async function listBookings(): Promise<BookingRecord[]> {
  const result = await getPool().query(
    `
      select *
      from bookings
      order by created_at desc
      limit 100
    `
  );

  return result.rows.map(rowToBookingRecord);
}

export async function getBooking(id: string): Promise<BookingRecord | null> {
  const result = await getPool().query(
    `
      select *
      from bookings
      where id = $1
      limit 1
    `,
    [id]
  );

  return result.rows[0] ? rowToBookingRecord(result.rows[0]) : null;
}

export async function updateBooking(id: string, updates: Partial<BookingRecord>): Promise<BookingRecord | null> {
  const existing = await getBooking(id);
  if (!existing) return null;

  const next = {
    ...existing,
    ...updates,
    updatedAt: new Date().toISOString()
  };

  const client = await getPool().connect();

  try {
    await client.query('begin');

    const result = await client.query(
      `
        update bookings
        set
          status = $2,
          service_type = $3,
          customer_name = $4,
          customer_email = $5,
          customer_phone = $6,
          agency = $7,
          property_address_raw = $8,
          preferred_date = $9,
          preferred_window = $10,
          duration_minutes = $11,
          buffer_minutes = $12,
          access_method = $13,
          occupancy_status = $14,
          signage_required = $15,
          notes = $16,
          ai_summary = $17,
          updated_at = $18
        where id = $1
        returning *
      `,
      [
        id,
        next.status,
        next.serviceType,
        next.customerName,
        next.customerEmail,
        next.customerPhone,
        next.agency ?? '',
        next.propertyAddress,
        toDbDate(next.preferredDate),
        next.preferredWindow ?? '',
        next.durationMinutes,
        next.bufferMinutes,
        next.accessMethod ?? '',
        next.occupancyStatus ?? '',
        next.signageRequired ?? false,
        next.notes ?? '',
        next.aiSummary,
        next.updatedAt
      ]
    );

    if (existing.status !== next.status) {
      await client.query(
        `
          insert into booking_status_history (booking_id, from_status, to_status, note)
          values ($1, $2, $3, $4)
        `,
        [id, existing.status, next.status, 'Booking status updated']
      );
    }

    await client.query('commit');
    return rowToBookingRecord(result.rows[0]);
  } catch (error) {
    await client.query('rollback');
    throw error;
  } finally {
    client.release();
  }
}
