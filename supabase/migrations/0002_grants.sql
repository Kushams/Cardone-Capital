-- 0002_grants.sql
-- Data API grants for the service_role (applied live 2026-11-01).
-- Tables created through the Management API / SQL editor do not receive
-- PostgREST (Data API) grants automatically when "automatically expose
-- new tables" is off. RLS remains enabled, deny-by-default on every
-- table; anon and authenticated receive NO grants here. Only the
-- server-side service_role (used by the app with its service key) can
-- read/write, and the app enforces per-client scoping itself.
-- NOTE: future tables created the same way need this grant too.
GRANT USAGE ON SCHEMA public TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO service_role;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO service_role;
