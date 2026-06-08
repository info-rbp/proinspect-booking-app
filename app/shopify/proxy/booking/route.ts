import { NextRequest, NextResponse } from 'next/server';

function htmlEscape(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: NextRequest) {
  const configuredBaseUrl = process.env.APP_BASE_URL_PROINSPECT || process.env.APP_BASE_URL;
  const requestUrl = new URL(request.url);
  const baseUrl = configuredBaseUrl || `${requestUrl.protocol}//${requestUrl.host}`;
  const shop = requestUrl.searchParams.get('shop') || '';
  const iframeUrl = new URL('/booking', baseUrl);

  iframeUrl.searchParams.set('source', 'shopify-app-proxy');
  if (shop) {
    iframeUrl.searchParams.set('shop', shop);
  }

  const body = `
    <section class="proinspect-booking-proxy" style="width:100%;max-width:1180px;margin:0 auto;padding:24px 16px;box-sizing:border-box;">
      <div style="margin-bottom:16px;">
        <p style="margin:0 0 6px 0;font-size:13px;letter-spacing:.08em;text-transform:uppercase;color:#64748b;font-weight:700;">ProInspect</p>
        <h1 style="margin:0;font-size:32px;line-height:1.15;color:#0f172a;">Book an inspection</h1>
        <p style="margin:10px 0 0 0;color:#475569;font-size:16px;">Complete the booking request below and our scheduling system will capture it for review.</p>
      </div>
      <iframe
        title="ProInspect booking form"
        src="${htmlEscape(iframeUrl.toString())}"
        style="display:block;width:100%;min-height:1050px;border:0;border-radius:18px;background:#ffffff;box-shadow:0 18px 60px rgba(15,23,42,.12);"
        loading="eager"
      ></iframe>
    </section>
  `;

  return new NextResponse(body, {
    status: 200,
    headers: {
      'content-type': 'text/html; charset=utf-8',
      'cache-control': 'no-store, no-cache, must-revalidate, proxy-revalidate'
    }
  });
}
