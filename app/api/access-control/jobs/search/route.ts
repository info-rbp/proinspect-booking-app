import { NextRequest, NextResponse } from 'next/server';
import { accessControlJobSearchSchema } from '../../../../../lib/accessControl/schema';
import { searchAccessControlJobs } from '../../../../../lib/accessControl/database';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: NextRequest) {
  const params = Object.fromEntries(request.nextUrl.searchParams.entries());
  const parsed = accessControlJobSearchSchema.safeParse(params);

  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid search query.', issues: parsed.error.flatten() }, { status: 400 });
  }

  const jobs = await searchAccessControlJobs(parsed.data.q, parsed.data.status);
  return NextResponse.json({ jobs });
}
