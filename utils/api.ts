// Utilidades para manejo de API y errores

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public response?: any,
  ) {
    super(message)
    this.name = "ApiError"
  }
}

// Configuración base de la API
const API_BASE_URL = "http://127.0.0.1:8000/internal"

export const apiRequest = async (url: string, options: RequestInit = {}, token?: string): Promise<any> => {
  // Construimos headers dinamicamente
  const headers: HeadersInit = {}

  // Solo agregamos Content-Type JSON si el body NO es FormData
  if (!(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json"
  }

  // Mezclamos con headers que vengan en options
  if (options.headers) {
    Object.assign(headers, options.headers)
  }

  // Token Bearer si existe
  if (token) {
    ;(headers as Record<string, string>)["Authorization"] = `Bearer ${token}`
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    })

    if (!response.ok) {
      const errorText = await response.text()
      let errorMessage = `Error ${response.status}`

      try {
        const errorJson = JSON.parse(errorText)
        errorMessage = errorJson.message || errorMessage
      } catch {
        errorMessage = errorText || errorMessage
      }

      throw new ApiError(errorMessage, response.status, errorText)
    }

    // 204 No Content
    if (response.status === 204) {
      return null
    }

    const contentType = response.headers.get("content-type")
    if (contentType && contentType.includes("application/json")) {
      return await response.json()
    }

    return await response.text()
  } catch (error) {
    if (error instanceof ApiError) {
      throw error
    }
    throw new ApiError("Error de conexión con el servidor. Verifica tu conexión a internet.", 0)
  }
}


export const handleApiError = (error: unknown): string => {
  if (error instanceof ApiError) {
    switch (error.status) {
      case 400:
        return "Datos inválidos. Verifica la información ingresada."
      case 401:
        return "Sesión expirada. Por favor, inicia sesión nuevamente."
      case 403:
        return "No tienes permisos para realizar esta acción."
      case 404:
        return "Recurso no encontrado."
      case 409:
        return "Conflicto: El recurso ya existe o está en uso."
      case 422:
        return "Datos no válidos. Verifica los campos requeridos."
      case 500:
        return "Error interno del servidor. Contacta al administrador."
      default:
        return error.message || "Error desconocido del servidor."
    }
  }

  if (error instanceof Error) {
    return error.message
  }

  return "Error desconocido. Intenta nuevamente."
}

// ===== SERVICIOS DE API =====

// Autenticación
export const authService = {
  login: async (correo: string, clave: string) => {
    return apiRequest(`${API_BASE_URL}/auth/login`, {
      method: "POST",
      body: JSON.stringify({ correo, clave }),
    })
  },

  register: async (nombre: string, correo: string, clave: string, rolId: number) => {
    return apiRequest(`${API_BASE_URL}/auth/registrar`, {
      method: "POST",
      body: JSON.stringify({ nombre, correo, clave, rolId }),
    })
  },
}

// Estudiantes
export const estudiantesService = {
  create: async (data: any, token: string) => {
    return apiRequest(
      `${API_BASE_URL}/estudiante/registrar`,
      {
        method: "POST",
        body: JSON.stringify(data),
      },
      token,
    )
  },

  getAll: async (
    params: {
      estado?: string
      numeroPagina?: number
      limite?: number
    } = {},
    token: string,
  ) => {
    const searchParams = new URLSearchParams()
    if (params.estado) searchParams.append("estado", params.estado)
    if (params.numeroPagina) searchParams.append("numeroPagina", params.numeroPagina.toString())
    if (params.limite) searchParams.append("limite", params.limite.toString())

    const url = `${API_BASE_URL}/estudiante${searchParams.toString() ? `?${searchParams}` : ""}`
    return apiRequest(url, { method: "GET" }, token)
  },

  getById: async (estudianteId: number, token: string) => {
    return apiRequest(`${API_BASE_URL}/estudiante/${estudianteId}`, { method: "GET" }, token)
  },

  getByCorreo: async (correo: string, token: string) => {
    return apiRequest(`${API_BASE_URL}/estudiante/correo/${correo}`, { method: "GET" }, token)
  },

  update: async (data: any, token: string) => {
    return apiRequest(
      `${API_BASE_URL}/estudiante/actualizar`,
      {
        method: "PATCH",
        body: JSON.stringify(data),
      },
      token,
    )
  },
}
// utils/api.ts

