import React, { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  Box,
  Check,
  CheckCircle2,
  ChevronDown,
  CircleAlert,
  Clock3,
  CreditCard,
  Heart,
  Home,
  MapPin,
  Minus,
  PackageCheck,
  Plus,
  Search,
  ShoppingBag,
  ShoppingCart,
  SlidersHorizontal,
  Sparkles,
  Star,
  Trash2,
  Truck,
  UserRound,
  X,
} from "lucide-react";
import { useAuth } from "./context/AuthContext.jsx";
import {
  addToCart,
  getAddresses,
  getCart,
  getMyOrders,
  getProduct,
  getProductCategories,
  getProducts,
  getWishlist,
  placeMarketplaceOrder,
  saveAddress,
  setWishlistProduct,
  updateCartItem,
} from "./lib/aura-api.js";

const price = (p) => Number(p.discount_price ?? p.price);
const load = (key, fallback = []) => {
  try {
    return JSON.parse(localStorage.getItem(key)) || fallback;
  } catch {
    return fallback;
  }
};
const store = (key, value) => localStorage.setItem(key, JSON.stringify(value));
const orderSteps = [
  "Pending",
  "Confirmed",
  "Preparing",
  "Shipped",
  "Out for Delivery",
  "Delivered",
];

function Mark() {
  return (
    <a
      href="/"
      className="flex items-center gap-2.5 font-display text-2xl font-bold"
    >
      <span className="grid h-9 w-9 place-items-center rounded-full bg-wine-700 text-white">
        <Sparkles size={17} />
      </span>
      Aura
    </a>
  );
}
export function MarketHeader() {
  const { isAuthenticated } = useAuth();
  return (
    <header className="sticky top-0 z-40 border-b border-wine-900/5 bg-[#fbf8f4]/95 backdrop-blur-xl">
      <div className="wrap flex h-20 items-center justify-between">
        <Mark />
        <nav className="hidden items-center gap-5 lg:flex">
          <a href="/marketplace" className="text-sm font-bold text-wine-700">
            Shop
          </a>
          <a href="/salons" className="text-sm font-semibold text-stone-500">
            Salons
          </a>
          {isAuthenticated && (
            <>
              <a
                href="/my-orders"
                className="text-sm font-semibold text-stone-500"
              >
                My Orders
              </a>
              <a
                href="/wishlist"
                className="text-sm font-semibold text-stone-500"
              >
                Wishlist
              </a>
            </>
          )}
        </nav>
        <div className="flex items-center gap-2">
          <a
            href={isAuthenticated ? "/dashboard" : "/login"}
            className="hidden rounded-xl px-3 py-2 text-sm font-bold text-stone-600 sm:block"
          >
            {isAuthenticated ? "Account" : "Sign in"}
          </a>
          <a
            href="/cart"
            aria-label="Shopping cart"
            className="grid h-11 w-11 place-items-center rounded-full border border-wine-200 bg-white text-wine-700"
          >
            <ShoppingBag size={19} />
          </a>
        </div>
      </div>
    </header>
  );
}
function Notice({ text, onClose }) {
  return (
    <AnimatePresence>
      {text && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className="fixed right-5 top-24 z-50 flex max-w-sm items-center gap-3 rounded-2xl bg-wine-800 px-5 py-4 text-sm font-bold text-white shadow-2xl"
        >
          <CheckCircle2 size={18} />
          {text}
          <button onClick={onClose}>
            <X size={15} />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
function Rating({ product }) {
  const ratings = (product.reviews || []).map((x) => Number(x.rating));
  const avg = ratings.length
    ? ratings.reduce((a, b) => a + b, 0) / ratings.length
    : 0;
  return (
    <span className="flex items-center gap-1 text-xs font-bold text-amber-700">
      <Star size={12} fill="currentColor" />
      {ratings.length ? avg.toFixed(1) : "New"}{" "}
      <span className="font-normal text-stone-400">({ratings.length})</span>
    </span>
  );
}

export function ProductCard({ product, saved, onSave, onAdd }) {
  const low = product.stock_quantity <= product.low_stock_threshold;
  return (
    <motion.article
      layout
      className="group overflow-hidden rounded-3xl border border-stone-100 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-card"
    >
      <div className="relative aspect-[.92] overflow-hidden bg-[#f1ebe5]">
        <a href={`/products/${product.slug}`}>
          <img
            src={product.image_urls?.[0]}
            alt={product.name}
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
          />
        </a>
        <button
          onClick={() => onSave(product)}
          aria-label={saved ? "Remove from wishlist" : "Save to wishlist"}
          className="absolute right-3 top-3 grid h-10 w-10 place-items-center rounded-full bg-white/90 text-wine-700 shadow"
        >
          <Heart size={18} fill={saved ? "currentColor" : "none"} />
        </button>
        <div className="absolute left-3 top-3 flex flex-col items-start gap-1">
          {product.discount_price && (
            <span className="rounded-full bg-wine-700 px-2.5 py-1 text-[10px] font-bold text-white">
              {Math.round((1 - product.discount_price / product.price) * 100)}%
              OFF
            </span>
          )}
          {product.is_bestseller && (
            <span className="rounded-full bg-[#2e2528] px-2.5 py-1 text-[10px] font-bold text-white">
              BEST SELLER
            </span>
          )}
          {product.is_new && (
            <span className="rounded-full bg-white px-2.5 py-1 text-[10px] font-bold text-wine-700">
              NEW
            </span>
          )}
        </div>
        {low && product.stock_quantity > 0 && (
          <span className="absolute bottom-3 left-3 rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-bold text-red-700">
            Only {product.stock_quantity} left
          </span>
        )}
      </div>
      <div className="p-5">
        <p className="text-[10px] font-bold uppercase tracking-[.14em] text-stone-400">
          {product.brand}
        </p>
        <a href={`/products/${product.slug}`}>
          <h3 className="mt-1 min-h-12 font-display text-xl font-bold leading-6">
            {product.name}
          </h3>
        </a>
        <div className="mt-3 flex items-center justify-between">
          <Rating product={product} />
          <div className="text-right">
            <b className="text-wine-700">${price(product).toFixed(2)}</b>
            {product.discount_price && (
              <span className="ml-2 text-xs text-stone-400 line-through">
                ${Number(product.price).toFixed(2)}
              </span>
            )}
          </div>
        </div>
        <button
          disabled={!product.stock_quantity}
          onClick={() => onAdd(product)}
          className="btn-primary mt-4 w-full rounded-xl py-3 disabled:cursor-not-allowed disabled:bg-stone-300"
        >
          <ShoppingCart size={15} />
          {product.stock_quantity ? "Add to Cart" : "Out of Stock"}
        </button>
      </div>
    </motion.article>
  );
}

export function MarketplacePage() {
  const { user, isAuthenticated } = useAuth();
  const [products, setProducts] = useState([]),
    [categories, setCategories] = useState([]),
    [wish, setWish] = useState(new Set()),
    [loading, setLoading] = useState(true),
    [error, setError] = useState(""),
    [query, setQuery] = useState(""),
    [category, setCategory] = useState("all"),
    [brand, setBrand] = useState("all"),
    [sort, setSort] = useState("Recommended"),
    [inStock, setInStock] = useState(false),
    [discounted, setDiscounted] = useState(false),
    [notice, setNotice] = useState(""),
    [recentSearches, setRecentSearches] = useState(() =>
      typeof window === "undefined" ? [] : load("auraProductSearches", []),
    );
  useEffect(() => {
    let active = true;
    Promise.all([
      getProducts(),
      getProductCategories(),
      isAuthenticated ? getWishlist(user.id) : Promise.resolve([]),
    ])
      .then(([p, c, w]) => {
        if (!active) return;
        setProducts(p);
        setCategories(c);
        setWish(new Set(w.map((x) => x.id)));
      })
      .catch((e) => active && setError(e.message))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [isAuthenticated, user?.id]);
  const brands = [...new Set(products.map((x) => x.brand))];
  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = products.filter(
      (p) =>
        (!q ||
          [p.name, p.brand, p.category?.name].some((x) =>
            x?.toLowerCase().includes(q),
          )) &&
        (category === "all" || p.category?.slug === category) &&
        (brand === "all" || p.brand === brand) &&
        (!inStock || p.stock_quantity > 0) &&
        (!discounted || p.discount_price),
    );
    const sorts = {
      "Price: Low to High": (a, b) => price(a) - price(b),
      "Price: High to Low": (a, b) => price(b) - price(a),
      "Highest Rated": (a, b) =>
        (b.reviews?.length || 0) - (a.reviews?.length || 0),
      "Best Selling": (a, b) => b.sold_count - a.sold_count,
      Newest: (a, b) => new Date(b.created_at) - new Date(a.created_at),
      Recommended: (a, b) =>
        Number(b.is_featured) +
        Number(b.is_bestseller) -
        Number(a.is_featured) -
        Number(a.is_bestseller),
    };
    return [...list].sort(sorts[sort]);
  }, [products, query, category, brand, inStock, discounted, sort]);
  const search = (e) => {
    e.preventDefault();
    if (query.trim()) {
      const next = [
        query.trim(),
        ...recentSearches.filter((x) => x !== query.trim()),
      ].slice(0, 5);
      setRecentSearches(next);
      store("auraProductSearches", next);
    }
  };
  const save = async (p) => {
    if (!isAuthenticated) {
      localStorage.setItem("auraReturnTo", "/marketplace");
      location.href = "/login";
      return;
    }
    const next = !wish.has(p.id);
    await setWishlistProduct(user.id, p.id, next);
    setWish((s) => {
      const n = new Set(s);
      next ? n.add(p.id) : n.delete(p.id);
      return n;
    });
    setNotice(next ? "Saved to wishlist" : "Removed from wishlist");
  };
  const add = async (p) => {
    if (!isAuthenticated) {
      localStorage.setItem("auraReturnTo", "/marketplace");
      location.href = "/login";
      return;
    }
    await addToCart(user.id, p.id, 1);
    setNotice("Added to cart");
  };
  return (
    <main className="min-h-screen bg-[#f7f2ec]">
      <MarketHeader />
      <Notice text={notice} onClose={() => setNotice("")} />
      <section className="relative overflow-hidden bg-wine-900 py-14 text-white sm:py-20">
        <div className="orb -right-24 -top-40 h-96 w-96 bg-wine-500/40" />
        <div className="wrap relative grid items-center gap-10 lg:grid-cols-[1fr_.65fr]">
          <div>
            <span className="inline-flex rounded-full bg-white/10 px-3 py-2 text-[11px] font-bold uppercase tracking-[.16em]">
              Aura Beauty Marketplace
            </span>
            <h1 className="mt-5 max-w-3xl font-display text-5xl font-semibold leading-[1.05] tracking-[-.05em] sm:text-6xl">
              Your beauty shelf, beautifully curated.
            </h1>
            <p className="mt-5 max-w-xl leading-7 text-white/65">
              Shop salon-quality hair, skin, makeup and self-care essentials
              selected by Aura experts.
            </p>
            <form
              onSubmit={search}
              className="mt-8 flex max-w-2xl rounded-2xl bg-white p-2 text-ink shadow-2xl"
            >
              <Search className="ml-3 self-center text-stone-400" size={19} />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search products, brands or categories"
                className="min-w-0 flex-1 bg-transparent px-3 py-3 text-sm outline-none"
              />
              <button className="rounded-xl bg-wine-700 px-5 text-sm font-bold text-white">
                Search
              </button>
            </form>
            {recentSearches.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2 text-xs text-white/55">
                <span>Recent:</span>
                {recentSearches.map((x) => (
                  <button
                    key={x}
                    onClick={() => setQuery(x)}
                    className="font-bold text-white/80"
                  >
                    {x}
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="hidden rounded-[2rem] bg-white/10 p-7 backdrop-blur lg:block">
            <p className="text-xs font-bold uppercase tracking-wider text-white/50">
              This week’s edit
            </p>
            <h2 className="mt-3 font-display text-3xl font-bold">
              Glow essentials
            </h2>
            <p className="mt-3 text-sm leading-6 text-white/60">
              Discover nourishing favorites for the season, including up to 20%
              off selected products.
            </p>
            <div className="mt-6 grid grid-cols-3 gap-2">
              {products.slice(0, 3).map((p) => (
                <img
                  key={p.id}
                  src={p.image_urls?.[0]}
                  alt=""
                  className="aspect-square rounded-xl object-cover"
                />
              ))}
            </div>
          </div>
        </div>
      </section>
      <section className="wrap py-10">
        <div className="flex gap-3 overflow-x-auto pb-3">
          {[{ slug: "all", name: "All products" }, ...categories].map((c) => (
            <button
              key={c.slug}
              onClick={() => setCategory(c.slug)}
              className={`whitespace-nowrap rounded-full px-4 py-2.5 text-sm font-bold ${category === c.slug ? "bg-wine-700 text-white" : "border border-stone-200 bg-white text-stone-600"}`}
            >
              {c.name}
            </button>
          ))}
        </div>
        <div className="mt-7 grid items-start gap-7 lg:grid-cols-[230px_1fr]">
          <aside className="rounded-2xl bg-white p-5 shadow-sm lg:sticky lg:top-24">
            <div className="flex items-center gap-2 font-bold">
              <SlidersHorizontal size={17} className="text-wine-700" />
              Filters
            </div>
            <label className="mt-5 block text-xs font-bold uppercase tracking-wider text-stone-400">
              Brand
              <select
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                className="mt-2 h-11 w-full rounded-xl border border-stone-200 px-3 text-sm font-semibold text-ink"
              >
                <option value="all">All brands</option>
                {brands.map((x) => (
                  <option key={x}>{x}</option>
                ))}
              </select>
            </label>
            <div className="mt-5 space-y-3 border-t border-stone-100 pt-5">
              <label className="flex items-center gap-3 text-sm font-semibold">
                <input
                  type="checkbox"
                  checked={inStock}
                  onChange={(e) => setInStock(e.target.checked)}
                  className="accent-[#642735]"
                />
                In stock only
              </label>
              <label className="flex items-center gap-3 text-sm font-semibold">
                <input
                  type="checkbox"
                  checked={discounted}
                  onChange={(e) => setDiscounted(e.target.checked)}
                  className="accent-[#642735]"
                />
                Special offers
              </label>
            </div>
            <button
              onClick={() => {
                setCategory("all");
                setBrand("all");
                setInStock(false);
                setDiscounted(false);
                setQuery("");
              }}
              className="mt-5 text-xs font-bold text-wine-700"
            >
              Clear all filters
            </button>
          </aside>
          <div>
            <div className="mb-5 flex items-center justify-between">
              <p className="text-sm text-stone-500">
                <b className="text-ink">{results.length}</b> products
              </p>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className="h-11 rounded-xl border border-stone-200 bg-white px-3 text-sm font-bold"
              >
                {[
                  "Recommended",
                  "Price: Low to High",
                  "Price: High to Low",
                  "Highest Rated",
                  "Best Selling",
                  "Newest",
                ].map((x) => (
                  <option key={x}>{x}</option>
                ))}
              </select>
            </div>
            {error ? (
              <div className="rounded-2xl bg-red-50 p-5 text-red-700">
                {error}
              </div>
            ) : loading ? (
              <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {[1, 2, 3, 4, 5, 6].map((x) => (
                  <div
                    key={x}
                    className="h-[460px] animate-pulse rounded-3xl bg-white"
                  />
                ))}
              </div>
            ) : results.length ? (
              <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {results.map((p) => (
                  <ProductCard
                    key={p.id}
                    product={p}
                    saved={wish.has(p.id)}
                    onSave={save}
                    onAdd={add}
                  />
                ))}
              </div>
            ) : (
              <div className="rounded-3xl border border-dashed border-wine-200 bg-white p-14 text-center">
                <Search className="mx-auto text-wine-600" />
                <h2 className="mt-4 font-display text-2xl font-bold">
                  No products found
                </h2>
                <p className="mt-2 text-stone-500">
                  Try changing your search or filters.
                </p>
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}

export function ProductDetailsPage({ slug }) {
  const { user, isAuthenticated } = useAuth();
  const [product, setProduct] = useState(null),
    [related, setRelated] = useState([]),
    [loading, setLoading] = useState(true),
    [quantity, setQuantity] = useState(1),
    [selectedImage, setSelectedImage] = useState(0),
    [variation, setVariation] = useState("Standard"),
    [saved, setSaved] = useState(false),
    [notice, setNotice] = useState("");
  useEffect(() => {
    let active = true;
    Promise.all([
      getProduct(slug),
      getProducts(),
      isAuthenticated ? getWishlist(user.id) : Promise.resolve([]),
    ])
      .then(([p, all, w]) => {
        if (!active) return;
        setProduct(p);
        setRelated(
          all
            .filter((x) => x.id !== p.id && x.category_id === p.category_id)
            .slice(0, 4),
        );
        setSaved(w.some((x) => x.id === p.id));
        const recent = [
          slug,
          ...load("auraRecentlyViewedProducts", []).filter((x) => x !== slug),
        ].slice(0, 6);
        store("auraRecentlyViewedProducts", recent);
      })
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [slug, isAuthenticated, user?.id]);
  if (loading) return <div className="min-h-screen bg-[#f7f2ec]" />;
  if (!product) return <div>Product unavailable</div>;
  const ensure = () => {
    if (!isAuthenticated) {
      localStorage.setItem("auraReturnTo", `/products/${slug}`);
      location.href = "/login";
      return false;
    }
    return true;
  };
  const add = async () => {
    if (!ensure()) return;
    await addToCart(user.id, product.id, quantity, variation);
    setNotice("Added to cart");
  };
  const buy = async () => {
    await add();
    if (isAuthenticated) location.href = "/cart";
  };
  const save = async () => {
    if (!ensure()) return;
    await setWishlistProduct(user.id, product.id, !saved);
    setSaved(!saved);
    setNotice(!saved ? "Saved to wishlist" : "Removed from wishlist");
  };
  const images = product.image_urls?.length
    ? product.image_urls
    : [product.image_urls?.[0]];
  return (
    <main className="min-h-screen bg-[#f7f2ec]">
      <MarketHeader />
      <Notice text={notice} onClose={() => setNotice("")} />
      <div className="wrap py-8">
        <a
          href="/marketplace"
          className="inline-flex items-center gap-2 text-sm font-bold text-wine-700"
        >
          <ArrowLeft size={15} />
          Back to marketplace
        </a>
        <section className="mt-6 grid gap-8 rounded-3xl bg-white p-5 shadow-sm sm:p-8 lg:grid-cols-2">
          <div>
            <img
              src={images[selectedImage]}
              alt={product.name}
              className="aspect-square w-full rounded-3xl bg-[#f3ece5] object-cover"
            />
            <div className="mt-3 flex gap-3">
              {images.map((img, i) => (
                <button
                  key={img}
                  onClick={() => setSelectedImage(i)}
                  className={`h-20 w-20 overflow-hidden rounded-xl border-2 ${i === selectedImage ? "border-wine-700" : "border-transparent"}`}
                >
                  <img
                    src={img}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                </button>
              ))}
            </div>
          </div>
          <div className="lg:py-4">
            <p className="text-xs font-bold uppercase tracking-[.15em] text-wine-600">
              {product.brand}
            </p>
            <h1 className="mt-3 font-display text-4xl font-bold tracking-[-.04em] sm:text-5xl">
              {product.name}
            </h1>
            <div className="mt-4 flex items-center gap-4">
              <Rating product={product} />
              <span className="text-xs text-stone-400">SKU {product.sku}</span>
            </div>
            <div className="mt-6 flex items-end gap-3">
              <span className="font-display text-3xl font-bold text-wine-700">
                ${price(product).toFixed(2)}
              </span>
              {product.discount_price && (
                <span className="pb-1 text-stone-400 line-through">
                  ${Number(product.price).toFixed(2)}
                </span>
              )}
            </div>
            <p className="mt-6 leading-7 text-stone-500">
              {product.description}
            </p>
            <div className="mt-6 rounded-xl bg-[#f7f2ec] p-4 text-sm">
              <b
                className={
                  product.stock_quantity ? "text-emerald-700" : "text-red-700"
                }
              >
                {product.stock_quantity
                  ? `${product.stock_quantity} in stock`
                  : "Out of stock"}
              </b>
              {product.stock_quantity <= product.low_stock_threshold &&
                product.stock_quantity > 0 && (
                  <span className="ml-2 text-red-700">
                    Only a few remaining
                  </span>
                )}
            </div>
            <label className="mt-6 block text-sm font-bold">
              Variation
              <select
                value={variation}
                onChange={(e) => setVariation(e.target.value)}
                className="mt-2 h-12 w-full rounded-xl border border-stone-200 px-4"
              >
                {(product.variations || ["Standard"]).map((x) => (
                  <option key={typeof x === "string" ? x : x.name}>
                    {typeof x === "string" ? x : x.name}
                  </option>
                ))}
              </select>
            </label>
            <div className="mt-6 flex items-center gap-3">
              <div className="flex h-12 items-center rounded-xl border border-stone-200">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="px-4"
                >
                  <Minus size={16} />
                </button>
                <b>{quantity}</b>
                <button
                  onClick={() =>
                    setQuantity(Math.min(product.stock_quantity, quantity + 1))
                  }
                  className="px-4"
                >
                  <Plus size={16} />
                </button>
              </div>
              <button
                onClick={add}
                disabled={!product.stock_quantity}
                className="btn-primary flex-1 rounded-xl"
              >
                Add to cart
              </button>
              <button
                onClick={save}
                aria-label="Wishlist"
                className="grid h-12 w-12 place-items-center rounded-xl border border-wine-200 text-wine-700"
              >
                <Heart fill={saved ? "currentColor" : "none"} />
              </button>
            </div>
            <button
              onClick={buy}
              disabled={!product.stock_quantity}
              className="btn-secondary mt-3 w-full rounded-xl"
            >
              Buy now
            </button>
            <div className="mt-7 grid gap-3 border-t border-stone-100 pt-6 sm:grid-cols-2">
              {[
                [Truck, "Delivery", "Standard 2–4 days"],
                [
                  BadgeCheck,
                  "Seller",
                  product.salon?.name || "Aura Marketplace",
                ],
              ].map(([Icon, title, copy]) => (
                <div key={title} className="flex gap-3">
                  <Icon size={19} className="text-wine-700" />
                  <div>
                    <b className="text-sm">{title}</b>
                    <p className="text-xs text-stone-400">{copy}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
        <section className="mt-6 grid gap-6 lg:grid-cols-3">
          {[
            [
              "Benefits",
              product.benefits?.join(" · ") || "Curated professional quality",
            ],
            [
              "Ingredients",
              product.ingredients || "See packaging for details.",
            ],
            ["How to use", product.usage_instructions || "Use as directed."],
          ].map(([title, copy]) => (
            <article key={title} className="rounded-2xl bg-white p-6">
              <h2 className="font-display text-xl font-bold">{title}</h2>
              <p className="mt-3 text-sm leading-6 text-stone-500">{copy}</p>
            </article>
          ))}
        </section>
        {related.length > 0 && (
          <section className="py-12">
            <h2 className="font-display text-3xl font-bold">
              You may also love
            </h2>
            <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {related.map((p) => (
                <ProductCard
                  key={p.id}
                  product={p}
                  saved={false}
                  onSave={() => {}}
                  onAdd={async () => {
                    if (ensure()) {
                      await addToCart(user.id, p.id, 1);
                      setNotice("Added to cart");
                    }
                  }}
                />
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}

function CartLine({ item, onChange, onRemove }) {
  const p = item.product;
  return (
    <article className="flex gap-4 border-b border-stone-100 py-5">
      <img
        src={p.image_urls?.[0]}
        alt=""
        className="h-24 w-24 rounded-2xl object-cover sm:h-28 sm:w-28"
      />
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
          {p.brand}
        </p>
        <h3 className="mt-1 font-bold">{p.name}</h3>
        {item.variation && (
          <p className="mt-1 text-xs text-stone-400">{item.variation}</p>
        )}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center rounded-lg border border-stone-200">
            <button
              onClick={() => onChange(item, item.quantity - 1)}
              className="p-2"
            >
              <Minus size={14} />
            </button>
            <b className="px-2 text-sm">{item.quantity}</b>
            <button
              disabled={item.quantity >= p.stock_quantity}
              onClick={() => onChange(item, item.quantity + 1)}
              className="p-2 disabled:opacity-30"
            >
              <Plus size={14} />
            </button>
          </div>
          <b className="text-wine-700">
            ${(price(p) * item.quantity).toFixed(2)}
          </b>
          <button
            onClick={() => onRemove(item)}
            aria-label="Remove item"
            className="text-stone-400 hover:text-red-700"
          >
            <Trash2 size={17} />
          </button>
        </div>
      </div>
    </article>
  );
}
export function CartPage() {
  const { user } = useAuth();
  const [items, setItems] = useState([]),
    [loading, setLoading] = useState(true),
    [notice, setNotice] = useState("");
  const refresh = () =>
    getCart(user.id)
      .then(setItems)
      .finally(() => setLoading(false));
  useEffect(refresh, [user.id]);
  const change = async (item, q) => {
    if (q > item.product.stock_quantity) {
      setNotice("Quantity exceeds available stock");
      return;
    }
    await updateCartItem(item.id, q);
    refresh();
  };
  const subtotal = items.reduce((s, x) => s + price(x.product) * x.quantity, 0),
    delivery = subtotal >= 50 ? 0 : 4;
  return (
    <main className="min-h-screen bg-[#f7f2ec]">
      <MarketHeader />
      <Notice text={notice} onClose={() => setNotice("")} />
      <div className="wrap py-10">
        <h1 className="font-display text-4xl font-bold tracking-[-.04em]">
          Your Shopping Cart
        </h1>
        <p className="mt-2 text-stone-500">
          Review your beauty edit before checkout.
        </p>
        {loading ? (
          <div className="mt-8 rounded-3xl bg-white p-12 text-center">
            Loading cart…
          </div>
        ) : items.length ? (
          <div className="mt-8 grid items-start gap-6 lg:grid-cols-[1fr_340px]">
            <section className="rounded-3xl bg-white px-6 shadow-sm">
              {items.map((x) => (
                <CartLine
                  key={x.id}
                  item={x}
                  onChange={change}
                  onRemove={(x) => change(x, 0)}
                />
              ))}
            </section>
            <aside className="rounded-3xl bg-white p-6 shadow-card">
              <h2 className="font-display text-2xl font-bold">Order summary</h2>
              <div className="mt-5 space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-stone-500">Subtotal</span>
                  <b>${subtotal.toFixed(2)}</b>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500">Delivery</span>
                  <b>{delivery ? `$${delivery.toFixed(2)}` : "Free"}</b>
                </div>
                <div className="flex justify-between border-t pt-4 text-lg">
                  <b>Total</b>
                  <b className="text-wine-700">
                    ${(subtotal + delivery).toFixed(2)}
                  </b>
                </div>
              </div>
              <a
                href="/checkout"
                className="btn-primary mt-6 w-full rounded-xl"
              >
                Proceed to Checkout
                <ArrowRight size={16} />
              </a>
              <a
                href="/marketplace"
                className="mt-4 block text-center text-sm font-bold text-wine-700"
              >
                Continue shopping
              </a>
            </aside>
          </div>
        ) : (
          <div className="mt-8 rounded-3xl bg-white p-14 text-center">
            <ShoppingCart className="mx-auto text-wine-600" size={32} />
            <h2 className="mt-4 font-display text-2xl font-bold">
              Your cart is empty
            </h2>
            <a href="/marketplace" className="btn-primary mt-5 rounded-xl">
              Explore products
            </a>
          </div>
        )}
      </div>
    </main>
  );
}

export function WishlistPage() {
  const { user } = useAuth();
  const [items, setItems] = useState([]),
    [notice, setNotice] = useState("");
  const refresh = () => getWishlist(user.id).then(setItems);
  useEffect(refresh, [user.id]);
  return (
    <main className="min-h-screen bg-[#f7f2ec]">
      <MarketHeader />
      <Notice text={notice} onClose={() => setNotice("")} />
      <div className="wrap py-10">
        <h1 className="font-display text-4xl font-bold">My Wishlist</h1>
        <p className="mt-2 text-stone-500">
          Products saved for your next beauty order.
        </p>
        {items.length ? (
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {items.map((p) => (
              <ProductCard
                key={p.id}
                product={p}
                saved
                onSave={async () => {
                  await setWishlistProduct(user.id, p.id, false);
                  refresh();
                  setNotice("Removed from wishlist");
                }}
                onAdd={async () => {
                  await addToCart(user.id, p.id, 1);
                  setNotice("Moved to cart");
                }}
              />
            ))}
          </div>
        ) : (
          <div className="mt-8 rounded-3xl bg-white p-14 text-center">
            <Heart className="mx-auto text-wine-600" />
            <h2 className="mt-4 font-display text-2xl font-bold">
              Nothing saved yet
            </h2>
            <a href="/marketplace" className="btn-primary mt-5 rounded-xl">
              Discover products
            </a>
          </div>
        )}
      </div>
    </main>
  );
}

const emptyAddress = {
  label: "Home",
  full_name: "",
  phone: "",
  country: "Palestine",
  city: "",
  area: "",
  street: "",
  building: "",
  floor: "",
  apartment: "",
  directions: "",
  is_default: true,
};
function AddressForm({ userId, onSaved }) {
  const [form, setForm] = useState(emptyAddress),
    [saving, setSaving] = useState(false),
    [error, setError] = useState("");
  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const saved = await saveAddress({ ...form, user_id: userId });
      onSaved(saved);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };
  return (
    <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
      {[
        ["full_name", "Full name"],
        ["phone", "Phone"],
        ["country", "Country"],
        ["city", "City"],
        ["area", "Area"],
        ["street", "Street"],
        ["building", "Building"],
        ["floor", "Floor"],
        ["apartment", "Apartment"],
      ].map(([key, label]) => (
        <label key={key} className="text-sm font-bold">
          {label}
          <input
            required={!["floor", "apartment"].includes(key)}
            value={form[key]}
            onChange={(e) => setForm({ ...form, [key]: e.target.value })}
            className="mt-2 h-12 w-full rounded-xl border border-stone-200 px-4 font-normal outline-none focus:border-wine-500"
          />
        </label>
      ))}
      <label className="sm:col-span-2 text-sm font-bold">
        Additional directions
        <textarea
          value={form.directions}
          onChange={(e) => setForm({ ...form, directions: e.target.value })}
          className="mt-2 w-full rounded-xl border border-stone-200 px-4 py-3 font-normal"
        />
      </label>
      <label className="flex items-center gap-2 text-sm sm:col-span-2">
        <input
          type="checkbox"
          checked={form.is_default}
          onChange={(e) => setForm({ ...form, is_default: e.target.checked })}
        />
        Use as default address
      </label>
      {error && <p className="text-sm text-red-700 sm:col-span-2">{error}</p>}
      <button
        disabled={saving}
        className="btn-primary rounded-xl sm:col-span-2"
      >
        {saving ? "Saving…" : "Save address"}
      </button>
    </form>
  );
}
export function AddressesPage() {
  const { user } = useAuth();
  const [items, setItems] = useState([]),
    [adding, setAdding] = useState(false);
  const refresh = () => getAddresses(user.id).then(setItems);
  useEffect(refresh, [user.id]);
  return (
    <main className="min-h-screen bg-[#f7f2ec]">
      <MarketHeader />
      <div className="wrap max-w-4xl py-10">
        <div className="flex items-end justify-between">
          <div>
            <h1 className="font-display text-4xl font-bold">
              Delivery Addresses
            </h1>
            <p className="mt-2 text-stone-500">
              Manage where your Aura orders are delivered.
            </p>
          </div>
          <button
            onClick={() => setAdding(!adding)}
            className="btn-primary rounded-xl"
          >
            <Plus size={16} />
            Add address
          </button>
        </div>
        {adding && (
          <section className="mt-7 rounded-3xl bg-white p-6 shadow-sm">
            <AddressForm
              userId={user.id}
              onSaved={() => {
                setAdding(false);
                refresh();
              }}
            />
          </section>
        )}
        <div className="mt-7 grid gap-4 sm:grid-cols-2">
          {items.map((a) => (
            <article key={a.id} className="rounded-2xl bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <b>{a.label}</b>
                {a.is_default && (
                  <span className="rounded-full bg-wine-50 px-2 py-1 text-[10px] font-bold text-wine-700">
                    DEFAULT
                  </span>
                )}
              </div>
              <p className="mt-3 text-sm leading-6 text-stone-500">
                {a.full_name} · {a.phone}
                <br />
                {a.street}, {a.building}
                <br />
                {a.area}, {a.city}, {a.country}
              </p>
            </article>
          ))}
        </div>
      </div>
    </main>
  );
}

export function CheckoutPage() {
  const { user } = useAuth();
  const [items, setItems] = useState([]),
    [addresses, setAddresses] = useState([]),
    [step, setStep] = useState(0),
    [selectedAddress, setSelectedAddress] = useState(""),
    [delivery, setDelivery] = useState("standard"),
    [payment, setPayment] = useState("cash_on_delivery"),
    [promo, setPromo] = useState(""),
    [placing, setPlacing] = useState(false),
    [error, setError] = useState(""),
    [order, setOrder] = useState(null),
    [adding, setAdding] = useState(false);
  const refreshAddresses = () =>
    getAddresses(user.id).then((a) => {
      setAddresses(a);
      if (!selectedAddress && a.length)
        setSelectedAddress((a.find((x) => x.is_default) || a[0]).id);
    });
  useEffect(() => {
    getCart(user.id).then(setItems);
    refreshAddresses();
  }, [user.id]);
  const subtotal = items.reduce((s, x) => s + price(x.product) * x.quantity, 0),
    deliveryFee = delivery === "express" ? 8 : subtotal >= 50 ? 0 : 4;
  const place = async () => {
    setPlacing(true);
    setError("");
    try {
      const result = await placeMarketplaceOrder({
        p_address_id: selectedAddress,
        p_delivery_method: delivery,
        p_payment_method: payment,
        p_promo_code: promo || null,
      });
      setOrder(Array.isArray(result) ? result[0] : result);
    } catch (e) {
      setError(e.message);
    } finally {
      setPlacing(false);
    }
  };
  if (order)
    return (
      <main className="grid min-h-screen place-items-center bg-[#f7f2ec] p-5">
        <div className="w-full max-w-xl rounded-3xl bg-white p-8 text-center shadow-card">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-emerald-50 text-emerald-700">
            <CheckCircle2 size={30} />
          </div>
          <p className="mt-5 text-xs font-bold uppercase tracking-wider text-wine-600">
            Order {order.order_number}
          </p>
          <h1 className="mt-2 font-display text-4xl font-bold">
            Your order is confirmed!
          </h1>
          <p className="mt-3 text-stone-500">
            We’re preparing your beauty favorites. Estimated delivery{" "}
            {new Date(order.estimated_delivery_at).toLocaleDateString()}.
          </p>
          <div className="mt-6 rounded-2xl bg-[#f7f2ec] p-5 text-left text-sm">
            <div className="flex justify-between">
              <span>Status</span>
              <b className="capitalize text-emerald-700">{order.status}</b>
            </div>
            <div className="mt-3 flex justify-between">
              <span>Total</span>
              <b>${Number(order.total).toFixed(2)}</b>
            </div>
            <div className="mt-3 flex justify-between">
              <span>Payment</span>
              <b className="capitalize">{order.payment_status}</b>
            </div>
          </div>
          <div className="mt-6 grid gap-2 sm:grid-cols-3">
            <a href="/my-orders" className="btn-primary rounded-xl px-3">
              Track Order
            </a>
            <a href="/my-orders" className="btn-secondary rounded-xl px-3">
              View Order
            </a>
            <a href="/marketplace" className="btn-secondary rounded-xl px-3">
              Continue Shopping
            </a>
          </div>
        </div>
      </main>
    );
  const steps = [
    "Cart Review",
    "Delivery Address",
    "Delivery Method",
    "Payment",
    "Review Order",
  ];
  return (
    <main className="min-h-screen bg-[#f7f2ec]">
      <MarketHeader />
      <div className="wrap max-w-5xl py-10">
        <h1 className="font-display text-4xl font-bold">Secure Checkout</h1>
        <div className="mt-6 flex overflow-x-auto rounded-2xl bg-white p-3">
          {steps.map((x, i) => (
            <div
              key={x}
              className={`flex min-w-max flex-1 items-center gap-2 px-3 text-xs font-bold ${i <= step ? "text-wine-700" : "text-stone-300"}`}
            >
              <span
                className={`grid h-7 w-7 place-items-center rounded-full ${i < step ? "bg-wine-700 text-white" : i === step ? "border-2 border-wine-700" : "border border-stone-200"}`}
              >
                {i < step ? <Check size={13} /> : i + 1}
              </span>
              {x}
            </div>
          ))}
        </div>
        <div className="mt-6 grid items-start gap-6 lg:grid-cols-[1fr_320px]">
          <section className="rounded-3xl bg-white p-6 shadow-sm sm:p-8">
            {step === 0 && (
              <>
                <h2 className="font-display text-2xl font-bold">
                  Review your cart
                </h2>
                {items.map((x) => (
                  <div key={x.id} className="mt-4 flex items-center gap-3">
                    <img
                      src={x.product.image_urls?.[0]}
                      alt=""
                      className="h-16 w-16 rounded-xl object-cover"
                    />
                    <div>
                      <b>{x.product.name}</b>
                      <p className="text-xs text-stone-400">Qty {x.quantity}</p>
                    </div>
                    <b className="ml-auto text-wine-700">
                      ${(price(x.product) * x.quantity).toFixed(2)}
                    </b>
                  </div>
                ))}
              </>
            )}
            {step === 1 && (
              <>
                <div className="flex justify-between">
                  <h2 className="font-display text-2xl font-bold">
                    Delivery address
                  </h2>
                  <button
                    onClick={() => setAdding(!adding)}
                    className="text-sm font-bold text-wine-700"
                  >
                    + New address
                  </button>
                </div>
                {adding && (
                  <div className="mt-5 rounded-2xl bg-[#f7f2ec] p-5">
                    <AddressForm
                      userId={user.id}
                      onSaved={() => {
                        setAdding(false);
                        refreshAddresses();
                      }}
                    />
                  </div>
                )}
                <div className="mt-5 space-y-3">
                  {addresses.map((a) => (
                    <button
                      key={a.id}
                      onClick={() => setSelectedAddress(a.id)}
                      className={`w-full rounded-2xl border p-4 text-left ${selectedAddress === a.id ? "border-wine-700 bg-wine-50" : "border-stone-200"}`}
                    >
                      <b>
                        {a.label} · {a.full_name}
                      </b>
                      <p className="mt-1 text-sm text-stone-500">
                        {a.street}, {a.building}, {a.area}, {a.city}
                      </p>
                    </button>
                  ))}
                  {!addresses.length && !adding && (
                    <p className="rounded-xl bg-amber-50 p-4 text-sm text-amber-800">
                      Add a delivery address to continue.
                    </p>
                  )}
                </div>
              </>
            )}
            {step === 2 && (
              <>
                <h2 className="font-display text-2xl font-bold">
                  Delivery method
                </h2>
                <div className="mt-5 space-y-3">
                  {[
                    [
                      "standard",
                      "Standard delivery",
                      "2–4 business days",
                      subtotal >= 50 ? 0 : 4,
                    ],
                    ["express", "Express delivery", "Next business day", 8],
                  ].map(([id, title, copy, fee]) => (
                    <button
                      key={id}
                      onClick={() => setDelivery(id)}
                      className={`flex w-full items-center gap-4 rounded-2xl border p-5 text-left ${delivery === id ? "border-wine-700 bg-wine-50" : "border-stone-200"}`}
                    >
                      <Truck className="text-wine-700" />
                      <div>
                        <b>{title}</b>
                        <p className="text-xs text-stone-400">{copy}</p>
                      </div>
                      <b className="ml-auto">{fee ? `$${fee}` : "FREE"}</b>
                    </button>
                  ))}
                </div>
              </>
            )}
            {step === 3 && (
              <>
                <h2 className="font-display text-2xl font-bold">Payment</h2>
                <div className="mt-5 space-y-3">
                  {[
                    ["cash_on_delivery", "Cash on delivery"],
                    ["card_on_delivery", "Card on delivery"],
                  ].map(([id, label]) => (
                    <button
                      key={id}
                      onClick={() => setPayment(id)}
                      className={`flex w-full items-center gap-3 rounded-2xl border p-5 ${payment === id ? "border-wine-700 bg-wine-50" : "border-stone-200"}`}
                    >
                      <CreditCard className="text-wine-700" />
                      <b>{label}</b>
                    </button>
                  ))}
                </div>
              </>
            )}
            {step === 4 && (
              <>
                <h2 className="font-display text-2xl font-bold">
                  Review order
                </h2>
                <p className="mt-2 text-sm text-stone-500">
                  Confirm every detail before placing your order.
                </p>
                <dl className="mt-5 divide-y divide-stone-100 rounded-2xl bg-[#f7f2ec] px-5 text-sm">
                  {[
                    ["Items", `${items.length} products`],
                    [
                      "Delivery",
                      delivery === "express" ? "Express" : "Standard",
                    ],
                    ["Payment", payment.replaceAll("_", " ")],
                    [
                      "Address",
                      addresses.find((x) => x.id === selectedAddress)?.label ||
                        "Not selected",
                    ],
                  ].map(([k, v]) => (
                    <div key={k} className="flex justify-between py-3">
                      <dt className="text-stone-500">{k}</dt>
                      <dd className="font-bold capitalize">{v}</dd>
                    </div>
                  ))}
                </dl>
                <label className="mt-5 block text-sm font-bold">
                  Promo code
                  <div className="mt-2 flex gap-2">
                    <input
                      value={promo}
                      onChange={(e) => setPromo(e.target.value.toUpperCase())}
                      placeholder="AURA10"
                      className="h-12 flex-1 rounded-xl border border-stone-200 px-4"
                    />
                  </div>
                </label>
                {error && (
                  <p className="mt-4 flex gap-2 rounded-xl bg-red-50 p-4 text-sm font-semibold text-red-700">
                    <CircleAlert size={18} />
                    {error}
                  </p>
                )}
                <button
                  disabled={placing}
                  onClick={place}
                  className="btn-primary mt-6 w-full rounded-xl"
                >
                  {placing ? "Placing order…" : "Place Order"}
                </button>
              </>
            )}
            <div className="mt-7 flex justify-between border-t border-stone-100 pt-5">
              <button
                disabled={step === 0}
                onClick={() => setStep(step - 1)}
                className="btn-secondary rounded-xl disabled:invisible"
              >
                Back
              </button>
              {step < 4 && (
                <button
                  disabled={
                    (step === 0 && !items.length) ||
                    (step === 1 && !selectedAddress)
                  }
                  onClick={() => setStep(step + 1)}
                  className="btn-primary rounded-xl disabled:opacity-40"
                >
                  Continue
                  <ArrowRight size={15} />
                </button>
              )}
            </div>
          </section>
          <aside className="rounded-3xl bg-wine-800 p-6 text-white shadow-card">
            <h2 className="font-display text-2xl font-bold">Order summary</h2>
            <div className="mt-5 space-y-3 text-sm">
              <div className="flex justify-between text-white/60">
                <span>Subtotal</span>
                <b className="text-white">${subtotal.toFixed(2)}</b>
              </div>
              <div className="flex justify-between text-white/60">
                <span>Delivery</span>
                <b className="text-white">
                  {deliveryFee ? `$${deliveryFee.toFixed(2)}` : "Free"}
                </b>
              </div>
              <div className="flex justify-between border-t border-white/10 pt-4 text-lg">
                <b>Total</b>
                <b>${(subtotal + deliveryFee).toFixed(2)}</b>
              </div>
            </div>
            <p className="mt-6 flex gap-2 text-xs text-white/45">
              <BadgeCheck size={15} />
              Inventory is rechecked securely when you place the order.
            </p>
          </aside>
        </div>
      </div>
    </main>
  );
}

function OrderTimeline({ status }) {
  const current = orderSteps.findIndex(
    (x) => x.toLowerCase().replaceAll(" ", "_") === status,
  );
  return (
    <div className="mt-5 flex overflow-x-auto pb-2">
      {orderSteps.map((x, i) => (
        <React.Fragment key={x}>
          <div
            className={`min-w-16 text-center ${i <= current ? "text-wine-700" : "text-stone-300"}`}
          >
            <span
              className={`mx-auto grid h-8 w-8 place-items-center rounded-full ${i <= current ? "bg-wine-700 text-white" : "bg-stone-100"}`}
            >
              {i < current ? <Check size={14} /> : i + 1}
            </span>
            <p className="mt-2 text-[10px] font-bold">{x}</p>
          </div>
          {i < orderSteps.length - 1 && (
            <span
              className={`mt-4 h-px min-w-6 flex-1 ${i < current ? "bg-wine-300" : "bg-stone-200"}`}
            />
          )}
        </React.Fragment>
      ))}
    </div>
  );
}
export function MyOrdersPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]),
    [loading, setLoading] = useState(true),
    [open, setOpen] = useState(null);
  useEffect(() => {
    getMyOrders(user.id)
      .then(setOrders)
      .finally(() => setLoading(false));
  }, [user.id]);
  return (
    <main className="min-h-screen bg-[#f7f2ec]">
      <MarketHeader />
      <div className="wrap py-10">
        <h1 className="font-display text-4xl font-bold">My Orders</h1>
        <p className="mt-2 text-stone-500">
          Track deliveries and revisit your Aura purchases.
        </p>
        <div className="mt-8 space-y-5">
          {loading ? (
            <div className="rounded-3xl bg-white p-12 text-center">
              Loading orders…
            </div>
          ) : (
            orders.map((o) => (
              <article
                key={o.id}
                className="rounded-3xl bg-white p-6 shadow-sm"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-wine-600">
                      {o.order_number}
                    </p>
                    <h2 className="mt-1 font-display text-2xl font-bold">
                      {o.items.length} product{o.items.length === 1 ? "" : "s"}
                    </h2>
                    <p className="mt-1 text-sm text-stone-400">
                      Placed {new Date(o.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="rounded-full bg-wine-50 px-3 py-1 text-xs font-bold capitalize text-wine-700">
                      {o.status.replaceAll("_", " ")}
                    </span>
                    <p className="mt-2 font-display text-xl font-bold">
                      ${Number(o.total).toFixed(2)}
                    </p>
                  </div>
                </div>
                <div className="mt-5 flex gap-2">
                  {o.items.slice(0, 4).map((i) => (
                    <img
                      key={i.id}
                      src={i.image_url}
                      alt=""
                      className="h-16 w-16 rounded-xl object-cover"
                    />
                  ))}
                </div>
                <OrderTimeline status={o.status} />
                <div className="mt-5 flex flex-wrap gap-2">
                  <button
                    onClick={() => setOpen(open === o.id ? null : o.id)}
                    className="btn-primary rounded-xl px-4 py-2.5"
                  >
                    {open === o.id ? "Hide Details" : "Track Order"}
                  </button>
                  <a
                    href="/marketplace"
                    className="btn-secondary rounded-xl px-4 py-2.5"
                  >
                    Buy Again
                  </a>
                  {["pending", "confirmed"].includes(o.status) && (
                    <button className="btn-secondary rounded-xl px-4 py-2.5 text-red-700">
                      Cancel Order
                    </button>
                  )}
                </div>
                {open === o.id && (
                  <div className="mt-5 grid gap-4 rounded-2xl bg-[#f7f2ec] p-5 text-sm sm:grid-cols-2">
                    <div>
                      <b>Delivery address</b>
                      <p className="mt-2 leading-6 text-stone-500">
                        {o.delivery_address?.street},{" "}
                        {o.delivery_address?.building}
                        <br />
                        {o.delivery_address?.area}, {o.delivery_address?.city}
                      </p>
                    </div>
                    <div>
                      <b>Latest update</b>
                      <p className="mt-2 text-stone-500">
                        {o.tracking?.at(-1)?.description ||
                          "Your order is being processed."}
                      </p>
                      <p className="mt-2 text-xs text-stone-400">
                        Estimated{" "}
                        {o.estimated_delivery_at &&
                          new Date(
                            o.estimated_delivery_at,
                          ).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                )}
              </article>
            ))
          )}
          {!loading && !orders.length && (
            <div className="rounded-3xl bg-white p-14 text-center">
              <Box className="mx-auto text-wine-600" />
              <h2 className="mt-4 font-display text-2xl font-bold">
                No orders yet
              </h2>
              <a href="/marketplace" className="btn-primary mt-5 rounded-xl">
                Start shopping
              </a>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
