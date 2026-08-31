'use client'

import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'

const STORAGE_KEY = 'auraUser'
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
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) setUser(JSON.parse(saved))
    } catch {
      localStorage.removeItem(STORAGE_KEY)
    } finally {
      setIsReady(true)
    }
  }, [])

  const value = useMemo(() => ({
    user,
    isAuthenticated: Boolean(user),
    isReady,
    login(nextUser) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(nextUser))
      setUser(nextUser)
    },
    logout() {
      localStorage.removeItem(STORAGE_KEY)
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
