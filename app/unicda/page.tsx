"use client";

import Head from "next/head";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";

/** Tipados */
interface Evento {
  id: number;
  titulo: string;
  descripcion: string;
  fecha: string;
  categoriaEvento?: { nombre: string };
}
interface Libro {
  id: number;
  titulo: string;
  sinopsis: string;
  anoPublicacion: number;
  archivoURL: string;
  imagenURL: string;
  editorial?: { nombre: string };
}
interface Estudiante {
  id: number;
  nombre: string;
  apellido: string;
  cedula: string;
  convalidado: boolean;
  matricula: string;
  institucionExterna?: { nombre: string };
}

/** Página UNICDA con estilo vivo/gradiente */
export default function UnicdaPage() {
  const { token, user } = useAuth();

  const [eventos, setEventos] = useState<Evento[]>([]);
  const [libros, setLibros] = useState<Libro[]>([]);
  const [estudiantes, setEstudiantes] = useState<Estudiante[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // UI: pestañas y filtros suaves
  const [tab, setTab] = useState<"eventos" | "libros" | "estudiantes">("eventos");
  const [q, setQ] = useState("");

  // PDF con auth
  const handleViewPdf = async (archivoURL: string) => {
    if (!token) {
      alert("No estás autenticado");
      return;
    }
    try {
      const cleanFileName = archivoURL.replace(/^api\/media\//, "");
      const response = await fetch(
        `http://127.0.0.1:8000/internal/unicda/pdf/${encodeURIComponent(cleanFileName)}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (!response.ok) throw new Error(`Error ${response.status}: ${response.statusText}`);
      const blob = await response.blob();
      const pdfUrl = window.URL.createObjectURL(blob);
      window.open(pdfUrl, "_blank");
      setTimeout(() => window.URL.revokeObjectURL(pdfUrl), 1000);
    } catch (err) {
      console.error("Error al cargar PDF:", err);
      alert("Error al cargar el PDF");
    }
  };

  useEffect(() => {
    async function fetchData() {
      if (!token) {
        setError("No estás autenticado. Por favor inicia sesión.");
        setLoading(false);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
        const [eventosRes, librosRes, estudiantesRes] = await Promise.all([
          fetch("http://127.0.0.1:8000/internal/unicda/eventos", { headers }).then((r) => {
            if (!r.ok) throw new Error(`Error ${r.status}: ${r.statusText}`);
            return r.json();
          }),
          fetch("http://127.0.0.1:8000/internal/unicda/libros", { headers }).then((r) => {
            if (!r.ok) throw new Error(`Error ${r.status}: ${r.statusText}`);
            return r.json();
          }),
          fetch("http://127.0.0.1:8000/internal/unicda/estudiantes", { headers }).then((r) => {
            if (!r.ok) throw new Error(`Error ${r.status}: ${r.statusText}`);
            return r.json();
          }),
        ]);
        setEventos(eventosRes.data || []);
        setLibros(librosRes.data || []);
        setEstudiantes(estudiantesRes.data || []);
      } catch (err) {
        console.error("Error fetching UNICDA data:", err);
        setError(err instanceof Error ? err.message : "Error desconocido al cargar los datos");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [token]);

  // Filtro de búsqueda simple (cliente)
  const eventosFiltrados = useMemo(
    () =>
      eventos.filter(
        (e) =>
          !q ||
          e.titulo.toLowerCase().includes(q.toLowerCase()) ||
          e.descripcion?.toLowerCase().includes(q.toLowerCase()) ||
          e.categoriaEvento?.nombre?.toLowerCase().includes(q.toLowerCase())
      ),
    [eventos, q]
  );
  const librosFiltrados = useMemo(
    () =>
      libros.filter(
        (l) =>
          !q ||
          l.titulo.toLowerCase().includes(q.toLowerCase()) ||
          l.sinopsis?.toLowerCase().includes(q.toLowerCase()) ||
          l.editorial?.nombre?.toLowerCase().includes(q.toLowerCase())
      ),
    [libros, q]
  );
  const estudiantesFiltrados = useMemo(
    () =>
      estudiantes.filter(
        (s) =>
          !q ||
          s.nombre.toLowerCase().includes(q.toLowerCase()) ||
          s.apellido.toLowerCase().includes(q.toLowerCase()) ||
          s.matricula.toLowerCase().includes(q.toLowerCase()) ||
          s.cedula.toLowerCase().includes(q.toLowerCase())
      ),
    [estudiantes, q]
  );

  if (!user) {
    return (
      <>
        <Head>
          <title>UNICDA</title>
          <link
            rel="stylesheet"
            href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css"
            crossOrigin="anonymous"
          />
        </Head>
        <div className="container py-4">
          <div className="alert alert-warning" role="alert">
            <h4 className="alert-heading">Acceso restringido</h4>
            <p>Necesitas iniciar sesión para acceder a la información de UNICDA.</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>UNICDA</title>
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css"
          crossOrigin="anonymous"
        />
      </Head>

      {/* HERO con gradiente y métricas */}
      <div className="unicda-hero py-4 py-md-5 mb-4">
        <div className="container">
          <div className="d-flex flex-column flex-md-row align-items-start align-items-md-center justify-content-between gap-3">
            <div className="d-flex align-items-start gap-3">
              <div className="icon-blob d-flex align-items-center justify-content-center">
                {/* Libro/planeta */}
                <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor" className="text-white">
                  <path d="M21 5v14a2 2 0 0 1-2 2H7a3 3 0 0 1-3-3V6a3 3 0 0 1 3-3h12a2 2 0 0 1 2 2m-2 0H7a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h12zM9 8h8v2H9zm0 4h8v2H9z" />
                </svg>
              </div>
              <div>
                <h1 className="h3 h2-md text-white fw-bold mb-1">UNICDA</h1>
                <p className="text-white-50 mb-0">Eventos, biblioteca y estudiantes egresados</p>
              </div>
            </div>
            <div className="d-flex flex-wrap gap-2">
              <div className="metric-pill">
                <span className="label">Eventos</span>
                <span className="value">{eventos.length}</span>
              </div>
              <div className="metric-pill">
                <span className="label">Libros</span>
                <span className="value">{libros.length}</span>
              </div>
              <div className="metric-pill">
                <span className="label">Estudiantes</span>
                <span className="value">{estudiantes.length}</span>
              </div>
            </div>
          </div>

          {/* Buscador + Tabs */}
          <div className="mt-4 d-flex flex-column flex-md-row align-items-md-center gap-3">
            <div className="flex-grow-1">
              <div className="input-group shadow-sm">
                <span className="input-group-text bg-white border-end-0">
                  <i className="bi bi-search"></i>
                </span>
                <input
                  className="form-control border-start-0"
                  placeholder="Buscar en UNICDA (título, sinopsis, nombre, matrícula, categoría...)"
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
            <ul className="nav nav-pills bg-white rounded-3 shadow-sm p-1">
              <li className="nav-item">
                <button
                  className={`nav-link ${tab === "eventos" ? "active" : ""}`}
                  onClick={() => setTab("eventos")}
                >
                  <i className="bi bi-calendar-event me-1"></i> Eventos
                </button>
              </li>
              <li className="nav-item">
                <button
                  className={`nav-link ${tab === "libros" ? "active" : ""}`}
                  onClick={() => setTab("libros")}
                >
                  <i className="bi bi-book me-1"></i> Biblioteca
                </button>
              </li>
              <li className="nav-item">
                <button
                  className={`nav-link ${tab === "estudiantes" ? "active" : ""}`}
                  onClick={() => setTab("estudiantes")}
                >
                  <i className="bi bi-people me-1"></i> Estudiantes
                </button>
              </li>
            </ul>
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

        {loading ? (
          <SkeletonCards />
        ) : (
          <>
            {/* EVENTOS */}
            {tab === "eventos" && (
              <>
                <SectionHeader title="Eventos UNICDA" icon="bi bi-calendar2-week" />
                <div className="row g-3 g-md-4">
                  {eventosFiltrados.length > 0 ? (
                    eventosFiltrados.map((evento) => (
                      <div className="col-sm-6 col-lg-4" key={evento.id}>
                        <div className="card card-float h-100 border-0 shadow-sm">
                          <div className="card-body">
                            <div className="d-flex align-items-start justify-content-between">
                              <h5 className="card-title mb-2">{evento.titulo}</h5>
                              {evento.categoriaEvento && (
                                <span className="badge rounded-pill bg-gradient-sky">
                                  {evento.categoriaEvento.nombre}
                                </span>
                              )}
                            </div>
                            <p className="card-text text-secondary mb-3" style={{ minHeight: 60 }}>
                              {evento.descripcion}
                            </p>
                            <div className="d-flex align-items-center gap-2 text-primary">
                              <i className="bi bi-clock"></i>
                              <small className="fw-semibold">
                                {evento.fecha ? new Date(evento.fecha).toLocaleString() : "Sin fecha"}
                              </small>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <EmptyState text="No hay eventos disponibles." />
                  )}
                </div>
              </>
            )}

            {/* LIBROS */}
            {tab === "libros" && (
              <>
                <SectionHeader title="Biblioteca UNICDA" icon="bi bi-journal-richtext" />
                <div className="row g-3 g-md-4">
                  {librosFiltrados.length > 0 ? (
                    librosFiltrados.map((libro) => (
                      <div className="col-sm-6 col-lg-4" key={libro.id}>
                        <div className="card card-float h-100 border-0 shadow-sm overflow-hidden">
                          {libro.imagenURL && (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={libro.imagenURL}
                              alt={libro.titulo}
                              className="card-img-top object-fit-cover"
                              style={{ height: 190 }}
                            />
                          )}
                          <div className="card-body">
                            <div className="d-flex align-items-start justify-content-between">
                              <h5 className="card-title mb-2">{libro.titulo}</h5>
                              {libro.editorial?.nombre && (
                                <span className="badge rounded-pill bg-gradient-emerald">
                                  {libro.editorial.nombre}
                                </span>
                              )}
                            </div>
                            <p className="card-text text-secondary" style={{ minHeight: 72 }}>
                              {libro.sinopsis}
                            </p>
                            <div className="d-flex align-items-center justify-content-between">
                              <span className="small text-muted">
                                <i className="bi bi-calendar3 me-1"></i>
                                {libro.anoPublicacion}
                              </span>
                              {libro.archivoURL && (
                                <button
                                  onClick={() => handleViewPdf(libro.archivoURL)}
                                  className="btn btn-sm btn-primary shadow-sm"
                                >
                                  <i className="bi bi-file-earmark-pdf me-1"></i> Ver PDF
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <EmptyState text="No hay libros disponibles." />
                  )}
                </div>
              </>
            )}

            {/* ESTUDIANTES */}
            {tab === "estudiantes" && (
              <>
                <SectionHeader title="Estudiantes egresados inscritos en UNICDA" icon="bi bi-mortarboard" />
                {estudiantesFiltrados.length > 0 ? (
                  <div className="table-responsive card border-0 shadow-sm">
                    <table className="table align-middle mb-0">
                      <thead className="text-white sticky-top" style={{ background: "linear-gradient(90deg,#1e3a8a,#2563eb,#38bdf8)" }}>
                        <tr>
                          <th className="small">ID</th>
                          <th className="small">Nombre</th>
                          <th className="small">Apellido</th>
                          <th className="small">Cédula</th>
                          <th className="small">Matrícula</th>
                          <th className="small">Convalidado</th>
                        </tr>
                      </thead>
                      <tbody className="table-group-divider">
                        {estudiantesFiltrados.map((est) => (
                          <tr key={est.id} className="row-hover">
                            <td>{est.id}</td>
                            <td className="fw-semibold">{est.nombre}</td>
                            <td className="fw-semibold">{est.apellido}</td>
                            <td><span className="text-secondary">{est.cedula}</span></td>
                            <td><span className="badge bg-light text-primary border">{est.matricula}</span></td>
                            <td>
                              <span className={`badge rounded-pill ${est.convalidado ? "bg-success" : "bg-warning text-dark"}`}>
                                {est.convalidado ? "Sí" : "No"}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <EmptyState text="No hay estudiantes disponibles." />
                )}
              </>
            )}
          </>
        )}
      </div>

      {/* Estilos vivos */}
      <style jsx>{`
        /* Gradiente del hero alineado a tu barra superior */
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

        /* Gradientes para badges */
        .bg-gradient-sky {
          background: linear-gradient(90deg, #38bdf8, #60a5fa) !important;
        }
        .bg-gradient-emerald {
          background: linear-gradient(90deg, #10b981, #22c55e) !important;
        }

        /* Tarjetas “flotantes” */
        .card-float {
          transition: transform .2s ease, box-shadow .2s ease;
          border-radius: 14px;
        }
        .card-float:hover {
          transform: translateY(-2px);
          box-shadow: 0 12px 32px rgba(2, 6, 23, 0.12);
        }

        /* Table row hover */
        .row-hover:hover { background: rgba(37, 99, 235, 0.06); }

        /* Util para imágenes */
        .object-fit-cover { object-fit: cover; }
      `}</style>

      {/* Bootstrap Icons (si ya las cargas globalmente, puedes quitar esto) */}
      <link
        rel="stylesheet"
        href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.css"
      />
    </>
  );
}

/** ---------- Subcomponentes UI ---------- */
function SectionHeader({ title, icon }: { title: string; icon: string }) {
  return (
    <div className="d-flex align-items-center justify-content-between mb-3 mb-md-4">
      <div className="d-flex align-items-center gap-2">
        <i className={`${icon} text-primary`}></i>
        <h2 className="h5 fw-bold mb-0">{title}</h2>
      </div>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="col-12">
      <div className="alert alert-info border-0 shadow-sm">{text}</div>
    </div>
  );
}

function SkeletonCards() {
  // shimmer simple con Bootstrap
  return (
    <div className="container">
      <div className="placeholder-wave mb-3">
        <div className="col-6 placeholder"></div>
      </div>
      <div className="row g-3 g-md-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div className="col-sm-6 col-lg-4" key={i}>
            <div className="card border-0 shadow-sm">
              <div className="card-img-top placeholder" style={{ height: 150 }} />
              <div className="card-body">
                <h5 className="card-title placeholder-glow">
                  <span className="placeholder col-7"></span>
                </h5>
                <p className="card-text placeholder-glow">
                  <span className="placeholder col-12"></span>
                  <span className="placeholder col-10"></span>
                  <span className="placeholder col-8"></span>
                </p>
                <div className="d-flex justify-content-between">
                  <span className="placeholder col-4"></span>
                  <span className="btn disabled placeholder col-3"></span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
