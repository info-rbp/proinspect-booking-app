create table if not exists bookings (
  id text primary key,
  status text not null,
  service_type text not null,
  customer_name text not null,
  customer_email text not null,
  customer_phone text not null,
  agency text,
  property_address_raw text not null,
  property_address_validated text,
  place_id text,
  latitude numeric,
  longitude numeric,
  suburb text,
  postcode text,
  preferred_date date,
  preferred_window text,
  duration_minutes integer not null,
  buffer_minutes integer not null,
  access_method text,
  occupancy_status text,
  signage_required boolean default false,
  notes text,
  missing_information text[] default '{}',
  ai_summary text,
  recommended_slot_start timestamptz,
  recommended_slot_end timestamptz,
  calendar_event_id text,
  calendar_event_html_link text,
  route_run_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table bookings add column if not exists missing_information text[] default '{}';
alter table bookings add column if not exists recommended_slot_start timestamptz;
alter table bookings add column if not exists recommended_slot_end timestamptz;
alter table bookings add column if not exists calendar_event_html_link text;

create table if not exists service_rules (
  service_type text primary key,
  duration_minutes integer not null,
  buffer_minutes integer not null,
  auto_book_allowed boolean not null default false,
  requires_manual_review boolean not null default true,
  minimum_notice_hours integer not null default 24,
  max_travel_minutes_between_jobs integer not null default 30
);

create table if not exists ofi_runs (
  id text primary key,
  run_date date not null,
  region text,
  status text not null default 'Draft Scheduled',
  parent_calendar_event_id text,
  start_time timestamptz,
  end_time timestamptz,
  admin_approved boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists ofi_run_stops (
  id bigserial primary key,
  ofi_run_id text not null references ofi_runs(id),
  booking_id text not null references bookings(id),
  sequence integer not null,
  scheduled_start timestamptz,
  scheduled_end timestamptz,
  travel_from_previous_minutes integer
);

create table if not exists booking_status_history (
  id bigserial primary key,
  booking_id text not null references bookings(id),
  from_status text,
  to_status text not null,
  note text,
  created_at timestamptz not null default now()
);

create table if not exists access_control_jobs (
  id text primary key,
  service_type text not null,
  status text not null,
  shopify_customer_id text,
  shopify_company_id text,
  shopify_company_location_id text,
  shopify_order_id text,
  shopify_order_name text,
  shopify_line_item_id text,
  client_name text,
  customer_name text not null,
  customer_email text not null,
  customer_phone text not null,
  preferred_date date,
  occupancy_status text,
  access_notes text,
  notes text,
  primary_address text,
  job_payload jsonb default '{}'::jsonb,
  fulfilment_payload jsonb default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table access_control_jobs add column if not exists primary_address text;
alter table access_control_jobs add column if not exists job_payload jsonb default '{}'::jsonb;
alter table access_control_jobs add column if not exists fulfilment_payload jsonb default '{}'::jsonb;

create index if not exists access_control_jobs_order_name_idx on access_control_jobs(shopify_order_name);
create index if not exists access_control_jobs_status_idx on access_control_jobs(status);
create index if not exists access_control_jobs_primary_address_idx on access_control_jobs(primary_address);

create table if not exists access_control_job_locations (
  id bigserial primary key,
  job_id text not null references access_control_jobs(id) on delete cascade,
  location_type text not null check (location_type in ('pickup','installation','source','destination','return','storage','audit')),
  address text,
  contact_name text,
  contact_phone text,
  instructions text,
  location_on_property text,
  created_at timestamptz not null default now()
);

create table if not exists access_control_job_status_history (
  id bigserial primary key,
  job_id text not null references access_control_jobs(id) on delete cascade,
  from_status text,
  to_status text not null,
  note text,
  created_at timestamptz not null default now()
);

create table if not exists access_control_job_files (
  id bigserial primary key,
  job_id text not null references access_control_jobs(id) on delete cascade,
  file_type text not null,
  file_url text not null,
  file_name text,
  created_at timestamptz not null default now()
);
