"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/AuthContext"
import CategoriasEventos from "./CategoriasEventos"
import Eventos from "./Eventos"
import Libros from "./Libros"
import Editoriales from "./Editoriales"
import ProgramasAcademicos from "./ProgramasAcademicos"
import Materias from "./Materias"
import Estudiantes from "./Estudiantes"
import Graficas from "./Graficas"
import type { EstadisticasGenerales } from "@/types/interfaces"
import Cuatrimestres from "./Cuatrimestre"
export default function Dashboard() {
  const [activeTab, setActiveTab] = useState("dashboard")
  const [stats, setStats] = useState<EstadisticasGenerales>({
    totalLibros: 0,
    librosDisponibles: 0,
    totalEventos: 0,
    totalCategorias: 0,
    totalEditoriales: 0,
    totalProgramas: 0,
    totalMaterias: 0,
    totalEstudiantes: 0
  })
  const [loading, setLoading] = useState(true)
  const { user, logout, token } = useAuth()

  const isAdmin = user?.rolId === 1

  useEffect(() => {
    if (isAdmin && token) {
      fetchStats()
    }
  }, [isAdmin, token])

  const fetchStats = async () => {
    setLoading(true)
    try {
      const endpoints = [
        "http://127.0.0.1:8000/internal/libro/",
        "http://127.0.0.1:8000/internal/evento/",
        "http://127.0.0.1:8000/internal/categoria-evento/",
        "http://127.0.0.1:8000/internal/editorial/",
        "http://127.0.0.1:8000/internal/programa-academico/",
        "http://127.0.0.1:8000/internal/materia/",
        "http://127.0.0.1:8000/internal/estudiante/?limite=1000"
      ]

      const responses = await Promise.allSettled(
        endpoints.map(url => 
          fetch(url, { headers: { Authorization: `Bearer ${token}` } })
            .then(res => res.ok ? res.json() : { data: [] })
        )
      )

      const [librosData, eventosData, categoriasData, editorialesData, programasData, materiasData, estudiantesData] = 
        responses.map(result => result.status === 'fulfilled' ? result.value : { data: [] })

      const libros = librosData.data || []
      const librosActivos = libros.filter((libro: any) => libro.estado === "AC")
      const librosDisponibles = librosActivos.reduce((total: number, libro: any) => total + (libro.cantidadDisponible || 0), 0)

      setStats({
        totalLibros: librosActivos.length,
        librosDisponibles: librosDisponibles,
        totalEventos: (eventosData.data || []).filter((evento: any) => evento.estado === "AC").length,
        totalCategorias: (categoriasData.data || []).filter((cat: any) => cat.estado === "AC").length,
        totalEditoriales: (editorialesData.data || []).filter((ed: any) => ed.estado === "AC").length,
        totalProgramas: (programasData.data || []).filter((prog: any) => prog.estado === "AC").length,
        totalMaterias: (materiasData.data || []).filter((mat: any) => mat.estado === "AC").length,
        totalEstudiantes: (estudiantesData.data || []).length
      })
    } catch (error) {
      console.error("Error fetching stats:", error)
    } finally {
      setLoading(false)
    }
  }

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }

  return (
    <div className="itla-container">
      {/* Header Institucional */}
      <header className="itla-header">
        <div className="container-fluid">
          <div className="d-flex justify-content-between align-items-center">
            <div className="itla-logo animate-slideInLeft">
              <div className="user-avatar" style={{ width: '50px', height: '50px' }}>
                <i className="bi bi-mortarboard"></i>
              </div>
              <div>
                <div className="itla-logo-text">Sistema ITLA</div>
                <small className="text-muted">Instituto Tecnológico de Las Américas</small>
              </div>
            </div>
            
            <div className="itla-user-info animate-slideInRight">
              <div className="text-end me-3">
                <div className="fw-semibold">{user?.nombre}</div>
                <small className="text-muted">
                  {user?.rolId === 1 ? "Administrador" : user?.rolId === 2 ? "Usuario" : "Cliente"}
                </small>
              </div>
              <div className="user-avatar">
                {getInitials(user?.nombre || "U")}
              </div>
              <button className="btn btn-outline-danger ms-3" onClick={logout}>
                <i className="bi bi-box-arrow-right me-2"></i>Salir
              </button>
            </div>
          </div>
        </div>
      </header>

      {!isAdmin ? (
        <div className="container mt-5">
          <div className="content-card animate-fadeIn">
            <div className="content-card-body text-center p-5">
              <div className="mb-4">
                <i className="bi bi-shield-lock text-warning" style={{ fontSize: '4rem' }}></i>
              </div>
              <h4 className="text-itla-primary fw-bold mb-3">Acceso Restringido</h4>
              <p className="text-muted mb-4">
                Solo los administradores pueden acceder a esta sección del sistema.
              </p>
              <div className="alert alert-info">
                <i className="bi bi-info-circle me-2"></i>
                Tu rol actual: <strong>{user?.rolId === 2 ? "Usuario" : "Cliente"}</strong>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Navegación Principal */}
          <nav className="itla-nav">
            <div className="container-fluid">
              <ul className="nav nav-pills">
                <li className="nav-item">
                  <button
                    className={`nav-link ${activeTab === "dashboard" ? "active" : ""}`}
                    onClick={() => setActiveTab("dashboard")}
                  >
                    <i className="bi bi-speedometer2 me-2"></i>Dashboard
                  </button>
                </li>
                <li className="nav-item">
                  <button
                    className={`nav-link ${activeTab === "graficas" ? "active" : ""}`}
                    onClick={() => setActiveTab("graficas")}
                  >
                    <i className="bi bi-bar-chart me-2"></i>Gráficas
                  </button>
                </li>
                <li className="nav-item">
                  <button
                    className={`nav-link ${activeTab === "estudiantes" ? "active" : ""}`}
                    onClick={() => setActiveTab("estudiantes")}
                  >
                    <i className="bi bi-people me-2"></i>Estudiantes
                  </button>
                </li>
                <li className="nav-item">
                  <button
                    className={`nav-link ${activeTab === "programas" ? "active" : ""}`}
                    onClick={() => setActiveTab("programas")}
                  >
                    <i className="bi bi-mortarboard me-2"></i>Programas
                  </button>
                </li>
                <li className="nav-item">
                  <button
                    className={`nav-link ${activeTab === "materias" ? "active" : ""}`}
                    onClick={() => setActiveTab("materias")}
                  >
                    <i className="bi bi-book me-2"></i>Materias
                  </button>
                </li>
                <li className="nav-item">
                  <button
                    className={`nav-link ${activeTab === "libros" ? "active" : ""}`}
                    onClick={() => setActiveTab("libros")}
                  >
                    <i className="bi bi-journal me-2"></i>Biblioteca
                  </button>
                </li>
                <li className="nav-item">
                  <button
                    className={`nav-link ${activeTab === "eventos" ? "active" : ""}`}
                    onClick={() => setActiveTab("eventos")}
                  >
                    <i className="bi bi-calendar-event me-2"></i>Eventos
                  </button>
                </li>
                <li className="nav-item">
                  <button
                    className={`nav-link ${activeTab === "categorias" ? "active" : ""}`}
                    onClick={() => setActiveTab("categorias")}
                  >
                    <i className="bi bi-tags me-2"></i>Categorías
                  </button>
                </li>
                <li className="nav-item">
                  <button
                    className={`nav-link ${activeTab === "editoriales" ? "active" : ""}`}
                    onClick={() => setActiveTab("editoriales")}
                  >
                    <i className="bi bi-building me-2"></i>Editoriales
                  </button>
                </li>
                <li className="nav-item">
                  <button
                    className={`nav-link ${activeTab === "cuatrimestres" ? "active" : ""}`}
                    onClick={() => setActiveTab("cuatrimestres")}
                  >
                    <i className="bi bi-calendar2-week me-2"></i>Cuatrimestres
                  </button>
                </li>
              </ul>
            </div>
          </nav>

          {/* Contenido Principal */}
          <main className="itla-dashboard">
            <div className="container-fluid">
              {activeTab === "dashboard" && (
                <div className="animate-fadeIn">
                  <div className="dashboard-header">
                    <h1 className="dashboard-title">
                      <i className="bi bi-speedometer2 me-3"></i>Panel de Control
                    </h1>
                    <p className="dashboard-subtitle">
                      Bienvenido al sistema de gestión académica del Instituto Tecnológico de Las Américas
                    </p>
                  </div>

                  {/* Estadísticas */}
                  <div className="stats-grid">
                    <div className="stat-card hover-lift animate-slideInLeft">
                      <div className="stat-icon books">
                        <i className="bi bi-people"></i>
                      </div>
                      <span className="stat-number animate-countUp">
                        {loading ? "..." : stats.totalEstudiantes}
                      </span>
                      <div className="stat-label">Estudiantes Registrados</div>
                      <div className="stat-change positive">
                        <i className="bi bi-arrow-up me-1"></i>En el sistema
                      </div>
                    </div>

                    <div className="stat-card hover-lift animate-slideInLeft" style={{ animationDelay: '0.1s' }}>
                      <div className="stat-icon categories">
                        <i className="bi bi-mortarboard"></i>
                      </div>
                      <span className="stat-number animate-countUp">
                        {loading ? "..." : stats.totalProgramas}
                      </span>
                      <div className="stat-label">Programas Académicos</div>
                      <div className="stat-change positive">
                        <i className="bi bi-check-circle me-1"></i>Activos
                      </div>
                    </div>

                    <div className="stat-card hover-lift animate-slideInLeft" style={{ animationDelay: '0.2s' }}>
                      <div className="stat-icon editorials">
                        <i className="bi bi-book"></i>
                      </div>
                      <span className="stat-number animate-countUp">
                        {loading ? "..." : stats.totalMaterias}
                      </span>
                      <div className="stat-label">Materias</div>
                      <div className="stat-change positive">
                        <i className="bi bi-collection me-1"></i>Disponibles
                      </div>
                    </div>

                    <div className="stat-card hover-lift animate-slideInLeft" style={{ animationDelay: '0.3s' }}>
                      <div className="stat-icon books">
                        <i className="bi bi-journal"></i>
                      </div>
                      <span className="stat-number animate-countUp">
                        {loading ? "..." : stats.totalLibros}
                      </span>
                      <div className="stat-label">Libros en Biblioteca</div>
                      <div className="stat-change positive">
                        <i className="bi bi-arrow-up me-1"></i>Registrados
                      </div>
                    </div>

                    <div className="stat-card hover-lift animate-slideInLeft" style={{ animationDelay: '0.4s' }}>
                      <div className="stat-icon books">
                        <i className="bi bi-box"></i>
                      </div>
                      <span className="stat-number animate-countUp">
                        {loading ? "..." : stats.librosDisponibles}
                      </span>
                      <div className="stat-label">Ejemplares Disponibles</div>
                      <div className="stat-change positive">
                        <i className="bi bi-check-circle me-1"></i>Para préstamo
                      </div>
                    </div>

                    <div className="stat-card hover-lift animate-slideInLeft" style={{ animationDelay: '0.5s' }}>
                      <div className="stat-icon events">
                        <i className="bi bi-calendar-event"></i>
                      </div>
                      <span className="stat-number animate-countUp">
                        {loading ? "..." : stats.totalEventos}
                      </span>
                      <div className="stat-label">Eventos Activos</div>
                      <div className="stat-change positive">
                        <i className="bi bi-calendar-check me-1"></i>Programados
                      </div>
                    </div>

                    <div className="stat-card hover-lift animate-slideInLeft" style={{ animationDelay: '0.6s' }}>
                      <div className="stat-icon categories">
                        <i className="bi bi-tags"></i>
                      </div>
                      <span className="stat-number animate-countUp">
                        {loading ? "..." : stats.totalCategorias}
                      </span>
                      <div className="stat-label">Categorías</div>
                      <div className="stat-change positive">
                        <i className="bi bi-collection me-1"></i>Organizadas
                      </div>
                    </div>

                    <div className="stat-card hover-lift animate-slideInLeft" style={{ animationDelay: '0.7s' }}>
                      <div className="stat-icon editorials">
                        <i className="bi bi-building"></i>
                      </div>
                      <span className="stat-number animate-countUp">
                        {loading ? "..." : stats.totalEditoriales}
                      </span>
                      <div className="stat-label">Editoriales</div>
                      <div className="stat-change positive">
                        <i className="bi bi-briefcase me-1"></i>Colaboradoras
                      </div>
                    </div>
                  </div>

                  {/* Acciones Rápidas */}
                  <div className="content-card animate-slideInRight">
                    <div className="content-card-header">
                      <h3 className="content-card-title">
                        <i className="bi bi-lightning me-2"></i>Acciones Rápidas
                      </h3>
                    </div>
                    <div className="content-card-body">
                      <div className="row">
                        <div className="col-md-2 mb-3">
                          <button 
                            className="btn-itla-primary w-100 h-100 d-flex flex-column align-items-center justify-content-center p-3"
                            onClick={() => setActiveTab("estudiantes")}
                          >
                            <i className="bi bi-person-plus mb-2" style={{ fontSize: '2rem' }}></i>
                            <span>Nuevo Estudiante</span>
                          </button>
                        </div>
                        <div className="col-md-2 mb-3">
                          <button 
                            className="btn-itla-secondary w-100 h-100 d-flex flex-column align-items-center justify-content-center p-3"
                            onClick={() => setActiveTab("programas")}
                          >
                            <i className="bi bi-mortarboard-fill mb-2" style={{ fontSize: '2rem' }}></i>
                            <span>Nuevo Programa</span>
                          </button>
                        </div>
                        <div className="col-md-2 mb-3">
                          <button 
                            className="btn-itla-outline w-100 h-100 d-flex flex-column align-items-center justify-content-center p-3"
                            onClick={() => setActiveTab("materias")}
                          >
                            <i className="bi bi-book-half mb-2" style={{ fontSize: '2rem' }}></i>
                            <span>Nueva Materia</span>
                          </button>
                        </div>
                        <div className="col-md-2 mb-3">
                          <button 
                            className="btn-itla-outline w-100 h-100 d-flex flex-column align-items-center justify-content-center p-3"
                            onClick={() => setActiveTab("libros")}
                          >
                            <i className="bi bi-journal-plus mb-2" style={{ fontSize: '2rem' }}></i>
                            <span>Nuevo Libro</span>
                          </button>
                        </div>
                        <div className="col-md-2 mb-3">
                          <button 
                            className="btn-itla-outline w-100 h-100 d-flex flex-column align-items-center justify-content-center p-3"
                            onClick={() => setActiveTab("graficas")}
                          >
                            <i className="bi bi-bar-chart mb-2" style={{ fontSize: '2rem' }}></i>
                            <span>Ver Gráficas</span>
                          </button>
                        </div>
                        <div className="col-md-2 mb-3">
                          <button 
                            className="btn-itla-outline w-100 h-100 d-flex flex-column align-items-center justify-content-center p-3"
                            onClick={fetchStats}
                          >
                            <i className="bi bi-arrow-clockwise mb-2" style={{ fontSize: '2rem' }}></i>
                            <span>Actualizar</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "cuatrimestres" && <Cuatrimestres />}
              {activeTab === "graficas" && <Graficas />}
              {activeTab === "estudiantes" && <Estudiantes />}
              {activeTab === "programas" && <ProgramasAcademicos />}
              {activeTab === "materias" && <Materias />}
              {activeTab === "libros" && <Libros />}
              {activeTab === "eventos" && <Eventos />}
              {activeTab === "categorias" && <CategoriasEventos />}
              {activeTab === "editoriales" && <Editoriales />}
            </div>
          </main>
        </>
      )}
    </div>
  )
}
