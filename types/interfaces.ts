// Interfaces existentes
export interface User {
  id: number
  nombre: string
  correo: string
  rolId: number
}

export interface CategoriaEvento {
  categoriaEventoId: number
  nombre: string
  estado: string
  fechaCreacion: string
  usuario: {
    usuarioId: number
    nombre: string
  }
  fechaActualizacion?: string | null
  usuarioActualizacionId?: number | null
}

export interface Evento {
  eventoId: number
  nombre: string
  descripcion: string
  estado: string
  fechaInicio: string
  fechaFin: string
  categoriaEventoId: number
  categoriaEvento: {
    categoriaEventoId: number
    nombre: string
  }
  fechaCreacion: string
  fechaActualizacion?: string | null
  usuario: {
    usuarioId: number
    nombre: string
  }
  usuarioActualizacionId?: number | null
}

export interface Editorial {
  editorialId: number
  nombre: string
  estado: string
  fechaCreacion: string
  fechaActualizacion?: string | null
}

export interface Libro {
  libroId: number
  titulo: string
  sipnosis: string
  yearPublicacion: number
  archivoUrl: string
  imagenUrl: string
  estado: string
  fechaCreacion: string
  fechaActualizacion?: string | null
  cantidadDisponible: number
  usuarioCreacion: {
    usuarioId: number
    nombre: string
  }
  usuarioActualizacion?: {
    usuarioId: number
    nombre: string
  } | null
  editorial: {
    editorialId: number
    nombre: string
    estado: string
  }
}

// Nuevas interfaces
export interface ProgramaAcademico {
  programaAcademicoId: number
  nombre: string
  estado: string
  periodoAcademico: string
  fechaCreacion: string
  fechaActualizacion?: string | null
}

export interface Materia {
  materiaId: number
  nombre: string
  codigo: string
  credito: number
  estado: string
  fechaCreacion: string
  fechaActualizacion?: string | null
  programasAcademicos?: ProgramaAcademico[]
}

export interface Cuatrimestre {
  cuatrimestreId: number
  nombre: string
  fechaInicio: string
  fechaFin: string
  estado: string
  fechaCreacion: string
  fechaActualizacion?: string | null
}

export interface Estudiante {
  estudianteId: number
  nombres: string
  apellidos: string
  correo: string
  telefono?: string
  cedula?: string
  matricula?: string
  estado:
    | "REGISTRADO"
    | "PENDIENTE_DOCUMENTO"
    | "PENDIENTE_RESPUESTA"
    | "ACEPTADO"
    | "RECHAZADO"
    | "ACTIVO"
    | "GRADUADO"
  fechaCreacion: string
  fechaActualizacion?: string | null
  usuarioCreacionId: number
  usuarioActualizacionId?: number | null
  programaAcademico?: ProgramaAcademico
}

// Interface para documentos de estudiante - CORREGIDA según la base de datos
export interface EstudianteDocumento {
  estudianteDocumentoId: number
  estudianteId: number
  tipoDocumento: "CEDULA" | "ACTA_NACIMIENTO" | "RECORD_ESCUELA"
  content: string // Base64 o referencia al archivo
  estado: "PENDIENTE" | "APROBADO" | "RECHAZADO"
  fechaCreacion: string
  fechaActualizacion?: string | null
  comentarios?: string | null
  usuarioRevisionId?: number | null
  usuarioRevision?: {
    usuarioId: number
    nombre: string
  } | null
}

// Tipos de documentos permitidos - CORREGIDOS según la base de datos
export const TIPOS_DOCUMENTO = [
  { value: "CEDULA", label: "🆔 Cédula de Identidad" },
  { value: "ACTA_NACIMIENTO", label: "📜 Acta de Nacimiento" },
  { value: "RECORD_ESCUELA", label: "📊 Record de Escuela" },
] as const

export type TipoDocumento = (typeof TIPOS_DOCUMENTO)[number]["value"]

// Interface para estudiante-materia
export interface EstudianteMateria {
  estudianteMateriaId: number
  estudianteId: number
  materiaId: number
  cuatrimestreId: number
  calificacion?: number
  estado: "CURSANDO" | "APROBADO" | "REPROBADO" | "RETIRADO"
  fechaCreacion: string
  fechaActualizacion?: string | null
  estudiante: Estudiante
  materia: Materia
  cuatrimestre: Cuatrimestre
}

// Interfaces para estadísticas y gráficas
export interface EstadisticasGenerales {
  totalLibros: number
  librosDisponibles: number
  totalEventos: number
  totalCategorias: number
  totalEditoriales: number
  totalProgramas: number
  totalMaterias: number
  totalEstudiantes: number
  totalCuatrimestres: number
}

export interface EstadisticasEstudiantes {
  registrados: number
  pendienteDocumento: number
  aceptados: number
  rechazados: number
  graduados: number
}

export interface EstadisticasLibrosPorEditorial {
  editorial: string
  cantidad: number
  disponibles: number
}

export interface EstadisticasEventosPorCategoria {
  categoria: string
  cantidad: number
}

// Tipos para formularios
export interface ProgramaAcademicoForm {
  nombre: string
  periodoAcademico: string
  estado: string
}

export interface MateriaForm {
  nombre: string
  codigo: string
  credito: number
  estado: string
  programasAcademicosIds: number[]
}

export interface EstudianteForm {
  nombres: string
  apellidos: string
  correo: string
  telefono: string
  cedula: string
  matricula: string
  programaAcademicoId: number
  estado: string
}

export interface CuatrimestreForm {
  nombre: string
  fechaInicio: string
  fechaFin: string
  estado: string
}

// Tipos para paginación
export interface PaginationParams {
  numeroPagina?: number
  limite?: number
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  pagina: number
  limite: number
  totalPaginas: number
}

// Tipos para respuestas de API
export interface ApiResponse<T> {
  data: T
  message?: string
  status?: number
}

export interface ApiListResponse<T> {
  data: T[]
  total?: number
  pagina?: number
  limite?: number
  totalPaginas?: number
}

// Tipos para notificaciones
export interface Notification {
  id: string
  type: "success" | "error" | "warning" | "info"
  title: string
  message: string
  duration?: number
  timestamp: Date
}
