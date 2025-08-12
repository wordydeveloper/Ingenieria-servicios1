"use client"

// Este componente gestiona las inscripciones de estudiantes en materias.  Utiliza los
// servicios definidos en `utils/api.ts` para consumir los endpoints
// `/estudiante-materia/registrar`, `/estudiante-materia`, `/estudiante-materia/estudiante/{matricula}/historial` y `/estudiante-materia/actualizar`.

import { useState, useEffect, ChangeEvent, FormEvent } from "react"
import { useAuth } from "@/contexts/AuthContext"
import {
  estudianteMateriaService,
  estudiantesService,
  apiRequest,
  handleApiError,
} from "@/utils/api"

interface Inscripcion {
  estudianteMateriaId: number
  estudianteId: number
  materiaId: number
  cuatrimestreId: number
  estado: "APROBADA" | "REPROBADA" | "RETIRADA"
  calificacion: number | null
  estudiante: { nombres: string; apellidos: string }
  materia: { nombre: string; codigo: string }
  cuatrimestre: { periodo: string; anio: number }
}

export default function EstudianteMaterias() {
  const { token } = useAuth()

  const [inscripciones, setInscripciones] = useState<Inscripcion[]>([])
  const [estudiantes, setEstudiantes] = useState<any[]>([])
  const [materias, setMaterias] = useState<any[]>([])
  const [cuatrimestres, setCuatrimestres] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  // Valores que el backend acepta: APROBADA | REPROBADA | RETIRADA
  const [formData, setFormData] = useState({
    estudianteId: "",
    materiaId: "",
    cuatrimestreId: "",
    estado: "APROBADA" as "APROBADA" | "REPROBADA" | "RETIRADA",
    // usamos string para permitir vacío y luego convertir
    calificacion: "",
  })

  useEffect(() => {
    if (token) {
      fetchInscripciones()
      fetchEstudiantes()
      fetchMaterias()
      fetchCuatrimestres()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token])

  const fetchInscripciones = async () => {
    setLoading(true)
    try {
      // tu backend devuelve ResponseList { data: [...] }
      const data = await estudianteMateriaService.getAll(token!)
      setInscripciones(data.data ?? [])
    } catch (error) {
      alert(handleApiError(error))
    } finally {
      setLoading(false)
    }
  }

  const fetchEstudiantes = async () => {
    try {
      const data = await estudiantesService.getAll({ limite: 1000 }, token!)
      setEstudiantes(data.data ?? [])
    } catch (error) {
      console.error("Error al cargar estudiantes:", error)
    }
  }

  const fetchMaterias = async () => {
    try {
      const data = await apiRequest(
        "http://127.0.0.1:8000/internal/materia/?estado=AC",
        { method: "GET" },
        token!,
      )
      setMaterias(data.data ?? [])
    } catch (error) {
      console.error("Error al cargar materias:", error)
    }
  }

  const fetchCuatrimestres = async () => {
    try {
      const data = await apiRequest(
        "http://127.0.0.1:8000/internal/cuatrimestre/?estado=AC",
        { method: "GET" },
        token!,
      )
      setCuatrimestres(data.data ?? [])
    } catch (error) {
      console.error("Error al cargar cuatrimestres:", error)
    }
  }

  const handleChange = (e: ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()

    if (!formData.estudianteId || !formData.materiaId || !formData.cuatrimestreId) {
      alert("Debes seleccionar estudiante, materia y cuatrimestre")
      return
    }

    const estado = formData.estado

    // calificación: null si RETIRADA; número 0–100 en los demás casos
    let calificacion: number | null = null
    if (estado !== "RETIRADA") {
      if (formData.calificacion === "") {
        alert("Ingresa la calificación (0–100) o cambia el estado a Retirada")
        return
      }
      const num = Number(formData.calificacion)
      if (Number.isNaN(num) || num < 0 || num > 100) {
        alert("La calificación debe estar entre 0 y 100")
        return
      }
      calificacion = num
    } else {
      calificacion = null
    }

    try {
      await estudianteMateriaService.create(
        {
          estudianteId: Number(formData.estudianteId),
          materiaId: Number(formData.materiaId),
          cuatrimestreId: Number(formData.cuatrimestreId),
          estado,          // ✅ coincide con el regex del backend
          calificacion,    // ✅ null cuando RETIRADA
        },
        token!,
      )
      alert("✅ Inscripción creada exitosamente")
      await fetchInscripciones()
      setFormData({
        estudianteId: "",
        materiaId: "",
        cuatrimestreId: "",
        estado: "APROBADA",
        calificacion: "",
      })
    } catch (error) {
      alert(handleApiError(error))
    }
  }

  return (
    <div className="p-4 space-y-4">
      <h2 className="text-xl font-bold">Gestión de Inscripciones</h2>

      {/* Formulario para nueva inscripción */}
      <form
        onSubmit={handleSubmit}
        className="flex flex-col md:flex-row items-center gap-4 border border-gray-200 p-4 rounded"
      >
        <select
          name="estudianteId"
          value={formData.estudianteId}
          onChange={handleChange}
          className="p-2 border rounded w-full md:w-1/5"
        >
          <option value="">Selecciona estudiante</option>
          {estudiantes.map((e) => (
            <option key={e.estudianteId} value={e.estudianteId}>
              {e.nombres} {e.apellidos} ({e.matricula})
            </option>
          ))}
        </select>

        <select
          name="materiaId"
          value={formData.materiaId}
          onChange={handleChange}
          className="p-2 border rounded w-full md:w-1/5"
        >
          <option value="">Selecciona materia</option>
          {materias.map((m) => (
            <option key={m.materiaId} value={m.materiaId}>
              {m.nombre} ({m.codigo})
            </option>
          ))}
        </select>

        <select
          name="cuatrimestreId"
          value={formData.cuatrimestreId}
          onChange={handleChange}
          className="p-2 border rounded w-full md:w-1/5"
        >
          <option value="">Selecciona cuatrimestre</option>
          {cuatrimestres.map((c) => (
            <option key={c.cuatrimestreId} value={c.cuatrimestreId}>
              {c.periodo} {c.anio}
            </option>
          ))}
        </select>

        <input
          type="number"
          name="calificacion"
          placeholder="Calificación (0–100)"
          value={formData.calificacion}
          onChange={handleChange}
          className="p-2 border rounded w-full md:w-1/5"
          disabled={formData.estado === "RETIRADA"}
        />

        {/* Etiquetas amigables pero valores EXACTOS del backend */}
        <select
          name="estado"
          value={formData.estado}
          onChange={handleChange}
          className="p-2 border rounded w-full md:w-1/5"
        >
          <option value="APROBADA">Aprobado</option>
          <option value="REPROBADA">Reprobado</option>
          <option value="RETIRADA">Retirada</option>
        </select>

        <button
          type="submit"
          className="flex items-center gap-2 px-5 py-2 rounded-lg bg-gradient-to-r from-blue-700 to-blue-400 text-white font-semibold shadow hover:from-blue-800 hover:to-blue-500 transition"
        >
          <span className="text-lg">+</span> Crear
        </button>
      </form>

      {/* Tabla de inscripciones */}
      {loading ? (
        <p>Cargando inscripciones...</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estudiante</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Materia</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cuatrimestre</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Calificación</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {inscripciones.map((item) => (
                <tr key={item.estudianteMateriaId}>
                  <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{item.estudianteMateriaId}</td>
                  <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                    {item.estudiante.nombres} {item.estudiante.apellidos}
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{item.materia.nombre}</td>
                  <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                    {item.cuatrimestre.periodo} {item.cuatrimestre.anio}
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{item.estado}</td>
                  <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                    {item.calificacion ?? "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
