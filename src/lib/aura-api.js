import { supabase } from './supabase.js'

function requireClient() {
  if (!supabase) throw new Error('Supabase is not configured.')
  return supabase
}

export async function getSalons({ homeOnly = false } = {}) {
  let query = requireClient().from('salons').select('*, services(*), specialists(*)').eq('is_active', true)
  if (homeOnly) query = query.eq('offers_home_service', true)
  const { data, error } = await query.order('name')
  if (error) throw error
  return data
}

export async function getMyBookings(userId) {
  const { data, error } = await requireClient()
    .from('bookings')
    .select('*, salon:salons(*), service:services(*), specialist:specialists(*)')
    .eq('customer_id', userId)
    .order('appointment_at', { ascending: false })
  if (error) throw error
  return data
}

export async function createBooking(values) {
  const { data, error } = await requireClient().from('bookings').insert(values).select().single()
  if (error) throw error
  return data
}

export async function updateBooking(bookingId, values) {
  const { data, error } = await requireClient().from('bookings').update(values).eq('id', bookingId).select().single()
  if (error) throw error
  return data
}

export async function toggleFavorite(userId, salonId, favorite) {
  const query = requireClient().from('favorites')
  const { error } = favorite
    ? await query.upsert({ user_id: userId, salon_id: salonId })
    : await query.delete().eq('user_id', userId).eq('salon_id', salonId)
  if (error) throw error
}

export async function submitReview(values) {
  const { data, error } = await requireClient().from('reviews').insert(values).select().single()
  if (error) throw error
  return data
}
