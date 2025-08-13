"use client"

import type React from "react"
import { useEffect, useMemo, useState } from "react"
import { useAuth } from "@/contexts/AuthContext"

/* =================== Tipos =================== */
interface UsuarioCategoriaEvento {
  usuarioId: number
  nombre: string
}
interface CategoriaEvento {
  categoriaEventoId: number
  nombre: string
  estado: "AC" | "IN"
  fechaCreacion: string | null
  usuario: UsuarioCategoriaEvento
}

/* ===== Helpers: normalización y fechas ===== */
// Acepta camelCase o snake_case desde la API
function normalizeCategoria(raw: any): CategoriaEvento {
  return {
    categoriaEventoId:
      raw.categoriaEventoId ?? raw.categoria_evento_id ?? raw.id ?? 0,
    nombre: raw.nombre ?? "",
    estado: (raw.estado ?? "AC") as "AC" | "IN",
    fechaCreacion: raw.fechaCreacion ?? raw.fecha_creacion ?? null,
    usuario:
      raw.usuario ??
      ({
        usuarioId: raw.usuarioId ?? raw.usuario_creacion_id ?? 0,
        nombre: raw.usuario?.nombre ?? raw.usuario_nombre ?? "—",
      } as UsuarioCategoriaEvento),
  }
}

// Formateador robusto: soporta "YYYY-MM-DD HH:mm:ss.ssssss" (Postgres)
function formatDateSafe(value?: string | null): string {
  if (!value) return "—"
  let s = value.replace(" ", "T").replace(/\.(\d{3})\d+$/, ".$1")
  if (!/[zZ]|[+\-]\d{2}:\d{2}$/.test(s)) s += "Z"
  const d = new Date(s)
  return isNaN(d.getTime())
    ? value
    : d.toLocaleDateString(undefined, { year: "numeric", month: "2-digit", day: "2-digit" })
}

