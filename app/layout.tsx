import type { Metadata } from 'next'
import { Geist } from 'next/font/google'
import './globals.css'

const geist = Geist({
  variable: '--font-geist',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'FoundriOS — AI Operating System voor vakbedrijven',
  description:
    'Gecentraliseerde lead inbox, AI-kwalificatie en dashboards voor projectgedreven vakbedrijven.',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="nl">
      <body className={`${geist.variable} font-sans antialiased`}>{children}</body>
    </html>
  )
}
