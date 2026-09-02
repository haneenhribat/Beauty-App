'use client'
import { FavoritesPage } from '../../src/dashboard.jsx'
import { ProtectedRoute } from '../../src/components/ProtectedRoute.jsx'
export default function Page(){return <ProtectedRoute><FavoritesPage/></ProtectedRoute>}
