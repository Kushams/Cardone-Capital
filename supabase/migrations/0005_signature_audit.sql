-- 0005: real e-signature audit trail (audit item 2).
-- The drawn signature image lives in the private `signatures` storage bucket;
-- these columns record who signed, when, from where, and the image's hash.
alter table signature_requests
  add column if not exists consent_agreed_at timestamptz,
  add column if not exists signed_at timestamptz,
  add column if not exists signer_name text,
  add column if not exists signer_ip text,
  add column if not exists signer_user_agent text,
  add column if not exists signature_sha256 text,
  add column if not exists signature_image_path text;
insert into storage.buckets (id, name, public) values ('signatures', 'signatures', false)
on conflict (id) do nothing;
