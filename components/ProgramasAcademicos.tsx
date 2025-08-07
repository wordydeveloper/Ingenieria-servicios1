"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/AuthContext"
import type { ProgramaAcademico, ProgramaAcademicoForm } from "@/types/interfaces"

export default function ProgramasAcademicos() {
  const [programas, setProgramas] = useState<ProgramaAcademico[]>([])
  const [loading, setLoading] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [editingPrograma, setEditingPrograma] = useState<ProgramaAcademico | null>(null)
  const [formData, setFormData] = useState<ProgramaAcademicoForm>({
    nombre: "",
    periodoAcademico: "",
    estado: "AC",
  })
  const [filtroEstado, setFiltroEstado] = useState("")

  const { token } = useAuth()

  useEffect(() => {
    fetchProgramas()
  }, [filtroEstado])

  const fetchProgramas = async () => {
    setLoading(true)
    try {
      const url = filtroEstado
        ? `http://127.0.0.1:8000/internal/programa-academico/?estado=${filtroEstado}`
        : "http://127.0.0.1:8000/internal/programa-academico/"

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })

      if (response.ok) {
        const data = await response.json()
        setProgramas(data.data || [])
      } else {
        console.error("Error fetching programas:", response.status)
      }
    } catch (error) {
      console.error("Error:", error)
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

    if (!formData.periodoAcademico.trim()) {
      alert("El período académico es requerido")
      return
    }

    // Validar formato del período académico (YYYY-YYYY)
    const periodoRegex = /^\d{4}-\d{4}$/
    if (!periodoRegex.test(formData.periodoAcademico)) {
      alert("El período académico debe tener el formato YYYY-YYYY (ej: 2025-2026)")
      return
    }

    setLoading(true)

    try {
      if (editingPrograma) {
        // Actualizar
        const response = await fetch("http://127.0.0.1:8000/internal/programa-academico/actualizar", {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            programaAcademicoId: editingPrograma.programaAcademicoId,
            nombre: formData.nombre.trim(),
            periodoAcademico: formData.periodoAcademico.trim(),
            estado: formData.estado,
          }),
        })

        if (response.status === 204) {
          alert("✅ Programa académico actualizado exitosamente")
          fetchProgramas()
          handleCloseModal()
        } else {
          alert("Error al actualizar programa académico")
        }
      } else {
        // Crear
        const response = await fetch("http://127.0.0.1:8000/internal/programa-academico/registrar", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            nombre: formData.nombre.trim(),
            periodoAcademico: formData.periodoAcademico.trim(),
          }),
        })

        if (response.status === 201) {
          alert("✅ Programa académico creado exitosamente")
          fetchProgramas()
          handleCloseModal()
        } else {
          alert("Error al crear programa académico")
        }
      }
    } catch (error) {
      console.error("Error:", error)
      alert("Error al procesar la solicitud")
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (programa: ProgramaAcademico) => {
    setEditingPrograma(programa)
    setFormData({
      nombre: programa.nombre || "",                    // Ensure never undefined
      periodoAcademico: programa.periodoAcademico || "", // Ensure never undefined
      estado: programa.estado || "AC",                  // Ensure never undefined
    })
    setShowModal(true)
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setEditingPrograma(null)
    setFormData({
      nombre: "",
      periodoAcademico: "",
      estado: "AC",
    })
  }

  return (
    <div className="animate-fadeIn">
      <div className="dashboard-header">
        <h1 className="dashboard-title">
          <i className="bi bi-mortarboard me-3"></i>Programas Académicos
        </h1>
        <p className="dashboard-subtitle">
          Gestión de programas académicos y períodos de estudio
        </p>
      </div>

      <div className="content-card">
        <div className="content-card-header d-flex justify-content-between align-items-center">
          <h3 className="content-card-title mb-0">
            <i className="bi bi-list-ul me-2"></i>Lista de Programas
          </h3>
          <button className="btn-itla-primary" onClick={() => setShowModal(true)}>
            <i className="bi bi-plus-circle me-2"></i>Nuevo Programa
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
              <button className="btn-itla-outline" onClick={fetchProgramas}>
                <i className="bi bi-arrow-clockwise me-2"></i>Actualizar
              </button>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary mb-3" style={{ width: '3rem', height: '3rem' }}>
                <span className="visually-hidden">Cargando...</span>
              </div>
              <p className="text-muted">Cargando programas académicos...</p>
            </div>
          ) : (
            <div className="itla-table">
              <table className="table table-hover mb-0">
                <thead>
                  <tr>
                    <th><i className="bi bi-hash me-1"></i>ID</th>
                    <th><i className="bi bi-mortarboard me-1"></i>Programa</th>
                    <th><i className="bi bi-calendar-range me-1"></i>Período</th>
                    <th><i className="bi bi-check-circle me-1"></i>Estado</th>
                    <th><i className="bi bi-calendar-plus me-1"></i>Creación</th>
                    <th><i className="bi bi-calendar-check me-1"></i>Actualización</th>
                    <th><i className="bi bi-gear me-1"></i>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {programas.map((programa, index) => (
                    <tr key={programa.programaAcademicoId} className="animate-slideInRight" style={{ animationDelay: `${index * 0.1}s` }}>
                      <td className="fw-semibold">{programa.programaAcademicoId}</td>
                      <td>
                        <strong className="text-itla-primary">{programa.nombre}</strong>
                      </td>
                      <td>
                        <span className="badge badge-itla bg-info">
                          {programa.periodoAcademico}
                        </span>
                      </td>
                      <td>
                        <span className={`badge badge-itla ${programa.estado === "AC" ? "badge-available" : "badge-unavailable"}`}>
                          {programa.estado === "AC" ? "✅ Activo" : "❌ Inactivo"}
                        </span>
                      </td>
                      <td>
                        <small className="text-muted">
                          {new Date(programa.fechaCreacion).toLocaleDateString()}
                        </small>
                      </td>
                      <td>
                        <small className="text-muted">
                          {programa.fechaActualizacion ? new Date(programa.fechaActualizacion).toLocaleDateString() : "Sin actualizar"}
                        </small>
                      </td>
                      <td>
                        <button
                          className="btn btn-sm btn-outline-primary hover-lift"
                          onClick={() => handleEdit(programa)}
                          title="Editar programa"
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
          <div className="modal-dialog animate-fadeIn">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title fw-bold">
                  <i className={`bi ${editingPrograma ? 'bi-pencil' : 'bi-plus-circle'} me-2`}></i>
                  {editingPrograma ? "Editar Programa" : "Nuevo Programa"}
                </h5>
                <button type="button" className="btn-close" onClick={handleCloseModal}></button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="modal-body">
                  <div className="form-group-itla">
                    <label htmlFor="nombre" className="form-label-itla">
                      <i className="bi bi-mortarboard me-2"></i>Nombre del Programa *
                    </label>
                    <input
                      type="text"
                      className="form-control-itla"
                      id="nombre"
                      value={formData.nombre}
                      onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                      required
                      placeholder="Ej: Ingeniería en Sistemas"
                    />
                  </div>

                  <div className="form-group-itla">
                    <label htmlFor="periodoAcademico" className="form-label-itla">
                      <i className="bi bi-calendar-range me-2"></i>Período Académico *
                    </label>
                    <input
                      type="text"
                      className="form-control-itla"
                      id="periodoAcademico"
                      value={formData.periodoAcademico}
                      onChange={(e) => setFormData({ ...formData, periodoAcademico: e.target.value })}
                      required
                      placeholder="2025-2026"
                      pattern="\d{4}-\d{4}"
                    />
                    <small className="text-muted">Formato: YYYY-YYYY (años consecutivos)</small>
                  </div>

                  {editingPrograma && (
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
                  )}
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
                        <i className={`bi ${editingPrograma ? 'bi-check-circle' : 'bi-plus-circle'} me-2`}></i>
                        {editingPrograma ? "Actualizar" : "Crear"}
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
