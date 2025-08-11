/** Representa un cuatrimestre académico. */
export interface Cuatrimestre {
  cuatrimestreId: number
  /** Identificador del período: C1, C2 o C3 */
  periodo: string
  /** Año del cuatrimestre (entre 2000 y 2099) */
  anio: number
  /** Estado del cuatrimestre: AC (Activo) o IN (Inactivo) */
  estado: string
  /** Fecha de creación en formato ISO */
  fechaCreacion: string
  /** Fecha de actualización en formato ISO (opcional) */
  fechaActualizacion?: string | null
}

/** Tipos de datos para crear o editar un cuatrimestre mediante un formulario. */
export interface CuatrimestreForm {
  /** Período seleccionado (C1, C2 o C3) */
  periodo: string
  /** Año como cadena de texto para facilitar la edición en inputs */
  anio: string
  /** Estado del cuatrimestre (AC o IN) */
  estado: string
}
