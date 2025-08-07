import type React from "react"
import type { Metadata } from "next"
import { AuthProvider } from "@/contexts/AuthContext"
import "bootstrap/dist/css/bootstrap.min.css"
import "./globals.css"
import Script from "next/script"
import ErrorBoundary from "@/components/ErrorBoundary"

export const metadata: Metadata = {
  title: "Sistema ITLA - Gestión Académica",
  description: "Sistema integral para la gestión de eventos, libros y recursos académicos",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <head>
        <style dangerouslySetInnerHTML={{
          __html: `
            @import url('https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.0/font/bootstrap-icons.css');
          `
        }} />
      </head>
      <body>
        <ErrorBoundary>
          <AuthProvider>{children}</AuthProvider>
        </ErrorBoundary>
      </body>
    </html>
  )
}
