import { supabase } from "./supabase.js";

function requireClient() {
  if (!supabase) throw new Error("Supabase is not configured.");
  return supabase;
}

export async function getSalons({ homeOnly = false } = {}) {
  let query = requireClient()
    .from("salons")
    .select("*, services(*), reviews(rating)")
    .eq("is_active", true);
  if (homeOnly) query = query.eq("offers_home_service", true);
  const { data, error } = await query.order("name");
  if (error) throw error;
  return data;
}

export async function getSalonDetails(slug) {
  const { data, error } = await requireClient()
    .from("salons")
    .select("*, services(*), specialists(*), reviews(*), products(*)")
    .eq("slug", slug)
    .eq("is_active", true)
    .single();
  if (error) throw error;
  return data;
}

export async function getMyBookings(userId) {
  const { data, error } = await requireClient()
    .from("bookings")
    .select(
      "*, salon:salons(*), service:services(*), specialist:specialists(*)",
    )
    .eq("customer_id", userId)
    .order("appointment_at", { ascending: false });
  if (error) throw error;
  return data;
}

export async function getFavorites(userId) {
  const { data, error } = await requireClient()
    .from("favorites")
    .select("salon:salons(*, services(*), reviews(rating))")
    .eq("user_id", userId);
  if (error) throw error;
  return data.map((item) => item.salon).filter(Boolean);
}

