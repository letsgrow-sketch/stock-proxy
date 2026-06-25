import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "Let's Grow — IDX Syariah Stock Screener",
  description: "AI-powered stock screener for the Indonesian capital market with Syariah investment",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
