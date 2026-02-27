import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'RouteImpact',
  description: 'Sustainability Navigation Platform',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>{children}</body>
    </html>
  )
}