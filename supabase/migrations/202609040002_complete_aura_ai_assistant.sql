create table public.assistant_conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null default 'Aura AI conversation',
  context jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.assistant_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.assistant_conversations(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role text not null check (role in ('user','assistant')),
  content text not null check (char_length(content) between 1 and 10000),
  created_at timestamptz not null default now()
);

alter table public.assistant_conversations enable row level security;
alter table public.assistant_messages enable row level security;
create policy "Users manage own assistant conversations" on public.assistant_conversations for all to authenticated using (user_id=auth.uid()) with check (user_id=auth.uid());
create policy "Users manage own assistant messages" on public.assistant_messages for all to authenticated using (user_id=auth.uid() and exists(select 1 from public.assistant_conversations c where c.id=conversation_id and c.user_id=auth.uid())) with check (user_id=auth.uid() and exists(select 1 from public.assistant_conversations c where c.id=conversation_id and c.user_id=auth.uid()));
grant select,insert,update,delete on public.assistant_conversations,public.assistant_messages to authenticated;
create index assistant_conversations_user_updated_idx on public.assistant_conversations(user_id,updated_at desc);
create index assistant_messages_conversation_idx on public.assistant_messages(conversation_id,created_at);

update public.salons set latitude=31.9038,longitude=35.2034 where city='Ramallah' and latitude is null;
update public.salons set latitude=32.2211,longitude=35.2544 where city='Nablus' and latitude is null;
update public.salons set latitude=31.7054,longitude=35.2024 where city='Bethlehem' and latitude is null;
update public.salons set latitude=31.5326,longitude=35.0998 where city='Hebron' and latitude is null;

create or replace function public.aura_slot_is_free(
  p_salon_id uuid, p_service_id uuid, p_specialist_id uuid, p_start timestamptz, p_exclude_booking uuid default null
) returns boolean language sql stable security definer set search_path=public as $$
  select not exists(
    select 1 from public.bookings b join public.services bs on bs.id=b.service_id
    where b.salon_id=p_salon_id and b.status in ('pending','confirmed')
      and (p_exclude_booking is null or b.id<>p_exclude_booking)
      and (p_specialist_id is null or b.specialist_id is null or b.specialist_id=p_specialist_id)
      and b.appointment_at < p_start + make_interval(mins=>(select duration_minutes from public.services where id=p_service_id))
      and b.appointment_at + make_interval(mins=>bs.duration_minutes) > p_start
  );
$$;
revoke all on function public.aura_slot_is_free(uuid,uuid,uuid,timestamptz,uuid) from public,anon,authenticated;

drop function if exists public.search_available_slots(uuid,date,uuid);
create function public.search_available_slots(p_salon_id uuid,p_service_id uuid,p_date date,p_specialist_id uuid default null,p_after time default null)
returns table(slot_at timestamptz) language sql security definer set search_path=public as $$
  with valid as (
    select s.id service_id,sa.id salon_id
    from public.services s join public.salons sa on sa.id=s.salon_id
    where s.id=p_service_id and s.salon_id=p_salon_id and s.is_active and sa.is_active and sa.is_open
      and (p_specialist_id is null or exists(select 1 from public.specialists sp where sp.id=p_specialist_id and sp.salon_id=sa.id and sp.is_active))
  ), slots as (
    select (p_date::timestamp + make_interval(mins=>m)) at time zone 'Asia/Hebron' slot_at
    from valid cross join generate_series(540,1080,30) m
  )
  select s.slot_at from slots s
  where s.slot_at>now() and (p_after is null or s.slot_at at time zone 'Asia/Hebron' >= p_date+p_after)
    and public.aura_slot_is_free(p_salon_id,p_service_id,p_specialist_id,s.slot_at,null)
  order by s.slot_at;
$$;
grant execute on function public.search_available_slots(uuid,uuid,date,uuid,time) to anon,authenticated;

