import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.NEXT_PUBLIC_SUPABASE_URL
const supabasePublishableKey = import.meta.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY

export const isSupabaseConfigured = Boolean(supabaseUrl && supabasePublishableKey)

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabasePublishableKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storageKey: 'aura-supabase-auth',
      },
    })
  : null

export function mapSupabaseUser(authUser, profile) {
  if (!authUser) return null
  return {
    id: authUser.id,
    email: authUser.email,
    name: profile?.full_name || authUser.user_metadata?.full_name || authUser.email?.split('@')[0] || 'Aura User',
    phone: profile?.phone || authUser.phone || '',
    role: profile?.role || authUser.user_metadata?.role || 'customer',
    avatarUrl: profile?.avatar_url || authUser.user_metadata?.avatar_url || '',
  }
}
