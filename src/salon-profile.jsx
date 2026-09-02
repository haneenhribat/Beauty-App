import React, { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Accessibility,
  AirVent,
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  CalendarCheck,
  Car,
  ChevronDown,
  Clock3,
  Coffee,
  CreditCard,
  Heart,
  House,
  Images,
  Map,
  MapPin,
  Navigation,
  ParkingCircle,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Star,
  UserRound,
  UsersRound,
  Wifi,
  X,
} from "lucide-react";
import { useAuth } from "./context/AuthContext.jsx";
import {
  getFavorites,
  getSalonDetails,
  toggleFavorite,
} from "./lib/aura-api.js";

const galleryFallback = [
  "https://images.unsplash.com/photo-1521590832167-7bcbfaa6381b1?auto=format&fit=crop&w=1200&q=85",
  "https://images.unsplash.com/photo-1600948836101-f9ffda59d250?auto=format&fit=crop&w=1200&q=85",
  "https://images.unsplash.com/photo-1562322140-8baeececf3df?auto=format&fit=crop&w=1200&q=85",
  "https://images.unsplash.com/photo-1633681926022-84c23e8cb2d6?auto=format&fit=crop&w=1200&q=85",
];
const specialistNames = [
  "Layla Nasser",
  "Sara Khalil",
  "Noor Saleh",
  "Maya Darwish",
];
const openingHours = [
  ["Sunday", "10:00 AM – 6:00 PM"],
  ["Monday", "9:00 AM – 8:00 PM"],
  ["Tuesday", "9:00 AM – 8:00 PM"],
  ["Wednesday", "9:00 AM – 8:00 PM"],
  ["Thursday", "9:00 AM – 9:00 PM"],
  ["Friday", "Closed"],
  ["Saturday", "10:00 AM – 7:00 PM"],
];
const offers = [
  {
    discount: "20% OFF",
    title: "Hair Coloring",
    copy: "Refresh your color with a professional consultation included.",
    expires: "September 30",
  },
  {
    discount: "PACKAGE",
    title: "Manicure + Pedicure · $35",
    copy: "Complete nail care in one relaxing appointment.",
    expires: "October 15",
  },
  {
    discount: "15% OFF",
    title: "First Home Service",
    copy: "Enjoy your first Aura home appointment for less.",
    expires: "October 31",
  },
];
const products = [
  {
    name: "Hydrating Hair Mask",
    brand: "Aura Professional",
    price: 28,
    rating: 4.9,
    image:
      "https://images.unsplash.com/photo-1571781926291-c477ebfd024b?auto=format&fit=crop&w=600&q=85",
  },
  {
    name: "Radiance Facial Serum",
    brand: "Maison Botanique",
    price: 38,
    rating: 4.8,
    image:
      "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=600&q=85",
  },
  {
    name: "Nail Care Kit",
    brand: "Muse Beauty",
    price: 24,
    rating: 4.7,
    image:
      "https://images.unsplash.com/photo-1604654894610-df63bc536371?auto=format&fit=crop&w=600&q=85",
  },
  {
    name: "Velvet Lip Treatment",
    brand: "Luna",
    price: 19,
    rating: 4.9,
    image:
      "https://images.unsplash.com/photo-1586495777744-4413f21062fa?auto=format&fit=crop&w=600&q=85",
  },
];
const policies = [
  [
    "Cancellation policy",
    "Cancel at least 24 hours before your appointment to avoid a cancellation fee.",
  ],
  [
    "Late arrival policy",
    "Arrivals more than 15 minutes late may require a shorter service or a new appointment.",
  ],
  [
    "Rescheduling policy",
    "Appointments can be rescheduled from My Bookings, subject to availability.",
  ],
  [
    "Payment policy",
    "Cash and card payments are accepted. Online payment status is shown before confirmation.",
  ],
  [
    "Home service policy",
    "A travel fee may apply. Please provide a complete address and a suitable service space.",
  ],
];
const amenityItems = [
  [Wifi, "Wi-Fi"],
  [Car, "Parking"],
  [CreditCard, "Card payments"],
  [Accessibility, "Accessible"],
  [UsersRound, "Private rooms"],
  [AirVent, "Air conditioning"],
  [Coffee, "Coffee & drinks"],
];
const loadLocal = (key, fallback = []) => {
  try {
    return JSON.parse(localStorage.getItem(key)) || fallback;
  } catch {
    return fallback;
  }
};
const saveLocal = (key, value) =>
  localStorage.setItem(key, JSON.stringify(value));
