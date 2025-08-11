"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/AuthContext"
import { apiRequest, handleApiError } from "@/utils/api"

// Definición de los tipos básicos para un cuatrimestre y su formulario.
interface Cuatrimestre {
  cuatrimestreId: number
  periodo: string
  anio: number
  estado: string
  fechaCreacion: string
  fechaActualizacion?: string | null
}

interface CuatrimestreForm {
  periodo: string
  anio: string
  estado: string
}

/**
 * Componente de gestión de cuatrimestres.
 *
 * Permite listar, filtrar, crear y actualizar cuatrimestres mediante
 * formularios modales. Se basa en el patrón utilizado en otros
 * componentes de la aplicación (como Materias o Programas Académicos).
 */
export default function Cuatrimestres() {
  const [cuatrimestres, setCuatrimestres] = useState<Cuatrimestre[]>([])
  const [loading, setLoading] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [editingCuatrimestre, setEditingCuatrimestre] = useState<Cuatrimestre | null>(null)
  const [formData, setFormData] = useState<CuatrimestreForm>({
    periodo: "",
    anio: "",
    estado: "AC",
  })
  const [filtroEstado, setFiltroEstado] = useState("")
  const [filtroPeriodo, setFiltroPeriodo] = useState("")
  const [filtroAnio, setFiltroAnio] = useState("")

  const { token } = useAuth()

  // Cargar cuatrimestres cada vez que cambien los filtros
  useEffect(() => {
    fetchCuatrimestres()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtroEstado, filtroPeriodo, filtroAnio])

  /**
   * Obtiene la lista de cuatrimestres desde el backend aplicando los filtros
   * seleccionados. Utiliza la función apiRequest definida en utils/api.ts.
   */
  const fetchCuatrimestres = async () => {
    setLoading(true)
    try {
      const searchParams = new URLSearchParams()
      if (filtroEstado) searchParams.append("estado", filtroEstado)
      if (filtroPeriodo) searchParams.append("periodo", filtroPeriodo)
      if (filtroAnio) searchParams.append("anio", filtroAnio)
      const baseUrl = "http://127.0.0.1:8000/internal/cuatrimestre"
      const url = `${baseUrl}${searchParams.toString() ? `?${searchParams}` : ""}`
      const data = await apiRequest(url, { method: "GET" }, token)
      // La respuesta del backend puede venir como { items: [], paginacion: {} }
      // o como { data: [] }. Se intenta cubrir ambas variantes.
      const items = (data && (data.items || data.data)) || []
      setCuatrimestres(Array.isArray(items) ? items : [])
    } catch (error) {
      console.error("Error fetching cuatrimestres:", error)
      alert(handleApiError(error))
    } finally {
      setLoading(false)
    }
  }

  /**
   * Maneja el envío del formulario tanto para crear como actualizar un
   * cuatrimestre. Valida los campos antes de realizar la petición.
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.periodo) {
      alert("El periodo es requerido (C1, C2 o C3)")
      return
    }

    if (!formData.anio || isNaN(Number(formData.anio))) {
      alert("El año es requerido y debe ser un número")
      return
    }
    const anioNumber = parseInt(formData.anio, 10)
    if (anioNumber < 2000 || anioNumber > 2099) {
      alert("El año debe estar entre 2000 y 2099")
      return
    }

    setLoading(true)
    try {
      if (editingCuatrimestre) {
        // Actualizar un cuatrimestre existente
        await apiRequest(
          "http://127.0.0.1:8000/internal/cuatrimestre/actualizar",
          {
            method: "PATCH",
            body: JSON.stringify({
              cuatrimestreId: editingCuatrimestre.cuatrimestreId,
              periodo: formData.periodo,
              anio: anioNumber,
              estado: formData.estado,
            }),
          },
          token,
        )
        alert("✅ Cuatrimestre actualizado exitosamente")
      } else {
        // Crear nuevo cuatrimestre
        await apiRequest(
          "http://127.0.0.1:8000/internal/cuatrimestre/registrar",
          {
            method: "POST",
            body: JSON.stringify({
              periodo: formData.periodo,
              anio: anioNumber,
            }),
          },
          token,
        )
        alert("✅ Cuatrimestre creado exitosamente")
      }
      // Refrescar lista y cerrar modal
      fetchCuatrimestres()
      handleCloseModal()
    } catch (error) {
      console.error("Error saving cuatrimestre:", error)
      alert(handleApiError(error))
    } finally {
      setLoading(false)
    }
  }

  /**
   * Prepara el estado del formulario para editar un cuatrimestre ya existente.
   *
   * @param cuatrimestre Registro a editar
   */
  const handleEdit = (cuatrimestre: Cuatrimestre) => {
    setEditingCuatrimestre(cuatrimestre)
    setFormData({
      periodo: cuatrimestre.periodo || "",
      anio: cuatrimestre.anio ? cuatrimestre.anio.toString() : "",
      estado: cuatrimestre.estado || "AC",
    })
    setShowModal(true)
  }

  /** Restablece el estado del formulario y cierra el modal. */
  const handleCloseModal = () => {
    setShowModal(false)
    setEditingCuatrimestre(null)
    setFormData({ periodo: "", anio: "", estado: "AC" })
  }

  return (
    <div className="animate-fadeIn">
      <div className="dashboard-header">
        <h1 className="dashboard-title">
          <i className="bi bi-calendar3 me-3"></i>Cuatrimestres
        </h1>
        <p className="dashboard-subtitle">
          Gestión de cuatrimestres académicos (período y año)
        </p>
      </div>

      <div className="content-card">
        <div className="content-card-header d-flex justify-content-between align-items-center">
          <h3 className="content-card-title mb-0">
            <i className="bi bi-list-ul me-2"></i>Lista de Cuatrimestres
          </h3>
          <button className="btn-itla-primary" onClick={() => setShowModal(true)}>
            <i className="bi bi-plus-circle me-2"></i>Nuevo Cuatrimestre
          </button>
        </div>

        <div className="content-card-body">
          {/* Filtros */}
          <div className="row mb-4">
            <div className="col-md-3 mb-2">
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
            <div className="col-md-3 mb-2">
              <select
                className="form-control-itla"
                value={filtroPeriodo}
                onChange={(e) => setFiltroPeriodo(e.target.value)}
              >
                <option value="">🔍 Todos los períodos</option>
                <option value="C1">📅 C1</option>
                <option value="C2">📅 C2</option>
                <option value="C3">📅 C3</option>
              </select>
            </div>
            <div className="col-md-3 mb-2">
              <input
                type="number"
                className="form-control-itla"
                placeholder="🔍 Año (ej. 2025)"
                value={filtroAnio}
                onChange={(e) => setFiltroAnio(e.target.value)}
                min={2000}
                max={2099}
              />
            </div>
            <div className="col-md-3 mb-2">
              <button className="btn-itla-outline w-100" onClick={fetchCuatrimestres}>
                <i className="bi bi-arrow-clockwise me-2"></i>Actualizar
              </button>
            </div>
          </div>

          {/* Tabla de resultados */}
          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary mb-3" style={{ width: '3rem', height: '3rem' }}>
                <span className="visually-hidden">Cargando...</span>
              </div>
              <p className="text-muted">Cargando cuatrimestres...</p>
            </div>
          ) : cuatrimestres.length === 0 ? (
            <p className="text-center text-muted">No se encontraron cuatrimestres.</p>
          ) : (
            <div className="itla-table">
              <table className="table table-hover mb-0">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Período</th>
                    <th>Año</th>
                    <th>Estado</th>
                    <th>Creación</th>
                    <th>Actualización</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {cuatrimestres.map((c) => (
                    <tr key={c.cuatrimestreId}>
                      <td>{c.cuatrimestreId}</td>
                      <td>{c.periodo}</td>
                      <td>{c.anio}</td>
                      <td>{c.estado}</td>
                      <td>{new Date(c.fechaCreacion).toLocaleString()}</td>
                      <td>{c.fechaActualizacion ? new Date(c.fechaActualizacion).toLocaleString() : '-'}</td>
                      <td>
                        <button className="btn btn-sm btn-itla-outline me-2" onClick={() => handleEdit(c)}>
                          <i className="bi bi-pencil-square"></i>
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

      {/* Modal para crear/editar */}
      {showModal && (
        <div className="modal show fade d-block" tabIndex={-1} role="dialog" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  {editingCuatrimestre ? 'Editar Cuatrimestre' : 'Nuevo Cuatrimestre'}
                </h5>
                <button type="button" className="btn-close" onClick={handleCloseModal}></button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="modal-body">
                  <div className="mb-3">
                    <label htmlFor="periodo" className="form-label">Período</label>
                    <select
                      id="periodo"
                      className="form-control-itla"
                      value={formData.periodo}
                      onChange={(e) => setFormData({ ...formData, periodo: e.target.value })}
                      required
                    >
                      <option value="">Seleccione un período</option>
                      <option value="C1">C1</option>
                      <option value="C2">C2</option>
                      <option value="C3">C3</option>
                    </select>
                  </div>
                  <div className="mb-3">
                    <label htmlFor="anio" className="form-label">Año</label>
                    <input
                      id="anio"
                      type="number"
                      className="form-control-itla"
                      value={formData.anio}
                      onChange={(e) => setFormData({ ...formData, anio: e.target.value })}
                      min={2000}
                      max={2099}
                      placeholder="Ej: 2025"
                      required
                    />
                  </div>
                  {editingCuatrimestre && (
                    <div className="mb-3">
                      <label htmlFor="estado" className="form-label">Estado</label>
                      <select
                        id="estado"
                        className="form-control-itla"
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
                  <button type="button" className="btn btn-secondary" onClick={handleCloseModal}>Cancelar</button>
                  <button type="submit" className="btn-itla-primary">
                    {editingCuatrimestre ? 'Actualizar' : 'Guardar'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
