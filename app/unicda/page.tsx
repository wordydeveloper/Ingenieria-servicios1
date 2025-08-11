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
 * Página pública que consulta y muestra la información de los
 * módulos de UNICDA (eventos, libros y estudiantes) usando los
 * endpoints expuestos en el back-end. Se utiliza Bootstrap para
 * obtener estilos de tarjeta y tabla sin tener que modificar el
 * estilo general del proyecto. La hoja de estilo de Bootstrap se
 * carga desde un CDN en el elemento Head.
 */
export default function UnicdaPage() {
  // Tomamos el token desde el contexto de autenticación por si en el futuro
  // los endpoints requieren autorización. Actualmente los servicios de
  // /internal/unicda no la exigen, por lo que las llamadas se pueden
  // realizar sin cabecera Authorization.
  const { token } = useAuth();
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [libros, setLibros] = useState<Libro[]>([]);
  const [estudiantes, setEstudiantes] = useState<Estudiante[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const [eventosRes, librosRes, estudiantesRes] = await Promise.all([
          fetch("http://127.0.0.1:8000/internal/unicda/eventos").then((res) => res.json()),
          fetch("http://127.0.0.1:8000/internal/unicda/libros").then((res) => res.json()),
          fetch("http://127.0.0.1:8000/internal/unicda/estudiantes").then((res) => res.json()),
        ]);
        setEventos(eventosRes.data || []);
        setLibros(librosRes.data || []);
        setEstudiantes(estudiantesRes.data || []);
      } catch (error) {
        console.error("Error fetching UNICDA data:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
    // Dependencias vacías para que solo se ejecute una vez al montar
  }, []);

  return (
    <>
      {/* Cargamos Bootstrap desde CDN. No se incluye atributo integrity para
          evitar problemas en entornos locales. */}
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
        {loading ? (
          <p>Cargando...</p>
        ) : (
          <>
            <div className="row">
              {eventos.map((evento) => (
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
              ))}
            </div>

            <h2 className="mt-5 mb-4">Biblioteca UNICDA</h2>
            <div className="row">
              {libros.map((libro) => (
                <div className="col-md-4 mb-3" key={libro.id}>
                  <div className="card h-100">
                    {libro.imagenURL && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={libro.imagenURL}
                        alt={libro.titulo}
                        className="card-img-top"
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
                        <a
                          href={`http://127.0.0.1:8000/internal/unicda/pdf/${encodeURIComponent(
                            libro.archivoURL,
                          )}`}
                          className="btn btn-primary"
                          target="_blank"
                          rel="noreferrer"
                        >
                          Ver PDF
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <h2 className="mt-5 mb-4">Estudiantes UNICDA</h2>
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
                      <td>{est.convalidado ? "Sí" : "No"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </>
  );
}