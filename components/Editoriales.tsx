"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/AuthContext"

interface Editorial {
  editorialId: number
  nombre: string
  estado: string
  fechaCreacion: string
  fechaActualizacion?: string | null
}

export default function Editoriales() {
  const [editoriales, setEditoriales] = useState<Editorial[]>([])
  const [loading, setLoading] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [editingEditorial, setEditingEditorial] = useState<Editorial | null>(null)
  const [formData, setFormData] = useState({
    nombre: "",
    estado: "AC",
  })
  const [filtroEstado, setFiltroEstado] = useState("")

  const { token } = useAuth()

  useEffect(() => {
    fetchEditoriales()
  }, [filtroEstado])

  const fetchEditoriales = async () => {
    setLoading(true)
    try {
      const url = filtroEstado
        ? `http://127.0.0.1:8000/internal/editorial/?estado=${filtroEstado}`
        : "http://127.0.0.1:8000/internal/editorial/"

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
        setEditoriales(data.data || [])
      } else {
        const errorText = await response.text()
        console.error("❌ Error response:", errorText)

        if (response.status === 401) {
          alert("Token expirado. Por favor, inicia sesión nuevamente.")
        } else if (response.status === 403) {
          alert("Sin permisos para acceder a editoriales.")
        } else {
          alert(`Error del servidor: ${response.status}`)
        }
      }
    } catch (error) {
      console.error("🚨 Network error:", error)

      if (error instanceof TypeError && error.message.includes("fetch")) {
        alert("Error de conexión con el servidor. Verifica que la API esté ejecutándose en http://127.0.0.1:8000")
      } else {
        alert(`Error inesperado: ${error.message}`)
      }

      setEditoriales([])
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.nombre.trim()) {
      alert("El nombre es requerido")
      return
    }

    setLoading(true)

    try {
      if (editingEditorial) {
        // Actualizar
        const requestBody = {
          editorialId: editingEditorial.editorialId,
          nombre: formData.nombre.trim(),
          estado: formData.estado,
        }

        const response = await fetch("http://127.0.0.1:8000/internal/editorial/actualizar", {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(requestBody),
        })

        if (response.status === 204) {
          alert("Editorial actualizada exitosamente")
          fetchEditoriales()
          handleCloseModal()
        } else {
          const errorText = await response.text()
          console.error("Error updating:", errorText)
          alert(`Error al actualizar: ${response.status}`)
        }
      } else {
        // Crear
        const requestBody = {
          nombre: formData.nombre.trim(),
        }

        const response = await fetch("http://127.0.0.1:8000/internal/editorial/registrar", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(requestBody),
        })

        if (response.status === 201) {
          alert("Editorial creada exitosamente")
          fetchEditoriales()
          handleCloseModal()
        } else {
          const errorText = await response.text()
          console.error("Error creating:", errorText)
          alert(`Error al crear: ${response.status}`)
        }
      }
    } catch (error) {
      console.error("Error:", error)
      alert("Error al procesar la solicitud")
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (editorial: Editorial) => {
    setEditingEditorial(editorial)
    setFormData({
      nombre: editorial.nombre,
      estado: editorial.estado,
    })
    setShowModal(true)
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setEditingEditorial(null)
    setFormData({ nombre: "", estado: "AC" })
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h3>🏢 Gestión de Editoriales</h3>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          ➕ Nueva Editorial
        </button>
      </div>

      <div className="row mb-3">
        <div className="col-md-3">
          <select className="form-select" value={filtroEstado} onChange={(e) => setFiltroEstado(e.target.value)}>
            <option value="">Todos los estados</option>
            <option value="AC">Activo</option>
            <option value="IN">Inactivo</option>
          </select>
        </div>
        <div className="col-md-3">
          <button className="btn btn-outline-secondary" onClick={fetchEditoriales}>
            🔄 Actualizar
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Cargando...</span>
          </div>
        </div>
      ) : (
        <div className="table-responsive">
          <table className="table table-striped">
            <thead>
              <tr>
                <th>ID</th>
                <th>Nombre</th>
                <th>Estado</th>
                <th>📅 Fecha Creación</th>
                <th>🔄 Fecha Actualización</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {editoriales.map((editorial) => (
                <tr key={editorial.editorialId}>
                  <td>{editorial.editorialId}</td>
                  <td>
                    <strong>{editorial.nombre}</strong>
                  </td>
                  <td>
                    <span className={`badge ${editorial.estado === "AC" ? "bg-success" : "bg-secondary"}`}>
                      {editorial.estado === "AC" ? "✅ Activo" : "❌ Inactivo"}
                    </span>
                  </td>
                  <td>
                    <div>
                      <strong>{new Date(editorial.fechaCreacion).toLocaleDateString()}</strong>
                      <br />
                      <small className="text-muted">{new Date(editorial.fechaCreacion).toLocaleTimeString()}</small>
                    </div>
                  </td>
                  <td>
                    {editorial.fechaActualizacion ? (
                      <div>
                        <strong>{new Date(editorial.fechaActualizacion).toLocaleDateString()}</strong>
                        <br />
                        <small className="text-muted">
                          {new Date(editorial.fechaActualizacion).toLocaleTimeString()}
                        </small>
                      </div>
                    ) : (
                      <span className="text-muted">Sin actualizar</span>
                    )}
                  </td>
                  <td>
                    <button
                      className="btn btn-sm btn-outline-primary"
                      onClick={() => handleEdit(editorial)}
                      title="Editar editorial"
                    >
                      ✏️ Editar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="modal show d-block" tabIndex={-1}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">{editingEditorial ? "✏️ Editar Editorial" : "➕ Nueva Editorial"}</h5>
                <button type="button" className="btn-close" onClick={handleCloseModal}></button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="modal-body">
                  <div className="mb-3">
                    <label htmlFor="nombre" className="form-label">
                      Nombre *
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      id="nombre"
                      value={formData.nombre}
                      onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                      required
                      maxLength={250}
                    />
                  </div>
                  {editingEditorial && (
                    <div className="mb-3">
                      <label htmlFor="estado" className="form-label">
                        Estado
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

                  {editingEditorial && (
                    <div className="alert alert-info">
                      <small>
                        <strong>📅 Creado:</strong> {new Date(editingEditorial.fechaCreacion).toLocaleString()}
                        <br />
                        <strong>🔄 Última actualización:</strong>{" "}
                        {editingEditorial.fechaActualizacion
                          ? new Date(editingEditorial.fechaActualizacion).toLocaleString()
                          : "Sin actualizar"}
                      </small>
                    </div>
                  )}
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={handleCloseModal}>
                    Cancelar
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={loading}>
                    {loading ? "Guardando..." : editingEditorial ? "Actualizar" : "Crear"}
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
