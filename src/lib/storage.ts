import type { Dosis, EstadoApp, Item, Toma } from "./types";

const CLAVE_ITEMS = "med-calendario:items";
const CLAVE_TOMAS = "med-calendario:tomas";
const CLAVE_TEMA = "med-calendario:tema";

function leerJSON<T>(clave: string, porDefecto: T): T {
  if (typeof localStorage === "undefined") return porDefecto;
  try {
    const crudo = localStorage.getItem(clave);
    if (!crudo) return porDefecto;
    return JSON.parse(crudo) as T;
  } catch {
    return porDefecto;
  }
}

function escribirJSON<T>(clave: string, valor: T): void {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(clave, JSON.stringify(valor));
}

export function cargarEstado(): EstadoApp {
  const items = leerJSON<Item[]>(CLAVE_ITEMS, []);
  const tomasCrudo = leerJSON<any[]>(CLAVE_TOMAS, []);

  const tomas: Toma[] = tomasCrudo.map((t) => {
    if (!t.dosis) {
      const dosis: Dosis = { id: generarId(), cantidad: 1, hora: "00:00" };
      return { itemId: t.itemId, fecha: t.fecha, dosis: [dosis] };
    }
    return t as Toma;
  });

  return { items, tomas };
}

export function guardarItems(items: Item[]): void {
  escribirJSON(CLAVE_ITEMS, items);
}

export function guardarTomas(tomas: Toma[]): void {
  escribirJSON(CLAVE_TOMAS, tomas);
}

export function cargarTema(): string {
  return leerJSON<string>(CLAVE_TEMA, "system");
}

export function guardarTema(tema: string): void {
  escribirJSON(CLAVE_TEMA, tema);
}

export function generarId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `id-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}
