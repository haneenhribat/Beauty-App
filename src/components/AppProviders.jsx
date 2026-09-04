'use client'

import React from 'react'
import { AuthProvider } from '../context/AuthContext.jsx'
import { AssistantLauncher } from '../assistant.jsx'

export default function AppProviders({ children }) {
  return <AuthProvider>{children}<AssistantLauncher/></AuthProvider>
}