// Documentos de Estudiante
export const estudianteDocumentosService = {
  // Obtener documentos de un estudiante
  getByEstudiante: async (estudianteId: number, estado?: string, token?: string) => {
    const params = estado ? `?estado=${estado}` : ""
    return apiRequest(
      `${API_BASE_URL}/estudiante-documento/estudiante/${estudianteId}${params}`,
      { method: "GET" },
      token,
    )
  },

  // Subir documento de estudiante
  // Envíamos un FormData con las claves que espera el API: estudianteId, tipoDocumento y file
  upload: async (estudianteId: number, tipoDocumento: string, archivo: File, token: string) => {
    const formData = new FormData()
    formData.append("estudianteId", estudianteId.toString())
    formData.append("tipoDocumento", tipoDocumento)
    formData.append("file", archivo) // clave correcta para el archivo

    return apiRequest(
      `${API_BASE_URL}/estudiante-documento/subir`,
      {
        method: "POST",
        body: formData,
        headers: {}, // no definimos Content-Type, el navegador lo añade automáticamente
      },
      token,
    )
  },

  // Actualizar estado de documento
  updateStatus: async (
    data: { documentoId: number; estado: string; comentarios?: string },
    token: string,
  ) => {
    return apiRequest(
      `${API_BASE_URL}/estudiante-documento/actualizar-estado`,
      {
        method: "PATCH",
        body: JSON.stringify(data),
      },
      token,
    )
  },

  // Descargar documento individual
  download: async (documentoId: number, token: string) => {
    const response = await fetch(`${API_BASE_URL}/estudiante-documento/${documentoId}/descargar`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (!response.ok) throw new ApiError("Error al descargar documento", response.status)
    return response.blob()
  },

  // Descargar todos los documentos en ZIP
  downloadAll: async (matricula: string, token: string) => {
    const response = await fetch(`${API_BASE_URL}/estudiante-documento/estudiante/${matricula}/descargar`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (!response.ok) throw new ApiError("Error al descargar documentos", response.status)
    return response.blob()
  },
}


// Estudiante Materia
export const estudianteMateriaService = {
  create: async (data: any, token: string) => {
    return apiRequest(
      `${API_BASE_URL}/estudiante-materia/registrar`,
      {
        method: "POST",
        body: JSON.stringify(data),
      },
      token,
    )
  },

  getAll: async (token: string) => {
    return apiRequest(`${API_BASE_URL}/estudiante-materia`, { method: "GET" }, token)
  },

  getById: async (estudianteMateriaId: number, token: string) => {
    return apiRequest(`${API_BASE_URL}/estudiante-materia/${estudianteMateriaId}`, { method: "GET" }, token)
  },

  getHistorial: async (matricula: string, token: string) => {
    return apiRequest(`${API_BASE_URL}/estudiante-materia/estudiante/${matricula}/historial`, { method: "GET" }, token)
  },

  update: async (data: any, token: string) => {
    return apiRequest(
      `${API_BASE_URL}/estudiante-materia/actualizar`,
      {
        method: "PATCH",
        body: JSON.stringify(data),
      },
      token,
    )
  },
}

// Cuatrimestres
// ===== SERVICIOS DE API =====

// Cuatrimestres
/**
 * Servicios relacionados al manejo de cuatrimestres.
 *
 * Según la documentación actual del API, un cuatrimestre se compone de un
 * período (`C1`, `C2` o `C3`), un año (entre 2000 y 2099) y un estado
 * (`AC` para Activo o `IN` para Inactivo).
 *
 * - `create`: Crea un nuevo cuatrimestre enviando un objeto con las
 *   propiedades `periodo` y `anio`.
 * - `getAll`: Permite listar cuatrimestres opcionalmente filtrando por
 *   período, año, estado o parámetros de paginación. Todos los filtros son
 *   opcionales. Cuando se especifican, se incluyen en la URL como query
 *   parameters.
 * - `getById`: Obtiene un cuatrimestre en particular a partir de su ID.
 * - `update`: Actualiza un cuatrimestre existente. Debe incluirse el
 *   identificador del cuatrimestre (`cuatrimestreId`) y al menos una de las
 *   propiedades `periodo`, `anio` o `estado`.
 */
export const cuatrimestreService = {
  /** Crea un nuevo cuatrimestre. */
  create: async (data: { periodo: string; anio: number }, token: string) => {
    return apiRequest(
      `${API_BASE_URL}/cuatrimestre/registrar`,
      {
        method: "POST",
        body: JSON.stringify(data),
      },
      token,
    )
  },

  /** Obtiene la lista de cuatrimestres con filtros opcionales. */
  getAll: async (
    params: {
      periodo?: string
      anio?: number
      estado?: string
      numeroPagina?: number
      limite?: number
    } = {},
    token?: string,
  ) => {
    const searchParams = new URLSearchParams()
    if (params.periodo) searchParams.append("periodo", params.periodo)
    if (params.anio) searchParams.append("anio", params.anio.toString())
    if (params.estado) searchParams.append("estado", params.estado)
    if (params.numeroPagina) searchParams.append("numeroPagina", params.numeroPagina.toString())
    if (params.limite) searchParams.append("limite", params.limite.toString())
    const url = `${API_BASE_URL}/cuatrimestre${searchParams.toString() ? `?${searchParams}` : ""}`
    return apiRequest(url, { method: "GET" }, token)
  },

  /** Obtiene un cuatrimestre por su ID. */
  getById: async (cuatrimestreId: number, token: string) => {
    return apiRequest(`${API_BASE_URL}/cuatrimestre/${cuatrimestreId}`, { method: "GET" }, token)
  },

  /** Actualiza un cuatrimestre existente. */
  update: async (
    data: {
      cuatrimestreId: number
      periodo?: string
      anio?: number
      estado?: string
    },
    token: string,
  ) => {
    return apiRequest(
      `${API_BASE_URL}/cuatrimestre/actualizar`,
      {
        method: "PATCH",
        body: JSON.stringify(data),
      },
      token,
    )
  },
}


// Eventos
export const eventosService = {
  create: async (data: any, token: string) => {
    return apiRequest(
      `${API_BASE_URL}/evento/registrar`,
      {
        method: "POST",
        body: JSON.stringify(data),
      },
      token,
    )
  },

  getAll: async (
    params: {
      numeroPagina?: number
      limite?: number
    } = {},
    token?: string,
  ) => {
    const searchParams = new URLSearchParams()
    if (params.numeroPagina) searchParams.append("numeroPagina", params.numeroPagina.toString())
    if (params.limite) searchParams.append("limite", params.limite.toString())

    const url = `${API_BASE_URL}/evento${searchParams.toString() ? `?${searchParams}` : ""}`
    return apiRequest(url, { method: "GET" }, token)
  },

  getById: async (eventoId: number, token: string) => {
    return apiRequest(`${API_BASE_URL}/evento/${eventoId}`, { method: "GET" }, token)
  },

  update: async (data: any, token: string) => {
    return apiRequest(
      `${API_BASE_URL}/evento/actualizar`,
      {
        method: "PATCH",
        body: JSON.stringify(data),
      },
      token,
    )
  },
}

// Libros
export const librosService = {
  create: async (formData: FormData, token: string) => {
    return apiRequest(
      `${API_BASE_URL}/libro/registrar`,
      {
        method: "POST",
        body: formData,
        headers: {},
      },
      token,
    )
  },

  getAll: async (estado?: string, token?: string) => {
    const params = estado ? `?estado=${estado}` : ""
    return apiRequest(`${API_BASE_URL}/libro${params}`, { method: "GET" }, token)
  },

  download: async (libroId: number, token: string) => {
    const response = await fetch(`${API_BASE_URL}/libro/${libroId}/descargar`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    if (!response.ok) {
      throw new ApiError("Error al descargar libro", response.status)
    }

    return response.blob()
  },

  update: async (data: any, token: string) => {
    return apiRequest(
      `${API_BASE_URL}/libro/actualizar`,
      {
        method: "PATCH",
        body: JSON.stringify(data),
      },
      token,
    )
  },
}

// Editoriales
export const editorialesService = {
  create: async (data: { nombre: string }, token: string) => {
    return apiRequest(
      `${API_BASE_URL}/editorial/registrar`,
      {
        method: "POST",
        body: JSON.stringify(data),
      },
      token,
    )
  },

  getAll: async (estado?: string, token?: string) => {
    const params = estado ? `?estado=${estado}` : ""
    return apiRequest(`${API_BASE_URL}/editorial${params}`, { method: "GET" }, token)
  },

  getById: async (editorialId: number, token: string) => {
    return apiRequest(`${API_BASE_URL}/editorial/${editorialId}`, { method: "GET" }, token)
  },

  update: async (data: any, token: string) => {
    return apiRequest(
      `${API_BASE_URL}/editorial/actualizar`,
      {
        method: "PATCH",
        body: JSON.stringify(data),
      },
      token,
    )
  },
}

// Programas Académicos
export const programasService = {
  create: async (data: { nombre: string; periodoAcademico: string }, token: string) => {
    return apiRequest(
      `${API_BASE_URL}/programa-academico/registrar`,
      {
        method: "POST",
        body: JSON.stringify(data),
      },
      token,
    )
  },

  getAll: async (estado?: string, token?: string) => {
    const params = estado ? `?estado=${estado}` : ""
    return apiRequest(`${API_BASE_URL}/programa-academico${params}`, { method: "GET" }, token)
  },

  getById: async (programaAcademicoId: number, token: string) => {
    return apiRequest(`${API_BASE_URL}/programa-academico/${programaAcademicoId}`, { method: "GET" }, token)
  },

  update: async (data: any, token: string) => {
    return apiRequest(
      `${API_BASE_URL}/programa-academico/actualizar`,
      {
        method: "PATCH",
        body: JSON.stringify(data),
      },
      token,
    )
  },
}

// Materias
export const materiasService = {
  create: async (data: any, token: string) => {
    return apiRequest(
      `${API_BASE_URL}/materia/registrar`,
      {
        method: "POST",
        body: JSON.stringify(data),
      },
      token,
    )
  },

  getAll: async (estado?: string, token?: string) => {
    const params = estado ? `?estado=${estado}` : ""
    return apiRequest(`${API_BASE_URL}/materia${params}`, { method: "GET" }, token)
  },

  getById: async (materiaId: number, token: string) => {
    return apiRequest(`${API_BASE_URL}/materia/${materiaId}`, { method: "GET" }, token)
  },

  getProgramas: async (materiaId: number, token: string) => {
    return apiRequest(`${API_BASE_URL}/materia/${materiaId}/programas-academicos`, { method: "GET" }, token)
  },

  update: async (data: any, token: string) => {
    return apiRequest(
      `${API_BASE_URL}/materia/actualizar`,
      {
        method: "PATCH",
        body: JSON.stringify(data),
      },
      token,
    )
  },
}

// Categorías de Eventos
export const categoriasEventosService = {
  create: async (data: { nombre: string }, token: string) => {
    return apiRequest(
      `${API_BASE_URL}/categoria-evento/registrar`,
      {
        method: "POST",
        body: JSON.stringify(data),
      },
      token,
    )
  },

  getAll: async (estado?: string, token?: string) => {
    const params = estado ? `?estado=${estado}` : ""
    return apiRequest(`${API_BASE_URL}/categoria-evento${params}`, { method: "GET" }, token)
  },

  getById: async (categoriaEventoId: number, token: string) => {
    return apiRequest(`${API_BASE_URL}/categoria-evento/${categoriaEventoId}`, { method: "GET" }, token)
  },

  update: async (data: any, token: string) => {
    return apiRequest(
      `${API_BASE_URL}/categoria-evento/actualizar`,
      {
        method: "PATCH",
        body: JSON.stringify(data),
      },
      token,
    )
  },
}

// UNICDA (Integración externa)
export const unicdaService = {
  generateToken: async (token: string) => {
    return apiRequest(`${API_BASE_URL}/unicda/generar-token`, { method: "POST" }, token)
  },

  getEventos: async (token: string) => {
    return apiRequest(`${API_BASE_URL}/unicda/eventos`, { method: "GET" }, token)
  },

  getLibros: async (token: string) => {
    return apiRequest(`${API_BASE_URL}/unicda/libros`, { method: "GET" }, token)
  },
}
