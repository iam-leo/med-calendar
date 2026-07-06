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

/** Registro de que un ítem fue tomado en una fecha concreta (YYYY-MM-DD). */
export interface Toma {
  itemId: string;
  fecha: string;
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
