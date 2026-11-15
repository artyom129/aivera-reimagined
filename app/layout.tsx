import type React from "react"
import type { Metadata, Viewport } from "next"
// Self-hosted, so builds never depend on reaching Google Fonts.
import "@fontsource-variable/golos-text"
import "@fontsource-variable/literata"
import "@fontsource-variable/jetbrains-mono"
import "./globals.css"
import { Toaster } from "@/components/ui/toaster"
import { ThemeProvider } from "@/components/theme-provider"

export const metadata: Metadata = {
  title: {
    default: "AIvera — помощник учителя",
    template: "%s · AIvera",
  },
  description: "Планы уроков, тесты, отзывы на работы и письма родителям за пару минут",
  icons: { icon: "/icon.svg" },
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fafafa" },
    { media: "(prefers-color-scheme: dark)", color: "#141415" },
  ],
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ru" suppressHydrationWarning>
      <body className="font-sans antialiased">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  )
}
