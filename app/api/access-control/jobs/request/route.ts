import { NextRequest, NextResponse } from 'next/server';
import { accessControlJobsRequestSchema } from '../../../../../lib/accessControl/schema';
import { saveAccessControlJobs } from '../../../../../lib/accessControl/database';

function corsHeaders(origin: string | null) {
  const allowed = origin && (/\.myshopify\.com$/.test(new URL(origin).hostname) || /shopify\.com$/.test(new URL(origin).hostname) || /^https?:\/\/localhost(:\d+)?$/.test(origin));
  return { 'Access-Control-Allow-Origin': allowed ? origin! : '*', 'Access-Control-Allow-Methods': 'OPTIONS, POST', 'Access-Control-Allow-Headers': 'Content-Type, Authorization' };
}
export async function OPTIONS(request: NextRequest) { return new NextResponse(null, { status: 204, headers: corsHeaders(request.headers.get('origin')) }); }
export async function POST(request: NextRequest) {
  const headers = corsHeaders(request.headers.get('origin'));
  try {
    const parsed = accessControlJobsRequestSchema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ error: 'Invalid access control job request.', issues: parsed.error.flatten() }, { status: 400, headers });
    const saved = await saveAccessControlJobs(parsed.data.jobs);
    return NextResponse.json({ jobs: saved.map((job) => ({ id: job.id, serviceType: job.serviceType, status: job.status })) }, { headers });
  } catch (error) {
    console.error('Access control job request failed', error);
    return NextResponse.json({ error: 'Unexpected error creating access control jobs.' }, { status: 500, headers });
  }
}
