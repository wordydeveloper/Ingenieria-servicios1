"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/AuthContext"
import type { Estudiante, ProgramaAcademico, EstudianteForm, PaginatedResponse } from "@/types/interfaces"

// Importar y usar las utilidades de API
import { apiRequest, handleApiError } from "@/utils/api"

export default function Estudiantes() {
  const [estudiantes, setEstudiantes] = useState<Estudiante[]>([])
  const [programas, setProgramas] = useState<ProgramaAcademico[]>([])
  const [loading, setLoading] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [editingEstudiante, setEditingEstudiante] = useState<Estudiante | null>(null)
  const [formData, setFormData] = useState<EstudianteForm>({
    nombres: "",  // Cambiar de 'nombre' a 'nombres'
    apellidos: "",  // Cambiar de 'apellido' a 'apellidos'
    correo: "",
    telefono: "",     // Always initialize as empty string, never undefined
    cedula: "",       // Always initialize as empty string, never undefined
    matricula: "",  // Agregar campo matricula
    programaAcademicoId: 0,
    estado: "REGISTRADO",
  })
  const [filtroEstado, setFiltroEstado] = useState("")
  const [paginacion, setPaginacion] = useState({
    numeroPagina: 1,
    limite: 10,
    total: 0,
    totalPaginas: 0
  })

  const { token } = useAuth()

  const estadosEstudiante = [
    { value: "REGISTRADO", label: "📝 Registrado", color: "bg-primary" },
    { value: "PENDIENTE_DOCUMENTO", label: "📄 Pendiente Documento", color: "bg-warning" },
    { value: "PENDIENTE_RESPUESTA", label: "⏳ Pendiente Respuesta", color: "bg-info" },
    { value: "ACEPTADO", label: "✅ Aceptado", color: "bg-success" },
    { value: "RECHAZADO", label: "❌ Rechazado", color: "bg-danger" },
    { value: "ACTIVO", label: "🟢 Activo", color: "bg-success" },
    { value: "GRADUADO", label: "🎓 Graduado", color: "bg-info" },
  ]

  useEffect(() => {
    fetchEstudiantes()
    fetchProgramas()
  }, [filtroEstado, paginacion.numeroPagina])

  // En fetchEstudiantes, reemplazar el fetch manual:
  const fetchEstudiantes = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        numeroPagina: paginacion.numeroPagina.toString(),
        limite: paginacion.limite.toString(),
      })

      if (filtroEstado) {
        params.append('estado', filtroEstado)
      }

      const data: PaginatedResponse<Estudiante> = await apiRequest(
        `http://127.0.0.1:8000/internal/estudiante/?${params}`,
        { method: 'GET' },
        token
      )
      
      setEstudiantes(data.data || [])
      setPaginacion(prev => ({
        ...prev,
        total: data.total || 0,
        totalPaginas: data.totalPaginas || 0
      }))
    } catch (error) {
      console.error("Error:", error)
      alert(handleApiError(error))
    } finally {
      setLoading(false)
    }
  }

  const fetchProgramas = async () => {
    try {
      const response = await fetch("http://127.0.0.1:8000/internal/programa-academico/?estado=AC", {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })

      if (response.ok) {
        const data = await response.json()
        setProgramas(data.data || [])
      }
    } catch (error) {
      console.error("Error fetching programas:", error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.nombres.trim() || !formData.apellidos.trim() || !formData.correo.trim()) {
      alert("Todos los campos obligatorios deben ser completados")
      return
    }

    if (!formData.programaAcademicoId) {
      alert("Debe seleccionar un programa académico")
      return
    }

    // Validar formato de correo
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(formData.correo)) {
      alert("El formato del correo electrónico no es válido")
      return
    }

    // Validar cédula (formato básico)
    if (formData.cedula.length < 11) {
      alert("La cédula debe tener al menos 11 caracteres")
      return
    }

    setLoading(true)

    // En handleSubmit, reemplazar el fetch manual:
    try {
      await apiRequest(
        "http://127.0.0.1:8000/internal/estudiante/registrar",
        {
          method: "POST",
          body: JSON.stringify({
            nombres: formData.nombres.trim(),
            apellidos: formData.apellidos.trim(),
            correo: formData.correo.trim().toLowerCase(),
            matricula: formData.matricula.trim(),
            programaAcademicoId: formData.programaAcademicoId,
          }),
        },
        token
      )
      
      alert("✅ Estudiante registrado exitosamente")
      fetchEstudiantes()
      handleCloseModal()
    } catch (error) {
      console.error("Error:", error)
      alert(handleApiError(error))
    } finally {
      setLoading(false)
    }
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setEditingEstudiante(null)
    setFormData({
      nombres: "",
      apellidos: "",
      correo: "",
      telefono: "",     // Always reset to empty string
      cedula: "",       // Always reset to empty string
      matricula: "",
      programaAcademicoId: 0,
      estado: "REGISTRADO",
    })
  }

  const getEstadoInfo = (estado: string) => {
    return estadosEstudiante.find(e => e.value === estado) || estadosEstudiante[0]
  }

  const handlePageChange = (newPage: number) => {
    setPaginacion(prev => ({ ...prev, numeroPagina: newPage }))
  }

  return (
    <div className="animate-fadeIn">
      <div className="dashboard-header">
        <h1 className="dashboard-title">
          <i className="bi bi-people me-3"></i>Estudiantes
        </h1>
        <p className="dashboard-subtitle">
          Gestión de estudiantes y su información académica
        </p>
      </div>

      <div className="content-card">
        <div className="content-card-header d-flex justify-content-between align-items-center">
          <h3 className="content-card-title mb-0">
            <i className="bi bi-list-ul me-2"></i>Lista de Estudiantes
          </h3>
          <button className="btn-itla-primary" onClick={() => setShowModal(true)}>
            <i className="bi bi-person-plus me-2"></i>Nuevo Estudiante
          </button>
        </div>

        <div className="content-card-body">
          <div className="row mb-4">
            <div className="col-md-3">
              <select 
                className="form-control-itla" 
                value={filtroEstado} 
                onChange={(e) => setFiltroEstado(e.target.value)}
              >
                <option value="">🔍 Todos los estados</option>
                {estadosEstudiante.map(estado => (
                  <option key={estado.value} value={estado.value}>
                    {estado.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-md-3">
              <button className="btn-itla-outline" onClick={fetchEstudiantes}>
                <i className="bi bi-arrow-clockwise me-2"></i>Actualizar
              </button>
            </div>
            <div className="col-md-6 text-end">
              <small className="text-muted">
                Mostrando {estudiantes.length} de {paginacion.total} estudiantes
              </small>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary mb-3" style={{ width: '3rem', height: '3rem' }}>
                <span className="visually-hidden">Cargando...</span>
              </div>
              <p className="text-muted">Cargando estudiantes...</p>
            </div>
          ) : (
            <>
              <div className="itla-table">
                <table className="table table-hover mb-0">
                  <thead>
                    <tr>
                      <th><i className="bi bi-hash me-1"></i>ID</th>
                      <th><i className="bi bi-person me-1"></i>Estudiante</th>
                      <th><i className="bi bi-envelope me-1"></i>Correo</th>
                      <th><i className="bi bi-phone me-1"></i>Teléfono</th>
                      <th><i className="bi bi-card-text me-1"></i>Cédula</th>
                      <th><i className="bi bi-mortarboard me-1"></i>Programa</th>
                      <th><i className="bi bi-check-circle me-1"></i>Estado</th>
                      <th><i className="bi bi-calendar-plus me-1"></i>Registro</th>
                    </tr>
                  </thead>
                  <tbody>
                    {estudiantes.map((estudiante, index) => {
                      const estadoInfo = getEstadoInfo(estudiante.estado)
                      return (
                        <tr key={estudiante.estudianteId} className="animate-slideInRight" style={{ animationDelay: `${index * 0.1}s` }}>
                          <td className="fw-semibold">{estudiante.estudianteId}</td>
                          <td>
                            <div>
                              <strong className="text-itla-primary">
                                {estudiante.nombres} {estudiante.apellidos}  // Cambiar de 'nombre' y 'apellido' a 'nombres' y 'apellidos'
                              </strong>
                            </div>
                          </td>
                          <td>
                            <small className="text-muted">{estudiante.correo}</small>
                          </td>
                          <td>
                            <small className="text-muted">{estudiante.telefono || "N/A"}</small>
                          </td>
                          <td>
                            <span className="badge bg-secondary">
                              {estudiante.cedula}
                            </span>
                          </td>
                          <td>
                            <small className="text-muted">
                              {estudiante.programaAcademico?.nombre || "N/A"}
                            </small>
                          </td>
                          <td>
                            <span className={`badge badge-itla ${estadoInfo.color}`}>
                              {estadoInfo.label}
                            </span>
                          </td>
                          <td>
                            <small className="text-muted">
                              {new Date(estudiante.fechaCreacion).toLocaleDateString()}  // Cambiar de 'fechaRegistro' a 'fechaCreacion'
                            </small>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              {/* Paginación */}
              {paginacion.totalPaginas > 1 && (
                <div className="d-flex justify-content-center mt-4">
                  <nav>
                    <ul className="pagination">
                      <li className={`page-item ${paginacion.numeroPagina === 1 ? 'disabled' : ''}`}>
                        <button 
                          className="page-link" 
                          onClick={() => handlePageChange(paginacion.numeroPagina - 1)}
                          disabled={paginacion.numeroPagina === 1}
                        >
                          <i className="bi bi-chevron-left"></i>
                        </button>
                      </li>
                      
                      {Array.from({ length: paginacion.totalPaginas }, (_, i) => i + 1).map(page => (
                        <li key={page} className={`page-item ${page === paginacion.numeroPagina ? 'active' : ''}`}>
                          <button 
                            className="page-link" 
                            onClick={() => handlePageChange(page)}
                          >
                            {page}
                          </button>
                        </li>
                      ))}
                      
                      <li className={`page-item ${paginacion.numeroPagina === paginacion.totalPaginas ? 'disabled' : ''}`}>
                        <button 
                          className="page-link" 
                          onClick={() => handlePageChange(paginacion.numeroPagina + 1)}
                          disabled={paginacion.numeroPagina === paginacion.totalPaginas}
                        >
                          <i className="bi bi-chevron-right"></i>
                        </button>
                      </li>
                    </ul>
                  </nav>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal show d-block modal-itla" tabIndex={-1}>
          <div className="modal-dialog modal-lg animate-fadeIn">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title fw-bold">
                  <i className="bi bi-person-plus me-2"></i>Nuevo Estudiante
                </h5>
                <button type="button" className="btn-close" onClick={handleCloseModal}></button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="modal-body">
                  <div className="row">
                    <div className="col-md-6">
                      <div className="form-group-itla">
                        <label htmlFor="nombres" className="form-label-itla">
                          <i className="bi bi-person me-2"></i>Nombres *
                        </label>
                        <input
                          type="text"
                          className="form-control-itla"
                          id="nombres"  // Cambiar de 'nombre' a 'nombres'
                          value={formData.nombres}  // Cambiar de 'nombre' a 'nombres'
                          onChange={(e) => setFormData({ ...formData, nombres: e.target.value })}  // Cambiar de 'nombre' a 'nombres'
                          required
                          placeholder="Nombres del estudiante"
                        />
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="form-group-itla">
                        <label htmlFor="apellidos" className="form-label-itla">
                          <i className="bi bi-person me-2"></i>Apellidos *
                        </label>
                        <input
                          type="text"
                          className="form-control-itla"
                          id="apellidos"  // Cambiar de 'apellido' a 'apellidos'
                          value={formData.apellidos}  // Cambiar de 'apellido' a 'apellidos'
                          onChange={(e) => setFormData({ ...formData, apellidos: e.target.value })}  // Cambiar de 'apellido' a 'apellidos'
                          required
                          placeholder="Apellidos del estudiante"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="row">
                    <div className="col-md-6">
                      <div className="form-group-itla">
                        <label htmlFor="correo" className="form-label-itla">
                          <i className="bi bi-envelope me-2"></i>Correo Electrónico *
                        </label>
                        <input
                          type="email"
                          className="form-control-itla"
                          id="correo"
                          value={formData.correo}
                          onChange={(e) => setFormData({ ...formData, correo: e.target.value })}
                          required
                          placeholder="estudiante@itla.edu.do"
                        />
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="form-group-itla">
                        <label htmlFor="telefono" className="form-label-itla">
                          <i className="bi bi-phone me-2"></i>Teléfono
                        </label>
                        <input
                          type="tel"
                          className="form-control-itla"
                          id="telefono"
                          value={formData.telefono || ""}  // Ensure it's never undefined
                          onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                          placeholder="(809) 123-4567"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="row">
                    <div className="col-md-6">
                      <div className="form-group-itla">
                        <label htmlFor="cedula" className="form-label-itla">
                          <i className="bi bi-card-text me-2"></i>Cédula *
                        </label>
                        <input
                          type="text"
                          className="form-control-itla"
                          id="cedula"
                          value={formData.cedula || ""}  // Ensure it's never undefined
                          onChange={(e) => setFormData({ ...formData, cedula: e.target.value })}
                          required
                          placeholder="000-0000000-0"
                        />
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="form-group-itla">
                        <label htmlFor="matricula" className="form-label-itla">
                          <i className="bi bi-card-text me-2"></i>Matrícula
                        </label>
                        <input
                          type="text"
                          className="form-control-itla"
                          id="matricula"
                          value={formData.matricula || ""}  // Ensure it's never undefined
                          onChange={(e) => setFormData({ ...formData, matricula: e.target.value })}
                          placeholder="Matrícula del estudiante"
                        />
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="form-group-itla">
                        <label htmlFor="programaAcademicoId" className="form-label-itla">
                          <i className="bi bi-mortarboard me-2"></i>Programa Académico *
                        </label>
                        <select
                          className="form-control-itla"
                          id="programaAcademicoId"
                          value={formData.programaAcademicoId}
                          onChange={(e) => setFormData({ ...formData, programaAcademicoId: parseInt(e.target.value) })}
                          required
                        >
                          <option value={0}>Seleccionar programa</option>
                          {programas.map((programa) => (
                            <option key={programa.programaAcademicoId} value={programa.programaAcademicoId}>
                              {programa.nombre} ({programa.periodoAcademico})
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={handleCloseModal}>
                    <i className="bi bi-x-circle me-2"></i>Cancelar
                  </button>
                  <button type="submit" className="btn-itla-primary" disabled={loading}>
                    {loading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2"></span>
                        Registrando...
                      </>
                    ) : (
                      <>
                        <i className="bi bi-person-plus me-2"></i>
                        Registrar Estudiante
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {showModal && <div className="modal-backdrop show"></div>}
    </div>
  )
}
