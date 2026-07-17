/**
 * Tipos de datos de la aplicación.
 * Todo se persiste en localStorage (sin backend).
 */

/** Un ítem registrable: un medicamento, suplemento o categoría personalizada. */
export interface Item {
  id: string;
  /** Nombre visible, ej: "Ibuprofeno 400mg" */
  nombre: string;
  /** Emoji que representa la etiqueta, ej: "💊" */
  emoji: string;
  /** Color hexadecimal usado para la etiqueta en el calendario, ej: "#2F5D53" */
  color: string;
  creadoEn: string;
}

/** Una dosis individual dentro de una toma. */
export interface Dosis {
  id: string;
  /** Número de pastillas/unidades tomadas */
  cantidad: number;
  /** Hora en formato "HH:mm" (24h) */
  hora: string;
}

/** Registro de todas las dosis de un ítem en una fecha concreta (YYYY-MM-DD). */
export interface Toma {
  itemId: string;
  fecha: string;
  /** Lista de dosis registradas para este ítem en esta fecha */
  dosis: Dosis[];
}

export interface EstadoApp {
  items: Item[];
  tomas: Toma[];
}

/** Preset rápido al crear un ítem nuevo. */
export interface CategoriaPreset {
  id: string;
  etiqueta: string;
  emoji: string;
  colorSugerido: string;
}
