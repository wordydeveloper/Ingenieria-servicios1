export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public response?: any
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

export const apiRequest = async (
  url: string,
  options: RequestInit = {},
  token?: string
): Promise<any> => {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`
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

    // Si es 204 No Content, no intentar parsear JSON
    if (response.status === 204) {
      return null
    }

    const contentType = response.headers.get('content-type')
    if (contentType && contentType.includes('application/json')) {
      return await response.json()
    }

    return await response.text()
  } catch (error) {
    if (error instanceof ApiError) {
      throw error
    }

    // Error de red o conexión
    throw new ApiError(
      'Error de conexión con el servidor. Verifica tu conexión a internet.',
      0
    )
  }
}

export const handleApiError = (error: unknown): string => {
  if (error instanceof ApiError) {
    switch (error.status) {
      case 400:
        return 'Datos inválidos. Verifica la información ingresada.'
      case 401:
        return 'Sesión expirada. Por favor, inicia sesión nuevamente.'
      case 403:
        return 'No tienes permisos para realizar esta acción.'
      case 404:
        return 'Recurso no encontrado.'
      case 409:
        return 'Conflicto: El recurso ya existe o está en uso.'
      case 422:
        return 'Datos no válidos. Verifica los campos requeridos.'
      case 500:
        return 'Error interno del servidor. Contacta al administrador.'
      default:
        return error.message || 'Error desconocido del servidor.'
    }
  }

  if (error instanceof Error) {
    return error.message
  }

  return 'Error desconocido. Intenta nuevamente.'
}
