"use client"

import type React from "react"
import { useState } from "react"
import { useAuth } from "@/contexts/AuthContext"

export default function LoginForm() {
  const [isLogin, setIsLogin] = useState(true)
  const [formData, setFormData] = useState({
    nombre: "",
    correo: "",
    clave: "",
    rolId: 1,
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const { login, register } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      if (isLogin) {
        const success = await login(formData.correo, formData.clave)
        if (!success) {
          setError("Credenciales incorrectas")
        }
      } else {
        const success = await register(formData.nombre, formData.correo, formData.clave, formData.rolId)
        if (success) {
          setError("")
          alert("Usuario registrado exitosamente. Ahora puedes iniciar sesión.")
          setIsLogin(true)
        } else {
          setError("Error al registrar usuario")
        }
      }
    } catch (error) {
      setError("Error de conexión")
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  return (
    <div className="login-container">
      <div className="login-card animate-fadeIn">
        <div className="login-logo">
          <div className="d-flex align-items-center justify-content-center mb-3">
            <div className="user-avatar" style={{ width: '80px', height: '80px', fontSize: '2rem' }}>
              <i className="bi bi-mortarboard"></i>
            </div>
          </div>
          <h1 className="login-title">Sistema ITLA</h1>
          <p className="login-subtitle">
            {isLogin ? "Accede a tu cuenta institucional" : "Registro de nuevo usuario"}
          </p>
        </div>

        {error && (
          <div className="alert alert-danger animate-slideInRight" role="alert">
            <i className="bi bi-exclamation-triangle-fill me-2"></i>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {!isLogin && (
            <div className="form-group-itla">
              <label htmlFor="nombre" className="form-label-itla">
                <i className="bi bi-person me-2"></i>Nombre completo
              </label>
              <input
                type="text"
                className="form-control-itla"
                id="nombre"
                name="nombre"
                value={formData.nombre || ""}  // Ensure never undefined
                onChange={handleChange}
                placeholder="Ingresa tu nombre completo"
                required
              />
            </div>
          )}

          <div className="form-group-itla">
            <label htmlFor="correo" className="form-label-itla">
              <i className="bi bi-envelope me-2"></i>Correo institucional
            </label>
            <input
              type="email"
              className="form-control-itla"
              id="correo"
              name="correo"
              value={formData.correo || ""}  // Ensure never undefined
              onChange={handleChange}
              placeholder="usuario@itla.edu.do"
              required
            />
          </div>

          <div className="form-group-itla">
            <label htmlFor="clave" className="form-label-itla">
              <i className="bi bi-lock me-2"></i>Contraseña
            </label>
            <input
              type="password"
              className="form-control-itla"
              id="clave"
              name="clave"
              value={formData.clave || ""}  // Ensure never undefined
              onChange={handleChange}
              placeholder="••••••••"
              required
            />
          </div>

          {!isLogin && (
            <div className="form-group-itla">
              <label htmlFor="rolId" className="form-label-itla">
                <i className="bi bi-person-badge me-2"></i>Tipo de usuario
              </label>
              <select
                className="form-control-itla"
                id="rolId"
                name="rolId"
                value={formData.rolId || 1}  // Ensure never undefined
                onChange={handleChange}
              >
                <option value={1}>👑 Administrador</option>
                <option value={2}>👤 Usuario</option>
                <option value={3}>🎯 Cliente</option>
              </select>
            </div>
          )}

          <button 
            type="submit" 
            className="btn-itla-primary w-100 mb-3" 
            disabled={loading}
            style={{ padding: '1rem' }}
          >
            {loading ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                {isLogin ? "Iniciando sesión..." : "Creando cuenta..."}
              </>
            ) : (
              <>
                <i className={`bi ${isLogin ? 'bi-box-arrow-in-right' : 'bi-person-plus'} me-2`}></i>
                {isLogin ? "Iniciar sesión" : "Crear cuenta"}
              </>
            )}
          </button>
        </form>

        <div className="text-center">
          <p className="text-muted mb-3">
            {isLogin ? "¿No tienes una cuenta?" : "¿Ya tienes una cuenta?"}
          </p>
          <button 
            type="button" 
            className="btn-itla-outline" 
            onClick={() => setIsLogin(!isLogin)}
          >
            <i className={`bi ${isLogin ? 'bi-person-plus' : 'bi-box-arrow-in-right'} me-2`}></i>
            {isLogin ? "Crear cuenta nueva" : "Iniciar sesión"}
          </button>
        </div>

        <div className="text-center mt-4">
          <small className="text-muted">
            <i className="bi bi-shield-check me-1"></i>
            Instituto Tecnológico de Las Américas
          </small>
        </div>
      </div>
    </div>
  )
}
