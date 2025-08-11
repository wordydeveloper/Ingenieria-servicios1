"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/AuthContext"

interface Evento {
  eventoId: number
  nombre: string
  descripcion: string
  estado: string
  fechaInicio: string
  fechaFin: string
  categoriaEventoId: number
  categoriaEvento: {
    nombre: string
  }
}

interface CategoriaEvento {
  categoriaEventoId: number
  nombre: string
  estado: string
}

export default function Eventos() {
  const [eventos, setEventos] = useState<Evento[]>([])
  const [categorias, setCategorias] = useState<CategoriaEvento[]>([])
  const [loading, setLoading] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [editingEvento, setEditingEvento] = useState<Evento | null>(null)
  const [formData, setFormData] = useState({
    nombre: "",
    descripcion: "",
    categoriaEventoId: "",
    fechaInicio: "",
    fechaFin: "",
    estado: "AC",
  })

  // Agregar estado de paginación
  const [paginacion, setPaginacion] = useState({
    numeroPagina: 1,
    limite: 10,
    total: 0,
    totalPaginas: 0,
  })

  const { token } = useAuth()

  useEffect(() => {
    fetchEventos()
    fetchCategorias()
  }, [paginacion.numeroPagina])

  // Actualizar fetchEventos para usar paginación
  const fetchEventos = async () => {
    setLoading(true)
    try {
      const response = await fetch(
        `http://127.0.0.1:8000/internal/evento/?numeroPagina=${paginacion.numeroPagina}&limite=${paginacion.limite}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      )

      if (response.ok) {
        const data = await response.json()
        setEventos(data.data || [])
        setPaginacion((prev) => ({
          ...prev,
          total: data.total || 0,
          totalPaginas: data.totalPaginas || 0,
        }))
      }
    } catch (error) {
      console.error("Error al obtener eventos:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchCategorias = async () => {
    try {
      const response = await fetch("http://127.0.0.1:8000/internal/categoria-evento/?estado=AC", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setCategorias(data.data || [])
      }
    } catch (error) {
      console.error("Error al obtener categorías:", error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validaciones básicas
    if (!formData.nombre.trim()) {
      alert("El nombre es requerido")
      return
    }

    if (!formData.categoriaEventoId) {
      alert("La categoría es requerida")
      return
    }

    if (!formData.fechaInicio || !formData.fechaFin) {
      alert("Las fechas de inicio y fin son requeridas")
      return
    }

    setLoading(true)

    try {
      if (editingEvento) {
        // Actualizar
        const updateData: any = {
          eventoId: editingEvento.eventoId,
        }

        if (formData.nombre.trim()) updateData.nombre = formData.nombre.trim()
        if (formData.descripcion.trim()) updateData.descripcion = formData.descripcion.trim()
        if (formData.categoriaEventoId) updateData.categoriaEventoId = Number.parseInt(formData.categoriaEventoId)
        if (formData.fechaInicio) updateData.fechaInicio = formData.fechaInicio + ":00"
        if (formData.fechaFin) updateData.fechaFin = formData.fechaFin + ":00"
        if (formData.estado) updateData.estado = formData.estado

        console.log("Actualizando datos:", updateData)

        const response = await fetch("http://127.0.0.1:8000/internal/evento/actualizar", {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(updateData),
        })

        if (response.status === 204) {
          alert("Evento actualizado exitosamente")
          fetchEventos()
          handleCloseModal()
        } else {
          const errorData = await response.text()
          console.error("Error response:", errorData)
          alert(`Error al actualizar evento: ${response.status}`)
        }
      } else {
        // Crear - Formato simple agregando solo segundos
        const requestBody = {
          nombre: formData.nombre.trim(),
          descripcion: formData.descripcion.trim(),
          categoriaEventoId: Number.parseInt(formData.categoriaEventoId),
          fechaInicio: formData.fechaInicio + ":00",
          fechaFin: formData.fechaFin + ":00",
        }

        console.log("Enviando datos:", requestBody)
        console.log("Token:", token)
        console.log("URL:", "http://127.0.0.1:8000/internal/evento/registrar")

        const response = await fetch("http://127.0.0.1:8000/internal/evento/registrar", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(requestBody),
        })

        console.log("Response status:", response.status)
        console.log("Response headers:", response.headers)

        if (response.status === 201) {
          alert("Evento creado exitosamente")
          fetchEventos()
          handleCloseModal()
        } else {
          const errorData = await response.text()
          console.error("Error response:", errorData)
          alert(`Error al crear evento: ${response.status}`)
        }
      }
    } catch (error) {
      console.error("Error:", error)
      alert("Error al procesar la solicitud")
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (evento: Evento) => {
    setEditingEvento(evento)
    setFormData({
      nombre: evento.nombre,
      descripcion: evento.descripcion || "",
      categoriaEventoId: evento.categoriaEventoId ? evento.categoriaEventoId.toString() : "",
      fechaInicio: evento.fechaInicio ? evento.fechaInicio.slice(0, 16) : "", // Para datetime-local
      fechaFin: evento.fechaFin ? evento.fechaFin.slice(0, 16) : "",
      estado: evento.estado,
    })
    setShowModal(true)
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setEditingEvento(null)
    setFormData({
      nombre: "",
      descripcion: "",
      categoriaEventoId: "",
      fechaInicio: "",
      fechaFin: "",
      estado: "AC",
    })
  }

  // Agregar función para cambiar página
  const handlePageChange = (newPage: number) => {
    setPaginacion((prev) => ({ ...prev, numeroPagina: newPage }))
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h3>Gestión de Eventos</h3>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          Nuevo Evento
        </button>
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
                <th>Descripción</th>
                <th>Categoría</th>
                <th>Fecha Inicio</th>
                <th>Fecha Fin</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {eventos.map((evento) => (
                <tr key={evento.eventoId}>
                  <td>{evento.eventoId}</td>
                  <td>{evento.nombre}</td>
                  <td>{evento.descripcion || "N/A"}</td>
                  <td>{evento.categoriaEvento?.nombre || "N/A"}</td>
                  <td>{new Date(evento.fechaInicio).toLocaleString()}</td>
                  <td>{new Date(evento.fechaFin).toLocaleString()}</td>
                  <td>
                    <span className={`badge ${evento.estado === "AC" ? "bg-success" : "bg-secondary"}`}>
                      {evento.estado === "AC" ? "Activo" : "Inactivo"}
                    </span>
                  </td>
                  <td>
                    <button className="btn btn-sm btn-outline-primary" onClick={() => handleEdit(evento)}>
                      Editar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

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

              <li className={`page-item ${paginacion.numeroPagina === paginacion.totalPaginas ? "disabled" : ""}`}>
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

      {/* Modal */}
      {showModal && (
        <div className="modal show d-block" tabIndex={-1}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">{editingEvento ? "Editar Evento" : "Nuevo Evento"}</h5>
                <button type="button" className="btn-close" onClick={handleCloseModal}></button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="modal-body">
                  <div className="row">
                    <div className="col-md-6">
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
                        />
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label htmlFor="categoriaEventoId" className="form-label">
                          Categoría *
                        </label>
                        <select
                          className="form-select"
                          id="categoriaEventoId"
                          value={formData.categoriaEventoId}
                          onChange={(e) => setFormData({ ...formData, categoriaEventoId: e.target.value })}
                          required
                        >
                          <option value="">Seleccionar categoría</option>
                          {categorias.map((categoria) => (
                            <option key={categoria.categoriaEventoId} value={categoria.categoriaEventoId}>
                              {categoria.nombre}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="mb-3">
                    <label htmlFor="descripcion" className="form-label">
                      Descripción
                    </label>
                    <textarea
                      className="form-control"
                      id="descripcion"
                      rows={3}
                      value={formData.descripcion}
                      onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                    />
                  </div>

                  <div className="row">
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label htmlFor="fechaInicio" className="form-label">
                          Fecha Inicio *
                        </label>
                        <input
                          type="datetime-local"
                          className="form-control"
                          id="fechaInicio"
                          value={formData.fechaInicio}
                          onChange={(e) => setFormData({ ...formData, fechaInicio: e.target.value })}
                          required
                        />
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label htmlFor="fechaFin" className="form-label">
                          Fecha Fin *
                        </label>
                        <input
                          type="datetime-local"
                          className="form-control"
                          id="fechaFin"
                          value={formData.fechaFin}
                          onChange={(e) => setFormData({ ...formData, fechaFin: e.target.value })}
                          required
                        />
                      </div>
                    </div>
                  </div>

                  {editingEvento && (
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
                        <option value="AC">Activo</option>
                        <option value="IN">Inactivo</option>
                      </select>
                    </div>
                  )}
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={handleCloseModal}>
                    Cancelar
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={loading}>
                    {loading ? "Guardando..." : "Guardar"}
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
