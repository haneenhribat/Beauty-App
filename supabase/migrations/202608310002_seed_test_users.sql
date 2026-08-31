-- Test-only Aura accounts. Passwords are stored as one-way bcrypt hashes.
with test_users (id, email, encrypted_password, full_name, account_role) as (
  values
    ('10000000-0000-4000-8000-000000000001'::uuid, 'maya@aura.test', '$2y$10$ILe0zJHwNlmXDs5kCumfUeyjCqrJJ56.RPa7HXzqbJqW7IX3krVZC', 'Maya', 'customer'),
    ('10000000-0000-4000-8000-000000000002'::uuid, 'layla@aura.test', '$2y$10$iMp8anDNGlaAA0ardlEZ7eJFnZPNxT2fToH5/25iJO6ipPiMU8/iK', 'Layla', 'specialist'),
    ('10000000-0000-4000-8000-000000000003'::uuid, 'owner@aura.test', '$2y$10$ujkJmDKqoQ/Mtv.PRawAfOu.Lxus4avan5ezwLY7flf/4RPUAan.i', 'Rania', 'owner'),
    ('10000000-0000-4000-8000-000000000004'::uuid, 'admin@aura.test', '$2y$10$b2E7idjp5zsDJoNdbH38NuKPYWVch5Kefwr9GKeoaBdePaoMUcp5K', 'Admin', 'admin')
)
insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
  created_at, updated_at, confirmation_token, recovery_token,
  email_change, email_change_token_new
)
select
  '00000000-0000-0000-0000-000000000000'::uuid,
  id,
  'authenticated',
  'authenticated',
  email,
  encrypted_password,
  now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  jsonb_build_object('full_name', full_name, 'role', account_role),
  now(),
  now(),
  '',
  '',
  '',
  ''
from test_users
on conflict (id) do nothing;

insert into auth.identities (
  id, provider_id, user_id, identity_data, provider,
  last_sign_in_at, created_at, updated_at
)
select
  gen_random_uuid(),
  u.id::text,
  u.id,
  jsonb_build_object('sub', u.id::text, 'email', u.email, 'email_verified', true),
  'email',
  now(),
  now(),
  now()
from auth.users u
where u.email in ('maya@aura.test', 'layla@aura.test', 'owner@aura.test', 'admin@aura.test')
on conflict (provider_id, provider) do nothing;
