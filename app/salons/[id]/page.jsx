'use client'
import { SalonDetailsPage } from '../../../src/salons.jsx'
export default function Page(){const id=typeof window==='undefined'?'luna-beauty':window.location.pathname.split('/')[2];return <SalonDetailsPage id={id}/>}
