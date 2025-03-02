import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { SessionProvider } from '@/components/SessionProvider'
import { getServerSession } from 'next-auth'
import { authOptions } from './api/auth/[...nextauth]/route'

// Configure the Inter font with Next.js optimized font loading
const inter = Inter({
  subsets: ['latin'],
  display: 'swap', // Use 'swap' for better performance during font loading
  variable: '--font-inter',
})

export const metadata: Metadata = {
  title: 'Finance Tracker',
  description: 'Track your finances and expenses with ease',
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getServerSession(authOptions)

  return (
    <html lang="en" className={`${inter.variable} font-sans`}>
      <body className="min-h-screen bg-gray-50">
        <SessionProvider session={session}>
          {children}
        </SessionProvider>
      </body>
    </html>
  )
}
