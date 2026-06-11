import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'GRACE Enterprise — Logo & Design Studio',
  description: 'AI-powered fashion design platform',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
