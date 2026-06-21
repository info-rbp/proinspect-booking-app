import { NextRequest, NextResponse } from 'next/server';
import { fulfilAccessControlJobSchema } from '../../../../../../lib/accessControl/schema';
import { updateAccessControlJobStatus } from '../../../../../../lib/accessControl/database';

export async function POST(request: NextRequest, { params }: { params: { jobId: string } }) {
  const parsed = fulfilAccessControlJobSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: 'Invalid fulfilment request.', issues: parsed.error.flatten() }, { status: 400 });
  // TODO: upload/store completion images and create access_control_job_files rows.
  // TODO: fulfil Shopify order/line item through Shopify Admin API after line-item linkage exists.
  // TODO: send Shopify completion notification/message through an approved Shopify messaging path.
  // TODO: attach image/report links to the Shopify order/customer record.
  const status = 'Completed Pending Shopify Fulfilment' as const;
  await updateAccessControlJobStatus(params.jobId, status, `Fulfilment captured for Shopify order ${parsed.data.shopifyOrderNumber}. Shopify integration pending.`);
  return NextResponse.json({ jobId: params.jobId, status, message: 'Completion saved. Shopify fulfilment integration pending.' });
}
