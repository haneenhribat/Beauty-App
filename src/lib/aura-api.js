import { supabase } from './supabase.js'

function requireClient() {
  if (!supabase) throw new Error('Supabase is not configured.')
  return supabase
}

export async function getSalons({ homeOnly = false } = {}) {
  let query = requireClient().from('salons').select('*, services(*), reviews(rating)').eq('is_active', true)
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

export async function createBookingFromSelection({ userId, salonSlug, booking, address }) {
  const client = requireClient()
  const { data: salon, error: salonError } = await client.from('salons').select('id').eq('slug', salonSlug).single()
  if (salonError) throw salonError
  const { data: service, error: serviceError } = await client.from('services').select('id').eq('salon_id', salon.id).eq('name', booking.service.name).single()
  if (serviceError) throw serviceError

  const appointment = new Date(booking.date.date)
  const [, hourText, minuteText, meridiem] = booking.time.match(/(\d+):(\d+)\s(AM|PM)/) || []
  let hour = Number(hourText)
  if (meridiem === 'PM' && hour !== 12) hour += 12
  if (meridiem === 'AM' && hour === 12) hour = 0
  appointment.setHours(hour, Number(minuteText), 0, 0)
  const home = booking.location === 'home'

  return createBooking({
    customer_id: userId,
    salon_id: salon.id,
    service_id: service.id,
    specialist_name: booking.specialist?.name || 'No Preference',
    appointment_at: appointment.toISOString(),
    location_type: home ? 'home' : 'salon',
    address: home ? `${address.address}, ${address.city}` : null,
    location_notes: home ? address.notes || null : null,
    service_price: booking.service.price,
    additional_fee: home ? 12 : 0,
    payment_method: booking.payment,
    payment_status: 'pending',
    status: 'confirmed',
  })
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
