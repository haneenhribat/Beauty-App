create type public.order_status as enum ('pending', 'confirmed', 'preparing', 'shipped', 'out_for_delivery', 'delivered', 'cancelled', 'returned');

create table public.product_categories (
  id uuid primary key default gen_random_uuid(),
  parent_id uuid references public.product_categories(id) on delete set null,
  slug text not null unique,
  name text not null,
  description text,
  image_url text,
  sort_order integer not null default 0,
  is_active boolean not null default true
);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.product_categories(id),
  salon_id uuid references public.salons(id) on delete set null,
  slug text not null unique,
  sku text not null unique,
  name text not null,
  brand text not null,
  description text not null,
  benefits text[] not null default '{}',
  ingredients text,
  usage_instructions text,
  image_urls text[] not null default '{}',
  variations jsonb not null default '[]'::jsonb,
  price numeric(10,2) not null check (price >= 0),
  discount_price numeric(10,2) check (discount_price >= 0 and discount_price < price),
  stock_quantity integer not null default 0 check (stock_quantity >= 0),
  low_stock_threshold integer not null default 5 check (low_stock_threshold >= 0),
  is_featured boolean not null default false,
  is_bestseller boolean not null default false,
  is_new boolean not null default true,
  is_active boolean not null default true,
  sold_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.shopping_carts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.cart_items (
  id uuid primary key default gen_random_uuid(),
  cart_id uuid not null references public.shopping_carts(id) on delete cascade,
  product_id uuid not null references public.products(id),
  variation text not null default '',
  quantity integer not null check (quantity > 0),
  created_at timestamptz not null default now(),
  unique (cart_id, product_id, variation)
);

create table public.product_wishlist (
  user_id uuid not null references public.profiles(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, product_id)
);

create table public.customer_addresses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  label text not null default 'Home',
  full_name text not null,
  phone text not null,
  country text not null,
  city text not null,
  area text not null,
  street text not null,
  building text not null,
  floor text,
  apartment text,
  directions text,
  is_default boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.marketplace_promo_codes (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  discount_type text not null check (discount_type in ('percentage','fixed')),
  discount_value numeric(10,2) not null check (discount_value > 0),
  minimum_order numeric(10,2) not null default 0,
  maximum_discount numeric(10,2),
  starts_at timestamptz not null default now(),
  expires_at timestamptz not null,
  usage_limit integer,
  usage_count integer not null default 0,
  per_user_limit integer not null default 1,
  is_active boolean not null default true
);

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique default ('AU-ORD-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8))),
  user_id uuid not null references public.profiles(id),
  address_id uuid references public.customer_addresses(id) on delete set null,
  delivery_address jsonb not null,
  subtotal numeric(10,2) not null check (subtotal >= 0),
  discount_amount numeric(10,2) not null default 0 check (discount_amount >= 0),
  delivery_fee numeric(10,2) not null default 0 check (delivery_fee >= 0),
  total numeric(10,2) not null check (total >= 0),
  promo_code text,
  payment_method text not null,
  payment_status public.payment_status not null default 'pending',
  status public.order_status not null default 'pending',
  delivery_method text not null default 'standard',
  estimated_delivery_at timestamptz,
  courier_name text,
  tracking_number text,
  delivery_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid not null references public.products(id),
  product_name text not null,
  sku text not null,
  image_url text,
  variation text not null default '',
  unit_price numeric(10,2) not null check (unit_price >= 0),
  quantity integer not null check (quantity > 0),
  line_total numeric(10,2) generated always as (unit_price * quantity) stored
);

create table public.order_tracking_events (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  status public.order_status not null,
  title text not null,
  description text,
  created_at timestamptz not null default now()
);

create table public.marketplace_promo_redemptions (
  promo_id uuid not null references public.marketplace_promo_codes(id),
  user_id uuid not null references public.profiles(id),
  order_id uuid not null references public.orders(id),
  redeemed_at timestamptz not null default now(),
  primary key (promo_id, user_id, order_id)
);

