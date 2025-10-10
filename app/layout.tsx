import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Modern YouTube Player - Next.js 15 & React 19',
  description: 'A feature-rich YouTube player built with the latest Next.js, React, and TypeScript patterns from Context7',
  keywords: ['YouTube', 'Player', 'Next.js', 'React', 'TypeScript', 'Video'],
  authors: [{ name: 'Helye' }],
  openGraph: {
    title: 'Modern YouTube Player',
    description: 'Built with Next.js 15, React 19, and TypeScript',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
      </head>
      <body 
        className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white antialiased"
        suppressHydrationWarning={true}
      >
        <main className="container mx-auto px-4 py-8">
          {children}
        </main>
      </body>
    </html>
  )
}