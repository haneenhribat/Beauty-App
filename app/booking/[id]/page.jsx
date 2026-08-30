'use client'
import { BookingPage } from '../../../src/salons.jsx'
export default function Page(){const id=typeof window==='undefined'?'luna-beauty':window.location.pathname.split('/')[2];return <BookingPage id={id}/>}
