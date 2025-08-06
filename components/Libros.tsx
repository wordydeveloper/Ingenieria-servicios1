"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/AuthContext"

interface Libro {
  libroId: number
  titulo: string
  sipnosis: string
  yearPublicacion: number
  archivoUrl: string
  imagenUrl: string
  estado: string
  fechaCreacion: string
  fechaActualizacion?: string | null
  cantidadDisponible: number
  usuarioCreacion: {
    usuarioId: number
    nombre: string
  }
  usuarioActualizacion?: {
    usuarioId: number
    nombre: string
  } | null
  editorial: {
    editorialId: number
    nombre: string
    estado: string
  }
}

interface Editorial {
  editorialId: number
  nombre: string
  estado: string
}

export default function Libros() {
  const [libros, setLibros] = useState<Libro[]>([])
  const [editoriales, setEditoriales] = useState<Editorial[]>([])
  const [loading, setLoading] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [showViewer, setShowViewer] = useState(false)
  const [editingLibro, setEditingLibro] = useState<Libro | null>(null)
  const [viewingLibro, setViewingLibro] = useState<Libro | null>(null)
  const [pdfUrl, setPdfUrl] = useState<string>("")
  const [formData, setFormData] = useState({
    titulo: "",
    sipnosis: "",
    yearPublicacion: new Date().getFullYear(),
    cantidadDisponible: 1,
    editorialId: "",
    archivoUrl: "",
    imagenUrl: "",
    estado: "AC",
  })
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [filtroEstado, setFiltroEstado] = useState("")

  const { token, user } = useAuth()

  useEffect(() => {
    fetchLibros()
    fetchEditoriales()
  }, [filtroEstado])

  const fetchLibros = async () => {
    setLoading(true)
    try {
      const url = filtroEstado
        ? `http://127.0.0.1:8000/internal/libro/?estado=${filtroEstado}`
        : "http://127.0.0.1:8000/internal/libro/"

      if (!token) {
        alert("No hay token de autenticación. Por favor, inicia sesión nuevamente.")
        return
      }

      const response = await fetch(url, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })

      if (response.ok) {
        const data = await response.json()
        setLibros(data.data || [])
      } else {
        const errorText = await response.text()
        console.error("❌ Error response:", errorText)

        if (response.status === 401) {
          alert("Token expirado o inválido. Por favor, inicia sesión nuevamente.")
        } else if (response.status === 403) {
          alert("No tienes permisos para acceder a esta información.")
        } else {
          alert(`Error del servidor: ${response.status}`)
        }
      }
    } catch (error) {
      console.error("🚨 Network error:", error)
      alert("Error de conexión con el servidor")
      setLibros([])
    } finally {
      setLoading(false)
    }
  }

  const fetchEditoriales = async () => {
    try {
      if (!token) return

      const response = await fetch("http://127.0.0.1:8000/internal/editorial/?estado=AC", {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })

      if (response.ok) {
        const data = await response.json()
        setEditoriales(data.data || [])
      }
    } catch (error) {
      console.error("🚨 Error fetching editoriales:", error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.titulo.trim()) {
      alert("El título es requerido")
      return
    }

    if (!formData.editorialId) {
      alert("La editorial es requerida")
      return
    }

    if (!editingLibro && !selectedFile) {
      alert("El archivo es requerido para crear un nuevo libro")
      return
    }

    setLoading(true)

    try {
      if (editingLibro) {
        // Actualizar libro existente - USANDO LA DOCUMENTACIÓN CORRECTA
        const updateData: any = {
          libroId: editingLibro.libroId,
          editorialId: Number.parseInt(formData.editorialId),
          titulo: formData.titulo.trim(),
          estado: formData.estado,
          cantidadDisponible: formData.cantidadDisponible,
        }

        // Campos opcionales
        if (formData.sipnosis.trim()) updateData.sipnosis = formData.sipnosis.trim()
        if (formData.yearPublicacion) updateData.yearPublicacion = formData.yearPublicacion
        if (formData.archivoUrl) updateData.archivoUrl = formData.archivoUrl
        if (formData.imagenUrl) updateData.imagenUrl = formData.imagenUrl

        console.log("📝 Actualizando libro:", updateData)

        const response = await fetch("http://127.0.0.1:8000/internal/libro/actualizar", {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(updateData),
        })

        console.log("📡 Response status:", response.status)

        if (response.status === 204) {
          alert("✅ Libro actualizado exitosamente")
          fetchLibros()
          handleCloseModal()
        } else {
          const errorData = await response.text()
          console.error("❌ Error updating libro:", errorData)
          alert(`Error al actualizar libro: ${response.status}`)
        }
      } else {
        // Crear nuevo libro
        const formDataToSend = new FormData()
        formDataToSend.append("titulo", formData.titulo.trim())
        formDataToSend.append("editorialId", formData.editorialId)
        formDataToSend.append("cantidadDisponible", formData.cantidadDisponible.toString())

        if (selectedFile) {
          formDataToSend.append("file", selectedFile)
        }

        if (formData.sipnosis.trim()) {
          formDataToSend.append("sipnosis", formData.sipnosis.trim())
        }

        if (formData.yearPublicacion) {
          formDataToSend.append("yearPublicacion", formData.yearPublicacion.toString())
        }

        if (formData.archivoUrl) {
          formDataToSend.append("archivoUrl", formData.archivoUrl)
        }

        if (formData.imagenUrl) {
          formDataToSend.append("imagenUrl", formData.imagenUrl)
        }

        const response = await fetch("http://127.0.0.1:8000/internal/libro/registrar", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formDataToSend,
        })

        if (response.status === 201) {
          alert("✅ Libro creado exitosamente")
          fetchLibros()
          handleCloseModal()
        } else {
          const errorData = await response.text()
          console.error("Error creating libro:", errorData)
          alert("Error al crear libro")
        }
      }
    } catch (error) {
      console.error("Error:", error)
      alert("Error al procesar la solicitud")
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (libro: Libro) => {
    setEditingLibro(libro)
    setFormData({
      titulo: libro.titulo,
      sipnosis: libro.sipnosis || "",
      yearPublicacion: libro.yearPublicacion || new Date().getFullYear(),
      cantidadDisponible: libro.cantidadDisponible,
      editorialId: libro.editorial.editorialId.toString(),
      archivoUrl: libro.archivoUrl || "",
      imagenUrl: libro.imagenUrl || "",
      estado: libro.estado,
    })
    setShowModal(true)
  }

  const handleView = async (libro: Libro) => {
    try {
      setViewingLibro(libro)

      // Si hay archivoUrl, usarla directamente
      if (libro.archivoUrl) {
        setPdfUrl(libro.archivoUrl)
        setShowViewer(true)
        return
      }

      // Si no hay archivoUrl, obtener el archivo del servidor
      const response = await fetch(`http://127.0.0.1:8000/internal/libro/${libro.libroId}/descargar`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        setPdfUrl(url)
        setShowViewer(true)
      } else {
        alert("No se pudo cargar el contenido del libro")
      }
    } catch (error) {
      console.error("Error viewing libro:", error)
      alert("Error al cargar el libro")
    }
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setEditingLibro(null)
    setSelectedFile(null)
    setFormData({
      titulo: "",
      sipnosis: "",
      yearPublicacion: new Date().getFullYear(),
      cantidadDisponible: 1,
      editorialId: "",
      archivoUrl: "",
      imagenUrl: "",
      estado: "AC",
    })
  }

  const handleCloseViewer = () => {
    setShowViewer(false)
    setViewingLibro(null)
    if (pdfUrl && pdfUrl.startsWith("blob:")) {
      window.URL.revokeObjectURL(pdfUrl)
    }
    setPdfUrl("")
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 20 * 1024 * 1024) {
        alert("El archivo no puede ser mayor a 20MB")
        return
      }
      setSelectedFile(file)
    }
  }

  return (
    <div className="animate-fadeIn">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h3 className="text-gradient fw-bold">
          <i className="bi bi-book me-2"></i>Gestión de Libros
        </h3>
        <button className="btn btn-primary hover-scale" onClick={() => setShowModal(true)}>
          <i className="bi bi-plus-circle me-2"></i>Nuevo Libro
        </button>
      </div>

      <div className="row mb-4">
        <div className="col-md-3">
          <select 
            className="form-select" 
            value={filtroEstado} 
            onChange={(e) => setFiltroEstado(e.target.value)}
          >
            <option value="">🔍 Todos los estados</option>
            <option value="AC">✅ Activo</option>
            <option value="IN">❌ Inactivo</option>
          </select>
        </div>
        <div className="col-md-3">
          <button className="btn btn-outline-primary hover-scale" onClick={fetchLibros}>
            <i className="bi bi-arrow-clockwise me-2"></i>Actualizar
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary mb-3" style={{ width: '3rem', height: '3rem' }} role="status">
            <span className="visually-hidden">Cargando...</span>
          </div>
          <p className="text-muted">Cargando libros...</p>
        </div>
      ) : (
        <div className="card animate-slideInLeft">
          <div className="table-responsive">
            <table className="table table-hover mb-0">
              <thead>
                <tr>
                  <th><i className="bi bi-hash me-1"></i>ID</th>
                  <th><i className="bi bi-book me-1"></i>Título</th>
                  <th><i className="bi bi-building me-1"></i>Editorial</th>
                  <th><i className="bi bi-calendar me-1"></i>Año</th>
                  <th><i className="bi bi-box me-1"></i>Cantidad</th>
                  <th><i className="bi bi-check-circle me-1"></i>Estado</th>
                  <th><i className="bi bi-calendar-plus me-1"></i>Creación</th>
                  <th><i className="bi bi-calendar-check me-1"></i>Actualización</th>
                  <th><i className="bi bi-gear me-1"></i>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {libros.map((libro, index) => (
                  <tr key={libro.libroId} className="animate-slideInRight" style={{ animationDelay: `${index * 0.1}s` }}>
                    <td className="fw-semibold">{libro.libroId}</td>
                    <td>
                      <div>
                        <strong className="text-primary">{libro.titulo}</strong>
                        {libro.sipnosis && (
                          <div>
                            <small className="text-muted d-block">
                              {libro.sipnosis.substring(0, 80)}...
                            </small>
                          </div>
                        )}
                      </div>
                    </td>
                    <td>
                      <span className="badge bg-info">
                        {libro.editorial?.nombre || "N/A"}
                      </span>
                    </td>
                    <td>{libro.yearPublicacion || "N/A"}</td>
                    <td>
                      <span className="badge bg-secondary">
                        {libro.cantidadDisponible}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${libro.estado === "AC" ? "bg-success" : "bg-danger"}`}>
                        {libro.estado === "AC" ? "✅ Activo" : "❌ Inactivo"}
                      </span>
                    </td>
                    <td>
                      <small className="text-muted">
                        {new Date(libro.fechaCreacion).toLocaleDateString()}
                      </small>
                    </td>
                    <td>
                      <small className="text-muted">
                        {libro.fechaActualizacion ? new Date(libro.fechaActualizacion).toLocaleDateString() : "Sin actualizar"}
                      </small>
                    </td>
                    <td>
                      <div className="btn-group" role="group">
                        <button
                          className="btn btn-sm btn-outline-info hover-scale"
                          onClick={() => handleView(libro)}
                          title="Ver contenido del libro"
                        >
                          <i className="bi bi-eye"></i>
                        </button>
                        <button
                          className="btn btn-sm btn-outline-primary hover-scale"
                          onClick={() => handleEdit(libro)}
                          title="Editar libro"
                        >
                          <i className="bi bi-pencil"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal para Crear/Editar */}
      {showModal && (
        <div className="modal show d-block" tabIndex={-1}>
          <div className="modal-dialog modal-lg animate-fadeIn">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title fw-bold">
                  <i className={`bi ${editingLibro ? 'bi-pencil' : 'bi-plus-circle'} me-2`}></i>
                  {editingLibro ? "Editar Libro" : "Nuevo Libro"}
                </h5>
                <button type="button" className="btn-close" onClick={handleCloseModal}></button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="modal-body">
                  <div className="row">
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label htmlFor="titulo" className="form-label fw-semibold">
                          <i className="bi bi-book me-2"></i>Título *
                        </label>
                        <input
                          type="text"
                          className="form-control"
                          id="titulo"
                          value={formData.titulo}
                          onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                          required
                          maxLength={250}
                          placeholder="Ingresa el título del libro"
                        />
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label htmlFor="editorialId" className="form-label fw-semibold">
                          <i className="bi bi-building me-2"></i>Editorial *
                        </label>
                        <select
                          className="form-select"
                          id="editorialId"
                          value={formData.editorialId}
                          onChange={(e) => setFormData({ ...formData, editorialId: e.target.value })}
                          required
                        >
                          <option value="">Seleccionar editorial</option>
                          {editoriales.map((editorial) => (
                            <option key={editorial.editorialId} value={editorial.editorialId}>
                              {editorial.nombre}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="mb-3">
                    <label htmlFor="sipnosis" className="form-label fw-semibold">
                      <i className="bi bi-text-paragraph me-2"></i>Sinopsis
                    </label>
                    <textarea
                      className="form-control"
                      id="sipnosis"
                      rows={3}
                      value={formData.sipnosis}
                      onChange={(e) => setFormData({ ...formData, sipnosis: e.target.value })}
                      maxLength={250}
                      placeholder="Describe brevemente el contenido del libro"
                    />
                  </div>

                  <div className="row">
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label htmlFor="yearPublicacion" className="form-label fw-semibold">
                          <i className="bi bi-calendar me-2"></i>Año de Publicación
                        </label>
                        <input
                          type="number"
                          className="form-control"
                          id="yearPublicacion"
                          value={formData.yearPublicacion}
                          onChange={(e) =>
                            setFormData({ ...formData, yearPublicacion: Number.parseInt(e.target.value) })
                          }
                          min={1000}
                          max={9999}
                        />
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label htmlFor="cantidadDisponible" className="form-label fw-semibold">
                          <i className="bi bi-box me-2"></i>Cantidad Disponible *
                        </label>
                        <input
                          type="number"
                          className="form-control"
                          id="cantidadDisponible"
                          value={formData.cantidadDisponible}
                          onChange={(e) =>
                            setFormData({ ...formData, cantidadDisponible: Number.parseInt(e.target.value) })
                          }
                          min={1}
                          required
                        />
                      </div>
                    </div>
                  </div>

                  {!editingLibro && (
                    <div className="mb-3">
                      <label htmlFor="file" className="form-label fw-semibold">
                        <i className="bi bi-file-earmark-pdf me-2"></i>Archivo PDF * (máx. 20MB)
                      </label>
                      <input
                        type="file"
                        className="form-control"
                        id="file"
                        onChange={handleFileChange}
                        accept=".pdf"
                        required
                      />
                      {selectedFile && (
                        <div className="mt-2 p-2 bg-light rounded">
                          <small className="text-success">
                            <i className="bi bi-check-circle me-1"></i>
                            Archivo seleccionado: <strong>{selectedFile.name}</strong> 
                            ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                          </small>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="row">
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label htmlFor="archivoUrl" className="form-label fw-semibold">
                          <i className="bi bi-link me-2"></i>URL del Archivo
                        </label>
                        <input
                          type="url"
                          className="form-control"
                          id="archivoUrl"
                          value={formData.archivoUrl}
                          onChange={(e) => setFormData({ ...formData, archivoUrl: e.target.value })}
                          placeholder="https://ejemplo.com/archivo.pdf"
                        />
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label htmlFor="imagenUrl" className="form-label fw-semibold">
                          <i className="bi bi-image me-2"></i>URL de la Imagen
                        </label>
                        <input
                          type="url"
                          className="form-control"
                          id="imagenUrl"
                          value={formData.imagenUrl}
                          onChange={(e) => setFormData({ ...formData, imagenUrl: e.target.value })}
                          placeholder="https://ejemplo.com/portada.jpg"
                        />
                      </div>
                    </div>
                  </div>

                  {editingLibro && (
                    <div className="mb-3">
                      <label htmlFor="estado" className="form-label fw-semibold">
                        <i className="bi bi-toggle-on me-2"></i>Estado
                      </label>
                      <select
                        className="form-select"
                        id="estado"
                        value={formData.estado}
                        onChange={(e) => setFormData({ ...formData, estado: e.target.value })}
                      >
                        <option value="AC">✅ Activo</option>
                        <option value="IN">❌ Inactivo</option>
                      </select>
                    </div>
                  )}
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary hover-scale" onClick={handleCloseModal}>
                    <i className="bi bi-x-circle me-2"></i>Cancelar
                  </button>
                  <button type="submit" className="btn btn-primary hover-scale" disabled={loading}>
                    {loading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                        Guardando...
                      </>
                    ) : (
                      <>
                        <i className={`bi ${editingLibro ? 'bi-check-circle' : 'bi-plus-circle'} me-2`}></i>
                        {editingLibro ? "Actualizar" : "Crear"}
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Visor de PDF */}
      {showViewer && viewingLibro && (
        <div className="modal show d-block" tabIndex={-1} style={{ zIndex: 1060 }}>
          <div className="modal-dialog modal-fullscreen animate-fadeIn">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title fw-bold">
                  <i className="bi bi-book-half me-2"></i>{viewingLibro.titulo}
                </h5>
                <button type="button" className="btn-close" onClick={handleCloseViewer}></button>
              </div>
              <div className="modal-body p-0">
                {pdfUrl ? (
                  <iframe
                    src={pdfUrl}
                    width="100%"
                    height="600px"
                    style={{ border: "none" }}
                    title={`Contenido de ${viewingLibro.titulo}`}
                  />
                ) : (
                  <div className="text-center p-5">
                    <div className="spinner-border text-primary mb-3" style={{ width: '3rem', height: '3rem' }} role="status">
                      <span className="visually-hidden">Cargando libro...</span>
                    </div>
                    <p className="text-muted">Cargando contenido del libro...</p>
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <div className="me-auto">
                  <small className="text-muted">
                    <i className="bi bi-building me-1"></i>Editorial: <strong>{viewingLibro.editorial?.nombre}</strong> | 
                    <i className="bi bi-calendar ms-2 me-1"></i>Año: <strong>{viewingLibro.yearPublicacion}</strong> | 
                    <i className="bi bi-box ms-2 me-1"></i>Disponibles: <strong>{viewingLibro.cantidadDisponible}</strong>
                  </small>
                </div>
                <button type="button" className="btn btn-secondary hover-scale" onClick={handleCloseViewer}>
                  <i className="bi bi-x-circle me-2"></i>Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showModal && <div className="modal-backdrop show"></div>}
      {showViewer && <div className="modal-backdrop show" style={{ zIndex: 1055 }}></div>}
    </div>
  )
}
