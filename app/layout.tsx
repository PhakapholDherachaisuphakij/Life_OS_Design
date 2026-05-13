import './globals.css'
import type { Metadata } from 'next'
import AuthGuard from '../components/AuthGuard'

export const metadata: Metadata = {
  title: "PK's Core OS",
  description: 'Personal Life OS Dashboard',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <AuthGuard>{children}</AuthGuard>
      </body>
    </html>
  )
}
