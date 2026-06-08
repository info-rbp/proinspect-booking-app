import { NextResponse } from 'next/server';

const requiredEnvNames = [
  'DATABASE_URL_PROINSPECT',
  'APP_BASE_URL_PROINSPECT',
  'ADMIN_AUTH_SECRET_PROINSPECT',
  'GOOGLE_CALENDAR_ID_PROINSPECT',
  'GOOGLE_MAPS_API_KEY_PROINSPECT',
  'SHOPIFY_PROINSPECT_CLIENT_ID',
  'SHOPIFY_PROINSPECT_SECRET',
  'SHOPIFY_PROINSPECT_SHOP_DOMAIN'
];

function maskPresence(name: string) {
  const value = process.env[name];
  return {
    name,
    present: Boolean(value && value.length > 0),
    length: value?.length ?? 0
  };
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    service: 'proinspect-booking-app',
    timestamp: new Date().toISOString(),
    environment: requiredEnvNames.map(maskPresence)
  });
}