export async function createBooking(values) {
  const { data, error } = await requireClient()
    .from("bookings")
    .insert(values)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function createBookingFromSelection({
  userId,
  salonSlug,
  booking,
  address,
}) {
  const client = requireClient();
  const { data: salon, error: salonError } = await client
    .from("salons")
    .select("id")
    .eq("slug", salonSlug)
    .single();
  if (salonError) throw salonError;
  const { data: service, error: serviceError } = await client
    .from("services")
    .select("id")
    .eq("salon_id", salon.id)
    .eq("name", booking.service.name)
    .single();
  if (serviceError) throw serviceError;

  const appointment = new Date(booking.date.date);
  const [, hourText, minuteText, meridiem] =
    booking.time.match(/(\d+):(\d+)\s(AM|PM)/) || [];
  let hour = Number(hourText);
  if (meridiem === "PM" && hour !== 12) hour += 12;
  if (meridiem === "AM" && hour === 12) hour = 0;
  appointment.setHours(hour, Number(minuteText), 0, 0);
  const home = booking.location === "home";

  return createBooking({
    customer_id: userId,
    salon_id: salon.id,
    service_id: service.id,
    specialist_name: booking.specialist?.name || "No Preference",
    appointment_at: appointment.toISOString(),
    location_type: home ? "home" : "salon",
    address: home ? `${address.address}, ${address.city}` : null,
    location_notes: home ? address.notes || null : null,
    service_price: booking.service.price,
    additional_fee: home ? 12 : 0,
    payment_method: booking.payment,
    payment_status: "pending",
    status: "confirmed",
  });
}

export async function updateBooking(bookingId, values) {
  const { data, error } = await requireClient()
    .from("bookings")
    .update(values)
    .eq("id", bookingId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function toggleFavorite(userId, salonId, favorite) {
  const query = requireClient().from("favorites");
  const { error } = favorite
    ? await query.upsert({ user_id: userId, salon_id: salonId })
    : await query.delete().eq("user_id", userId).eq("salon_id", salonId);
  if (error) throw error;
}

export async function submitReview(values) {
  const { data, error } = await requireClient()
    .from("reviews")
    .insert(values)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function getProductCategories() {
  const { data, error } = await requireClient()
    .from("product_categories")
    .select("*")
    .eq("is_active", true)
    .order("sort_order");
  if (error) throw error;
  return data;
}

export async function getProducts() {
  const { data, error } = await requireClient()
    .from("products")
    .select(
      "*, category:product_categories(*), reviews:product_reviews(rating)",
    )
    .eq("is_active", true)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

export async function getProduct(slug) {
  const { data, error } = await requireClient()
    .from("products")
    .select(
      "*, category:product_categories(*), salon:salons(id,slug,name), reviews:product_reviews(*)",
    )
    .eq("slug", slug)
    .eq("is_active", true)
    .single();
  if (error) throw error;
  return data;
}

async function getOrCreateCart(userId) {
  const client = requireClient();
  const { data: existing, error: readError } = await client
    .from("shopping_carts")
    .select("id")
    .eq("user_id", userId)
    .maybeSingle();
  if (readError) throw readError;
  if (existing) return existing.id;
  const { data, error } = await client
    .from("shopping_carts")
    .insert({ user_id: userId })
    .select("id")
    .single();
  if (error) throw error;
  return data.id;
}

export async function getCart(userId) {
  const cartId = await getOrCreateCart(userId);
  const { data, error } = await requireClient()
    .from("cart_items")
    .select("*, product:products(*, category:product_categories(*))")
    .eq("cart_id", cartId)
    .order("created_at");
  if (error) throw error;
  return data;
}

export async function addToCart(
  userId,
  productId,
  quantity = 1,
  variation = "",
) {
  const client = requireClient();
  const cartId = await getOrCreateCart(userId);
  const { data: existing, error: readError } = await client
    .from("cart_items")
    .select("*")
    .eq("cart_id", cartId)
    .eq("product_id", productId)
    .eq("variation", variation)
    .maybeSingle();
  if (readError) throw readError;
  const values = {
    cart_id: cartId,
    product_id: productId,
    variation,
    quantity: (existing?.quantity || 0) + quantity,
  };
  const { data, error } = await client
    .from("cart_items")
    .upsert(values, { onConflict: "cart_id,product_id,variation" })
    .select("*, product:products(*)")
    .single();
  if (error) throw error;
  return data;
}

export async function updateCartItem(itemId, quantity) {
  const client = requireClient();
  const result =
    quantity <= 0
      ? await client.from("cart_items").delete().eq("id", itemId)
      : await client
          .from("cart_items")
          .update({ quantity })
          .eq("id", itemId)
          .select("*, product:products(*)")
          .single();
  if (result.error) throw result.error;
  return result.data;
}

export async function getWishlist(userId) {
  const { data, error } = await requireClient()
    .from("product_wishlist")
    .select(
      "product:products(*, category:product_categories(*), reviews:product_reviews(rating))",
    )
    .eq("user_id", userId);
  if (error) throw error;
  return data.map((item) => item.product).filter(Boolean);
}

export async function setWishlistProduct(userId, productId, saved) {
  const query = requireClient().from("product_wishlist");
  const { error } = saved
    ? await query.upsert({ user_id: userId, product_id: productId })
    : await query.delete().eq("user_id", userId).eq("product_id", productId);
  if (error) throw error;
}

export async function getAddresses(userId) {
  const { data, error } = await requireClient()
    .from("customer_addresses")
    .select("*")
    .eq("user_id", userId)
    .order("is_default", { ascending: false })
    .order("created_at");
  if (error) throw error;
  return data;
}

export async function saveAddress(values) {
  const { data, error } = await requireClient()
    .from("customer_addresses")
    .insert(values)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function getMyOrders(userId) {
  const { data, error } = await requireClient()
    .from("orders")
    .select("*, items:order_items(*), tracking:order_tracking_events(*)")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

export async function placeMarketplaceOrder(values) {
  const { data, error } = await requireClient().rpc(
    "place_marketplace_order",
    values,
  );
  if (error) throw error;
  return data;
}

export async function getAssistantCatalog() {
  const client = requireClient();
  const [salons, products, faq] = await Promise.all([
    client.from("salons").select("*, services(*), specialists(*), reviews(rating)").eq("is_active", true),
    client.from("products").select("*, category:product_categories(*), salon:salons(id,slug,name), reviews:product_reviews(rating)").eq("is_active", true),
    client.from("platform_faq").select("*").order("topic"),
  ]);
  const failed = [salons, products, faq].find((result) => result.error);
  if (failed) throw failed.error;
  return { salons: salons.data, products: products.data, faq: faq.data };
}

export async function assistantCreateBooking(values) {
  const { data, error } = await requireClient().rpc("ai_create_booking", values);
  if (error) throw error;
  return data;
}

export async function assistantRescheduleBooking(bookingId, appointmentAt) {
  const { data, error } = await requireClient().rpc("ai_reschedule_booking", { p_booking_id: bookingId, p_appointment_at: appointmentAt });
  if (error) throw error;
  return data;
}

export async function assistantCancelBooking(bookingId) {
  const { data, error } = await requireClient().rpc("ai_cancel_booking", { p_booking_id: bookingId });
  if (error) throw error;
  return data;
}

export async function searchAvailableSlots(salonId, serviceId, date, specialistId = null, after = null) {
  const { data, error } = await requireClient().rpc("search_available_slots", { p_salon_id: salonId, p_service_id: serviceId, p_date: date, p_specialist_id: specialistId, p_after: after });
  if (error) throw error;
  return data;
}

export async function getCancellationQuote(bookingId) {
  const { data, error } = await requireClient().rpc("get_booking_cancellation_quote", { p_booking_id: bookingId });
  if (error) throw error;
  return data?.[0] || null;
}

export async function getAssistantConversation(userId) {
  const client = requireClient();
  let { data: conversation, error } = await client.from("assistant_conversations").select("*").eq("user_id", userId).order("updated_at", { ascending: false }).limit(1).maybeSingle();
  if (error) throw error;
  if (!conversation) {
    const created = await client.from("assistant_conversations").insert({ user_id: userId }).select("*").single();
    if (created.error) throw created.error;
    conversation = created.data;
  }
  const messages = await client.from("assistant_messages").select("role,content,created_at").eq("conversation_id", conversation.id).order("created_at").limit(100);
  if (messages.error) throw messages.error;
  return { conversation, messages: messages.data };
}

export async function saveAssistantMessage(userId, conversationId, role, content, context = null) {
  const client = requireClient();
  const result = await client.from("assistant_messages").insert({ user_id: userId, conversation_id: conversationId, role, content });
  if (result.error) throw result.error;
  const values = { updated_at: new Date().toISOString() };
  if (context) values.context = context;
  const updated = await client.from("assistant_conversations").update(values).eq("id", conversationId).eq("user_id", userId);
  if (updated.error) throw updated.error;
}
