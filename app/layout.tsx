import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Mystère — 14 Days Challenge',
  description: '14 jours. 14 défis. Un seul champion.',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#0A0A0F',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr" className="dark">
      <body className="min-h-screen bg-[#0A0A0F] text-white overflow-x-hidden">
        {children}
      </body>
    </html>
  )
}
