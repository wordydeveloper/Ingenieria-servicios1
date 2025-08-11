"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/AuthContext"
import { useNotifications } from "@/contexts/NotificationContext"
import type { EstudianteDocumento, TipoDocumento } from "@/types/interfaces"
import { estudianteDocumentosService, handleApiError } from "@/utils/api"
import { TIPOS_DOCUMENTO } from "@/types/interfaces"

interface EstudianteDocumentosProps {
  estudianteId: number
  estudianteNombre: string
  estudianteMatricula?: string
}

export default function EstudianteDocumentos({
  estudianteId,
  estudianteNombre,
  estudianteMatricula,
}: EstudianteDocumentosProps) {
  const [documentos, setDocumentos] = useState<EstudianteDocumento[]>([])
  const [loading, setLoading] = useState(false)
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [showReviewModal, setShowReviewModal] = useState(false)
  const [selectedDocumento, setSelectedDocumento] = useState<EstudianteDocumento | null>(null)
  const [uploadData, setUploadData] = useState({
    tipoDocumento: "" as TipoDocumento,
    archivo: null as File | null,
  })
  const [reviewData, setReviewData] = useState({
    estado: "PENDIENTE",
    comentarios: "",
  })
  const [filtroEstado, setFiltroEstado] = useState("")

  const { token } = useAuth()
  const { addNotification } = useNotifications()

  const estadosDocumento = [
    { value: "PENDIENTE", label: "⏳ Pendiente", color: "bg-warning" },
    { value: "VALIDO", label: "✅ Aprobado", color: "bg-success" },
    { value: "RECHAZADO", label: "❌ Rechazado", color: "bg-danger" },
  ]

  useEffect(() => {
    fetchDocumentos()
  }, [estudianteId, filtroEstado])

  const fetchDocumentos = async () => {
    if (!token) return

    setLoading(true)
    try {
      const data = await estudianteDocumentosService.getByEstudiante(estudianteId, filtroEstado || undefined, token)
      setDocumentos(data.data || [])
    } catch (error) {
      console.error("Error:", error)
      addNotification({
        type: "error",
        title: "Error al cargar documentos",
        message: handleApiError(error),
      })
    } finally {
      setLoading(false)
    }
  }

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!uploadData.tipoDocumento || !uploadData.archivo) {
      addNotification({
        type: "warning",
        title: "Campos requeridos",
        message: "Debe seleccionar el tipo de documento y el archivo",
      })
      return
    }

    // Validar tamaño del archivo (máx 10MB)
    if (uploadData.archivo.size > 10 * 1024 * 1024) {
      addNotification({
        type: "error",
        title: "Archivo muy grande",
        message: "El archivo no puede ser mayor a 10MB",
      })
      return
    }

    // Validar tipos de archivo permitidos
    const allowedTypes = ["application/pdf", "image/jpeg", "image/png", "image/jpg"]
    if (!allowedTypes.includes(uploadData.archivo.type)) {
      addNotification({
        type: "error",
        title: "Tipo de archivo no válido",
        message: "Solo se permiten archivos PDF, JPG, JPEG y PNG",
      })
      return
    }

    setLoading(true)

    try {
      await estudianteDocumentosService.upload(estudianteId, uploadData.tipoDocumento, uploadData.archivo, token!)

      addNotification({
        type: "success",
        title: "Documento subido",
        message: "El documento se ha subido exitosamente",
      })

      fetchDocumentos()
      handleCloseUploadModal()
    } catch (error) {
      console.error("Error:", error)
      addNotification({
        type: "error",
        title: "Error al subir documento",
        message: handleApiError(error),
      })
    } finally {
      setLoading(false)
    }
  }

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedDocumento) return

    setLoading(true)

    try {
      await estudianteDocumentosService.updateStatus(
        {
          estudianteId: estudianteId,
          documentoId: selectedDocumento.estudianteDocumentoId,
          estado: reviewData.estado as "PENDIENTE" | "VALIDO" | "RECHAZADO",
          comentarios: reviewData.comentarios.trim() || undefined,
        },
        token!,
      )

      addNotification({
        type: "success",
        title: "Estado actualizado",
        message: "El estado del documento se ha actualizado exitosamente",
      })

      fetchDocumentos()
      handleCloseReviewModal()
    } catch (error) {
      console.error("Error:", error)
      addNotification({
        type: "error",
        title: "Error al actualizar estado",
        message: handleApiError(error),
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDownload = async (documento: EstudianteDocumento) => {
    try {
      const blob = await estudianteDocumentosService.download(documento.estudianteDocumentoId, token!)

      // Crear URL del blob y descargar
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `${getTipoDocumentoLabel(documento.tipoDocumento)}_${estudianteNombre}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      addNotification({
        type: "success",
        title: "Descarga iniciada",
        message: "El documento se está descargando",
      })
    } catch (error) {
      console.error("Error:", error)
      addNotification({
        type: "error",
        title: "Error al descargar",
        message: handleApiError(error),
      })
    }
  }

  const handleDownloadAll = async () => {
    if (!estudianteMatricula) {
      addNotification({
        type: "warning",
        title: "Matrícula requerida",
        message: "No se puede descargar todos los documentos sin matrícula",
      })
      return
    }

    try {
      const blob = await estudianteDocumentosService.downloadAll(estudianteMatricula, token!)

      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `Documentos_${estudianteNombre}_${estudianteMatricula}.zip`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      addNotification({
        type: "success",
        title: "Descarga iniciada",
        message: "Todos los documentos se están descargando en ZIP",
      })
    } catch (error) {
      console.error("Error:", error)
      addNotification({
        type: "error",
        title: "Error al descargar ZIP",
        message: handleApiError(error),
      })
    }
  }

  const handleReview = (documento: EstudianteDocumento) => {
    setSelectedDocumento(documento)
    setReviewData({
      estado: documento.estado,
      comentarios: documento.comentarios || "",
    })
    setShowReviewModal(true)
  }

  const handleCloseUploadModal = () => {
    setShowUploadModal(false)
    setUploadData({
      tipoDocumento: "" as TipoDocumento,
      archivo: null,
    })
  }

  const handleCloseReviewModal = () => {
    setShowReviewModal(false)
    setSelectedDocumento(null)
    setReviewData({
      estado: "PENDIENTE",
      comentarios: "",
    })
  }

  const getEstadoInfo = (estado: string) => {
    return estadosDocumento.find((e) => e.value === estado) || estadosDocumento[0]
  }

  const getTipoDocumentoLabel = (tipo: string) => {
    return TIPOS_DOCUMENTO.find((t) => t.value === tipo)?.label || tipo
  }

  return (
    <div className="animate-fadeIn">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h4 className="text-itla-primary fw-bold mb-1">
            <i className="bi bi-file-earmark-text me-2"></i>Documentos
          </h4>
          <p className="text-muted mb-0">
            Estudiante: <strong>{estudianteNombre}</strong> (ID: {estudianteId})
            {estudianteMatricula && (
              <span className="ms-2">
                Matrícula: <strong>{estudianteMatricula}</strong>
              </span>
            )}
          </p>
        </div>
        <div className="btn-group">
          <button className="btn-itla-primary" onClick={() => setShowUploadModal(true)}>
            <i className="bi bi-cloud-upload me-2"></i>Subir Documento
          </button>
          {estudianteMatricula && documentos.length > 0 && (
            <button className="btn-itla-outline" onClick={handleDownloadAll}>
              <i className="bi bi-download me-2"></i>Descargar Todo (ZIP)
            </button>
          )}
        </div>
      </div>

      <div className="row mb-4">
        <div className="col-md-3">
          <select className="form-control-itla" value={filtroEstado} onChange={(e) => setFiltroEstado(e.target.value)}>
            <option value="">🔍 Todos los estados</option>
            {estadosDocumento.map((estado) => (
              <option key={estado.value} value={estado.value}>
                {estado.label}
              </option>
            ))}
          </select>
        </div>
        <div className="col-md-3">
          <button className="btn-itla-outline" onClick={fetchDocumentos}>
            <i className="bi bi-arrow-clockwise me-2"></i>Actualizar
          </button>
        </div>
        <div className="col-md-6 text-end">
          <small className="text-muted">
            Total de documentos: <strong>{documentos.length}</strong>
          </small>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary mb-3" style={{ width: "3rem", height: "3rem" }}>
            <span className="visually-hidden">Cargando...</span>
          </div>
          <p className="text-muted">Cargando documentos...</p>
        </div>
      ) : documentos.length === 0 ? (
        <div className="text-center py-5">
          <i className="bi bi-file-earmark-x display-1 text-muted mb-3"></i>
          <h5 className="text-muted">No hay documentos</h5>
          <p className="text-muted">Este estudiante no tiene documentos subidos</p>
          <button className="btn-itla-primary" onClick={() => setShowUploadModal(true)}>
            <i className="bi bi-cloud-upload me-2"></i>Subir Primer Documento
          </button>
        </div>
      ) : (
        <div className="itla-table">
          <table className="table table-hover mb-0">
            <thead>
              <tr>
                <th>
                  <i className="bi bi-hash me-1"></i>ID
                </th>
                <th>
                  <i className="bi bi-file-earmark me-1"></i>Tipo de Documento
                </th>
                <th>
                  <i className="bi bi-check-circle me-1"></i>Estado
                </th>
                <th>
                  <i className="bi bi-calendar-plus me-1"></i>Fecha Subida
                </th>
                <th>
                  <i className="bi bi-calendar-check me-1"></i>Fecha Actualización
                </th>
                <th>
                  <i className="bi bi-chat-text me-1"></i>Comentarios
                </th>
                <th>
                  <i className="bi bi-gear me-1"></i>Acciones
                </th>
              </tr>
            </thead>
            <tbody>
              {documentos.map((documento, index) => {
                const estadoInfo = getEstadoInfo(documento.estado)
                return (
                  <tr
                    key={documento.estudianteDocumentoId}
                    className="animate-slideInRight"
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <td className="fw-semibold">{documento.estudianteDocumentoId}</td>
                    <td>
                      <strong className="text-itla-primary">{getTipoDocumentoLabel(documento.tipoDocumento)}</strong>
                    </td>
                    <td>
                      <span className={`badge badge-itla ${estadoInfo.color}`}>{estadoInfo.label}</span>
                    </td>
                    <td>
                      <small className="text-muted">{new Date(documento.fechaCreacion).toLocaleString()}</small>
                    </td>
                    <td>
                      <small className="text-muted">
                        {documento.fechaActualizacion
                          ? new Date(documento.fechaActualizacion).toLocaleString()
                          : "Sin actualizar"}
                      </small>
                    </td>
                    <td>
                      <small className="text-muted">
                        {documento.comentarios ? (
                          <span title={documento.comentarios}>{documento.comentarios.substring(0, 30)}...</span>
                        ) : (
                          "Sin comentarios"
                        )}
                      </small>
                    </td>
                    <td>
                      <div className="btn-group" role="group">
                        <button
                          className="btn btn-sm btn-outline-success hover-lift"
                          onClick={() => handleDownload(documento)}
                          title="Descargar documento"
                        >
                          <i className="bi bi-download"></i>
                        </button>
                        <button
                          className="btn btn-sm btn-outline-primary hover-lift"
                          onClick={() => handleReview(documento)}
                          title="Revisar documento"
                        >
                          <i className="bi bi-eye"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal para Subir Documento */}
      {showUploadModal && (
        <div className="modal show d-block modal-itla" tabIndex={-1}>
          <div className="modal-dialog animate-fadeIn">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title fw-bold">
                  <i className="bi bi-cloud-upload me-2"></i>Subir Documento
                </h5>
                <button type="button" className="btn-close" onClick={handleCloseUploadModal}></button>
              </div>
              <form onSubmit={handleUploadSubmit}>
                <div className="modal-body">
                  <div className="alert alert-info">
                    <i className="bi bi-info-circle me-2"></i>
                    <strong>Información:</strong> Solo se permiten archivos PDF, JPG, JPEG y PNG con un tamaño máximo de
                    10MB.
                  </div>

                  <div className="form-group-itla">
                    <label htmlFor="tipoDocumento" className="form-label-itla">
                      <i className="bi bi-file-earmark me-2"></i>Tipo de Documento *
                    </label>
                    <select
                      className="form-control-itla"
                      id="tipoDocumento"
                      value={uploadData.tipoDocumento}
                      onChange={(e) => setUploadData({ ...uploadData, tipoDocumento: e.target.value as TipoDocumento })}
                      required
                    >
                      <option value="">Seleccionar tipo de documento</option>
                      {TIPOS_DOCUMENTO.map((tipo) => (
                        <option key={tipo.value} value={tipo.value}>
                          {tipo.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group-itla">
                    <label htmlFor="archivo" className="form-label-itla">
                      <i className="bi bi-file-earmark-pdf me-2"></i>Archivo * (máx. 10MB)
                    </label>
                    <input
                      type="file"
                      className="form-control-itla"
                      id="archivo"
                      onChange={(e) => setUploadData({ ...uploadData, archivo: e.target.files?.[0] || null })}
                      accept=".pdf,.jpg,.jpeg,.png"
                      required
                    />
                    {uploadData.archivo && (
                      <div className="mt-2 p-2 bg-light rounded">
                        <small className="text-success">
                          <i className="bi bi-check-circle me-1"></i>
                          Archivo seleccionado: <strong>{uploadData.archivo.name}</strong> (
                          {(uploadData.archivo.size / 1024 / 1024).toFixed(2)} MB)
                        </small>
                      </div>
                    )}
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={handleCloseUploadModal}>
                    <i className="bi bi-x-circle me-2"></i>Cancelar
                  </button>
                  <button type="submit" className="btn-itla-primary" disabled={loading}>
                    {loading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2"></span>
                        Subiendo...
                      </>
                    ) : (
                      <>
                        <i className="bi bi-cloud-upload me-2"></i>
                        Subir Documento
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal para Revisar Documento */}
      {showReviewModal && selectedDocumento && (
        <div className="modal show d-block modal-itla" tabIndex={-1}>
          <div className="modal-dialog modal-lg animate-fadeIn">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title fw-bold">
                  <i className="bi bi-eye me-2"></i>Revisar Documento
                </h5>
                <button type="button" className="btn-close" onClick={handleCloseReviewModal}></button>
              </div>
              <form onSubmit={handleReviewSubmit}>
                <div className="modal-body">
                  <div className="card mb-3">
                    <div className="card-header bg-info text-white">
                      <h6 className="mb-0">
                        <i className="bi bi-info-circle me-2"></i>Información del Documento
                      </h6>
                    </div>
                    <div className="card-body">
                      <p>
                        <strong>Tipo:</strong> {getTipoDocumentoLabel(selectedDocumento.tipoDocumento)}
                      </p>
                      <p>
                        <strong>Fecha de Subida:</strong> {new Date(selectedDocumento.fechaCreacion).toLocaleString()}
                      </p>
                      <p>
                        <strong>Estado Actual:</strong>
                        <span className={`badge ms-2 ${getEstadoInfo(selectedDocumento.estado).color}`}>
                          {getEstadoInfo(selectedDocumento.estado).label}
                        </span>
                      </p>
                      {selectedDocumento.usuarioRevision && (
                        <p>
                          <strong>Revisado por:</strong> {selectedDocumento.usuarioRevision.nombre}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="form-group-itla">
                    <label htmlFor="estado" className="form-label-itla">
                      <i className="bi bi-check-circle me-2"></i>Nuevo Estado *
                    </label>
                    <select
                      className="form-control-itla"
                      id="estado"
                      value={reviewData.estado}
                      onChange={(e) => setReviewData({ ...reviewData, estado: e.target.value })}
                      required
                    >
                      {estadosDocumento.map((estado) => (
                        <option key={estado.value} value={estado.value}>
                          {estado.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group-itla">
                    <label htmlFor="comentarios" className="form-label-itla">
                      <i className="bi bi-chat-text me-2"></i>Comentarios
                    </label>
                    <textarea
                      className="form-control-itla"
                      id="comentarios"
                      rows={3}
                      value={reviewData.comentarios}
                      onChange={(e) => setReviewData({ ...reviewData, comentarios: e.target.value })}
                      placeholder="Agregar comentarios sobre la revisión del documento..."
                    />
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={handleCloseReviewModal}>
                    <i className="bi bi-x-circle me-2"></i>Cancelar
                  </button>
                  <button type="button" className="btn btn-info me-2" onClick={() => handleDownload(selectedDocumento)}>
                    <i className="bi bi-download me-2"></i>Descargar
                  </button>
                  <button type="submit" className="btn-itla-primary" disabled={loading}>
                    {loading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2"></span>
                        Actualizando...
                      </>
                    ) : (
                      <>
                        <i className="bi bi-check-circle me-2"></i>
                        Actualizar Estado
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {showUploadModal && <div className="modal-backdrop show"></div>}
      {showReviewModal && <div className="modal-backdrop show"></div>}
    </div>
  )
}
