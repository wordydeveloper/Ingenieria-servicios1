"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/AuthContext"

interface CategoriaEvento {
  categoriaEventoId: number
  nombre: string
  estado: string
  fechaCreacion: string
}

export default function CategoriasEventos() {
  const [categorias, setCategorias] = useState<CategoriaEvento[]>([])
  const [loading, setLoading] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [editingCategoria, setEditingCategoria] = useState<CategoriaEvento | null>(null)
  const [formData, setFormData] = useState({
    nombre: "",
    estado: "AC",
  })
  const [filtroEstado, setFiltroEstado] = useState("")

  const { token } = useAuth()

  useEffect(() => {
    fetchCategorias()
  }, [filtroEstado])

  const fetchCategorias = async () => {
    setLoading(true)
    try {
      const url = filtroEstado
        ? `http://127.0.0.1:8000/internal/categoria-evento/?estado=${filtroEstado}`
        : "http://127.0.0.1:8000/internal/categoria-evento/"

      const response = await fetch(url, {
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
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (editingCategoria) {
        // Actualizar
        const response = await fetch("http://127.0.0.1:8000/internal/categoria-evento/actualizar", {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            categoriaEventoId: editingCategoria.categoriaEventoId,
            nombre: formData.nombre,
            estado: formData.estado,
          }),
        })

        if (response.status === 204) {
          alert("Categoría actualizada exitosamente")
          fetchCategorias()
          handleCloseModal()
        }
      } else {
        // Crear
        const response = await fetch("http://127.0.0.1:8000/internal/categoria-evento/registrar", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            nombre: formData.nombre,
          }),
        })

        if (response.status === 201) {
          alert("Categoría creada exitosamente")
          fetchCategorias()
          handleCloseModal()
        }
      }
    } catch (error) {
      console.error("Error:", error)
      alert("Error al procesar la solicitud")
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (categoria: CategoriaEvento) => {
    setEditingCategoria(categoria)
    setFormData({
      nombre: categoria.nombre,
      estado: categoria.estado,
    })
    setShowModal(true)
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setEditingCategoria(null)
    setFormData({ nombre: "", estado: "AC" })
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h3>Gestión de Categorías de Eventos</h3>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          Nueva Categoría
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
          <button className="btn btn-outline-secondary" onClick={fetchCategorias}>
            Actualizar
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
                <th>Fecha Creación</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {categorias.map((categoria) => (
                <tr key={categoria.categoriaEventoId}>
                  <td>{categoria.categoriaEventoId}</td>
                  <td>{categoria.nombre}</td>
                  <td>
                    <span className={`badge ${categoria.estado === "AC" ? "bg-success" : "bg-secondary"}`}>
                      {categoria.estado === "AC" ? "Activo" : "Inactivo"}
                    </span>
                  </td>
                  <td>{new Date(categoria.fechaCreacion).toLocaleDateString()}</td>
                  <td>
                    <button className="btn btn-sm btn-outline-primary" onClick={() => handleEdit(categoria)}>
                      Editar
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
                <h5 className="modal-title">{editingCategoria ? "Editar Categoría" : "Nueva Categoría"}</h5>
                <button type="button" className="btn-close" onClick={handleCloseModal}></button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="modal-body">
                  <div className="mb-3">
                    <label htmlFor="nombre" className="form-label">
                      Nombre
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
                  {editingCategoria && (
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
