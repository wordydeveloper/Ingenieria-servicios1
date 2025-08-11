"use client";

import Head from "next/head";
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";

// Tipado básico para los elementos retornados por los endpoints de UNICDA.
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

/**
 * Página que consulta y muestra la información de los
 * módulos de UNICDA (eventos, libros y estudiantes) usando los
 * endpoints expuestos en el back-end con autenticación.
 */
export default function UnicdaPage() {
  const { token, user } = useAuth();
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [libros, setLibros] = useState<Libro[]>([]);
  const [estudiantes, setEstudiantes] = useState<Estudiante[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Función para manejar la visualización de PDFs con autenticación
  const handleViewPdf = async (archivoURL: string) => {
    if (!token) {
      alert('No estás autenticado');
      return;
    }

    try {
      // Quitar el prefijo "api/media/" del archivoURL si existe
      const cleanFileName = archivoURL.replace(/^api\/media\//, '');
      
      const response = await fetch(
        `http://127.0.0.1:8000/internal/unicda/pdf/${encodeURIComponent(cleanFileName)}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      // Crear un blob con el PDF
      const blob = await response.blob();
      
      // Crear una URL temporal para el blob
      const pdfUrl = window.URL.createObjectURL(blob);
      
      // Abrir en una nueva ventana
      window.open(pdfUrl, '_blank');
      
      // Limpiar la URL después de un tiempo
      setTimeout(() => {
        window.URL.revokeObjectURL(pdfUrl);
      }, 1000);
    } catch (error) {
      console.error('Error al cargar PDF:', error);
      alert('Error al cargar el PDF');
    }
  };

  useEffect(() => {
    async function fetchData() {
      // Si no hay token, no intentamos hacer las peticiones
      if (!token) {
        setError("No estás autenticado. Por favor inicia sesión.");
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const headers = {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        };

        const [eventosRes, librosRes, estudiantesRes] = await Promise.all([
          fetch("http://127.0.0.1:8000/internal/unicda/eventos", { headers })
            .then((res) => {
              if (!res.ok) {
                throw new Error(`Error ${res.status}: ${res.statusText}`);
              }
              return res.json();
            }),
          fetch("http://127.0.0.1:8000/internal/unicda/libros", { headers })
            .then((res) => {
              if (!res.ok) {
                throw new Error(`Error ${res.status}: ${res.statusText}`);
              }
              return res.json();
            }),
          fetch("http://127.0.0.1:8000/internal/unicda/estudiantes", { headers })
            .then((res) => {
              if (!res.ok) {
                throw new Error(`Error ${res.status}: ${res.statusText}`);
              }
              return res.json();
            }),
        ]);

        setEventos(eventosRes.data || []);
        setLibros(librosRes.data || []);
        setEstudiantes(estudiantesRes.data || []);
      } catch (error) {
        console.error("Error fetching UNICDA data:", error);
        setError(error instanceof Error ? error.message : "Error desconocido al cargar los datos");
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [token]); // Dependencia del token para recargar cuando cambie

  // Si no hay usuario autenticado, mostrar mensaje
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
      <div className="container py-4">
        <h1 className="mb-4">Eventos UNICDA</h1>
        
        {error && (
          <div className="alert alert-danger" role="alert">
            <strong>Error:</strong> {error}
          </div>
        )}

        {loading ? (
          <div className="d-flex justify-content-center">
            <div className="spinner-border" role="status">
              <span className="visually-hidden">Cargando...</span>
            </div>
          </div>
        ) : (
          <>
            {/* Sección de Eventos */}
            <div className="row">
              {eventos.length > 0 ? (
                eventos.map((evento) => (
                  <div className="col-md-4 mb-3" key={evento.id}>
                    <div className="card h-100">
                      <div className="card-body">
                        <h5 className="card-title">{evento.titulo}</h5>
                        <p className="card-text">{evento.descripcion}</p>
                        <p className="card-text">
                          <strong>Fecha:</strong>{" "}
                          {evento.fecha
                            ? new Date(evento.fecha).toLocaleString()
                            : "Sin fecha"}
                        </p>
                        {evento.categoriaEvento && (
                          <p className="card-text">
                            <strong>Categoría:</strong>{" "}
                            {evento.categoriaEvento.nombre}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-12">
                  <div className="alert alert-info">
                    No hay eventos disponibles.
                  </div>
                </div>
              )}
            </div>

            {/* Sección de Libros */}
            <h2 className="mt-5 mb-4">Biblioteca UNICDA</h2>
            <div className="row">
              {libros.length > 0 ? (
                libros.map((libro) => (
                  <div className="col-md-4 mb-3" key={libro.id}>
                    <div className="card h-100">
                      {libro.imagenURL && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={libro.imagenURL}
                          alt={libro.titulo}
                          className="card-img-top"
                          style={{ height: '200px', objectFit: 'cover' }}
                        />
                      )}
                      <div className="card-body">
                        <h5 className="card-title">{libro.titulo}</h5>
                        <p className="card-text">{libro.sinopsis}</p>
                        <p className="card-text">
                          <strong>Año:</strong> {libro.anoPublicacion}
                        </p>
                        {libro.editorial && (
                          <p className="card-text">
                            <strong>Editorial:</strong> {libro.editorial.nombre}
                          </p>
                        )}
                        {libro.archivoURL && (
                          <button
                            onClick={() => handleViewPdf(libro.archivoURL)}
                            className="btn btn-primary"
                          >
                            Ver PDF
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-12">
                  <div className="alert alert-info">
                    No hay libros disponibles.
                  </div>
                </div>
              )}
            </div>

            {/* Sección de Estudiantes */}
            <h2 className="mt-5 mb-4">Estudiantes egresados inscritos en UNICDA</h2>
            {estudiantes.length > 0 ? (
              <div className="table-responsive">
                <table className="table table-striped">
                  <thead>
                    <tr>
                      <th scope="col">ID</th>
                      <th scope="col">Nombre</th>
                      <th scope="col">Apellido</th>
                      <th scope="col">Cédula</th>
                      <th scope="col">Matrícula</th>
                      <th scope="col">Convalidado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {estudiantes.map((est) => (
                      <tr key={est.id}>
                        <th scope="row">{est.id}</th>
                        <td>{est.nombre}</td>
                        <td>{est.apellido}</td>
                        <td>{est.cedula}</td>
                        <td>{est.matricula}</td>
                        <td>
                          <span className={`badge ${est.convalidado ? 'bg-success' : 'bg-warning'}`}>
                            {est.convalidado ? "Sí" : "No"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="alert alert-info">
                No hay estudiantes disponibles.
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}