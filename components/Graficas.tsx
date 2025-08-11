"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/AuthContext"
import type { 
  EstadisticasEstudiantes, 
  EstadisticasLibrosPorEditorial, 
  EstadisticasEventosPorCategoria 
} from "@/types/interfaces"

export default function Graficas() {
  const [estadisticasEstudiantes, setEstadisticasEstudiantes] = useState<EstadisticasEstudiantes>({
    registrados: 0,
    pendienteDocumento: 0,
    aceptados: 0,
    rechazados: 0,
    graduados: 0
  })
  const [librosEditorial, setLibrosEditorial] = useState<EstadisticasLibrosPorEditorial[]>([])
  const [eventosCategorias, setEventosCategorias] = useState<EstadisticasEventosPorCategoria[]>([])
  const [loading, setLoading] = useState(true)

  const { token } = useAuth()

  useEffect(() => {
    fetchDatosGraficas()
  }, [])

  const fetchDatosGraficas = async () => {
    setLoading(true)
    try {
      // Fetch estudiantes
      const estudiantesResponse = await fetch("http://127.0.0.1:8000/internal/estudiante/?limite=1000", {
        headers: { Authorization: `Bearer ${token}` }
      })

      // Fetch libros
      const librosResponse = await fetch("http://127.0.0.1:8000/internal/libro/", {
        headers: { Authorization: `Bearer ${token}` }
      })

      // Fetch eventos
      const eventosResponse = await fetch("http://127.0.0.1:8000/internal/evento/", {
        headers: { Authorization: `Bearer ${token}` }
      })

      const [estudiantesData, librosData, eventosData] = await Promise.all([
        estudiantesResponse.ok ? estudiantesResponse.json() : { data: [] },
        librosResponse.ok ? librosResponse.json() : { data: [] },
        eventosResponse.ok ? eventosResponse.json() : { data: [] }
      ])

      // Procesar estadísticas de estudiantes
      const estudiantes = estudiantesData.data || []
      const statsEstudiantes = {
        registrados: estudiantes.filter((e: any) => e.estado === "REGISTRADO").length,
        pendienteDocumento: estudiantes.filter((e: any) => e.estado === "PENDIENTE_DOCUMENTO").length,
        aceptados: estudiantes.filter((e: any) => e.estado === "ACEPTADO").length,
        rechazados: estudiantes.filter((e: any) => e.estado === "RECHAZADO").length,
        graduados: estudiantes.filter((e: any) => e.estado === "GRADUADO").length
      }
      setEstadisticasEstudiantes(statsEstudiantes)

      // Procesar libros por editorial
      const libros = librosData.data || []
      const librosGrouped = libros.reduce((acc: any, libro: any) => {
        const editorial = libro.editorial?.nombre || "Sin Editorial"
        if (!acc[editorial]) {
          acc[editorial] = { cantidad: 0, disponibles: 0 }
        }
        acc[editorial].cantidad += 1
        acc[editorial].disponibles += libro.cantidadDisponible || 0
        return acc
      }, {})

      const librosEditorialArray = Object.entries(librosGrouped).map(([editorial, data]: [string, any]) => ({
        editorial,
        cantidad: data.cantidad,
        disponibles: data.disponibles
      }))
      setLibrosEditorial(librosEditorialArray)

      // Procesar eventos por categoría
      const eventos = eventosData.data || []
      const eventosGrouped = eventos.reduce((acc: any, evento: any) => {
        const categoria = evento.categoriaEvento?.nombre || "Sin Categoría"
        acc[categoria] = (acc[categoria] || 0) + 1
        return acc
      }, {})

      const eventosCategoriasArray = Object.entries(eventosGrouped).map(([categoria, cantidad]: [string, any]) => ({
        categoria,
        cantidad
      }))
      setEventosCategorias(eventosCategoriasArray)

    } catch (error) {
      console.error("Error fetching graphics data:", error)
    } finally {
      setLoading(false)
    }
  }

  const getMaxValue = (data: number[]) => Math.max(...data, 1)

  const getBarWidth = (value: number, maxValue: number) => {
    return Math.max((value / maxValue) * 100, 2)
  }

  const colors = [
    '#1e3a8a', '#3b82f6', '#0ea5e9', '#06b6d4', '#10b981',
    '#059669', '#d97706', '#f59e0b', '#dc2626', '#ef4444'
  ]

  return (
    <div className="animate-fadeIn">
      <div className="dashboard-header">
        <h1 className="dashboard-title">
          <i className="bi bi-bar-chart me-3"></i>Gráficas y Estadísticas
        </h1>
        <p className="dashboard-subtitle">
          Análisis visual de los datos del sistema académico
        </p>
      </div>

      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary mb-3" style={{ width: '3rem', height: '3rem' }}>
            <span className="visually-hidden">Cargando gráficas...</span>
          </div>
          <p className="text-muted">Procesando datos estadísticos...</p>
        </div>
      ) : (
        <div className="row">
          {/* Gráfica de Estudiantes por Estado */}
          <div className="col-lg-6 mb-4">
            <div className="content-card animate-slideInLeft">
              <div className="content-card-header">
                <h3 className="content-card-title">
                  <i className="bi bi-people me-2"></i>Estudiantes por Estado
                </h3>
              </div>
              <div className="content-card-body">
                <div className="chart-container" style={{ height: '300px' }}>
                  {Object.entries(estadisticasEstudiantes).map(([estado, cantidad], index) => {
                    const maxValue = getMaxValue(Object.values(estadisticasEstudiantes))
                    const barWidth = getBarWidth(cantidad, maxValue)
                    const color = colors[index % colors.length]
                    
                    const estadoLabels: { [key: string]: string } = {
                      registrados: "📝 Registrados",
                      pendienteDocumento: "📄 Pendiente Doc.",
                      aceptados: "✅ Aceptados",
                      rechazados: "❌ Rechazados",
                      graduados: "🎓 Graduados"
                    }

                    return (
                      <div key={estado} className="mb-3">
                        <div className="d-flex justify-content-between align-items-center mb-1">
                          <span className="fw-semibold">{estadoLabels[estado]}</span>
                          <span className="badge bg-primary">{cantidad}</span>
                        </div>
                        <div className="progress" style={{ height: '25px' }}>
                          <div 
                            className="progress-bar animate-slideInRight" 
                            style={{ 
                              width: `${barWidth}%`, 
                              backgroundColor: color,
                              animationDelay: `${index * 0.2}s`
                            }}
                          >
                            {cantidad > 0 && <span className="text-white fw-bold">{cantidad}</span>}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Gráfica de Libros por Editorial */}
          <div className="col-lg-6 mb-4">
            <div className="content-card animate-slideInRight">
              <div className="content-card-header">
                <h3 className="content-card-title">
                  <i className="bi bi-building me-2"></i>Libros por Editorial
                </h3>
              </div>
              <div className="content-card-body">
                <div className="chart-container" style={{ height: '300px', overflowY: 'auto' }}>
                  {librosEditorial.map((item, index) => {
                    const maxValue = getMaxValue(librosEditorial.map(l => l.cantidad))
                    const barWidth = getBarWidth(item.cantidad, maxValue)
                    const color = colors[index % colors.length]

                    return (
                      <div key={item.editorial} className="mb-3">
                        <div className="d-flex justify-content-between align-items-center mb-1">
                          <span className="fw-semibold text-truncate" title={item.editorial}>
                            📚 {item.editorial}
                          </span>
                          <div>
                            <span className="badge bg-primary me-1">{item.cantidad}</span>
                            <span className="badge bg-success">{item.disponibles}</span>
                          </div>
                        </div>
                        <div className="progress" style={{ height: '20px' }}>
                          <div 
                            className="progress-bar animate-slideInRight" 
                            style={{ 
                              width: `${barWidth}%`, 
                              backgroundColor: color,
                              animationDelay: `${index * 0.1}s`
                            }}
                          >
                            {item.cantidad > 0 && <small className="text-white">{item.cantidad}</small>}
                          </div>
                        </div>
                        <small className="text-muted">
                          Total: {item.cantidad} libros | Disponibles: {item.disponibles} ejemplares
                        </small>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Gráfica de Eventos por Categoría */}
          <div className="col-lg-6 mb-4">
            <div className="content-card animate-slideInLeft" style={{ animationDelay: '0.3s' }}>
              <div className="content-card-header">
                <h3 className="content-card-title">
                  <i className="bi bi-calendar-event me-2"></i>Eventos por Categoría
                </h3>
              </div>
              <div className="content-card-body">
                <div className="chart-container" style={{ height: '300px' }}>
                  {eventosCategorias.map((item, index) => {
                    const maxValue = getMaxValue(eventosCategorias.map(e => e.cantidad))
                    const barWidth = getBarWidth(item.cantidad, maxValue)
                    const color = colors[index % colors.length]

                    return (
                      <div key={item.categoria} className="mb-3">
                        <div className="d-flex justify-content-between align-items-center mb-1">
                          <span className="fw-semibold">🎯 {item.categoria}</span>
                          <span className="badge bg-primary">{item.cantidad}</span>
                        </div>
                        <div className="progress" style={{ height: '25px' }}>
                          <div 
                            className="progress-bar animate-slideInRight" 
                            style={{ 
                              width: `${barWidth}%`, 
                              backgroundColor: color,
                              animationDelay: `${index * 0.2}s`
                            }}
                          >
                            {item.cantidad > 0 && <span className="text-white fw-bold">{item.cantidad}</span>}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Resumen General */}
          <div className="col-lg-6 mb-4">
            <div className="content-card animate-slideInRight" style={{ animationDelay: '0.3s' }}>
              <div className="content-card-header">
                <h3 className="content-card-title">
                  <i className="bi bi-clipboard-data me-2"></i>Resumen Ejecutivo
                </h3>
              </div>
              <div className="content-card-body">
                <div className="row text-center">
                  <div className="col-6 mb-3">
                    <div className="p-3 bg-light rounded">
                      <h4 className="text-itla-primary mb-1">
                        {Object.values(estadisticasEstudiantes).reduce((a, b) => a + b, 0)}
                      </h4>
                      <small className="text-muted">Total Estudiantes</small>
                    </div>
                  </div>
                  <div className="col-6 mb-3">
                    <div className="p-3 bg-light rounded">
                      <h4 className="text-itla-primary mb-1">
                        {librosEditorial.reduce((acc, item) => acc + item.cantidad, 0)}
                      </h4>
                      <small className="text-muted">Total Libros</small>
                    </div>
                  </div>
                  <div className="col-6 mb-3">
                    <div className="p-3 bg-light rounded">
                      <h4 className="text-itla-primary mb-1">
                        {librosEditorial.reduce((acc, item) => acc + item.disponibles, 0)}
                      </h4>
                      <small className="text-muted">Ejemplares Disponibles</small>
                    </div>
                  </div>
                  <div className="col-6 mb-3">
                    <div className="p-3 bg-light rounded">
                      <h4 className="text-itla-primary mb-1">
                        {eventosCategorias.reduce((acc, item) => acc + item.cantidad, 0)}
                      </h4>
                      <small className="text-muted">Total Eventos</small>
                    </div>
                  </div>
                </div>

                <div className="mt-4">
                  <h6 className="fw-bold mb-3">📊 Indicadores Clave:</h6>
                  <ul className="list-unstyled">
                    <li className="mb-2">
                      <i className="bi bi-check-circle text-success me-2"></i>
                      <strong>Estudiantes Activos:</strong> {estadisticasEstudiantes.aceptados + estadisticasEstudiantes.registrados}
                    </li>
                    <li className="mb-2">
                      <i className="bi bi-book text-primary me-2"></i>
                      <strong>Editorial Líder:</strong> {librosEditorial.length > 0 ? librosEditorial.reduce((prev, current) => (prev.cantidad > current.cantidad) ? prev : current).editorial : "N/A"}
                    </li>
                    <li className="mb-2">
                      <i className="bi bi-calendar text-info me-2"></i>
                      <strong>Categoría Popular:</strong> {eventosCategorias.length > 0 ? eventosCategorias.reduce((prev, current) => (prev.cantidad > current.cantidad) ? prev : current).categoria : "N/A"}
                    </li>
                  </ul>
                </div>

                <div className="text-center mt-4">
                  <button className="btn-itla-outline" onClick={fetchDatosGraficas}>
                    <i className="bi bi-arrow-clockwise me-2"></i>Actualizar Datos
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
