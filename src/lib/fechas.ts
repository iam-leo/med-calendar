export const NOMBRES_MES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

export const NOMBRES_DIA_CORTO = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

/** Formatea una fecha local como YYYY-MM-DD sin desfases de zona horaria. */
export function aClaveFecha(fecha: Date): string {
  const y = fecha.getFullYear();
  const m = String(fecha.getMonth() + 1).padStart(2, "0");
  const d = String(fecha.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function claveHoy(): string {
  return aClaveFecha(new Date());
}

export interface CeldaDia {
  clave: string;
  numero: number;
  delMesActual: boolean;
  esHoy: boolean;
}

/**
 * Genera las celdas para una grilla de calendario mensual (semanas de lunes a domingo),
 * incluyendo días del mes anterior/siguiente para completar la primera y última semana.
 */
export function generarGrillaMes(anio: number, mesIndice: number): CeldaDia[] {
  const primerDiaDelMes = new Date(anio, mesIndice, 1);
  // getDay(): 0=domingo..6=sábado -> convertir a 0=lunes..6=domingo
  const offsetLunes = (primerDiaDelMes.getDay() + 6) % 7;

  const inicioGrilla = new Date(anio, mesIndice, 1 - offsetLunes);
  const hoy = claveHoy();

  const celdas: CeldaDia[] = [];
  for (let i = 0; i < 42; i++) {
    const fecha = new Date(inicioGrilla);
    fecha.setDate(inicioGrilla.getDate() + i);
    const clave = aClaveFecha(fecha);
    celdas.push({
      clave,
      numero: fecha.getDate(),
      delMesActual: fecha.getMonth() === mesIndice,
      esHoy: clave === hoy,
    });
  }
  // Si la última fila completa es puro mes siguiente, se puede recortar a 35 celdas (5 semanas)
  const necesitaSextaFila = celdas.slice(35).some((c) => c.delMesActual);
  return necesitaSextaFila ? celdas : celdas.slice(0, 35);
}
