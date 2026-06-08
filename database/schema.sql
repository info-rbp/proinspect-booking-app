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
  ai_summary text,
  calendar_event_id text,
  route_run_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

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
