'use client'
import { BookingPage } from '../../../src/salons.jsx'
import { ProtectedRoute } from '../../../src/components/ProtectedRoute.jsx'
export default function Page(){const id=typeof window==='undefined'?'luna-beauty':window.location.pathname.split('/')[2];return <ProtectedRoute><BookingPage id={id}/></ProtectedRoute>}
