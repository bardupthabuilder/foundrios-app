import type { Metadata } from 'next'
import { Geist, Space_Grotesk, Inter } from 'next/font/google'
import './globals.css'

const geist = Geist({
  variable: '--font-geist',
  subsets: ['latin'],
})

const spaceGrotesk = Space_Grotesk({
  variable: '--font-display',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
})

const inter = Inter({
  variable: '--font-body',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'FoundriOS — Het complete bedrijfssysteem voor vakbedrijven',
  description:
    'Leads, projecten, planning, uren, offertes en facturen. Alles in een systeem dat gebouwd is voor hoe vakbedrijven echt werken.',
  metadataBase: new URL('https://foundrios-app.vercel.app'),
  openGraph: {
    title: 'FoundriOS — Het complete bedrijfssysteem voor vakbedrijven',
    description: 'Leads, projecten, planning, uren, offertes en facturen. Een systeem gebouwd voor vakbedrijven.',
    siteName: 'FoundriOS',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'FoundriOS — Bedrijfssysteem voor vakbedrijven',
    description: 'Leads, projecten, planning, uren, offertes en facturen. Een systeem gebouwd voor vakbedrijven.',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="nl">
      <body className={`${geist.variable} ${spaceGrotesk.variable} ${inter.variable} font-sans antialiased`}>{children}</body>
    </html>
  )
}
