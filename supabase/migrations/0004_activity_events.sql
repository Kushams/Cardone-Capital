-- 0004: activity log for operator + client actions (audit item 14).
-- Written by the app (service_role); read from the operator console.
create table if not exists activity_events (
  id bigint generated always as identity primary key,
  actor_type text not null check (actor_type in ('OPERATOR','CLIENT','SYSTEM')),
  actor_email text,
  client_email text,
  action text not null,
  detail text,
  created_at timestamptz not null default now()
);
alter table activity_events enable row level security;
grant select, insert, update, delete on activity_events to service_role;
grant usage, select on sequence activity_events_id_seq to service_role;
create index if not exists activity_events_created_idx on activity_events (created_at desc);
create index if not exists activity_events_client_idx on activity_events (client_email, created_at desc);
