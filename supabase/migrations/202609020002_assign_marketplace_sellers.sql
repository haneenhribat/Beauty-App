update public.products p set salon_id = s.id
from public.salons s
where (p.brand in ('Aura Professional','Luna') and s.slug='luna-beauty')
   or (p.brand='Maison Botanique' and s.slug='maison-glow')
   or (p.brand='Muse Beauty' and s.slug='muse-studio')
   or (p.brand='Noura' and s.slug='noura-beauty')
   or (p.brand='Velvet Tools' and s.slug='velvet-room')
   or (p.brand='Olive Organic' and s.slug='olive-organic')
   or (p.brand='Serene Ritual' and s.slug='serene-spa');
