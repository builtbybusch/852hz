import type { Metadata, Viewport } from "next"
import { Cookie, Inter, Geist_Mono } from "next/font/google"

import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { SwRegister } from "@/components/sw-register"
import { Analytics } from "@vercel/analytics/next"
import { cn } from "@/lib/utils"

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" })

const fontMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
})

const cookie = Cookie({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-cookie",
})

export const metadata: Metadata = {
  title: "852 Hz",
  description: "Free solfeggio frequency tone generator",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "852 Hz",
  },
  icons: {
    icon: "/icon-512.png",
    apple: "/icon-192.png",
  },
}

export const viewport: Viewport = {
  themeColor: "#0a0a1a",
  width: "device-width",
  initialScale: 1,
  userScalable: false,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn(
        "antialiased",
        fontMono.variable,
        cookie.variable,
        "font-sans",
        inter.variable,
      )}
    >
      <body>
        <ThemeProvider>{children}</ThemeProvider>
        <SwRegister />
        <Analytics />
      </body>
    </html>
  )
}
