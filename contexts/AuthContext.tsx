"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { authService } from "@/utils/api"

interface User {
  id: number
  nombre: string
  correo: string
  rolId: number
}

interface AuthContextType {
  user: User | null
  token: string | null
  login: (correo: string, clave: string) => Promise<boolean>
  register: (nombre: string, correo: string, clave: string, rolId: number) => Promise<boolean>
  logout: () => void
  loading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const savedToken = localStorage.getItem("token")
    const savedUser = localStorage.getItem("user")

    if (savedToken && savedUser) {
      setToken(savedToken)
      setUser(JSON.parse(savedUser))
    }
    setLoading(false)
  }, [])

  const login = async (correo: string, clave: string): Promise<boolean> => {
    try {
      const data = await authService.login(correo, clave)
      const accessToken = data.data.accessToken

      // Decodificar el token para obtener la información del usuario
      const payload = JSON.parse(atob(accessToken.split(".")[1]))
      const userData = {
        id: payload.sub || 0,                           // Ensure never undefined
        nombre: payload.nombre || correo.split("@")[0] || "Usuario", // Ensure never undefined
        correo: correo || "",                           // Ensure never undefined
        rolId: payload.rolId || 1,                      // Ensure never undefined
      }

      setToken(accessToken)
      setUser(userData)
      localStorage.setItem("token", accessToken)
      localStorage.setItem("user", JSON.stringify(userData))
      return true
    } catch (error) {
      console.error("Error en login:", error)
      return false
    }
  }

  const register = async (nombre: string, correo: string, clave: string, rolId: number): Promise<boolean> => {
    try {
      await authService.register(nombre, correo, clave, rolId)
      return true
    } catch (error) {
      console.error("Error en registro:", error)
      return false
    }
  }

  const logout = () => {
    setUser(null)
    setToken(null)
    localStorage.removeItem("token")
    localStorage.removeItem("user")
  }

  return (
    <AuthContext.Provider value={{ user, token, login, register, logout, loading }}>{children}</AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth debe ser usado dentro de un AuthProvider")
  }
  return context
}
