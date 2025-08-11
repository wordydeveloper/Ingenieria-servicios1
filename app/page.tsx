"use client"

import { useAuth } from "@/contexts/AuthContext"
import LoginForm from "@/components/LoginForm"
import Dashboard from "@/components/Dashboard"

export default function Home() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center min-vh-100">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Cargando...</span>
        </div>
      </div>
    )
  }

  return <div className="min-vh-100">{user ? <Dashboard /> : <LoginForm />}</div>
}
