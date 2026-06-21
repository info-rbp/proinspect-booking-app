import { Pool } from 'pg';
import type { AccessControlJob, AccessControlJobRequest, AccessControlJobStatus, AccessControlLocationInput } from './types';
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

type JobInput = AccessControlJobRequest & Record<string, any>;

function payloadFor(job: JobInput): Record<string, unknown> {
  const { locations: _locations, payload: _payload, ...rest } = job;
  return { ...rest, ...(_payload ?? {}) };
}

function locationsFor(job: JobInput): AccessControlLocationInput[] {
  if (Array.isArray(job.locations) && job.locations.length > 0) return job.locations;

  switch (job.serviceType) {
    case 'Lockbox Installation':
      return [
        ...(job.pickupRequired === 'Pickup required'
          ? [{ locationType: 'pickup' as const, address: job.pickupAddress, contactName: job.pickupFromName, contactPhone: job.pickupContactPhone, instructions: job.pickupNotes }]
          : []),
        { locationType: 'installation' as const, address: job.installationAddress, instructions: job.accessNotes, locationOnProperty: job.installationLocationOnProperty }
      ];
    case 'Lockbox Removal / Relocation':
      return [
        { locationType: 'source' as const, address: job.currentPropertyAddress, instructions: job.accessNotes, locationOnProperty: job.currentLockboxLocation },
        ...(job.actionType === 'Relocation at same property'
          ? [{ locationType: 'installation' as const, address: job.currentPropertyAddress, instructions: 'Same-property relocation', locationOnProperty: job.newLocationOnProperty }]
          : []),
        ...(job.actionType === 'Relocation to another property'
          ? [{ locationType: 'destination' as const, address: job.destinationPropertyAddress, instructions: job.accessNotes, locationOnProperty: job.destinationLocationOnProperty }]
          : []),
        ...(job.returnOrDisposalInstruction ? [{ locationType: 'return' as const, instructions: job.returnOrDisposalInstruction }] : [])
      ];
    case 'Key Collection & Return Service':
      return [
        ...(job.collectionAddress ? [{ locationType: 'pickup' as const, address: job.collectionAddress, contactName: job.collectionContactName, contactPhone: job.collectionContactPhone, instructions: job.collectionInstructions }] : []),
        ...(job.returnAddress ? [{ locationType: 'return' as const, address: job.returnAddress, contactName: job.returnContactName, contactPhone: job.returnContactPhone, instructions: job.returnInstructions }] : []),
        { locationType: 'source' as const, address: job.propertyAddress, instructions: job.keySetDescription }
      ];
    case 'Key Cutting & Tagging':
      return [
        ...(job.collectionAddress ? [{ locationType: 'pickup' as const, address: job.collectionAddress, instructions: job.keyReceiptMethod }] : []),
        { locationType: 'source' as const, address: job.propertyAddress, instructions: `${job.keyType}; copies: ${job.numberOfCopies}` },
        { locationType: 'return' as const, instructions: job.returnOrStorageInstructions }
      ];
    case 'Off-Site Key Storage':
      return [
        { locationType: 'storage' as const, address: job.handoverOrCollectionLocation, instructions: `${job.storageAction}; ${job.keyInventory}` },
        { locationType: 'source' as const, address: job.propertyAddress, instructions: job.authorisedContacts }
      ];
    case 'Property Access Setup Service':
      return [{ locationType: 'installation' as const, address: job.propertyAddress, instructions: job.currentAccessDetails, locationOnProperty: Array.isArray(job.setupTasks) ? job.setupTasks.join(', ') : '' }];
    case 'Key Audit & Register Update':
      return [{ locationType: 'audit' as const, address: job.propertyOrPortfolioDetails, instructions: `${job.auditScope}; output: ${job.outputRequired}` }];
    default:
      return [];
  }
}

function primaryAddressFor(job: JobInput): string {
  return job.installationAddress || job.currentPropertyAddress || job.destinationPropertyAddress || job.propertyAddress || job.propertyOrPortfolioDetails || '';
}

