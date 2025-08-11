"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/AuthContext"
import { useNotifications } from "@/contexts/NotificationContext"
import type { Estudiante, ProgramaAcademico, EstudianteForm, PaginatedResponse } from "@/types/interfaces"

// Importar los nuevos servicios de API
import { estudiantesService, programasService, handleApiError } from "@/utils/api"

// Importar el nuevo componente
import EstudianteDocumentos from "./EstudianteDocumentos"

export default function Estudiantes() {
  const [estudiantes, setEstudiantes] = useState<Estudiante[]>([])
  const [programas, setProgramas] = useState<ProgramaAcademico[]>([])
  const [loading, setLoading] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [editingEstudiante, setEditingEstudiante] = useState<Estudiante | null>(null)
  const [selectedEstudiante, setSelectedEstudiante] = useState<Estudiante | null>(null)
  const [formData, setFormData] = useState<EstudianteForm>({
    nombres: "",
    apellidos: "",
    correo: "",
    telefono: "",
    cedula: "",
    matricula: "",
    programaAcademicoId: 0,
    estado: "REGISTRADO",
  })
  const [filtroEstado, setFiltroEstado] = useState("")
  const [paginacion, setPaginacion] = useState({
    numeroPagina: 1,
    limite: 10,
    total: 0,
    totalPaginas: 0,
  })

  const { token } = useAuth()
  const { addNotification } = useNotifications()

  const estadosEstudiante = [
    { value: "REGISTRADO", label: "📝 Registrado", color: "bg-primary" },
    { value: "PENDIENTE_DOCUMENTO", label: "📄 Pendiente Documento", color: "bg-warning" },
    { value: "PENDIENTE_RESPUESTA", label: "⏳ Pendiente Respuesta", color: "bg-info" },
    { value: "ACEPTADO", label: "✅ Aceptado", color: "bg-success" },
    { value: "RECHAZADO", label: "❌ Rechazado", color: "bg-danger" },
    { value: "ACTIVO", label: "🟢 Activo", color: "bg-success" },
    { value: "GRADUADO", label: "🎓 Graduado", color: "bg-info" },
  ]

  // Estado para la pestaña activa
  const [activeTab, setActiveTab] = useState("lista")
  const [selectedEstudianteForDocs, setSelectedEstudianteForDocs] = useState<Estudiante | null>(null)

  useEffect(() => {
    fetchEstudiantes()
    fetchProgramas()
  }, [filtroEstado, paginacion.numeroPagina])

  const fetchEstudiantes = async () => {
    if (!token) return

    setLoading(true)
    try {
      const data: PaginatedResponse<Estudiante> = await estudiantesService.getAll(
        {
          estado: filtroEstado || undefined,
          numeroPagina: paginacion.numeroPagina,
          limite: paginacion.limite,
        },
        token,
      )

      setEstudiantes(data.data || [])
      setPaginacion((prev) => ({
        ...prev,
        total: data.total || 0,
        totalPaginas: data.totalPaginas || 0,
      }))
    } catch (error) {
      console.error("Error:", error)
      addNotification({
        type: "error",
        title: "Error al cargar estudiantes",
        message: handleApiError(error),
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchProgramas = async () => {
    if (!token) return

    try {
      const data = await programasService.getAll("AC", token)
      setProgramas(data.data || [])
    } catch (error) {
      console.error("Error fetching programas:", error)
    }
  }

  const fetchEstudianteDetails = async (estudianteId: number) => {
    if (!token) return

    try {
      const data = await estudiantesService.getById(estudianteId, token)
      setSelectedEstudiante(data.data)
      setShowDetailsModal(true)
    } catch (error) {
      console.error("Error fetching estudiante details:", error)
      addNotification({
        type: "error",
        title: "Error al cargar detalles",
        message: handleApiError(error),
      })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.nombres.trim() || !formData.apellidos.trim() || !formData.correo.trim()) {
      addNotification({
        type: "warning",
        title: "Campos requeridos",
        message: "Todos los campos obligatorios deben ser completados",
      })
      return
    }

    if (!formData.programaAcademicoId) {
      addNotification({
        type: "warning",
        title: "Programa requerido",
        message: "Debe seleccionar un programa académico",
      })
      return
    }

    // Validar formato de correo
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(formData.correo)) {
      addNotification({
        type: "error",
        title: "Correo inválido",
        message: "El formato del correo electrónico no es válido",
      })
      return
    }

    // Validar cédula (formato básico)
    if (formData.cedula.length < 11) {
      addNotification({
        type: "error",
        title: "Cédula inválida",
        message: "La cédula debe tener al menos 11 caracteres",
      })
      return
    }

    setLoading(true)

    try {
      if (editingEstudiante) {
        // Actualizar estudiante existente
        await estudiantesService.update(
          {
            estudianteId: editingEstudiante.estudianteId,
            nombres: formData.nombres.trim(),
            apellidos: formData.apellidos.trim(),
            correo: formData.correo.trim().toLowerCase(),
            telefono: formData.telefono?.trim(),
            cedula: formData.cedula.trim(),
            matricula: formData.matricula?.trim(),
            programaAcademicoId: formData.programaAcademicoId,
            estado: formData.estado,
          },
          token!,
        )

        addNotification({
          type: "success",
          title: "Estudiante actualizado",
          message: "El estudiante se ha actualizado exitosamente",
        })
      } else {
        // Crear nuevo estudiante
        const response = await estudiantesService.create(
          {
            nombres: formData.nombres.trim(),
            apellidos: formData.apellidos.trim(),
            correo: formData.correo.trim().toLowerCase(),
            telefono: formData.telefono?.trim(),
            cedula: formData.cedula.trim(),
            matricula: formData.matricula?.trim(),
            programaAcademicoId: formData.programaAcademicoId,
          },
          token!,
        )

        addNotification({
          type: "success",
          title: "Estudiante registrado",
          message: "El estudiante se ha registrado exitosamente",
        })

        // Obtener los detalles del estudiante recién creado
        if (response.data && response.data.estudianteId) {
          await fetchEstudianteDetails(response.data.estudianteId)
        }
      }

      fetchEstudiantes()
      handleCloseModal()
    } catch (error) {
      console.error("Error:", error)
      addNotification({
        type: "error",
        title: editingEstudiante ? "Error al actualizar" : "Error al registrar",
        message: handleApiError(error),
      })
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = async (estudiante: Estudiante) => {
    setEditingEstudiante(estudiante)
    setFormData({
      nombres: estudiante.nombres || "",
      apellidos: estudiante.apellidos || "",
      correo: estudiante.correo || "",
      telefono: estudiante.telefono || "",
      cedula: estudiante.cedula || "",
      matricula: estudiante.matricula || "",
      programaAcademicoId: estudiante.programaAcademico?.programaAcademicoId || 0,
      estado: estudiante.estado || "REGISTRADO",
    })
    setShowModal(true)
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setEditingEstudiante(null)
    setFormData({
      nombres: "",
      apellidos: "",
      correo: "",
      telefono: "",
      cedula: "",
      matricula: "",
      programaAcademicoId: 0,
      estado: "REGISTRADO",
    })
  }

  const handleCloseDetailsModal = () => {
    setShowDetailsModal(false)
    setSelectedEstudiante(null)
  }

  const getEstadoInfo = (estado: string) => {
    return estadosEstudiante.find((e) => e.value === estado) || estadosEstudiante[0]
  }

  const handlePageChange = (newPage: number) => {
    setPaginacion((prev) => ({ ...prev, numeroPagina: newPage }))
  }

  // Función para mostrar documentos
  const handleShowDocuments = (estudiante: Estudiante) => {
    setSelectedEstudianteForDocs(estudiante)
    setActiveTab("documentos")
  }

  return (
    <div className="animate-fadeIn">
      <div className="dashboard-header">
        <h1 className="dashboard-title">
          <i className="bi bi-people me-3"></i>Estudiantes
        </h1>
        <p className="dashboard-subtitle">Gestión de estudiantes y su información académica</p>
      </div>

      {/* Navegación de pestañas */}
      <div className="content-card mb-4">
        <div className="content-card-body p-0">
          <nav className="nav nav-pills nav-fill">
            <button
              className={`nav-link ${activeTab === "lista" ? "active" : ""}`}
              onClick={() => setActiveTab("lista")}
            >
              <i className="bi bi-list-ul me-2"></i>Lista de Estudiantes
            </button>
            <button
              className={`nav-link ${activeTab === "documentos" ? "active" : ""}`}
              onClick={() => {
                if (!selectedEstudianteForDocs) {
                  addNotification({
                    type: "warning",
                    title: "Estudiante requerido",
                    message: "Selecciona un estudiante primero para ver sus documentos",
                  })
                  setActiveTab("lista")
                }
              }}
              disabled={!selectedEstudianteForDocs}
            >
              <i className="bi bi-file-earmark-text me-2"></i>
              Documentos
              {selectedEstudianteForDocs && (
                <small className="d-block text-muted">
                  {selectedEstudianteForDocs.nombres} {selectedEstudianteForDocs.apellidos}
                </small>
              )}
            </button>
          </nav>
        </div>
      </div>

      {/* Contenido según la pestaña activa */}
      {activeTab === "lista" && (
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
                  {estadosEstudiante.map((estado) => (
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
                <div className="spinner-border text-primary mb-3" style={{ width: "3rem", height: "3rem" }}>
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
                        <th>
                          <i className="bi bi-hash me-1"></i>ID
                        </th>
                        <th>
                          <i className="bi bi-person me-1"></i>Estudiante
                        </th>
                        <th>
                          <i className="bi bi-envelope me-1"></i>Correo
                        </th>
                        <th>
                          <i className="bi bi-card-text me-1"></i>Matrícula
                        </th>
                        <th>
                          <i className="bi bi-mortarboard me-1"></i>Programa
                        </th>
                        <th>
                          <i className="bi bi-check-circle me-1"></i>Estado
                        </th>
                        <th>
                          <i className="bi bi-calendar-plus me-1"></i>Registro
                        </th>
                        <th>
                          <i className="bi bi-gear me-1"></i>Acciones
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {estudiantes.map((estudiante, index) => {
                        const estadoInfo = getEstadoInfo(estudiante.estado)
                        return (
                          <tr
                            key={estudiante.estudianteId}
                            className="animate-slideInRight"
                            style={{ animationDelay: `${index * 0.1}s` }}
                          >
                            <td className="fw-semibold">{estudiante.estudianteId}</td>
                            <td>
                              <div>
                                <strong className="text-itla-primary">
                                  {estudiante.nombres} {estudiante.apellidos}
                                </strong>
                                {estudiante.cedula && (
                                  <div>
                                    <small className="text-muted">Cédula: {estudiante.cedula}</small>
                                  </div>
                                )}
                              </div>
                            </td>
                            <td>
                              <small className="text-muted">{estudiante.correo}</small>
                              {estudiante.telefono && (
                                <div>
                                  <small className="text-muted">📞 {estudiante.telefono}</small>
                                </div>
                              )}
                            </td>
                            <td>
                              <span className="badge bg-secondary">{estudiante.matricula || "Sin matrícula"}</span>
                            </td>
                            <td>
                              <small className="text-muted">{estudiante.programaAcademico?.nombre || "N/A"}</small>
                            </td>
                            <td>
                              <span className={`badge badge-itla ${estadoInfo.color}`}>{estadoInfo.label}</span>
                            </td>
                            <td>
                              <small className="text-muted">
                                {new Date(estudiante.fechaCreacion).toLocaleDateString()}
                              </small>
                            </td>
                            <td>
                              <div className="btn-group" role="group">
                                <button
                                  className="btn btn-sm btn-outline-info hover-lift"
                                  onClick={() => fetchEstudianteDetails(estudiante.estudianteId)}
                                  title="Ver detalles"
                                >
                                  <i className="bi bi-eye"></i>
                                </button>
                                <button
                                  className="btn btn-sm btn-outline-warning hover-lift"
                                  onClick={() => handleShowDocuments(estudiante)}
                                  title="Ver documentos"
                                >
                                  <i className="bi bi-file-earmark-text"></i>
                                </button>
                                <button
                                  className="btn btn-sm btn-outline-primary hover-lift"
                                  onClick={() => handleEdit(estudiante)}
                                  title="Editar estudiante"
                                >
                                  <i className="bi bi-pencil"></i>
                                </button>
                              </div>
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
                        <li className={`page-item ${paginacion.numeroPagina === 1 ? "disabled" : ""}`}>
                          <button
                            className="page-link"
                            onClick={() => handlePageChange(paginacion.numeroPagina - 1)}
                            disabled={paginacion.numeroPagina === 1}
                          >
                            <i className="bi bi-chevron-left"></i>
                          </button>
                        </li>

                        {Array.from({ length: paginacion.totalPaginas }, (_, i) => i + 1).map((page) => (
                          <li key={page} className={`page-item ${page === paginacion.numeroPagina ? "active" : ""}`}>
                            <button className="page-link" onClick={() => handlePageChange(page)}>
                              {page}
                            </button>
                          </li>
                        ))}

                        <li
                          className={`page-item ${paginacion.numeroPagina === paginacion.totalPaginas ? "disabled" : ""}`}
                        >
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
      )}

      {activeTab === "documentos" && selectedEstudianteForDocs && (
        <EstudianteDocumentos
          estudianteId={selectedEstudianteForDocs.estudianteId}
          estudianteNombre={`${selectedEstudianteForDocs.nombres} ${selectedEstudianteForDocs.apellidos}`}
          estudianteMatricula={selectedEstudianteForDocs.matricula}
        />
      )}

      {/* Modal para Crear/Editar */}
      {showModal && (
        <div className="modal show d-block modal-itla" tabIndex={-1}>
          <div className="modal-dialog modal-lg animate-fadeIn">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title fw-bold">
                  <i className={`bi ${editingEstudiante ? "bi-pencil" : "bi-person-plus"} me-2`}></i>
                  {editingEstudiante ? "Editar Estudiante" : "Nuevo Estudiante"}
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
                          id="nombres"
                          value={formData.nombres}
                          onChange={(e) => setFormData({ ...formData, nombres: e.target.value })}
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
                          id="apellidos"
                          value={formData.apellidos}
                          onChange={(e) => setFormData({ ...formData, apellidos: e.target.value })}
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
                          value={formData.telefono || ""}
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
                          value={formData.cedula || ""}
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
                          value={formData.matricula || ""}
                          onChange={(e) => setFormData({ ...formData, matricula: e.target.value })}
                          placeholder="Matrícula del estudiante"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="row">
                    <div className="col-md-6">
                      <div className="form-group-itla">
                        <label htmlFor="programaAcademicoId" className="form-label-itla">
                          <i className="bi bi-mortarboard me-2"></i>Programa Académico *
                        </label>
                        <select
                          className="form-control-itla"
                          id="programaAcademicoId"
                          value={formData.programaAcademicoId}
                          onChange={(e) =>
                            setFormData({ ...formData, programaAcademicoId: Number.parseInt(e.target.value) })
                          }
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
                    {editingEstudiante && (
                      <div className="col-md-6">
                        <div className="form-group-itla">
                          <label htmlFor="estado" className="form-label-itla">
                            <i className="bi bi-toggle-on me-2"></i>Estado
                          </label>
                          <select
                            className="form-control-itla"
                            id="estado"
                            value={formData.estado}
                            onChange={(e) => setFormData({ ...formData, estado: e.target.value })}
                          >
                            {estadosEstudiante.map((estado) => (
                              <option key={estado.value} value={estado.value}>
                                {estado.label}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    )}
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
                        {editingEstudiante ? "Actualizando..." : "Registrando..."}
                      </>
                    ) : (
                      <>
                        <i className={`bi ${editingEstudiante ? "bi-check-circle" : "bi-person-plus"} me-2`}></i>
                        {editingEstudiante ? "Actualizar" : "Registrar Estudiante"}
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Detalles del Estudiante */}
      {showDetailsModal && selectedEstudiante && (
        <div className="modal show d-block modal-itla" tabIndex={-1}>
          <div className="modal-dialog modal-lg animate-fadeIn">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title fw-bold">
                  <i className="bi bi-person-circle me-2"></i>
                  Detalles del Estudiante
                </h5>
                <button type="button" className="btn-close" onClick={handleCloseDetailsModal}></button>
              </div>
              <div className="modal-body">
                <div className="row">
                  <div className="col-md-6">
                    <div className="card mb-3">
                      <div className="card-header bg-primary text-white">
                        <h6 className="mb-0">
                          <i className="bi bi-person me-2"></i>Información Personal
                        </h6>
                      </div>
                      <div className="card-body">
                        <p>
                          <strong>ID:</strong> {selectedEstudiante.estudianteId}
                        </p>
                        <p>
                          <strong>Nombres:</strong> {selectedEstudiante.nombres}
                        </p>
                        <p>
                          <strong>Apellidos:</strong> {selectedEstudiante.apellidos}
                        </p>
                        <p>
                          <strong>Cédula:</strong> {selectedEstudiante.cedula || "No registrada"}
                        </p>
                        <p>
                          <strong>Matrícula:</strong> {selectedEstudiante.matricula || "No asignada"}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="card mb-3">
                      <div className="card-header bg-info text-white">
                        <h6 className="mb-0">
                          <i className="bi bi-envelope me-2"></i>Información de Contacto
                        </h6>
                      </div>
                      <div className="card-body">
                        <p>
                          <strong>Correo:</strong> {selectedEstudiante.correo}
                        </p>
                        <p>
                          <strong>Teléfono:</strong> {selectedEstudiante.telefono || "No registrado"}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="row">
                  <div className="col-md-6">
                    <div className="card mb-3">
                      <div className="card-header bg-success text-white">
                        <h6 className="mb-0">
                          <i className="bi bi-mortarboard me-2"></i>Información Académica
                        </h6>
                      </div>
                      <div className="card-body">
                        <p>
                          <strong>Programa:</strong> {selectedEstudiante.programaAcademico?.nombre || "No asignado"}
                        </p>
                        <p>
                          <strong>Período:</strong> {selectedEstudiante.programaAcademico?.periodoAcademico || "N/A"}
                        </p>
                        <p>
                          <strong>Estado:</strong>
                          <span className={`badge ms-2 ${getEstadoInfo(selectedEstudiante.estado).color}`}>
                            {getEstadoInfo(selectedEstudiante.estado).label}
                          </span>
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="card mb-3">
                      <div className="card-header bg-warning text-dark">
                        <h6 className="mb-0">
                          <i className="bi bi-calendar me-2"></i>Fechas Importantes
                        </h6>
                      </div>
                      <div className="card-body">
                        <p>
                          <strong>Fecha de Registro:</strong>{" "}
                          {new Date(selectedEstudiante.fechaCreacion).toLocaleString()}
                        </p>
                        {selectedEstudiante.fechaActualizacion && (
                          <p>
                            <strong>Última Actualización:</strong>{" "}
                            {new Date(selectedEstudiante.fechaActualizacion).toLocaleString()}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={handleCloseDetailsModal}>
                  <i className="bi bi-x-circle me-2"></i>Cerrar
                </button>
                <button
                  type="button"
                  className="btn-itla-primary"
                  onClick={() => {
                    handleCloseDetailsModal()
                    handleEdit(selectedEstudiante)
                  }}
                >
                  <i className="bi bi-pencil me-2"></i>Editar Estudiante
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showModal && <div className="modal-backdrop show"></div>}
      {showDetailsModal && <div className="modal-backdrop show"></div>}
    </div>
  )
}
