'use client'

import { DashboardPage } from '../../src/main.jsx'
import { ProtectedRoute } from '../../src/components/ProtectedRoute.jsx'

export default function Page(){return <ProtectedRoute><DashboardPage/></ProtectedRoute>}
