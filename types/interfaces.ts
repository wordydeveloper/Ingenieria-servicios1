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
  credito: number  // Cambiar de 'creditos' a 'credito' (singular)
  estado: string
  fechaCreacion: string
  fechaActualizacion?: string | null
  programasAcademicos?: ProgramaAcademico[]
}

export interface Estudiante {
  estudianteId: number
  nombres: string  // Cambiar de 'nombre' a 'nombres'
  apellidos: string  // Cambiar de 'apellido' a 'apellidos'
  correo: string
  matricula?: string
  estado: 'REGISTRADO' | 'PENDIENTE_DOCUMENTO' | 'PENDIENTE_RESPUESTA' | 'ACEPTADO' | 'RECHAZADO' | 'ACTIVO' | 'GRADUADO'
  fechaCreacion: string  // Cambiar de 'fechaRegistro' a 'fechaCreacion'
  fechaActualizacion?: string | null
  usuarioCreacionId: number
  usuarioActualizacionId?: number | null
  programaAcademico?: ProgramaAcademico
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
  credito: number  // Cambiar de 'creditos' a 'credito'
  estado: string
  programasAcademicosIds: number[]
}

export interface EstudianteForm {
  nombres: string  // Cambiar de 'nombre' a 'nombres'
  apellidos: string  // Cambiar de 'apellido' a 'apellidos'
  correo: string
  telefono: string  // Make sure this is always a string, not optional
  cedula: string    // Make sure this is always a string, not optional
  matricula: string
  programaAcademicoId: number
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