const bookingUrl = (slug, { service, specialist, home } = {}) => {
  const params = new URLSearchParams();
  if (service) params.set("service", service);
  if (specialist) params.set("specialist", specialist);
  if (home) params.set("home", "true");
  return `/booking/${slug}${params.size ? `?${params}` : ""}`;
};

function SectionTitle({ eyebrow, title, copy }) {
  return (
    <div>
      <p className="text-[11px] font-bold uppercase tracking-[.16em] text-wine-600">
        {eyebrow}
      </p>
      <h2 className="mt-2 font-display text-3xl font-bold tracking-[-.035em]">
        {title}
      </h2>
      {copy && <p className="mt-2 text-sm leading-6 text-stone-500">{copy}</p>}
    </div>
  );
}
function ProfileSkeleton() {
  return (
    <main className="min-h-screen animate-pulse bg-[#f7f2ec]">
      <div className="h-20 bg-white" />
      <div className="wrap py-8">
        <div className="h-[470px] rounded-3xl bg-stone-200" />
        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_330px]">
          <div className="h-[700px] rounded-3xl bg-white" />
          <div className="h-80 rounded-3xl bg-white" />
        </div>
      </div>
    </main>
  );
}
function ProfileError({ message }) {
  return (
    <main className="grid min-h-screen place-items-center bg-[#f7f2ec] px-5">
      <div className="max-w-lg rounded-3xl bg-white p-8 text-center shadow-card">
        <Sparkles className="mx-auto text-wine-700" />
        <h1 className="mt-5 font-display text-3xl font-bold">
          Salon unavailable
        </h1>
        <p className="mt-3 text-sm text-stone-500">
          {message || "This salon profile could not be loaded."}
        </p>
        <a href="/salons" className="btn-primary mt-6">
          <ArrowLeft size={16} />
          Back to discovery
        </a>
      </div>
    </main>
  );
}

function Gallery({ images, name, onOpen }) {
  return (
    <section
      id="overview"
      className="grid h-[310px] gap-2 overflow-hidden rounded-3xl sm:h-[460px] sm:grid-cols-[1.5fr_1fr]"
    >
      <img
        src={images[0]}
        alt={`${name} salon`}
        className="h-full w-full object-cover"
      />
      <div className="relative hidden grid-cols-2 gap-2 sm:grid">
        {images.slice(1, 5).map((image, index) => (
          <img
            key={image}
            src={image}
            alt={`${name} gallery ${index + 2}`}
            className="h-full min-h-0 w-full object-cover"
          />
        ))}
        <button
          onClick={onOpen}
          className="absolute bottom-4 right-4 flex items-center gap-2 rounded-xl bg-white px-4 py-3 text-xs font-bold shadow-card"
        >
          <Images size={16} />
          View all photos
        </button>
      </div>
      <button
        onClick={onOpen}
        className="absolute bottom-4 right-4 flex items-center gap-2 rounded-xl bg-white px-4 py-3 text-xs font-bold shadow-card sm:hidden"
      >
        <Images size={16} />
        Photos
      </button>
    </section>
  );
}
function GalleryModal({ images, name, onClose }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[70] overflow-y-auto bg-[#211a1c]/95 p-5"
      role="dialog"
      aria-modal="true"
    >
      <div className="mx-auto max-w-5xl">
        <div className="flex items-center justify-between py-4 text-white">
          <h2 className="font-display text-2xl font-bold">{name} gallery</h2>
          <button
            onClick={onClose}
            className="grid h-11 w-11 place-items-center rounded-full bg-white/10"
            aria-label="Close gallery"
          >
            <X />
          </button>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {images.map((image, index) => (
            <img
              key={`${image}-${index}`}
              src={image}
              alt={`${name} photo ${index + 1}`}
              className="h-72 w-full rounded-2xl object-cover sm:h-96"
            />
          ))}
        </div>
      </div>
    </motion.div>
  );
}

