import type { BookingRecord } from './types';

const memoryStore = new Map<string, BookingRecord>();

export async function saveBooking(record: BookingRecord): Promise<BookingRecord> {
  memoryStore.set(record.id, record);
  return record;
}

export async function listBookings(): Promise<BookingRecord[]> {
  return Array.from(memoryStore.values()).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function getBooking(id: string): Promise<BookingRecord | null> {
  return memoryStore.get(id) ?? null;
}

export async function updateBooking(id: string, updates: Partial<BookingRecord>): Promise<BookingRecord | null> {
  const existing = memoryStore.get(id);
  if (!existing) return null;

  const updated = {
    ...existing,
    ...updates,
    updatedAt: new Date().toISOString()
  };

  memoryStore.set(id, updated);
  return updated;
}
