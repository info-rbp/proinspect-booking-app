import { Pool } from 'pg';
import type { AccessControlJob, AccessControlJobStatus, LockboxInstallationJobRequest } from './types';
import { generateAccessControlJobId } from './jobs';

const initialStatus: AccessControlJobStatus = 'Job Draft Created';
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

export async function saveAccessControlJob(job: LockboxInstallationJobRequest): Promise<AccessControlJob> {
  // Hidden Shopify customer/company fields are stored as supplied for now. TODO: verify identity with Shopify order webhooks/Admin API before trusting them operationally.
  const id = generateAccessControlJobId();
  const client = await getPool().connect();
  try {
    await client.query('begin');
    await client.query(
      `insert into access_control_jobs (id, service_type, status, shopify_customer_id, shopify_company_id, shopify_company_location_id, client_name, customer_name, customer_email, customer_phone, preferred_date, occupancy_status, access_notes)
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)`,
      [id, job.serviceType, initialStatus, job.shopifyCustomerId, job.shopifyCompanyId, job.shopifyCompanyLocationId, job.clientName, job.customerName, job.customerEmail, job.customerPhone, job.preferredDate, job.occupancyStatus, job.accessNotes]
    );
    if (job.pickupRequired === 'Pickup required') {
      await client.query(
        `insert into access_control_job_locations (job_id, location_type, address, contact_name, contact_phone, instructions) values ($1,'pickup',$2,$3,$4,$5)`,
        [id, job.pickupAddress, job.pickupFromName, job.pickupContactPhone, job.pickupNotes]
      );
    }
    await client.query(
      `insert into access_control_job_locations (job_id, location_type, address, instructions, location_on_property) values ($1,'installation',$2,$3,$4)`,
      [id, job.installationAddress, job.accessNotes, job.installationLocationOnProperty]
    );
    await client.query(`insert into access_control_job_status_history (job_id, from_status, to_status, note) values ($1,null,$2,$3)`, [id, initialStatus, 'Customer booking draft created before Shopify checkout.']);
    await client.query('commit');
    return { ...job, id, status: initialStatus };
  } catch (error) { await client.query('rollback'); throw error; } finally { client.release(); }
}
export async function saveAccessControlJobs(jobs: LockboxInstallationJobRequest[]) { return Promise.all(jobs.map(saveAccessControlJob)); }
export async function getAccessControlJob(id: string) { const r = await getPool().query('select * from access_control_jobs where id=$1', [id]); return r.rows[0] ?? null; }
export async function listAccessControlJobs() { const r = await getPool().query('select * from access_control_jobs order by created_at desc'); return r.rows; }
export async function listAccessControlJobsByOrderNumber(orderNumber: string) { const r = await getPool().query('select * from access_control_jobs where shopify_order_name=$1 order by created_at desc', [orderNumber]); return r.rows; }
export async function updateAccessControlJobStatus(id: string, status: AccessControlJobStatus, note?: string) {
  const client = await getPool().connect();
  try { await client.query('begin'); const current = await client.query('select status from access_control_jobs where id=$1', [id]); await client.query('update access_control_jobs set status=$2, updated_at=now() where id=$1', [id, status]); await client.query('insert into access_control_job_status_history (job_id, from_status, to_status, note) values ($1,$2,$3,$4)', [id, current.rows[0]?.status ?? null, status, note]); await client.query('commit'); }
  catch (e) { await client.query('rollback'); throw e; } finally { client.release(); }
}
