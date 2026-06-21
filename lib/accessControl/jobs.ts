export function generateAccessControlJobId(date = new Date()): string {
  const day = date.toISOString().slice(0, 10).replace(/-/g, '');
  const timestamp = String(date.getTime()).slice(-8);
  const random = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `ACJ-${day}-${timestamp}-${random}`;
}
