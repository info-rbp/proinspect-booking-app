import { createHmac, timingSafeEqual } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { linkAccessControlJobToShopifyOrder } from '../../../../../lib/accessControl/database';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

type ShopifyProperty = { name?: string; key?: string; value?: string };
type ShopifyLineItem = { id?: number | string; properties?: ShopifyProperty[]; custom_attributes?: ShopifyProperty[] };
type ShopifyOrderWebhook = {
  id?: number | string;
  name?: string;
  customer?: { id?: number | string };
  line_items?: ShopifyLineItem[];
};

function isValidShopifyWebhook(rawBody: string, hmacHeader: string | null) {
  const secret = process.env.SHOPIFY_PROINSPECT_SECRET;
  if (!secret || !hmacHeader) return false;

  const digest = createHmac('sha256', secret).update(rawBody, 'utf8').digest('base64');
  const digestBuffer = Buffer.from(digest, 'utf8');
  const headerBuffer = Buffer.from(hmacHeader, 'utf8');

  return digestBuffer.length === headerBuffer.length && timingSafeEqual(digestBuffer, headerBuffer);
}

function getLineItemProperty(lineItem: ShopifyLineItem, key: string) {
  const properties = [...(lineItem.properties ?? []), ...(lineItem.custom_attributes ?? [])];
  const match = properties.find((property) => property.name === key || property.key === key);
  return match?.value || '';
}

export async function POST(request: NextRequest) {
  const rawBody = await request.text();

  if (!isValidShopifyWebhook(rawBody, request.headers.get('x-shopify-hmac-sha256'))) {
    return NextResponse.json({ error: 'Invalid Shopify webhook signature.' }, { status: 401 });
  }

  const order = JSON.parse(rawBody) as ShopifyOrderWebhook;
  const linkedJobs: string[] = [];

  for (const lineItem of order.line_items ?? []) {
    const jobId = getLineItemProperty(lineItem, '_proinspect_job_id') || getLineItemProperty(lineItem, 'Job ID');
    if (!jobId) continue;

    await linkAccessControlJobToShopifyOrder({
      jobId,
      shopifyOrderId: String(order.id || ''),
      shopifyOrderName: String(order.name || ''),
      shopifyLineItemId: String(lineItem.id || ''),
      shopifyCustomerId: String(order.customer?.id || '')
    });
    linkedJobs.push(jobId);
  }

  return NextResponse.json({ ok: true, linkedJobs });
}