export async function saveAccessControlJob(job: JobInput): Promise<AccessControlJob> {
  // Hidden Shopify customer/company fields are stored as supplied for now. Shopify order webhooks are used later to verify and link paid orders.
  const id = generateAccessControlJobId();
  const client = await getPool().connect();

  try {
    await client.query('begin');
    await client.query(
      `insert into access_control_jobs (
        id, service_type, status, shopify_customer_id, shopify_company_id, shopify_company_location_id,
        client_name, customer_name, customer_email, customer_phone, preferred_date, occupancy_status,
        access_notes, notes, primary_address, job_payload
      ) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)`,
      [
        id,
        job.serviceType,
        initialStatus,
        job.shopifyCustomerId || '',
        job.shopifyCompanyId || '',
        job.shopifyCompanyLocationId || '',
        job.clientName || '',
        job.customerName,
        job.customerEmail,
        job.customerPhone,
        job.preferredDate || null,
        job.occupancyStatus || '',
        job.accessNotes || '',
        job.notes || '',
        primaryAddressFor(job),
        JSON.stringify(payloadFor(job))
      ]
    );

    for (const location of locationsFor(job)) {
      await client.query(
        `insert into access_control_job_locations (job_id, location_type, address, contact_name, contact_phone, instructions, location_on_property)
         values ($1,$2,$3,$4,$5,$6,$7)`,
        [id, location.locationType, location.address || '', location.contactName || '', location.contactPhone || '', location.instructions || '', location.locationOnProperty || '']
      );
    }

    await client.query(
      `insert into access_control_job_status_history (job_id, from_status, to_status, note) values ($1,null,$2,$3)`,
      [id, initialStatus, 'Customer booking draft created before Shopify checkout.']
    );

    await client.query('commit');
    return { ...job, id, status: initialStatus } as AccessControlJob;
  } catch (error) {
    await client.query('rollback');
    throw error;
  } finally {
    client.release();
  }
}

export async function saveAccessControlJobs(jobs: JobInput[]) {
  return Promise.all(jobs.map(saveAccessControlJob));
}

export async function getAccessControlJob(id: string) {
  const result = await getPool().query(
    `select * from access_control_jobs where id = $1`,
    [id]
  );
  return result.rows[0] ?? null;
}

export async function listAccessControlJobs() {
  const result = await getPool().query(
    `select * from access_control_jobs order by created_at desc limit 200`
  );
  return result.rows;
}

export async function searchAccessControlJobs(query = '', status = '') {
  const terms: string[] = [];
  const values: string[] = [];

  if (query.trim()) {
    values.push(`%${query.trim()}%`);
    terms.push(`(
      id ilike $${values.length}
      or coalesce(shopify_order_name, '') ilike $${values.length}
      or coalesce(client_name, '') ilike $${values.length}
      or coalesce(customer_email, '') ilike $${values.length}
      or coalesce(primary_address, '') ilike $${values.length}
      or service_type ilike $${values.length}
    )`);
  }

  if (status.trim()) {
    values.push(status.trim());
    terms.push(`status = $${values.length}`);
  }

  const where = terms.length ? `where ${terms.join(' and ')}` : '';
  const result = await getPool().query(
    `select * from access_control_jobs ${where} order by created_at desc limit 100`,
    values
  );
  return result.rows;
}

export async function listAccessControlJobsByOrderNumber(orderNumber: string) {
  const result = await getPool().query(
    `select * from access_control_jobs where shopify_order_name = $1 order by created_at desc`,
    [orderNumber]
  );
  return result.rows;
}

export async function linkAccessControlJobToShopifyOrder(input: {
  jobId: string;
  shopifyOrderId: string;
  shopifyOrderName: string;
  shopifyLineItemId?: string;
  shopifyCustomerId?: string;
}) {
  await getPool().query(
    `update access_control_jobs
     set shopify_order_id = $2,
         shopify_order_name = $3,
         shopify_line_item_id = $4,
         shopify_customer_id = coalesce(nullif($5, ''), shopify_customer_id),
         status = case when status = 'Job Draft Created' then 'Order Received' else status end,
         updated_at = now()
     where id = $1`,
    [input.jobId, input.shopifyOrderId, input.shopifyOrderName, input.shopifyLineItemId || '', input.shopifyCustomerId || '']
  );

  await getPool().query(
    `insert into access_control_job_status_history (job_id, from_status, to_status, note)
     values ($1, null, 'Order Received', $2)`,
    [input.jobId, `Linked to Shopify order ${input.shopifyOrderName}.`]
  );
}

export async function addAccessControlJobFiles(jobId: string, files: Array<{ fileType: string; fileUrl: string; fileName?: string }>) {
  for (const file of files) {
    await getPool().query(
      `insert into access_control_job_files (job_id, file_type, file_url, file_name) values ($1,$2,$3,$4)`,
      [jobId, file.fileType, file.fileUrl, file.fileName || '']
    );
  }
}

export async function updateAccessControlJobStatus(id: string, status: AccessControlJobStatus, note?: string, fulfilmentPayload?: Record<string, unknown>) {
  const client = await getPool().connect();

  try {
    await client.query('begin');
    const current = await client.query('select status from access_control_jobs where id = $1', [id]);
    await client.query(
      `update access_control_jobs set status = $2, fulfilment_payload = coalesce($3::jsonb, fulfilment_payload), updated_at = now() where id = $1`,
      [id, status, fulfilmentPayload ? JSON.stringify(fulfilmentPayload) : null]
    );
    await client.query(
      `insert into access_control_job_status_history (job_id, from_status, to_status, note) values ($1,$2,$3,$4)`,
      [id, current.rows[0]?.status ?? null, status, note || 'Access Control job status updated']
    );
    await client.query('commit');
  } catch (error) {
    await client.query('rollback');
    throw error;
  } finally {
    client.release();
  }
}
