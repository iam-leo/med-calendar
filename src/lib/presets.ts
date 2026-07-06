import type { CategoriaPreset } from "./types";

/** Presets rápidos ofrecidos al crear un ítem. */
export const CATEGORIAS_PRESET: CategoriaPreset[] = [
  { id: "medicamento", etiqueta: "Medicamento", emoji: "💊", colorSugerido: "#2F5D53" },
  { id: "suplemento", etiqueta: "Suplemento", emoji: "🌿", colorSugerido: "#7A8F3F" },
  { id: "personalizada", etiqueta: "Etiqueta personalizada", emoji: "", colorSugerido: "#C97B5A" },
];

/** Set curado de emojis para categorías personalizadas, agrupado por tema. */
export const EMOJIS_DISPONIBLES: string[] = [
  "💊", "🌿", "💉", "🩹", "🧴", "🩺", "🫙", "🧪",
  "🍯", "🥄", "💧", "☀️", "🌙", "🔥", "❄️", "🦷",
  "👁️", "🫀", "🧠", "🦴", "🩸", "⚡", "🌸", "🍃",
];

/** Paleta de colores sugeridos para etiquetas nuevas. */
export const COLORES_DISPONIBLES: string[] = [
  "#2F5D53", // moss
  "#C97B5A", // clay
  "#3E6D9C", // azul acero
  "#8B5FA8", // ciruela
  "#B8503F", // terracota
  "#7A8F3F", // oliva
  "#C99A2E", // mostaza
  "#4A7A8C", // petróleo
  "#A85C7A", // frambuesa
  "#5B6B68", // slate
];