function Services({ salon, services }) {
  const grouped = services.reduce(
    (groups, item) => ({
      ...groups,
      [item.category]: [...(groups[item.category] || []), item],
    }),
    {},
  );
  return (
    <section
      id="services"
      className="scroll-mt-28 rounded-3xl bg-white p-6 shadow-sm sm:p-8"
    >
      <SectionTitle
        eyebrow="Services & prices"
        title="Choose your treatment"
        copy="Transparent pricing, service duration, and direct booking."
      />
      <div className="mt-7 space-y-8">
        {Object.entries(grouped).map(([category, items]) => (
          <div key={category}>
            <h3 className="border-b border-stone-100 pb-3 text-lg font-bold text-wine-800">
              {category}
            </h3>
            <div className="divide-y divide-stone-100">
              {items.map((service, index) => (
                <article
                  key={service.id}
                  className="grid gap-4 py-5 sm:grid-cols-[1fr_auto] sm:items-center"
                >
                  <div>
                    <h4 className="font-bold">{service.name}</h4>
                    <p className="mt-1 text-sm leading-6 text-stone-500">
                      {service.description}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-3 text-xs text-stone-400">
                      <span className="flex items-center gap-1">
                        <Clock3 size={13} />
                        {service.duration_minutes} min
                      </span>
                      <span className="font-semibold text-emerald-700">
                        Next available:{" "}
                        {index % 2 ? "Today 5:00 PM" : "Today 3:30 PM"}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between gap-4 sm:block sm:text-right">
                    <p className="font-display text-xl font-bold text-wine-700">
                      ${Number(service.price).toFixed(0)}
                    </p>
                    <a
                      href={bookingUrl(salon.slug, { service: service.name })}
                      className="mt-2 inline-flex rounded-lg bg-wine-700 px-4 py-2 text-xs font-bold text-white"
                    >
                      Book
                    </a>
                  </div>
                </article>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function Specialists({ salon, items }) {
  const visible = items.length
    ? items
    : [
        {
          id: "mock-1",
          specialty: "Hair stylist & colorist",
          rating: 4.9,
          experience_years: 7,
          image_url:
            "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&q=85",
        },
        {
          id: "mock-2",
          specialty: "Skin & beauty specialist",
          rating: 4.8,
          experience_years: 6,
          image_url:
            "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?auto=format&fit=crop&w=400&q=85",
        },
      ];
  return (
    <section
      id="specialists"
      className="scroll-mt-28 rounded-3xl bg-white p-6 shadow-sm sm:p-8"
    >
      <SectionTitle
        eyebrow="Our team"
        title="Meet our specialists"
        copy="Experienced professionals ready to personalize your appointment."
      />
      <div className="mt-7 grid gap-4 sm:grid-cols-2">
        {visible.map((person, index) => {
          const name = specialistNames[index % specialistNames.length];
          return (
            <article
              key={person.id}
              className="rounded-2xl border border-stone-100 p-5"
            >
              <div className="flex gap-4">
                <img
                  src={person.image_url || galleryFallback[index]}
                  alt={name}
                  className="h-20 w-20 rounded-2xl object-cover"
                />
                <div>
                  <h3 className="font-bold">{name}</h3>
                  <p className="mt-1 text-sm text-stone-500">
                    {person.specialty}
                  </p>
                  <p className="mt-2 flex items-center gap-1 text-xs font-bold text-amber-700">
                    <Star size={12} fill="currentColor" />
                    {Number(person.rating || 4.8).toFixed(1)}{" "}
                    <span className="font-normal text-stone-400">
                      · {person.experience_years || 5} years
                    </span>
                  </p>
                </div>
              </div>
              <p className="mt-4 rounded-xl bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-700">
                Available {index ? "today at 5:00 PM" : "today at 3:30 PM"}
              </p>
              <div className="mt-4 grid grid-cols-2 gap-2">
                <a
                  href="#specialists"
                  className="btn-secondary rounded-xl px-3 py-2.5 text-xs"
                >
                  View profile
                </a>
                <a
                  href={bookingUrl(salon.slug, { specialist: name })}
                  className="btn-primary rounded-xl px-3 py-2.5 text-xs"
                >
                  Book
                </a>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

function Reviews({ reviews }) {
  const [sort, setSort] = useState("Most Recent");
  const sorted = useMemo(
    () =>
      [...reviews].sort(
        sort === "Highest Rated"
          ? (a, b) => b.rating - a.rating
          : sort === "Lowest Rated"
            ? (a, b) => a.rating - b.rating
            : (a, b) => new Date(b.created_at) - new Date(a.created_at),
      ),
    [reviews, sort],
  );
  const average = reviews.length
    ? reviews.reduce((sum, x) => sum + Number(x.rating), 0) / reviews.length
    : 0;
  const distribution = [5, 4, 3, 2, 1].map((star) => [
    star,
    reviews.filter((x) => x.rating === star).length,
  ]);
  return (
    <section
      id="reviews"
      className="scroll-mt-28 rounded-3xl bg-white p-6 shadow-sm sm:p-8"
    >
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <SectionTitle eyebrow="Verified reviews" title="What customers say" />
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          className="h-11 rounded-xl border border-stone-200 bg-white px-3 text-sm font-bold"
        >
          {["Most Recent", "Highest Rated", "Lowest Rated"].map((x) => (
            <option key={x}>{x}</option>
          ))}
        </select>
      </div>
      <div className="mt-7 grid gap-7 md:grid-cols-[180px_1fr]">
        <div className="text-center md:text-left">
          <p className="font-display text-5xl font-bold text-wine-800">
            {reviews.length ? average.toFixed(1) : "New"}
          </p>
          <p className="mt-1 text-sm text-stone-400">
            {reviews.length} verified reviews
          </p>
          <div className="mt-5 space-y-2">
            {distribution.map(([star, count]) => (
              <div key={star} className="flex items-center gap-2 text-xs">
                <span>{star}★</span>
                <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-stone-100">
                  <span
                    className="block h-full rounded-full bg-amber-400"
                    style={{
                      width: `${reviews.length ? (count / reviews.length) * 100 : 0}%`,
                    }}
                  />
                </span>
                <span className="w-4 text-stone-400">{count}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="space-y-4">
          {sorted.slice(0, 4).map((review, index) => (
            <article key={review.id} className="rounded-2xl bg-[#f7f2ec] p-5">
              <div className="flex items-center gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-full bg-wine-100 font-bold text-wine-800">
                  A
                </span>
                <div>
                  <p className="text-sm font-bold">Aura Customer</p>
                  <p className="text-xs text-stone-400">
                    Verified appointment ·{" "}
                    {new Date(review.created_at).toLocaleDateString()}
                  </p>
                </div>
                <span className="ml-auto text-xs font-bold text-amber-700">
                  {review.rating} ★
                </span>
              </div>
              <p className="mt-4 text-sm leading-6 text-stone-600">
                {review.comment ||
                  "A wonderful appointment and professional service."}
              </p>
            </article>
          ))}
          {!reviews.length && (
            <div className="rounded-2xl border border-dashed border-wine-200 p-8 text-center text-sm text-stone-500">
              No reviews yet. Be the first to review a completed appointment.
            </div>
          )}
          <a href="#reviews" className="btn-secondary rounded-xl">
            View all reviews
          </a>
        </div>
      </div>
    </section>
  );
}

export function SalonProfilePage({ id }) {
  const { user, isAuthenticated } = useAuth();
  const [salon, setSalon] = useState(null),
    [loading, setLoading] = useState(true),
    [error, setError] = useState(""),
    [galleryOpen, setGalleryOpen] = useState(false),
    [favorite, setFavorite] = useState(false);
  useEffect(() => {
    let active = true;
    Promise.all([
      getSalonDetails(id),
      isAuthenticated ? getFavorites(user.id) : Promise.resolve([]),
    ])
      .then(([row, favorites]) => {
        if (!active) return;
        setSalon(row);
        setFavorite(favorites.some((x) => x.slug === id));
        const recent = [
          id,
          ...loadLocal("auraRecentlyViewed", []).filter((x) => x !== id),
        ].slice(0, 5);
        saveLocal("auraRecentlyViewed", recent);
      })
      .catch((e) => active && setError(e.message))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [id, isAuthenticated, user?.id]);
  if (loading) return <ProfileSkeleton />;
  if (error || !salon) return <ProfileError message={error} />;
  const services = (salon.services || []).filter((x) => x.is_active !== false);
  const reviews = salon.reviews || [];
  const images = [salon.image_url, ...galleryFallback]
    .filter(Boolean)
    .slice(0, 5);
  const average = reviews.length
    ? reviews.reduce((sum, x) => sum + Number(x.rating), 0) / reviews.length
    : 0;
  const distance = (0.8 + (salon.slug.length % 7) * 0.1).toFixed(1);
  const minPrice = services.length
    ? Math.min(...services.map((x) => Number(x.price)))
    : null;
  const currentDay = new Date().toLocaleDateString("en-US", {
    weekday: "long",
  });
  const changeFavorite = async () => {
    const next = !favorite;
    setFavorite(next);
    const ids = new Set(loadLocal("auraFavoriteSalons", []));
    next ? ids.add(salon.slug) : ids.delete(salon.slug);
    saveLocal("auraFavoriteSalons", [...ids]);
    if (isAuthenticated) await toggleFavorite(user.id, salon.id, next);
  };
  return (
    <main className="min-h-screen bg-[#f7f2ec] pb-24 lg:pb-0">
      <header className="border-b border-wine-900/5 bg-white">
        <div className="wrap flex h-20 items-center justify-between">
          <a
            href="/"
            className="flex items-center gap-2.5 font-display text-2xl font-bold"
          >
            <span className="grid h-9 w-9 place-items-center rounded-full bg-wine-700 text-white">
              <Sparkles size={17} />
            </span>
            Aura
          </a>
          <div className="flex items-center gap-2">
            <a
              href="/dashboard"
              className="hidden text-sm font-bold text-stone-500 sm:block"
            >
              Dashboard
            </a>
            <a href="/salons" className="btn-secondary px-4 py-2.5">
              <ArrowLeft size={15} />
              Salons
            </a>
          </div>
        </div>
      </header>
      <div className="wrap py-6 sm:py-9">
        <div className="relative">
          <Gallery
            images={images}
            name={salon.name}
            onOpen={() => setGalleryOpen(true)}
          />
        </div>
        <section className="relative -mt-2 rounded-b-3xl bg-white p-6 shadow-sm sm:p-8">
          <div className="flex flex-col justify-between gap-5 md:flex-row md:items-center">
            <div className="flex items-start gap-4">
              <div className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl border-4 border-white bg-wine-800 font-display text-2xl font-bold text-white shadow-card">
                {salon.name
                  .split(" ")
                  .map((x) => x[0])
                  .slice(0, 2)
                  .join("")}
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="font-display text-3xl font-bold tracking-[-.04em] sm:text-4xl">
                    {salon.name}
                  </h1>
                  <BadgeCheck
                    size={21}
                    className="text-wine-600"
                    fill="#f4e4e7"
                  />
                </div>
                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-stone-500">
                  <span className="flex items-center gap-1 text-amber-700">
                    <Star size={14} fill="currentColor" />
                    {reviews.length ? average.toFixed(1) : "New"} ·{" "}
                    {reviews.length} reviews
                  </span>
                  <span>
                    {salon.city} · {distance} km away
                  </span>
                  <span
                    className={
                      salon.is_open
                        ? "font-bold text-emerald-700"
                        : "font-bold text-stone-400"
                    }
                  >
                    {salon.is_open ? "Open now" : "Closed"}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={changeFavorite}
                aria-label={favorite ? "Remove favorite" : "Add favorite"}
                className="grid h-12 w-12 place-items-center rounded-full border border-wine-200 bg-white text-wine-700"
              >
                <Heart size={20} fill={favorite ? "currentColor" : "none"} />
              </button>
              <a
                href={bookingUrl(salon.slug)}
                className="btn-primary rounded-xl"
              >
                Book now
                <ArrowRight size={16} />
              </a>
            </div>
          </div>
          {salon.offers_home_service && (
            <span className="mt-5 inline-flex items-center gap-1.5 rounded-full bg-wine-50 px-3 py-2 text-xs font-bold text-wine-700">
              <House size={13} />
              Home service available
            </span>
          )}
        </section>
        <nav className="sticky top-0 z-30 mt-5 overflow-x-auto rounded-2xl border border-stone-100 bg-white/95 px-3 shadow-sm backdrop-blur">
          <div className="flex min-w-max">
            {[
              ["Overview", "overview"],
              ["Services", "services"],
              ["Specialists", "specialists"],
              ["Reviews", "reviews"],
              ["Products", "products"],
              ["Location", "location"],
            ].map(([label, target]) => (
              <a
                key={target}
                href={`#${target}`}
                className="px-4 py-4 text-sm font-bold text-stone-500 hover:text-wine-700"
              >
                {label}
              </a>
            ))}
          </div>
        </nav>
        <div className="mt-6 grid items-start gap-6 lg:grid-cols-[1fr_330px]">
          <div className="space-y-6">
            <section className="rounded-3xl bg-white p-6 shadow-sm sm:p-8">
              <SectionTitle
                eyebrow="About"
                title={`Welcome to ${salon.name}`}
              />
              <p className="mt-4 leading-7 text-stone-500">
                {salon.description ||
                  `${salon.name} offers professional hair, nail, skincare, and makeup services in a modern and relaxing environment.`}
              </p>
              <div className="mt-6 grid gap-3 text-sm sm:grid-cols-3">
                {[
                  ["Experience", "8+ years"],
                  [
                    "Specialties",
                    [...new Set(services.map((x) => x.category))]
                      .slice(0, 3)
                      .join(", ") || "Beauty care",
                  ],
                  ["Languages", "Arabic, English"],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-xl bg-[#f7f2ec] p-4">
                    <p className="text-xs font-bold uppercase tracking-wider text-stone-400">
                      {label}
                    </p>
                    <p className="mt-2 font-semibold">{value}</p>
                  </div>
                ))}
              </div>
            </section>
            {services.length ? (
              <Services salon={salon} services={services} />
            ) : (
              <section id="services" className="rounded-3xl bg-white p-8">
                <SectionTitle
                  eyebrow="Services"
                  title="Menu coming soon"
                  copy="This salon is preparing its service catalog."
                />
              </section>
            )}
            <Specialists
              salon={salon}
              items={(salon.specialists || []).filter(
                (x) => x.is_active !== false,
              )}
            />
            <section className="rounded-3xl bg-white p-6 shadow-sm sm:p-8">
              <SectionTitle
                eyebrow="Limited time"
                title="Offers & promotions"
              />
              <div className="mt-6 grid gap-4 md:grid-cols-3">
                {offers.map((offer) => (
                  <article
                    key={offer.title}
                    className="rounded-2xl bg-gradient-to-br from-wine-800 to-wine-600 p-5 text-white"
                  >
                    <span className="rounded-full bg-white/15 px-2.5 py-1 text-[10px] font-bold">
                      {offer.discount}
                    </span>
                    <h3 className="mt-4 font-display text-xl font-bold">
                      {offer.title}
                    </h3>
                    <p className="mt-2 text-xs leading-5 text-white/65">
                      {offer.copy}
                    </p>
                    <p className="mt-4 text-[10px] text-white/45">
                      Ends {offer.expires}
                    </p>
                    <a
                      href={bookingUrl(salon.slug)}
                      className="mt-4 inline-flex rounded-lg bg-white px-3 py-2 text-xs font-bold text-wine-800"
                    >
                      Book offer
                    </a>
                  </article>
                ))}
              </div>
            </section>
            <section className="rounded-3xl bg-white p-6 shadow-sm sm:p-8">
              <SectionTitle
                eyebrow="At-home beauty"
                title={
                  salon.offers_home_service
                    ? "Beauty at your door"
                    : "Home services unavailable"
                }
              />
              {salon.offers_home_service ? (
                <>
                  <p className="mt-4 text-sm leading-6 text-stone-500">
                    Selected hair, makeup, nail, and skincare services are
                    available across {salon.city}. Typical travel fee: $12,
                    within approximately 8 km.
                  </p>
                  <a
                    href={bookingUrl(salon.slug, { home: true })}
                    className="btn-primary mt-5 rounded-xl"
                  >
                    <House size={16} />
                    Book home service
                  </a>
                </>
              ) : (
                <p className="mt-4 rounded-xl bg-[#f7f2ec] p-4 text-sm text-stone-500">
                  This salon currently welcomes customers at its salon location
                  only.
                </p>
              )}
            </section>
            <section
              id="products"
              className="scroll-mt-28 rounded-3xl bg-white p-6 shadow-sm sm:p-8"
            >
              <SectionTitle
                eyebrow="Beauty shelf"
                title={`Products from ${salon.name}`}
              />
              <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
                {products.map((product) => (
                  <article key={product.name}>
                    <img
                      src={product.image}
                      alt={product.name}
                      className="aspect-square w-full rounded-2xl object-cover"
                    />
                    <p className="mt-3 text-[10px] font-bold uppercase tracking-wider text-stone-400">
                      {product.brand}
                    </p>
                    <h3 className="mt-1 text-sm font-bold">{product.name}</h3>
                    <p className="mt-2 flex items-center justify-between text-sm">
                      <b className="text-wine-700">${product.price}</b>
                      <span className="text-xs text-amber-700">
                        ★ {product.rating}
                      </span>
                    </p>
                    <button className="mt-3 w-full rounded-lg border border-wine-200 py-2 text-xs font-bold text-wine-700">
                      View product
                    </button>
                  </article>
                ))}
              </div>
            </section>
            <section className="rounded-3xl bg-white p-6 shadow-sm sm:p-8">
              <SectionTitle eyebrow="Comfort" title="Amenities" />
              <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
                {[
                  ...amenityItems,
                  ...(salon.offers_home_service
                    ? [[House, "Home service"]]
                    : []),
                ].map(([Icon, label]) => (
                  <div
                    key={label}
                    className="flex items-center gap-2 rounded-xl bg-[#f7f2ec] p-3 text-xs font-bold"
                  >
                    <Icon size={16} className="text-wine-700" />
                    {label}
                  </div>
                ))}
              </div>
            </section>
            <Reviews reviews={reviews} />
            <section className="rounded-3xl bg-white p-6 shadow-sm sm:p-8">
              <SectionTitle eyebrow="Before you book" title="Salon policies" />
              <div className="mt-5 divide-y divide-stone-100">
                {policies.map(([title, copy]) => (
                  <details key={title} className="group py-4">
                    <summary className="flex cursor-pointer list-none items-center justify-between font-bold">
                      {title}
                      <ChevronDown
                        size={17}
                        className="transition group-open:rotate-180"
                      />
                    </summary>
                    <p className="pt-3 text-sm leading-6 text-stone-500">
                      {copy}
                    </p>
                  </details>
                ))}
              </div>
            </section>
          </div>
          <aside className="space-y-5 lg:sticky lg:top-24">
            <section
              id="location"
              className="scroll-mt-28 overflow-hidden rounded-3xl bg-white shadow-card"
            >
              <div className="relative h-44 bg-[#e5e0d7]">
                <div
                  className="absolute inset-0 opacity-50"
                  style={{
                    backgroundImage:
                      "linear-gradient(#fff 1px,transparent 1px),linear-gradient(90deg,#fff 1px,transparent 1px)",
                    backgroundSize: "30px 30px",
                  }}
                />
                <div className="absolute inset-0 grid place-items-center text-wine-700">
                  <span className="grid h-12 w-12 place-items-center rounded-full border-4 border-white bg-wine-700 text-white shadow-lg">
                    <MapPin size={20} />
                  </span>
                </div>
                <span className="absolute right-3 top-3 rounded-full bg-white/90 px-3 py-1.5 text-[10px] font-bold">
                  Map preview
                </span>
              </div>
              <div className="p-5">
                <h2 className="font-display text-xl font-bold">Location</h2>
                <p className="mt-2 text-sm leading-6 text-stone-500">
                  {salon.address}, {salon.city}
                  <br />
                  {distance} km away
                </p>
                <a
                  target="_blank"
                  rel="noreferrer"
                  href={`https://maps.google.com/?q=${encodeURIComponent(`${salon.address}, ${salon.city}`)}`}
                  className="btn-secondary mt-4 w-full rounded-xl"
                >
                  <Navigation size={15} />
                  Get directions
                </a>
              </div>
            </section>
            <section className="rounded-3xl bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <h2 className="font-display text-xl font-bold">
                  Opening hours
                </h2>
                <span
                  className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${salon.is_open ? "bg-emerald-50 text-emerald-700" : "bg-stone-100 text-stone-500"}`}
                >
                  {salon.is_open ? "OPEN NOW" : "CLOSED"}
                </span>
              </div>
              <div className="mt-4 space-y-2">
                {openingHours.map(([day, hours]) => (
                  <div
                    key={day}
                    className={`flex justify-between rounded-lg px-2 py-2 text-xs ${day === currentDay ? "bg-wine-50 font-bold text-wine-800" : "text-stone-500"}`}
                  >
                    <span>{day}</span>
                    <span>{hours}</span>
                  </div>
                ))}
              </div>
            </section>
            <section className="rounded-3xl bg-wine-800 p-6 text-white shadow-card">
              <CalendarCheck size={23} />
              <h2 className="mt-5 font-display text-2xl font-bold">
                Book your visit
              </h2>
              <p className="mt-2 text-sm leading-6 text-white/60">
                Choose a service and a time that fits beautifully into your day.
              </p>
              {minPrice !== null && (
                <p className="mt-5 text-xs text-white/55">
                  Services from{" "}
                  <b className="font-display text-2xl text-white">
                    ${minPrice.toFixed(0)}
                  </b>
                </p>
              )}
              <a
                href={bookingUrl(salon.slug)}
                className={`mt-5 flex w-full items-center justify-center rounded-xl bg-white px-5 py-3 text-sm font-bold text-wine-800 ${services.length ? "" : "pointer-events-none opacity-50"}`}
              >
                Book now
                <ArrowRight size={16} className="ml-2" />
              </a>
              <p className="mt-4 flex items-center gap-2 text-[10px] text-white/45">
                <ShieldCheck size={13} />
                Secure booking through Aura
              </p>
            </section>
          </aside>
        </div>
      </div>
      <div className="fixed inset-x-0 bottom-0 z-50 border-t border-stone-200 bg-white p-3 shadow-2xl lg:hidden">
        <div className="mx-auto flex max-w-lg items-center justify-between gap-4">
          {" "}
          <div>
            {minPrice !== null && (
              <>
                <p className="text-[10px] text-stone-400">Starting from</p>
                <p className="font-display text-xl font-bold text-wine-700">
                  ${minPrice.toFixed(0)}
                </p>
              </>
            )}
          </div>
          <a
            href={bookingUrl(salon.slug)}
            className={`btn-primary flex-1 rounded-xl ${services.length ? "" : "pointer-events-none opacity-50"}`}
          >
            Book now
          </a>
        </div>
      </div>
      <AnimatePresence>
        {galleryOpen && (
          <GalleryModal
            images={images}
            name={salon.name}
            onClose={() => setGalleryOpen(false)}
          />
        )}
      </AnimatePresence>
    </main>
  );
}
