-- 0007: login protection (audit item 11). One row per throttled key
-- (investor:<email>, operator:<email>, operator-ip:<ip> for the shared passphrase).
create table if not exists login_attempts (
  key text primary key,
  failures int not null default 0,
  window_started_at timestamptz not null default now(),
  locked_until timestamptz,
  updated_at timestamptz not null default now()
);
alter table login_attempts enable row level security;
grant select, insert, update, delete on login_attempts to service_role;
