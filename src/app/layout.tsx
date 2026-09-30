import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { Providers } from "@/components/providers"

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
})

export const metadata: Metadata = {
  title: {
    default: "Student Marketplace Ghana | Buy, Sell, Swap & Borrow on Campus",
    template: "%s | Student Marketplace Ghana",
  },
  description:
    "The marketplace built for students in Ghana. Buy, sell, swap, borrow and lend items safely on campus. Join thousands of students at KNUST, UG, UCC and more.",
  keywords: [
    "student marketplace Ghana",
    "campus buy sell",
    "KNUST marketplace",
    "UG student marketplace",
    "swap exchange textbooks Ghana",
    "student borrow lend",
  ],
  authors: [{ name: "Student Marketplace Ghana" }],
  creator: "Student Marketplace Ghana",
  openGraph: {
    type: "website",
    locale: "en_GH",
    url: process.env.NEXT_PUBLIC_APP_URL,
    siteName: "Student Marketplace Ghana",
    title: "Student Marketplace Ghana | Buy, Sell, Swap & Borrow on Campus",
    description: "The marketplace built for students in Ghana.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Student Marketplace Ghana",
    description: "The marketplace built for students in Ghana.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={inter.variable}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
