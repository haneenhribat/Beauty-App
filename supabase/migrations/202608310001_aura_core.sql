create extension if not exists pgcrypto;

create type public.account_role as enum ('customer', 'specialist', 'owner', 'admin');
create type public.booking_status as enum ('pending', 'confirmed', 'completed', 'cancelled');
create type public.location_type as enum ('salon', 'home');
create type public.payment_status as enum ('pending', 'paid', 'refunded');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  phone text,
  role public.account_role not null default 'customer',
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.salons (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  owner_id uuid references public.profiles(id) on delete set null,
  name text not null,
  description text,
  address text not null,
  city text not null,
  latitude numeric,
  longitude numeric,
  image_url text,
  price_level smallint check (price_level between 1 and 4),
  offers_home_service boolean not null default false,
  is_open boolean not null default true,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.services (
  id uuid primary key default gen_random_uuid(),
  salon_id uuid not null references public.salons(id) on delete cascade,
  name text not null,
  description text,
  category text not null,
  duration_minutes integer not null check (duration_minutes > 0),
  price numeric(10,2) not null check (price >= 0),
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.specialists (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid unique references public.profiles(id) on delete cascade,
  salon_id uuid not null references public.salons(id) on delete cascade,
  specialty text not null,
  experience_years integer not null default 0 check (experience_years >= 0),
  rating numeric(2,1) not null default 0 check (rating between 0 and 5),
  image_url text,
  is_active boolean not null default true
);

create table public.bookings (
  id uuid primary key default gen_random_uuid(),
  booking_number text not null unique default ('AU-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8))),
  customer_id uuid not null references public.profiles(id) on delete cascade,
  salon_id uuid not null references public.salons(id),
  service_id uuid not null references public.services(id),
  specialist_id uuid references public.specialists(id),
  appointment_at timestamptz not null,
  location_type public.location_type not null default 'salon',
  address text,
  location_notes text,
  service_price numeric(10,2) not null check (service_price >= 0),
  additional_fee numeric(10,2) not null default 0 check (additional_fee >= 0),
  payment_method text not null,
  payment_status public.payment_status not null default 'pending',
  status public.booking_status not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (location_type = 'salon' or address is not null)
);

create table public.favorites (
  user_id uuid not null references public.profiles(id) on delete cascade,
  salon_id uuid not null references public.salons(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, salon_id)
);

create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null unique references public.bookings(id) on delete cascade,
  customer_id uuid not null references public.profiles(id) on delete cascade,
  salon_id uuid not null references public.salons(id) on delete cascade,
  rating smallint not null check (rating between 1 and 5),
  comment text check (char_length(comment) <= 2000),
  created_at timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, full_name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    coalesce((new.raw_user_meta_data ->> 'role')::public.account_role, 'customer')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.salons enable row level security;
alter table public.services enable row level security;
alter table public.specialists enable row level security;
alter table public.bookings enable row level security;
alter table public.favorites enable row level security;
alter table public.reviews enable row level security;

create policy "Public can view active salons" on public.salons for select to anon, authenticated using (is_active);
create policy "Public can view active services" on public.services for select to anon, authenticated using (is_active);
create policy "Public can view active specialists" on public.specialists for select to anon, authenticated using (is_active);
create policy "Public can view reviews" on public.reviews for select to anon, authenticated using (true);
create policy "Users view own profile" on public.profiles for select to authenticated using ((select auth.uid()) = id);
create policy "Users update own profile" on public.profiles for update to authenticated using ((select auth.uid()) = id) with check ((select auth.uid()) = id);
create policy "Customers view own bookings" on public.bookings for select to authenticated using ((select auth.uid()) = customer_id);
create policy "Customers create own bookings" on public.bookings for insert to authenticated with check ((select auth.uid()) = customer_id);
create policy "Customers update own bookings" on public.bookings for update to authenticated using ((select auth.uid()) = customer_id) with check ((select auth.uid()) = customer_id);
create policy "Users manage own favorites" on public.favorites for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "Customers create own reviews" on public.reviews for insert to authenticated with check ((select auth.uid()) = customer_id and exists (select 1 from public.bookings b where b.id = booking_id and b.customer_id = (select auth.uid()) and b.status = 'completed'));
create policy "Customers update own reviews" on public.reviews for update to authenticated using ((select auth.uid()) = customer_id) with check ((select auth.uid()) = customer_id);

grant usage on schema public to anon, authenticated;
grant select on public.salons, public.services, public.specialists, public.reviews to anon, authenticated;
grant select, update on public.profiles to authenticated;
grant select, insert, update on public.bookings to authenticated;
grant select, insert, update, delete on public.favorites to authenticated;
grant insert, update on public.reviews to authenticated;

create index bookings_customer_date_idx on public.bookings(customer_id, appointment_at desc);
create index services_salon_idx on public.services(salon_id);
create index specialists_salon_idx on public.specialists(salon_id);
create index reviews_salon_idx on public.reviews(salon_id);
