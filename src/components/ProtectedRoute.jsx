'use client'

import React, { useEffect } from 'react'
import { navigate, useAuth } from '../context/AuthContext.jsx'

export function ProtectedRoute({ children }) {
  const { isAuthenticated, isReady } = useAuth()

  useEffect(() => {
    if (!isReady || isAuthenticated) return
    localStorage.setItem('auraReturnTo', `${window.location.pathname}${window.location.search}`)
    navigate('/login', { replace: true })
  }, [isAuthenticated, isReady])

  if (!isReady || !isAuthenticated) {
    return <main className="grid min-h-screen place-items-center bg-cream"><div className="h-9 w-9 animate-spin rounded-full border-2 border-wine-200 border-t-wine-700" aria-label="Checking your session" /></main>
  }

  return children
}
