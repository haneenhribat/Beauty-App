create table if not exists public.platform_faq (
  id uuid primary key default gen_random_uuid(),
  topic text not null unique,
  question text not null,
  answer text not null,
  updated_at timestamptz not null default now()
);

alter table public.platform_faq enable row level security;
create policy "Public reads platform FAQ" on public.platform_faq for select using (true);
grant select on public.platform_faq to anon, authenticated;

insert into public.platform_faq (topic, question, answer) values
  ('booking', 'How does booking work?', 'Choose a salon, service, specialist and an available time. Aura shows the full price and asks you to confirm before the appointment is created.'),
  ('cancellation', 'What is the cancellation policy?', 'Appointments should be cancelled at least 24 hours before the scheduled time. Any fee must be shown before you confirm cancellation.'),
  ('rescheduling', 'Can I reschedule?', 'Yes. Choose a currently available replacement time and confirm it. Aura keeps the same booking reference and only releases the old time after the new time is secured.'),
  ('payments', 'How can I pay?', 'Available payment methods are shown during booking or checkout. Depending on the service, Aura supports online payment and payment at the salon or home appointment.'),
  ('promo_codes', 'How do promo codes work?', 'Enter an active code at marketplace checkout. Eligibility and the discount are validated before the order is placed.'),
  ('home_services', 'How do home services work?', 'Salons marked Home Service can send a specialist to your address. Any travel fee is shown before confirmation.'),
  ('delivery', 'How can I track delivery?', 'Open My Orders or ask Aura AI to track your latest order. Aura shows the latest status and tracking update available from the seller.'),
  ('returns', 'Can marketplace products be returned?', 'Return eligibility depends on the product condition and seller policy. Contact Aura support from your order details before returning an item.'),
  ('reviews', 'Who can leave a review?', 'Customers can review a salon after a completed appointment and review a product after a delivered order.'),
  ('account', 'How do I manage my account?', 'Use My Profile to view your account details, and the customer dashboard to access bookings, orders, addresses, favorites and wishlist.')
on conflict (topic) do update set question=excluded.question, answer=excluded.answer, updated_at=now();

create or replace function public.ai_create_booking(
  p_salon_id uuid,
  p_service_id uuid,
  p_specialist_id uuid,
  p_appointment_at timestamptz,
  p_location_type public.location_type default 'salon',
  p_address text default null,
  p_payment_method text default 'pay_at_salon'
) returns public.bookings
language plpgsql security definer set search_path = public as $$
declare
  v_user uuid := auth.uid();
  v_service public.services;
  v_specialist public.specialists;
  v_booking public.bookings;
begin
  if v_user is null then raise exception 'Authentication required'; end if;
  if p_appointment_at <= now() then raise exception 'Appointment must be in the future'; end if;
  select * into v_service from public.services where id=p_service_id and salon_id=p_salon_id and is_active;
  if not found then raise exception 'Service is unavailable'; end if;
  if p_specialist_id is not null then
    select * into v_specialist from public.specialists where id=p_specialist_id and salon_id=p_salon_id and is_active;
    if not found then raise exception 'Specialist is unavailable'; end if;
  end if;
  perform pg_advisory_xact_lock(hashtextextended(p_salon_id::text || coalesce(p_specialist_id::text,'any') || p_appointment_at::text, 0));
  if exists(select 1 from public.bookings b where b.salon_id=p_salon_id and b.appointment_at=p_appointment_at and b.status in ('pending','confirmed') and (p_specialist_id is null or b.specialist_id=p_specialist_id)) then
    raise exception 'That appointment was just taken';
  end if;
  insert into public.bookings(customer_id,salon_id,service_id,specialist_id,specialist_name,appointment_at,location_type,address,service_price,additional_fee,payment_method,payment_status,status)
  values(v_user,p_salon_id,p_service_id,p_specialist_id,coalesce(v_specialist.specialty,'No Preference'),p_appointment_at,p_location_type,p_address,v_service.price,case when p_location_type='home' then 12 else 0 end,p_payment_method,'pending','confirmed') returning * into v_booking;
  return v_booking;
end; $$;

create or replace function public.ai_reschedule_booking(p_booking_id uuid, p_appointment_at timestamptz)
returns public.bookings language plpgsql security definer set search_path=public as $$
declare v_booking public.bookings;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  if p_appointment_at <= now() then raise exception 'Appointment must be in the future'; end if;
  select * into v_booking from public.bookings where id=p_booking_id and customer_id=auth.uid() and status='confirmed' for update;
  if not found then raise exception 'Appointment not found or cannot be rescheduled'; end if;
  perform pg_advisory_xact_lock(hashtextextended(v_booking.salon_id::text || coalesce(v_booking.specialist_id::text,'any') || p_appointment_at::text,0));
  if exists(select 1 from public.bookings b where b.id<>p_booking_id and b.salon_id=v_booking.salon_id and b.appointment_at=p_appointment_at and b.status in ('pending','confirmed') and (v_booking.specialist_id is null or b.specialist_id=v_booking.specialist_id)) then raise exception 'That appointment was just taken'; end if;
  update public.bookings set appointment_at=p_appointment_at,updated_at=now() where id=p_booking_id returning * into v_booking;
  return v_booking;
end; $$;

create or replace function public.ai_cancel_booking(p_booking_id uuid)
returns public.bookings language plpgsql security definer set search_path=public as $$
declare v_booking public.bookings;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  update public.bookings set status='cancelled',updated_at=now()
  where id=p_booking_id and customer_id=auth.uid() and status in ('pending','confirmed') returning * into v_booking;
  if not found then raise exception 'Appointment not found or cannot be cancelled'; end if;
  return v_booking;
end; $$;

grant execute on function public.ai_create_booking(uuid,uuid,uuid,timestamptz,public.location_type,text,text) to authenticated;
grant execute on function public.ai_reschedule_booking(uuid,timestamptz) to authenticated;
grant execute on function public.ai_cancel_booking(uuid) to authenticated;

create or replace function public.search_available_slots(p_salon_id uuid, p_date date, p_specialist_id uuid default null)
returns table(slot_at timestamptz) language sql security definer set search_path=public as $$
  with slots as (
    select (p_date::timestamp + make_interval(hours=>h)) at time zone 'Asia/Hebron' as slot_at
    from generate_series(9,18) h
  )
  select s.slot_at from slots s
  where s.slot_at > now()
    and not exists (
      select 1 from public.bookings b
      where b.salon_id=p_salon_id and b.appointment_at=s.slot_at
        and b.status in ('pending','confirmed')
        and (p_specialist_id is null or b.specialist_id=p_specialist_id)
    )
  order by s.slot_at;
$$;
grant execute on function public.search_available_slots(uuid,date,uuid) to anon, authenticated;
