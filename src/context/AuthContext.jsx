'use client'

import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { isSupabaseConfigured, mapSupabaseUser, supabase } from '../lib/supabase.js'

const AuthContext = createContext(null)

export function navigate(to, { replace = false } = {}) {
  if (typeof window === 'undefined') return
  window.history[replace ? 'replaceState' : 'pushState']({}, '', to)
  window.dispatchEvent(new PopStateEvent('popstate'))
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    let active = true

    async function resolveUser(authUser) {
      if (!authUser) return null
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, phone, role, avatar_url')
        .eq('id', authUser.id)
        .maybeSingle()
      return mapSupabaseUser(authUser, profile)
    }

    if (!isSupabaseConfigured) {
      setIsReady(true)
      return undefined
    }

    supabase.auth.getSession().then(async ({ data }) => {
      const nextUser = await resolveUser(data.session?.user)
      if (active) {
        setUser(nextUser)
        setIsReady(true)
      }
    })

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      window.setTimeout(async () => {
        const nextUser = await resolveUser(session?.user)
        if (active) {
          setUser(nextUser)
          setIsReady(true)
        }
      }, 0)
    })

    return () => {
      active = false
      listener.subscription.unsubscribe()
    }
  }, [])

  const value = useMemo(() => ({
    user,
    isAuthenticated: Boolean(user),
    isReady,
    isSupabaseConfigured,
    async login(email, password) {
      if (!supabase) throw new Error('Supabase is not configured.')
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw error
      const { data: profile } = await supabase.from('profiles').select('full_name, phone, role, avatar_url').eq('id', data.user.id).maybeSingle()
      const nextUser = mapSupabaseUser(data.user, profile)
      setUser(nextUser)
      return nextUser
    },
    async logout() {
      if (supabase) await supabase.auth.signOut()
      setUser(null)
    },
  }), [user, isReady])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const value = useContext(AuthContext)
  if (!value) throw new Error('useAuth must be used inside AuthProvider')
  return value
}
