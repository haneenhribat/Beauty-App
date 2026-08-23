import '../src/index.css'

export const metadata = {
  title: 'Aura — Beauty, beautifully simple.',
  description: 'Aura makes discovering and booking trusted beauty services effortless.',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