/* =================== Componente =================== */
export default function CategoriasEventos() {
  const { token } = useAuth()

  const [categorias, setCategorias] = useState<CategoriaEvento[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Modal / edición (para nombre; el estado se cambia con un clic)
  const [showModal, setShowModal] = useState(false)
  const [editingCategoria, setEditingCategoria] = useState<CategoriaEvento | null>(null)

  // Filtros
  const [q, setQ] = useState("")
  const [filtroEstado, setFiltroEstado] = useState<"" | "AC" | "IN">("")

  // Form
  const [formData, setFormData] = useState<{ nombre: string; estado: "AC" | "IN" }>({
    nombre: "",
    estado: "AC",
  })

  // Evita dobles clics en toggle
  const [togglingId, setTogglingId] = useState<number | null>(null)

  useEffect(() => {
    fetchCategorias()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtroEstado])

  /** Cargar categorías (maneja 404 como lista vacía) */
  const fetchCategorias = async () => {
    setLoading(true)
    setError(null)
    try {
      const url = filtroEstado
        ? `http://127.0.0.1:8000/internal/categoria-evento/?estado=${filtroEstado}`
        : "http://127.0.0.1:8000/internal/categoria-evento/"

      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (response.status === 404) {
        setCategorias([])
        setLoading(false)
        return
      }
      if (!response.ok) throw new Error(`Error ${response.status}: ${response.statusText}`)

      const json = await response.json()
      const list = Array.isArray(json?.data) ? json.data : []
      setCategorias(list.map(normalizeCategoria))
    } catch (e) {
      console.error("Error al obtener categorías:", e)
      setError(e instanceof Error ? e.message : "Error desconocido")
    } finally {
      setLoading(false)
    }
  }

  /** Crear / actualizar (desde modal) */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      if (editingCategoria) {
        const res = await fetch("http://127.0.0.1:8000/internal/categoria-evento/actualizar", {
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
        if (res.status !== 204) {
          const t = await res.text()
          throw new Error(t || "No se pudo actualizar")
        }
        alert("✅ Categoría actualizada")
      } else {
        const res = await fetch("http://127.0.0.1:8000/internal/categoria-evento/registrar", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ nombre: formData.nombre }),
        })
        if (res.status !== 201) {
          const t = await res.text()
          throw new Error(t || "No se pudo crear")
        }
        alert("✅ Categoría creada")
      }

      await fetchCategorias()
      handleCloseModal()
    } catch (e) {
      console.error(e)
      setError(e instanceof Error ? e.message : "Error procesando la solicitud")
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (cat: CategoriaEvento) => {
    setEditingCategoria(cat)
    setFormData({ nombre: cat.nombre, estado: cat.estado })
    setShowModal(true)
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setEditingCategoria(null)
    setFormData({ nombre: "", estado: "AC" })
  }

  /** Cambiar estado en un clic (badge) */
  const toggleEstado = async (cat: CategoriaEvento) => {
    if (togglingId) return
    setTogglingId(cat.categoriaEventoId)
    try {
      const nuevoEstado: "AC" | "IN" = cat.estado === "AC" ? "IN" : "AC"

      // Optimistic UI
      setCategorias(prev =>
        prev.map(c =>
          c.categoriaEventoId === cat.categoriaEventoId ? { ...c, estado: nuevoEstado } : c
        )
      )

      const res = await fetch("http://127.0.0.1:8000/internal/categoria-evento/actualizar", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          categoriaEventoId: cat.categoriaEventoId,
          nombre: cat.nombre,
          estado: nuevoEstado,
        }),
      })

      if (res.status !== 204) {
        // revertir si falló
        setCategorias(prev =>
          prev.map(c =>
            c.categoriaEventoId === cat.categoriaEventoId ? { ...c, estado: cat.estado } : c
          )
        )
        const t = await res.text()
        throw new Error(t || "No se pudo actualizar el estado")
      }
    } catch (err) {
      console.error(err)
      alert("❌ Error al cambiar estado")
    } finally {
      setTogglingId(null)
    }
  }

  // Filtrado cliente
  const categoriasFiltradas = useMemo(() => {
    return categorias.filter((c) => {
      const matchQ = !q || c.nombre.toLowerCase().includes(q.toLowerCase())
      const matchEstado = !filtroEstado || c.estado === filtroEstado
      return matchQ && matchEstado
    })
  }, [categorias, q, filtroEstado])

  return (
    <>
      {/* HERO */}
      <div className="unicda-hero py-4 py-md-5 mb-4">
        <div className="container">
          <div className="d-flex flex-column flex-md-row align-items-start align-items-md-center justify-content-between gap-3">
            <div className="d-flex align-items-start gap-3">
              <div className="icon-blob d-flex align-items-center justify-content-center">
                <i className="bi bi-tags text-white fs-5" />
              </div>
              <div>
                <h1 className="h4 h3-md text-white fw-bold mb-1">Categorías de Eventos</h1>
                <p className="text-white-50 mb-0">Gestiona categorías con historial y estados</p>
              </div>
            </div>
            <div className="d-flex flex-wrap gap-2">
              <div className="metric-pill">
                <span className="label">Total</span>
                <span className="value">{categorias.length}</span>
              </div>
              <div className="metric-pill">
                <span className="label">Activas</span>
                <span className="value">{categorias.filter((c) => c.estado === "AC").length}</span>
              </div>
              <div className="metric-pill">
                <span className="label">Inactivas</span>
                <span className="value">{categorias.filter((c) => c.estado === "IN").length}</span>
              </div>
            </div>
          </div>

          {/* Filtros */}
          <div className="mt-4 d-flex flex-column flex-md-row align-items-md-center gap-3">
            <div className="flex-grow-1">
              <div className="input-group shadow-sm">
                <span className="input-group-text bg-white border-end-0">
                  <i className="bi bi-search" />
                </span>
                <input
                  className="form-control border-start-0"
                  placeholder="Buscar categoría por nombre…"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                />
                {q && (
                  <button className="btn btn-outline-secondary" onClick={() => setQ("")}>
                    Limpiar
                  </button>
                )}
              </div>
            </div>
            <div className="d-flex gap-2">
              <select
                className="form-select shadow-sm"
                value={filtroEstado}
                onChange={(e) => setFiltroEstado(e.target.value as any)}
              >
                <option value="">Todos los estados</option>
                <option value="AC">Activo</option>
                <option value="IN">Inactivo</option>
              </select>
              <button className="btn btn-outline-light text-white border-white/50 shadow-sm" onClick={fetchCategorias}>
                <i className="bi bi-arrow-clockwise me-1" />
                Actualizar
              </button>
              <button className="btn btn-primary shadow-sm" onClick={() => setShowModal(true)}>
                <i className="bi bi-plus-lg me-1" />
                Nueva Categoría
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* CONTENIDO */}
      <div className="container pb-5">
        {error && (
          <div className="alert alert-danger shadow-sm" role="alert">
            <strong>Error:</strong> {error}
          </div>
        )}

        <div className="card border-0 shadow-sm">
          <div
            className="card-header text-white fw-semibold"
            style={{ background: "linear-gradient(90deg,#1e3a8a,#2563eb,#38bdf8)" }}
          >
            Lista de Categorías
          </div>

          {loading ? (
            <SkeletonTable />
          ) : (
            <div className="table-responsive">
              <table className="table align-middle mb-0">
                <thead
                  className="text-white sticky-top"
                  style={{ background: "linear-gradient(90deg,#1e3a8a,#2563eb,#38bdf8)" }}
                >
                  <tr>
                    <th className="small">ID</th>
                    <th className="small">Nombre</th>
                    <th className="small">Estado</th>
                    <th className="small">Creado</th>
                    <th className="small">Usuario creación</th>
                    <th className="small text-end">Acciones</th>
                  </tr>
                </thead>
                <tbody className="table-group-divider">
                  {categoriasFiltradas.length > 0 ? (
                    categoriasFiltradas.map((c) => (
                      <tr key={c.categoriaEventoId} className="row-hover">
                        <td>{c.categoriaEventoId}</td>
                        <td className="fw-semibold">{c.nombre}</td>
                        <td>
                          <span
                            role="button"
                            title={togglingId === c.categoriaEventoId ? "Actualizando…" : "Cambiar estado"}
                            onClick={() => (togglingId ? null : toggleEstado(c))}
                            className={`badge rounded-pill ${
                              c.estado === "AC" ? "bg-gradient-emerald" : "bg-secondary"
                            }`}
                            style={{ cursor: togglingId ? "not-allowed" : "pointer" }}
                          >
                            {togglingId === c.categoriaEventoId ? "…" : c.estado === "AC" ? "Activo" : "Inactivo"}
                          </span>
                        </td>
                        <td className="text-secondary">{formatDateSafe(c.fechaCreacion)}</td>
                        <td>{c.usuario?.nombre ?? "—"}</td>
                        <td className="text-end">
                          <button className="btn btn-sm btn-outline-primary" onClick={() => handleEdit(c)}>
                            <i className="bi bi-pencil-square me-1" />
                            Editar
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="text-center text-secondary py-4">
                        No hay categorías para mostrar.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* MODAL (crear/editar nombre) */}
      {showModal && (
        <>
          <div className="modal show d-block" tabIndex={-1}>
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content border-0 shadow-lg">
                <div
                  className="modal-header text-white"
                  style={{ background: "linear-gradient(90deg,#1e3a8a,#2563eb,#38bdf8)" }}
                >
                  <h5 className="modal-title mb-0">{editingCategoria ? "Editar Categoría" : "Nueva Categoría"}</h5>
                  <button type="button" className="btn-close btn-close-white" onClick={handleCloseModal} />
                </div>
                <form onSubmit={handleSubmit}>
                  <div className="modal-body">
                    <div className="mb-3">
                      <label htmlFor="nombre" className="form-label fw-semibold">
                        Nombre
                      </label>
                      <input
                        id="nombre"
                        type="text"
                        className="form-control"
                       
                        value={formData.nombre}
                        onChange={(e) => setFormData((p) => ({ ...p, nombre: e.target.value }))}
                        required
                      />
                    </div>

                    {/* Si estás editando, puedes (opcional) cambiar el estado aquí.
                        Aun así, recuerda que también lo puedes alternar desde el badge. */}
                    {editingCategoria && (
                      <div className="mb-3">
                        <label htmlFor="estado" className="form-label fw-semibold">
                          Estado
                        </label>
                        <select
                          id="estado"
                          className="form-select"
                          value={formData.estado}
                          onChange={(e) =>
                            setFormData((p) => ({ ...p, estado: e.target.value as "AC" | "IN" }))
                          }
                        >
                          <option value="AC">Activo</option>
                          <option value="IN">Inactivo</option>
                        </select>
                      </div>
                    )}
                  </div>

                  <div className="modal-footer">
                    <button type="button" className="btn btn-outline-secondary" onClick={handleCloseModal}>
                      Cancelar
                    </button>
                    <button type="submit" className="btn btn-primary" disabled={loading}>
                      {loading ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true" />
                          Guardando…
                        </>
                      ) : (
                        "Guardar"
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
          <div className="modal-backdrop show" />
        </>
      )}
      {/* --- fin modal --- */}

      {/* Estilos vivos */}
      <style jsx>{`
        .unicda-hero {
          background: radial-gradient(1200px 600px at 0% -10%, rgba(56, 189, 248, 0.35), transparent 50%),
                      radial-gradient(1000px 600px at 100% 0%, rgba(37, 99, 235, 0.45), transparent 50%),
                      linear-gradient(90deg, #1e3a8a, #2563eb, #38bdf8);
        }
        .icon-blob {
          width: 44px; height: 44px; border-radius: 16px;
          background: rgba(255,255,255,0.15);
          box-shadow: inset 0 0 0 1px rgba(255,255,255,0.25);
          backdrop-filter: blur(6px);
        }
        .metric-pill {
          display: inline-flex; gap: 8px; align-items: center;
          padding: 6px 12px; border-radius: 999px;
          background: rgba(255,255,255,0.15);
          color: #fff; border: 1px solid rgba(255,255,255,0.25);
          backdrop-filter: blur(4px);
        }
        .metric-pill .label { font-size: 12px; opacity: 0.9; }
        .metric-pill .value { font-weight: 700; }
        .bg-gradient-emerald {
          background: linear-gradient(90deg, #10b981, #22c55e) !important;
        }
        .row-hover { transition: background .15s ease; }
        .row-hover:hover { background: rgba(37, 99, 235, 0.06); }
      `}</style>

      {/* Bootstrap Icons (si no las tienes ya globales) */}
      <link
        rel="stylesheet"
        href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.css"
      />
    </>
  )
}

/* ------------- Skeleton sencillo ------------- */
function SkeletonTable() {
  return (
    <div className="p-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="placeholder-wave mb-3">
          <span className="placeholder col-12" style={{ height: 18 }} />
        </div>
      ))}
    </div>
  )
}
