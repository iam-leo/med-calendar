import type { EstadoApp, Item, Toma } from "./types";

const CLAVE_ITEMS = "med-calendario:items";
const CLAVE_TOMAS = "med-calendario:tomas";

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
  return {
    items: leerJSON<Item[]>(CLAVE_ITEMS, []),
    tomas: leerJSON<Toma[]>(CLAVE_TOMAS, []),
  };
}

export function guardarItems(items: Item[]): void {
  escribirJSON(CLAVE_ITEMS, items);
}

export function guardarTomas(tomas: Toma[]): void {
  escribirJSON(CLAVE_TOMAS, tomas);
}

export function generarId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `id-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}