create or replace function public.ai_create_booking(
  p_salon_id uuid,p_service_id uuid,p_specialist_id uuid,p_appointment_at timestamptz,
  p_location_type public.location_type default 'salon',p_address text default null,p_payment_method text default 'pay_at_salon'
) returns public.bookings language plpgsql security definer set search_path=public as $$
declare v_user uuid:=auth.uid();v_service public.services;v_specialist public.specialists;v_salon public.salons;v_booking public.bookings;
begin
  if v_user is null then raise exception 'Authentication required';end if;
  if p_appointment_at<=now() then raise exception 'Appointment must be in the future';end if;
  select * into v_salon from public.salons where id=p_salon_id and is_active and is_open for share;
  if not found then raise exception 'Salon is not accepting appointments';end if;
  if p_location_type='home' and (not v_salon.offers_home_service or nullif(trim(p_address),'') is null) then raise exception 'A valid address is required for an available home service';end if;
  select * into v_service from public.services where id=p_service_id and salon_id=p_salon_id and is_active;
  if not found then raise exception 'Service is unavailable';end if;
  if p_specialist_id is not null then select * into v_specialist from public.specialists where id=p_specialist_id and salon_id=p_salon_id and is_active;if not found then raise exception 'Specialist is unavailable';end if;end if;
  perform pg_advisory_xact_lock(hashtextextended('aura-booking-'||p_salon_id::text,0));
  if not public.aura_slot_is_free(p_salon_id,p_service_id,p_specialist_id,p_appointment_at,null) then raise exception 'That appointment overlaps an existing booking';end if;
  insert into public.bookings(customer_id,salon_id,service_id,specialist_id,specialist_name,appointment_at,location_type,address,service_price,additional_fee,payment_method,payment_status,status)
  values(v_user,p_salon_id,p_service_id,p_specialist_id,case when p_specialist_id is null then 'No Preference' else v_specialist.specialty end,p_appointment_at,p_location_type,p_address,v_service.price,case when p_location_type='home' then 12 else 0 end,p_payment_method,'pending','confirmed') returning * into v_booking;
  return v_booking;
end;$$;

create or replace function public.ai_reschedule_booking(p_booking_id uuid,p_appointment_at timestamptz)
returns public.bookings language plpgsql security definer set search_path=public as $$
declare v_booking public.bookings;v_salon public.salons;
begin
  if auth.uid() is null then raise exception 'Authentication required';end if;
  if p_appointment_at<=now() then raise exception 'Appointment must be in the future';end if;
  select * into v_booking from public.bookings where id=p_booking_id and customer_id=auth.uid() and status='confirmed' for update;
  if not found then raise exception 'Appointment not found or cannot be rescheduled';end if;
  select * into v_salon from public.salons where id=v_booking.salon_id and is_active and is_open;
  if not found then raise exception 'Salon is not accepting appointments';end if;
  perform pg_advisory_xact_lock(hashtextextended('aura-booking-'||v_booking.salon_id::text,0));
  if not public.aura_slot_is_free(v_booking.salon_id,v_booking.service_id,v_booking.specialist_id,p_appointment_at,p_booking_id) then raise exception 'That appointment overlaps an existing booking';end if;
  update public.bookings set appointment_at=p_appointment_at,updated_at=now() where id=p_booking_id returning * into v_booking;
  return v_booking;
end;$$;

create or replace function public.get_booking_cancellation_quote(p_booking_id uuid)
returns table(booking_id uuid,booking_number text,fee numeric,policy text,can_cancel boolean) language sql security definer set search_path=public as $$
  select b.id,b.booking_number,
    case when b.appointment_at-now()<interval '24 hours' then round((b.service_price+b.additional_fee)*0.20,2) else 0 end,
    'Free cancellation until 24 hours before the appointment; later cancellations may incur a 20% fee.',
    b.status in ('pending','confirmed') and b.appointment_at>now()
  from public.bookings b where b.id=p_booking_id and b.customer_id=auth.uid();
$$;
grant execute on function public.get_booking_cancellation_quote(uuid) to authenticated;
grant execute on function public.ai_create_booking(uuid,uuid,uuid,timestamptz,public.location_type,text,text) to authenticated;
grant execute on function public.ai_reschedule_booking(uuid,timestamptz) to authenticated;
