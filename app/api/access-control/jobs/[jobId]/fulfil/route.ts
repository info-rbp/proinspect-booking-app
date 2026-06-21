import { NextRequest, NextResponse } from 'next/server';
import { fulfilAccessControlJobSchema } from '../../../../../../lib/accessControl/schema';
import { addAccessControlJobFiles, getAccessControlJob, updateAccessControlJobStatus } from '../../../../../../lib/accessControl/database';
import { canUseShopifyAdminApi, fulfilShopifyAccessControlLineItem } from '../../../../../../lib/shopify/admin';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function POST(request: NextRequest, { params }: { params: { jobId: string } }) {
  const parsed = fulfilAccessControlJobSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid completion request.', issues: parsed.error.flatten() }, { status: 400 });
  }

  const job = await getAccessControlJob(params.jobId);
  if (!job) return NextResponse.json({ error: 'Access Control job not found.' }, { status: 404 });

  const files = parsed.data.photoUrls.map((fileUrl, index) => ({
    fileType: 'completion_photo',
    fileUrl,
    fileName: `completion-photo-${index + 1}`
  }));

  if (files.length) await addAccessControlJobFiles(params.jobId, files);

  const completionPayload = {
    ...parsed.data,
    photoCount: files.length,
    completedAt: new Date().toISOString()
  };

  const hasShopifyLink = Boolean(job.shopify_order_id && job.shopify_line_item_id);
  const canRunShopifyCompletion = hasShopifyLink && canUseShopifyAdminApi();

  if (canRunShopifyCompletion) {
    try {
      await fulfilShopifyAccessControlLineItem({
        shopifyOrderId: job.shopify_order_id,
        shopifyLineItemId: job.shopify_line_item_id,
        jobId: params.jobId,
        message: `ProInspect Access Control job ${params.jobId} has been completed.`
      });
      await updateAccessControlJobStatus(params.jobId, 'Fulfilled', `Shopify order ${parsed.data.shopifyOrderNumber} completed.`, completionPayload);
      return NextResponse.json({ jobId: params.jobId, status: 'Fulfilled', message: 'Completion saved and Shopify order line item completed.' });
    } catch (error) {
      await updateAccessControlJobStatus(params.jobId, 'Completed Pending Shopify Fulfilment', `Completion saved. Shopify completion failed: ${error instanceof Error ? error.message : 'Unknown Shopify error'}`, completionPayload);
      return NextResponse.json({ jobId: params.jobId, status: 'Completed Pending Shopify Fulfilment', message: 'Completion saved, but Shopify completion needs review.' }, { status: 202 });
    }
  }

  await updateAccessControlJobStatus(
    params.jobId,
    'Completed Pending Shopify Fulfilment',
    hasShopifyLink ? `Completion captured for Shopify order ${parsed.data.shopifyOrderNumber}.` : `Completion captured, but no Shopify line item is linked yet.`,
    completionPayload
  );

  return NextResponse.json({
    jobId: params.jobId,
    status: 'Completed Pending Shopify Fulfilment',
    message: hasShopifyLink
      ? 'Completion saved. Shopify Admin API credentials are required for automatic order completion.'
      : 'Completion saved. Link this job to a Shopify order line item before automatic order completion can run.'
  });
}