create table public.product_reviews (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  order_item_id uuid not null references public.order_items(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  rating smallint not null check (rating between 1 and 5),
  review_text text check (char_length(review_text) <= 3000),
  photo_urls text[] not null default '{}',
  helpful_count integer not null default 0,
  created_at timestamptz not null default now(),
  unique (order_item_id, user_id)
);

create or replace function public.set_default_address()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.is_default then
    update public.customer_addresses set is_default = false where user_id = new.user_id and id <> new.id;
  end if;
  return new;
end; $$;
create trigger customer_address_default before insert or update on public.customer_addresses for each row execute function public.set_default_address();

create or replace function public.place_marketplace_order(
  p_address_id uuid,
  p_delivery_method text,
  p_payment_method text,
  p_promo_code text default null
) returns public.orders
language plpgsql security definer set search_path = public as $$
declare
  v_user uuid := auth.uid();
  v_cart uuid;
  v_address public.customer_addresses;
  v_order public.orders;
  v_subtotal numeric(10,2);
  v_discount numeric(10,2) := 0;
  v_delivery numeric(10,2);
  v_promo public.marketplace_promo_codes;
  v_item record;
begin
  if v_user is null then raise exception 'Authentication required'; end if;
  select id into v_cart from public.shopping_carts where user_id = v_user;
  if v_cart is null or not exists(select 1 from public.cart_items where cart_id = v_cart) then raise exception 'Your cart is empty'; end if;
  select * into v_address from public.customer_addresses where id = p_address_id and user_id = v_user;
  if not found then raise exception 'Delivery address not found'; end if;

  for v_item in
    select ci.quantity, p.id, p.name, p.stock_quantity
    from public.cart_items ci join public.products p on p.id = ci.product_id
    where ci.cart_id = v_cart for update of p
  loop
    if v_item.stock_quantity < v_item.quantity then
      raise exception 'Some items in your cart are no longer available. Please review your cart.';
    end if;
  end loop;

  select coalesce(sum(ci.quantity * coalesce(p.discount_price,p.price)),0)
  into v_subtotal from public.cart_items ci join public.products p on p.id=ci.product_id where ci.cart_id=v_cart;
  v_delivery := case when p_delivery_method='express' then 8 else case when v_subtotal >= 50 then 0 else 4 end end;

  if nullif(upper(trim(p_promo_code)),'') is not null then
    select * into v_promo from public.marketplace_promo_codes
      where code=upper(trim(p_promo_code)) and is_active and now() between starts_at and expires_at for update;
    if not found then raise exception 'This promo code is invalid or expired'; end if;
    if v_subtotal < v_promo.minimum_order then raise exception 'This order does not meet the promo minimum'; end if;
    if v_promo.usage_limit is not null and v_promo.usage_count >= v_promo.usage_limit then raise exception 'This promo code has reached its usage limit'; end if;
    if (select count(*) from public.marketplace_promo_redemptions where promo_id=v_promo.id and user_id=v_user) >= v_promo.per_user_limit then raise exception 'You have already used this promo code'; end if;
    v_discount := case when v_promo.discount_type='percentage' then v_subtotal*v_promo.discount_value/100 else v_promo.discount_value end;
    if v_promo.maximum_discount is not null then v_discount := least(v_discount,v_promo.maximum_discount); end if;
    v_discount := least(v_discount,v_subtotal);
  end if;

  insert into public.orders(user_id,address_id,delivery_address,subtotal,discount_amount,delivery_fee,total,promo_code,payment_method,delivery_method,estimated_delivery_at,status)
  values(v_user,v_address.id,to_jsonb(v_address)-'user_id',v_subtotal,v_discount,v_delivery,v_subtotal-v_discount+v_delivery,nullif(upper(trim(p_promo_code)),''),p_payment_method,p_delivery_method,now()+case when p_delivery_method='express' then interval '1 day' else interval '3 days' end,'confirmed') returning * into v_order;

  insert into public.order_items(order_id,product_id,product_name,sku,image_url,variation,unit_price,quantity)
  select v_order.id,p.id,p.name,p.sku,p.image_urls[1],ci.variation,coalesce(p.discount_price,p.price),ci.quantity
  from public.cart_items ci join public.products p on p.id=ci.product_id where ci.cart_id=v_cart;

  update public.products p set stock_quantity=p.stock_quantity-ci.quantity,sold_count=p.sold_count+ci.quantity,updated_at=now()
  from public.cart_items ci where ci.cart_id=v_cart and ci.product_id=p.id;
  insert into public.order_tracking_events(order_id,status,title,description) values(v_order.id,'confirmed','Order confirmed','Your order was received and inventory is reserved.');
  if v_promo.id is not null then
    update public.marketplace_promo_codes set usage_count=usage_count+1 where id=v_promo.id;
    insert into public.marketplace_promo_redemptions values(v_promo.id,v_user,v_order.id,now());
  end if;
  delete from public.cart_items where cart_id=v_cart;
  return v_order;
end; $$;

alter table public.product_categories enable row level security;
alter table public.products enable row level security;
alter table public.shopping_carts enable row level security;
alter table public.cart_items enable row level security;
alter table public.product_wishlist enable row level security;
alter table public.customer_addresses enable row level security;
alter table public.marketplace_promo_codes enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.order_tracking_events enable row level security;
alter table public.marketplace_promo_redemptions enable row level security;
alter table public.product_reviews enable row level security;

create policy "Public reads product categories" on public.product_categories for select using (is_active);
create policy "Public reads active products" on public.products for select using (is_active);
create policy "Users manage own cart" on public.shopping_carts for all to authenticated using (user_id=auth.uid()) with check (user_id=auth.uid());
create policy "Users manage own cart items" on public.cart_items for all to authenticated using (exists(select 1 from public.shopping_carts c where c.id=cart_id and c.user_id=auth.uid())) with check (exists(select 1 from public.shopping_carts c where c.id=cart_id and c.user_id=auth.uid()));
create policy "Users manage own wishlist" on public.product_wishlist for all to authenticated using (user_id=auth.uid()) with check (user_id=auth.uid());
create policy "Users manage own addresses" on public.customer_addresses for all to authenticated using (user_id=auth.uid()) with check (user_id=auth.uid());
create policy "Users view own orders" on public.orders for select to authenticated using (user_id=auth.uid());
create policy "Users view own order items" on public.order_items for select to authenticated using (exists(select 1 from public.orders o where o.id=order_id and o.user_id=auth.uid()));
create policy "Users view own tracking" on public.order_tracking_events for select to authenticated using (exists(select 1 from public.orders o where o.id=order_id and o.user_id=auth.uid()));
create policy "Public reads product reviews" on public.product_reviews for select using (true);
create policy "Verified buyers create reviews" on public.product_reviews for insert to authenticated with check (user_id=auth.uid() and exists(select 1 from public.order_items oi join public.orders o on o.id=oi.order_id where oi.id=order_item_id and oi.product_id=product_id and o.user_id=auth.uid() and o.status='delivered'));

grant select on public.product_categories,public.products,public.product_reviews to anon,authenticated;
grant select,insert,update,delete on public.shopping_carts,public.cart_items,public.product_wishlist,public.customer_addresses to authenticated;
grant select on public.orders,public.order_items,public.order_tracking_events to authenticated;
grant insert on public.product_reviews to authenticated;
grant execute on function public.place_marketplace_order(uuid,text,text,text) to authenticated;

create index products_category_idx on public.products(category_id,is_active);
create index products_salon_idx on public.products(salon_id,is_active);
create index products_discovery_idx on public.products(is_featured,is_bestseller,is_new);
create index cart_items_cart_idx on public.cart_items(cart_id);
create index orders_user_created_idx on public.orders(user_id,created_at desc);
create index order_items_order_idx on public.order_items(order_id);

insert into public.product_categories(slug,name,sort_order) values
('hair-care','Hair Care',1),('skin-care','Skin Care',2),('makeup','Makeup',3),('nail-care','Nail Care',4),('fragrances','Fragrances',5),('hair-tools','Hair Tools',6),('beauty-tools','Beauty Tools',7),('body-care','Body Care',8),('mens-grooming','Men''s Grooming',9),('salon-professional','Salon Professional Products',10);

with catalog(category_slug,slug,sku,name,brand,description,price,discount_price,stock,is_featured,is_bestseller,image) as (values
('hair-care','silk-repair-hair-mask','AUR-HC-001','Silk Repair Hair Mask','Aura Professional','A deeply nourishing mask for dry and damaged hair.',32.00,25.60,18,true,true,'https://images.unsplash.com/photo-1571781926291-c477ebfd024b?auto=format&fit=crop&w=900&q=85'),
('skin-care','vitamin-c-radiance-serum','AUR-SC-001','Vitamin C Radiance Serum','Maison Botanique','A brightening daily serum with stable vitamin C.',38.00,null,12,true,true,'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=900&q=85'),
('makeup','velvet-lip-treatment','AUR-MU-001','Velvet Lip Treatment','Luna','A nourishing tinted treatment with a soft velvet finish.',22.00,18.00,7,true,false,'https://images.unsplash.com/photo-1586495777744-4413f21062fa?auto=format&fit=crop&w=900&q=85'),
('nail-care','professional-nail-care-kit','AUR-NC-001','Professional Nail Care Kit','Muse Beauty','Salon-quality essentials for polished nails at home.',29.00,null,3,false,true,'https://images.unsplash.com/photo-1604654894610-df63bc536371?auto=format&fit=crop&w=900&q=85'),
('fragrances','rose-oud-eau-de-parfum','AUR-FR-001','Rose Oud Eau de Parfum','Noura','A modern floral oud fragrance with warm amber notes.',65.00,null,9,true,false,'https://images.unsplash.com/photo-1541643600914-78b084683601?auto=format&fit=crop&w=900&q=85'),
('hair-tools','ceramic-styling-brush','AUR-HT-001','Ceramic Styling Brush','Velvet Tools','A heat-retaining ceramic brush for smooth blowouts.',34.00,28.00,14,false,true,'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=900&q=85'),
('body-care','olive-body-butter','AUR-BC-001','Olive Body Butter','Olive Organic','Rich Palestinian olive oil body care for lasting softness.',27.00,null,20,true,false,'https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?auto=format&fit=crop&w=900&q=85'),
('beauty-tools','rose-quartz-facial-set','AUR-BT-001','Rose Quartz Facial Set','Serene Ritual','Cooling facial tools for a relaxing skincare ritual.',26.00,null,11,false,false,'https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?auto=format&fit=crop&w=900&q=85')
)
insert into public.products(category_id,slug,sku,name,brand,description,price,discount_price,stock_quantity,is_featured,is_bestseller,image_urls,benefits,ingredients,usage_instructions,variations)
select c.id,x.slug,x.sku,x.name,x.brand,x.description,x.price,x.discount_price,x.stock,x.is_featured,x.is_bestseller,array[x.image],array['Professional-quality formula','Curated by Aura beauty experts'],'See packaging for the complete ingredient list.','Use as directed on clean skin or hair.','["Standard"]'::jsonb
from catalog x join public.product_categories c on c.slug=x.category_slug;

insert into public.marketplace_promo_codes(code,discount_type,discount_value,minimum_order,maximum_discount,expires_at,usage_limit,per_user_limit)
values('AURA10','percentage',10,35,20,now()+interval '1 year',500,1),('GLOW15','percentage',15,60,25,now()+interval '6 months',250,1);
