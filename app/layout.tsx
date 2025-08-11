import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { AuthProvider } from "@/contexts/AuthContext"
import { NotificationProvider } from "@/contexts/NotificationContext"
import NotificationContainer from "@/components/NotificationContainer"
import ErrorBoundary from "@/components/ErrorBoundary"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Sistema de Gestión ITLA",
  description: "Sistema integral de gestión académica del Instituto Tecnológico de Las Américas",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <head>
        <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet" />
        <link href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.10.0/font/bootstrap-icons.css" rel="stylesheet" />
      </head>
      <body className={inter.className}>
        <ErrorBoundary>
          <NotificationProvider>
            <AuthProvider>
              {children}
              <NotificationContainer />
            </AuthProvider>
          </NotificationProvider>
        </ErrorBoundary>
        <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js" async />
      </body>
    </html>
  )
}
