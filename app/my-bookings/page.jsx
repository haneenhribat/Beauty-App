'use client'

import { MyBookingsPage } from '../../src/bookings.jsx'
import { ProtectedRoute } from '../../src/components/ProtectedRoute.jsx'

export default function Page(){return <ProtectedRoute><MyBookingsPage/></ProtectedRoute>}
