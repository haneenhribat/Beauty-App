import '../src/index.css'
import AppProviders from '../src/components/AppProviders.jsx'

export const metadata = {
  title: 'Aura — Beauty, beautifully simple.',
  description: 'Aura makes discovering and booking trusted beauty services effortless.',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body><AppProviders>{children}</AppProviders></body>
    </html>
  )
}
