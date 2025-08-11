"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/AuthContext"
import type { Materia, ProgramaAcademico, MateriaForm } from "@/types/interfaces"

// Importar y usar las utilidades de API
import { apiRequest, handleApiError } from "@/utils/api"

export default function Materias() {
  const [materias, setMaterias] = useState<Materia[]>([])
  const [programas, setProgramas] = useState<ProgramaAcademico[]>([])
  const [loading, setLoading] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [editingMateria, setEditingMateria] = useState<Materia | null>(null)
  const [formData, setFormData] = useState<MateriaForm>({
    nombre: "",
    codigo: "",
    credito: 3,
    estado: "AC",
    programasAcademicosIds: [],  // Always initialize as empty array
  })
  const [filtroEstado, setFiltroEstado] = useState("")

  const { token } = useAuth()

  useEffect(() => {
    fetchMaterias()
    fetchProgramas()
  }, [filtroEstado])

  // En fetchMaterias, reemplazar el fetch manual:
  const fetchMaterias = async () => {
    setLoading(true)
    try {
      const url = filtroEstado
        ? `http://127.0.0.1:8000/internal/materia/?estado=${filtroEstado}`
        : "http://127.0.0.1:8000/internal/materia/"

      const data = await apiRequest(url, { method: 'GET' }, token)
      setMaterias(data.data || [])
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

  const fetchProgramasDeMateria = async (materiaId: number) => {
    try {
      const response = await fetch(`http://127.0.0.1:8000/internal/materia/${materiaId}/programas-academicos`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })

      if (response.ok) {
        const data = await response.json()
        return data.data || []
      }
    } catch (error) {
      console.error("Error fetching programas de materia:", error)
    }
    return []
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.nombre.trim() || !formData.codigo.trim()) {
      alert("El nombre y código son requeridos")
      return
    }

    if (formData.credito < 1 || formData.credito > 10) {
      alert("Los créditos deben estar entre 1 y 10")
      return
    }

    setLoading(true)

    // En handleSubmit, reemplazar los fetch manuales:
    try {
      if (editingMateria) {
        await apiRequest(
          "http://127.0.0.1:8000/internal/materia/actualizar",
          {
            method: "PATCH",
            body: JSON.stringify({
              materiaId: editingMateria.materiaId,
              nombre: formData.nombre.trim(),
              codigo: formData.codigo.trim(),
              credito: formData.credito,
              estado: formData.estado,
              programasAcademicosIds: formData.programasAcademicosIds,
            }),
          },
          token
        )
        alert("✅ Materia actualizada exitosamente")
      } else {
        await apiRequest(
          "http://127.0.0.1:8000/internal/materia/registrar",
          {
            method: "POST",
            body: JSON.stringify({
              nombre: formData.nombre.trim(),
              codigo: formData.codigo.trim(),
              credito: formData.credito,
              programasAcademicosIds: formData.programasAcademicosIds,
            }),
          },
          token
        )
        alert("✅ Materia creada exitosamente")
      }
      
      fetchMaterias()
      handleCloseModal()
    } catch (error) {
      console.error("Error:", error)
      alert(handleApiError(error))
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = async (materia: Materia) => {
    setEditingMateria(materia)
    
    // Obtener programas asociados a la materia
    const programasAsociados = await fetchProgramasDeMateria(materia.materiaId)
    
    setFormData({
      nombre: materia.nombre || "",           // Ensure never undefined
      codigo: materia.codigo || "",           // Ensure never undefined
      credito: materia.credito || 3,          // Ensure never undefined
      estado: materia.estado || "AC",         // Ensure never undefined
      programasAcademicosIds: Array.isArray(programasAsociados) ? programasAsociados : [],  // Ensure always array
    })
    setShowModal(true)
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setEditingMateria(null)
    setFormData({
      nombre: "",
      codigo: "",
      credito: 3,
      estado: "AC",
      programasAcademicosIds: [],  // Always reset to empty array
    })
  }

  const handleProgramaChange = (programaId: number, checked: boolean) => {
    if (checked) {
      setFormData({
        ...formData,
        programasAcademicosIds: [...formData.programasAcademicosIds, programaId]
      })
    } else {
      setFormData({
        ...formData,
        programasAcademicosIds: formData.programasAcademicosIds.filter(id => id !== programaId)
      })
    }
  }

  return (
    <div className="animate-fadeIn">
      <div className="dashboard-header">
        <h1 className="dashboard-title">
          <i className="bi bi-book me-3"></i>Materias
        </h1>
        <p className="dashboard-subtitle">
          Gestión de materias académicas y su asociación con programas
        </p>
      </div>

      <div className="content-card">
        <div className="content-card-header d-flex justify-content-between align-items-center">
          <h3 className="content-card-title mb-0">
            <i className="bi bi-list-ul me-2"></i>Lista de Materias
          </h3>
          <button className="btn-itla-primary" onClick={() => setShowModal(true)}>
            <i className="bi bi-plus-circle me-2"></i>Nueva Materia
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
                <option value="AC">✅ Activo</option>
                <option value="IN">❌ Inactivo</option>
              </select>
            </div>
            <div className="col-md-3">
              <button className="btn-itla-outline" onClick={fetchMaterias}>
                <i className="bi bi-arrow-clockwise me-2"></i>Actualizar
              </button>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary mb-3" style={{ width: '3rem', height: '3rem' }}>
                <span className="visually-hidden">Cargando...</span>
              </div>
              <p className="text-muted">Cargando materias...</p>
            </div>
          ) : (
            <div className="itla-table">
              <table className="table table-hover mb-0">
                <thead>
                  <tr>
                    <th><i className="bi bi-hash me-1"></i>ID</th>
                    <th><i className="bi bi-book me-1"></i>Materia</th>
                    <th><i className="bi bi-code-square me-1"></i>Código</th>
                    <th><i className="bi bi-star me-1"></i>Créditos</th>
                    <th><i className="bi bi-check-circle me-1"></i>Estado</th>
                    <th><i className="bi bi-calendar-plus me-1"></i>Creación</th>
                    <th><i className="bi bi-gear me-1"></i>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {materias.map((materia, index) => (
                    <tr key={materia.materiaId} className="animate-slideInRight" style={{ animationDelay: `${index * 0.1}s` }}>
                      <td className="fw-semibold">{materia.materiaId}</td>
                      <td>
                        <strong className="text-itla-primary">{materia.nombre}</strong>
                      </td>
                      <td>
                        <span className="badge bg-secondary">
                          {materia.codigo}
                        </span>
                      </td>
                      <td>
                        <span className="badge bg-info">
                          {materia.credito} créditos
                        </span>
                      </td>
                      <td>
                        <span className={`badge badge-itla ${materia.estado === "AC" ? "badge-available" : "badge-unavailable"}`}>
                          {materia.estado === "AC" ? "✅ Activo" : "❌ Inactivo"}
                        </span>
                      </td>
                      <td>
                        <small className="text-muted">
                          {new Date(materia.fechaCreacion).toLocaleDateString()}
                        </small>
                      </td>
                      <td>
                        <button
                          className="btn btn-sm btn-outline-primary hover-lift"
                          onClick={() => handleEdit(materia)}
                          title="Editar materia"
                        >
                          <i className="bi bi-pencil"></i>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
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
                  <i className={`bi ${editingMateria ? 'bi-pencil' : 'bi-plus-circle'} me-2`}></i>
                  {editingMateria ? "Editar Materia" : "Nueva Materia"}
                </h5>
                <button type="button" className="btn-close" onClick={handleCloseModal}></button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="modal-body">
                  <div className="row">
                    <div className="col-md-8">
                      <div className="form-group-itla">
                        <label htmlFor="nombre" className="form-label-itla">
                          <i className="bi bi-book me-2"></i>Nombre de la Materia *
                        </label>
                        <input
                          type="text"
                          className="form-control-itla"
                          id="nombre"
                          value={formData.nombre}
                          onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                          required
                          placeholder="Ej: Programación I"
                        />
                      </div>
                    </div>
                    <div className="col-md-4">
                      <div className="form-group-itla">
                        <label htmlFor="codigo" className="form-label-itla">
                          <i className="bi bi-code-square me-2"></i>Código *
                        </label>
                        <input
                          type="text"
                          className="form-control-itla"
                          id="codigo"
                          value={formData.codigo}
                          onChange={(e) => setFormData({ ...formData, codigo: e.target.value.toUpperCase() })}
                          required
                          placeholder="PROG101"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="row">
                    <div className="col-md-6">
                      <div className="form-group-itla">
                        <label htmlFor="credito" className="form-label-itla">
                          <i className="bi bi-star me-2"></i>Créditos *
                        </label>
                        <input
                          type="number"
                          className="form-control-itla"
                          id="credito"
                          value={formData.credito}
                          onChange={(e) => setFormData({ ...formData, credito: parseInt(e.target.value) })}
                          required
                          min={1}
                          max={10}
                        />
                      </div>
                    </div>
                    {editingMateria && (
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
                            <option value="AC">✅ Activo</option>
                            <option value="IN">❌ Inactivo</option>
                          </select>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="form-group-itla">
                    <label className="form-label-itla">
                      <i className="bi bi-mortarboard me-2"></i>Programas Académicos Asociados
                    </label>
                    <div className="row">
                      {programas.map((programa) => (
                        <div key={programa.programaAcademicoId} className="col-md-6 mb-2">
                          <div className="form-check">
                            <input
                              className="form-check-input"
                              type="checkbox"
                              id={`programa-${programa.programaAcademicoId}`}
                              checked={formData.programasAcademicosIds.includes(programa.programaAcademicoId)}
                              onChange={(e) => handleProgramaChange(programa.programaAcademicoId, e.target.checked)}
                            />
                            <label className="form-check-label" htmlFor={`programa-${programa.programaAcademicoId}`}>
                              {programa.nombre}
                              <small className="text-muted d-block">{programa.periodoAcademico}</small>
                            </label>
                          </div>
                        </div>
                      ))}
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
                        Guardando...
                      </>
                    ) : (
                      <>
                        <i className={`bi ${editingMateria ? 'bi-check-circle' : 'bi-plus-circle'} me-2`}></i>
                        {editingMateria ? "Actualizar" : "Crear"}
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
