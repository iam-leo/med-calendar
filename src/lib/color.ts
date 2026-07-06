/** Decide si el texto sobre un color de fondo debe ser claro u oscuro, según luminancia. */
export function colorTextoLegible(hex: string): "#F4F6F5" | "#1C2624" {
  const limpio = hex.replace("#", "");
  if (limpio.length !== 6) return "#1C2624";
  const r = parseInt(limpio.slice(0, 2), 16) / 255;
  const g = parseInt(limpio.slice(2, 4), 16) / 255;
  const b = parseInt(limpio.slice(4, 6), 16) / 255;
  const luminancia = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return luminancia > 0.6 ? "#1C2624" : "#F4F6F5";
}

export function escaparHTML(texto: string): string {
  const div = document.createElement("div");
  div.textContent = texto;
  return div.innerHTML;
}
