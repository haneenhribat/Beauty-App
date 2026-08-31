alter table public.bookings add column if not exists specialist_name text;

insert into public.salons (id, slug, name, address, city, image_url, price_level, offers_home_service, is_open)
values
  ('20000000-0000-4000-8000-000000000001', 'luna-beauty', 'Luna Beauty Studio', 'Al-Masyoun', 'Ramallah', 'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=1200&q=85', 3, true, true),
  ('20000000-0000-4000-8000-000000000002', 'muse-studio', 'Muse Nail & Beauty Bar', 'Al-Tira', 'Ramallah', 'https://images.unsplash.com/photo-1600948836101-f9ffda59d250?auto=format&fit=crop&w=1200&q=85', 2, false, true),
  ('20000000-0000-4000-8000-000000000003', 'maison-glow', 'Maison Glow', 'Rafidia', 'Nablus', 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&w=1200&q=85', 4, true, false),
  ('20000000-0000-4000-8000-000000000004', 'velvet-room', 'The Velvet Room', 'Ein Sarah', 'Hebron', 'https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?auto=format&fit=crop&w=1200&q=85', 3, true, true),
  ('20000000-0000-4000-8000-000000000005', 'noura-beauty', 'Noura Beauty House', 'Bethlehem Center', 'Bethlehem', 'https://images.unsplash.com/photo-1633681926022-84c23e8cb2d6?auto=format&fit=crop&w=1200&q=85', 2, true, true),
  ('20000000-0000-4000-8000-000000000006', 'serene-spa', 'Serene Ritual Spa', 'Al-Irsal', 'Ramallah', 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=1200&q=85', 4, false, false),
  ('20000000-0000-4000-8000-000000000007', 'blush-brow', 'Blush Brow Atelier', 'Old City', 'Nablus', 'https://images.unsplash.com/photo-1516975080664-ed2fc6a32937?auto=format&fit=crop&w=1200&q=85', 1, false, true),
  ('20000000-0000-4000-8000-000000000008', 'olive-organic', 'Olive Organic Beauty', 'Beit Jala', 'Bethlehem', 'https://images.unsplash.com/photo-1595476108010-b4d1f102b1b1?auto=format&fit=crop&w=1200&q=85', 2, true, true)
on conflict (slug) do update set
  name = excluded.name, address = excluded.address, city = excluded.city,
  image_url = excluded.image_url, price_level = excluded.price_level,
  offers_home_service = excluded.offers_home_service, is_open = excluded.is_open;

with service_templates (service_key, name, description, category, duration_minutes, price) as (
  values
    ('haircut', 'Haircut & Styling', 'A tailored cut, wash and professional finish.', 'Hair', 60, 25.00),
    ('color', 'Hair Coloring', 'Personalized color consultation and full application.', 'Hair', 120, 60.00),
    ('manicure', 'Manicure', 'Nail shaping, detailed cuticle care and polish.', 'Nails', 45, 20.00),
    ('pedicure', 'Pedicure', 'Restorative foot care, shaping and premium polish.', 'Nails', 55, 25.00),
    ('facial', 'Facial Treatment', 'Skin analysis and a customized radiance facial.', 'Skincare', 75, 45.00),
    ('makeup', 'Makeup', 'Professional occasion makeup tailored to your style.', 'Makeup', 60, 40.00)
)
insert into public.services (id, salon_id, name, description, category, duration_minutes, price)
select
  (substr(md5(s.slug || t.service_key),1,8) || '-' || substr(md5(s.slug || t.service_key),9,4) || '-4' || substr(md5(s.slug || t.service_key),14,3) || '-8' || substr(md5(s.slug || t.service_key),18,3) || '-' || substr(md5(s.slug || t.service_key),21,12))::uuid,
  s.id, t.name, t.description, t.category, t.duration_minutes, t.price
from public.salons s cross join service_templates t
on conflict (id) do update set
  name = excluded.name, description = excluded.description, category = excluded.category,
  duration_minutes = excluded.duration_minutes, price = excluded.price, is_active = true;
