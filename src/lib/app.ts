import type { Item } from "./types";
import { cargarEstado, guardarItems, guardarTomas, generarId, cargarTema, guardarTema, guardarNotas } from "./storage";
import { CATEGORIAS_PRESET, EMOJIS_DISPONIBLES, COLORES_DISPONIBLES } from "./presets";
import { NOMBRES_MES, NOMBRES_DIA_CORTO, generarGrillaMes, aClaveFecha } from "./fechas";
import { colorTextoLegible, escaparHTML } from "./color";

export function iniciarApp(): void {
  const estado = cargarEstado();

  const hoy = new Date();
  let anioVisible = hoy.getFullYear();
  let mesVisible = hoy.getMonth();

  let fechaSeleccionada: string | null = null;
  let itemEditandoId: string | null = null;
  let dosisEditandoId: string | null = null;
  let itemModalDesdeDia: string | null = null;
  let emojiSeleccionado = CATEGORIAS_PRESET[0].emoji;
  let colorSeleccionado = CATEGORIAS_PRESET[0].colorSugerido;

  // --- Referencias DOM ---
  const $ = <T extends Element>(sel: string) => document.querySelector(sel) as T;

  const mesTitulo = $<HTMLElement>("#mes-titulo");
  const grillaCalendario = $<HTMLElement>("#grilla-calendario");
  const listaItems = $<HTMLElement>("#lista-items");
  const estadoVacioItems = $<HTMLElement>("#estado-vacio-items");

  const btnMesAnterior = $<HTMLButtonElement>("#btn-mes-anterior");
  const btnMesSiguiente = $<HTMLButtonElement>("#btn-mes-siguiente");
  const btnHoy = $<HTMLButtonElement>("#btn-hoy");
  const btnAgregarItem = $<HTMLButtonElement>("#btn-agregar-item");

  const modalItem = $<HTMLElement>("#modal-item");
  const formItem = $<HTMLFormElement>("#form-item");
  const inputNombre = $<HTMLInputElement>("#item-nombre");
  const tituloModalItem = $<HTMLElement>("#modal-item-titulo");
  const contenedorPresets = $<HTMLElement>("#presets-categoria");
  const contenedorEmojis = $<HTMLElement>("#picker-emoji");
  const seccionEmoji = $<HTMLElement>("#seccion-emoji");
  const contenedorColores = $<HTMLElement>("#picker-color");
  const inputColorPersonalizado = $<HTMLInputElement>("#color-personalizado");
  const vistaPreviaTag = $<HTMLElement>("#vista-previa-tag");
  const btnEliminarItem = $<HTMLButtonElement>("#btn-eliminar-item");
  const btnCancelarItem = $<HTMLButtonElement>("#btn-cancelar-item");
  const btnCerrarModalItem = $<HTMLButtonElement>("#btn-cerrar-modal-item");

  const modalDia = $<HTMLElement>("#modal-dia");
  const diaModalTitulo = $<HTMLElement>("#dia-modal-titulo");
  const listaTomasDia = $<HTMLElement>("#lista-tomas-dia");
  const estadoVacioDia = $<HTMLElement>("#estado-vacio-dia");
  const btnCerrarModalDia = $<HTMLButtonElement>("#btn-cerrar-modal-dia");
  const btnAgregarDesdeVacio = $<HTMLButtonElement>("#btn-agregar-desde-vacio");

  const seccionEstadisticas = $<HTMLElement>("#seccion-estadisticas");
  const grillaEstadisticas = $<HTMLElement>("#grilla-estadisticas");

  // --- Referencias DOM (vista móvil) ---
  const vistaMobile = $<HTMLElement>("#vista-mobile");
  const encabezadoDiasMobile = $<HTMLElement>("#encabezado-dias-mobile");
  const miniCalendario = $<HTMLElement>("#mini-calendario");
  const detalleDiaMobile = $<HTMLElement>("#detalle-dia-mobile");
  const listaTomasMobile = $<HTMLElement>("#lista-tomas-mobile");
  const estadoVacioDiaMobile = $<HTMLElement>("#estado-vacio-dia-mobile");
  const diaMobileTitulo = $<HTMLElement>("#dia-mobile-titulo");
  const estadoSeleccionaDia = $<HTMLElement>("#estado-selecciona-dia");
  const btnDiaAnterior = $<HTMLButtonElement>("#btn-dia-anterior");
  const btnDiaSiguiente = $<HTMLButtonElement>("#btn-dia-siguiente");
  const btnAgregarDesdeVacioMobile = $<HTMLButtonElement>("#btn-agregar-desde-vacio-mobile");

  // --- Referencias DOM (selector de temas) ---
  const btnTemas = $<HTMLButtonElement>("#btn-temas");
  const popoverTemas = $<HTMLElement>("#popover-temas");

  // --- Días de la semana (encabezados) ---
  const encabezadoDias = $<HTMLElement>("#encabezado-dias");
  encabezadoDias.innerHTML = NOMBRES_DIA_CORTO.map(
    (d) => `<div class="text-center text-xs font-medium uppercase tracking-wider text-slate py-1.5 sm:py-2">${d}</div>`
  ).join("");
  encabezadoDiasMobile.innerHTML = NOMBRES_DIA_CORTO.map(
    (d) => `<div class="text-center text-[0.6rem] font-medium uppercase tracking-wider text-slate py-1">${d}</div>`
  ).join("");

  // --- Render principal ---
  function render(): void {
    mesTitulo.textContent = `${NOMBRES_MES[mesVisible]} ${anioVisible}`;
    renderGrillaCalendario();
    renderMiniCalendario();
    renderListaItems();
    renderEstadisticas();
  }

  function renderGrillaCalendario(): void {
    const celdas = generarGrillaMes(anioVisible, mesVisible);
    grillaCalendario.innerHTML = celdas
      .map((celda) => {
        const tomasDelDia = estado.tomas.filter((t) => t.fecha === celda.clave && t.dosis.length > 0);
        const tieneNota = !!(estado.notas && estado.notas[celda.clave]);
        const tagsHTML = tomasDelDia
          .map((t) => {
            const item = estado.items.find((i) => i.id === t.itemId);
            if (!item) return null;
            const totalPildoras = t.dosis.reduce((sum, d) => sum + d.cantidad, 0);
            return { item, totalPildoras };
          })
          .filter((x): x is NonNullable<typeof x> => x !== null)
          .map(({ item, totalPildoras }) => {
            const colorTexto = colorTextoLegible(item.color);
            return `<span class="tag-pill" style="background-color:${item.color};color:${colorTexto}" title="${escaparHTML(item.nombre)} — ${totalPildoras} pastilla(s)">
                <span aria-hidden="true">${item.emoji}</span><span class="truncate">${escaparHTML(item.nombre)}</span>
                ${totalPildoras > 1 ? `<span class="tag-pill__count">×${totalPildoras}</span>` : ""}
              </span>`;
          })
          .join("");

        const clasesCelda = [
          "celda-dia",
          celda.delMesActual ? "" : "celda-dia--atenuada",
          celda.esHoy ? "celda-dia--hoy" : "",
        ]
          .filter(Boolean)
          .join(" ");

        return `<button type="button" class="${clasesCelda}" data-fecha="${celda.clave}" aria-label="Ver tomas del día ${celda.numero}">
            <span class="celda-dia__numero">${celda.numero}</span>
            ${tieneNota ? '<span class="tag-pill tag-pill--nota" title="Tiene anotación" aria-label="Tiene anotación"><svg xmlns="http://www.w3.org/2000/svg" width="1.15em" height="1.15em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 22a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.704.706l3.588 3.588A2.4 2.4 0 0 1 20 8v12a2 2 0 0 1-2 2z"/><path d="M14 2v5a1 1 0 0 0 1 1h5"/><path d="M10 9H8"/><path d="M16 13H8"/><path d="M16 17H8"/></svg><span class="truncate">nota</span></span>' : ""}
            <span class="celda-dia__tags">${tagsHTML}</span>
          </button>`;
      })
      .join("");

    grillaCalendario.querySelectorAll<HTMLButtonElement>("[data-fecha]").forEach((btn) => {
      btn.addEventListener("click", () => abrirModalDia(btn.dataset.fecha!));
    });
  }

  function renderMiniCalendario(): void {
    const celdas = generarGrillaMes(anioVisible, mesVisible);
    miniCalendario.innerHTML = celdas
      .map((celda) => {
        const tieneActividad = estado.tomas.some((t) => t.fecha === celda.clave && t.dosis.length > 0);
        const tieneNota = !!(estado.notas && estado.notas[celda.clave]);
        const seleccionado = celda.clave === fechaSeleccionada;
        const clases = [
          "mini-celda",
          celda.delMesActual ? "" : "mini-celda--atenuada",
          celda.esHoy ? "mini-celda--hoy" : "",
          seleccionado ? "mini-celda--selected" : "",
        ]
          .filter(Boolean)
          .join(" ");
        return `<button type="button" class="${clases}" data-fecha="${celda.clave}" aria-label="Día ${celda.numero}">
            <span class="mini-celda__numero">${celda.numero}</span>
            ${tieneActividad ? '<span class="mini-celda__punto"></span>' : ""}
            ${tieneNota ? '<span class="mini-celda__nota"></span>' : ""}
          </button>`;
      })
      .join("");

    miniCalendario.querySelectorAll<HTMLButtonElement>("[data-fecha]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const clave = btn.dataset.fecha!;
        if (fechaSeleccionada === clave) return;
        seleccionarDiaMobile(clave);
      });
    });
  }

  function seleccionarDiaMobile(clave: string): void {
    fechaSeleccionada = clave;
    estadoSeleccionaDia.classList.add("hidden");
    detalleDiaMobile.classList.remove("hidden");
    actualizarDetalleDiaMobile();
    renderMiniCalendario();
  }

  function cerrarDetalleMobile(): void {
    fechaSeleccionada = null;
    detalleDiaMobile.classList.add("hidden");
    estadoSeleccionaDia.classList.remove("hidden");
    renderMiniCalendario();
  }

  function actualizarDetalleDiaMobile(): void {
    if (!fechaSeleccionada) return;
    const [anio, mes, dia] = fechaSeleccionada.split("-").map(Number);
    const fecha = new Date(anio, mes - 1, dia);
    diaMobileTitulo.textContent = fecha.toLocaleDateString("es-ES", {
      weekday: "long", day: "numeric", month: "long",
    });

    const hayItems = estado.items.length > 0;
    estadoVacioDiaMobile.classList.toggle("hidden", hayItems);
    if (hayItems) {
      renderListaTomasDia(listaTomasMobile);
    } else {
      listaTomasMobile.innerHTML = "";
    }
  }

  function navegarDiaMobile(direccion: -1 | 1): void {
    if (!fechaSeleccionada) return;
    const [anio, mes, dia] = fechaSeleccionada.split("-").map(Number);
    const fecha = new Date(anio, mes - 1, dia + direccion);
    const clave = aClaveFecha(fecha);
    anioVisible = fecha.getFullYear();
    mesVisible = fecha.getMonth();
    seleccionarDiaMobile(clave);
    render();
  }

  function actualizarTomasDia(): void {
    if (fechaSeleccionada) {
      renderListaTomasDia(listaTomasDia);
      actualizarDetalleDiaMobile();
    }
  }

  function renderListaItems(): void {
    estadoVacioItems.classList.toggle("hidden", estado.items.length > 0);
    listaItems.innerHTML = estado.items
      .map((item) => {
        const colorTexto = colorTextoLegible(item.color);
        return `<button type="button" class="tag-pill tag-pill--chip" style="background-color:${item.color};color:${colorTexto}" data-item-id="${item.id}" aria-label="Editar ${escaparHTML(item.nombre)}">
            <span aria-hidden="true">${item.emoji}</span><span>${escaparHTML(item.nombre)}</span>
          </button>`;
      })
      .join("");

    listaItems.querySelectorAll<HTMLButtonElement>("[data-item-id]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const item = estado.items.find((i) => i.id === btn.dataset.itemId);
        if (item) abrirModalItem(item);
      });
    });
  }

  // --- Estadísticas ---
  function renderEstadisticas(): void {
    const totalItems = estado.items.length;
    const tieneDatos = estado.tomas.some((t) => t.dosis.length > 0);

    if (totalItems === 0 || !tieneDatos) {
      seccionEstadisticas.classList.add("hidden");
      return;
    }
    seccionEstadisticas.classList.remove("hidden");

    const tomasPorFecha = new Map<string, number>();
    const itemsActivos = new Set<string>();
    let totalDosis = 0;
    let dosisMes = 0;
    const prefijoMes = `${anioVisible}-${String(mesVisible + 1).padStart(2, "0")}`;

    for (const toma of estado.tomas) {
      if (toma.dosis.length === 0) continue;
      itemsActivos.add(toma.itemId);
      const sum = toma.dosis.reduce((s, d) => s + d.cantidad, 0);
      totalDosis += sum;
      tomasPorFecha.set(toma.fecha, (tomasPorFecha.get(toma.fecha) || 0) + sum);
      if (toma.fecha.startsWith(prefijoMes)) {
        dosisMes += sum;
      }
    }

    // Racha actual: días consecutivos con dosis desde hoy hacia atrás
    let racha = 0;
    const hoy = new Date();
    for (let i = 0; ; i++) {
      const f = new Date(hoy);
      f.setDate(f.getDate() - i);
      const clave = `${f.getFullYear()}-${String(f.getMonth() + 1).padStart(2, "0")}-${String(f.getDate()).padStart(2, "0")}`;
      if (tomasPorFecha.has(clave)) {
        racha++;
      } else {
        break;
      }
    }

    // Cumplimiento del mes
    const totalDiasMes = new Date(anioVisible, mesVisible + 1, 0).getDate();
    const diasConActividad = new Set<string>();
    for (const toma of estado.tomas) {
      if (toma.dosis.length > 0 && toma.fecha.startsWith(prefijoMes)) {
        diasConActividad.add(toma.fecha);
      }
    }
    const cumplimiento = Math.round((diasConActividad.size / totalDiasMes) * 100);

    const estadisticas = [
      { label: "Racha actual", valor: `${racha} ${racha === 1 ? "día" : "días"}`, icono: "🔥" },
      { label: "Tomas del mes", valor: String(dosisMes), icono: "📅" },
      { label: "Medicamentos activos", valor: String(itemsActivos.size), icono: "🧴" },
      { label: "Cumplimiento", valor: `${cumplimiento}%`, icono: "📊" },
    ];

    grillaEstadisticas.innerHTML = estadisticas
      .map(
        (e) =>
          `<div class="stat-card">
            <span class="stat-card__icon">${e.icono}</span>
            <span class="stat-card__valor">${e.valor}</span>
            <span class="stat-card__label">${e.label}</span>
          </div>`
      )
      .join("");
  }

  // --- Modal de ítem (crear/editar) ---
  function renderPickerEmoji(): void {
    contenedorEmojis.innerHTML = EMOJIS_DISPONIBLES.map(
      (e) =>
        `<button type="button" class="picker-emoji__btn ${e === emojiSeleccionado ? "picker-emoji__btn--activo" : ""}" data-emoji="${e}" aria-label="Elegir emoji ${e}">${e}</button>`
    ).join("");
    contenedorEmojis.querySelectorAll<HTMLButtonElement>("[data-emoji]").forEach((btn) => {
      btn.addEventListener("click", () => {
        emojiSeleccionado = btn.dataset.emoji!;
        renderPickerEmoji();
        actualizarVistaPrevia();
      });
    });
  }

  function renderPickerColor(): void {
    contenedorColores.innerHTML = COLORES_DISPONIBLES.map(
      (c) =>
        `<button type="button" class="picker-color__btn ${c.toLowerCase() === colorSeleccionado.toLowerCase() ? "picker-color__btn--activo" : ""}" data-color="${c}" style="background-color:${c}" aria-label="Elegir color ${c}"></button>`
    ).join("");
    contenedorColores.querySelectorAll<HTMLButtonElement>("[data-color]").forEach((btn) => {
      btn.addEventListener("click", () => {
        colorSeleccionado = btn.dataset.color!;
        inputColorPersonalizado.value = colorSeleccionado;
        renderPickerColor();
        actualizarVistaPrevia();
      });
    });
  }

  function actualizarVistaPrevia(): void {
    const nombre = inputNombre.value.trim() || "Nombre del ítem";
    const colorTexto = colorTextoLegible(colorSeleccionado);
    vistaPreviaTag.style.backgroundColor = colorSeleccionado;
    vistaPreviaTag.style.color = colorTexto;
    vistaPreviaTag.innerHTML = `<span aria-hidden="true">${emojiSeleccionado || "🏷️"}</span><span>${escaparHTML(nombre)}</span>`;
  }

  function renderPresets(): void {
    contenedorPresets.innerHTML = CATEGORIAS_PRESET.map(
      (preset) =>
        `<button type="button" class="preset-btn" data-preset-id="${preset.id}">
          <span aria-hidden="true">${preset.emoji || "✨"}</span> ${preset.etiqueta}
        </button>`
    ).join("");

    contenedorPresets.querySelectorAll<HTMLButtonElement>("[data-preset-id]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const preset = CATEGORIAS_PRESET.find((p) => p.id === btn.dataset.presetId)!;
        const esPersonalizada = preset.id === "personalizada";
        seccionEmoji.classList.toggle("hidden", !esPersonalizada);
        if (!esPersonalizada) {
          emojiSeleccionado = preset.emoji;
        }
        colorSeleccionado = preset.colorSugerido;
        inputColorPersonalizado.value = colorSeleccionado;
        renderPickerEmoji();
        renderPickerColor();
        actualizarVistaPrevia();
      });
    });
  }

  function abrirModalItem(item?: Item): void {
    itemEditandoId = item?.id ?? null;
    tituloModalItem.textContent = item ? "Editar ítem" : "Agregar ítem";
    btnEliminarItem.classList.toggle("hidden", !item);
    inputNombre.value = item?.nombre ?? "";
    emojiSeleccionado = item?.emoji ?? CATEGORIAS_PRESET[0].emoji;
    colorSeleccionado = item?.color ?? CATEGORIAS_PRESET[0].colorSugerido;
    inputColorPersonalizado.value = colorSeleccionado;
    seccionEmoji.classList.toggle("hidden", !item);

    renderPresets();
    renderPickerEmoji();
    renderPickerColor();
    actualizarVistaPrevia();

    modalItem.classList.add("modal-overlay--open");
    inputNombre.focus();
  }

  function cerrarModalItem(): void {
    modalItem.classList.remove("modal-overlay--open");
    formItem.reset();
    itemEditandoId = null;
    if (itemModalDesdeDia) {
      const clave = itemModalDesdeDia;
      itemModalDesdeDia = null;
      if (window.innerWidth < 640) {
        seleccionarDiaMobile(clave);
      } else {
        abrirModalDia(clave);
      }
    }
  }

  formItem.addEventListener("submit", (evento) => {
    evento.preventDefault();
    const nombre = inputNombre.value.trim();
    if (!nombre) return;

    if (itemEditandoId) {
      const item = estado.items.find((i) => i.id === itemEditandoId);
      if (item) {
        item.nombre = nombre;
        item.emoji = emojiSeleccionado || "🏷️";
        item.color = colorSeleccionado;
      }
    } else {
      const nuevoItem: Item = {
        id: generarId(),
        nombre,
        emoji: emojiSeleccionado || "🏷️",
        color: colorSeleccionado,
        creadoEn: new Date().toISOString(),
      };
      estado.items.push(nuevoItem);
    }
    guardarItems(estado.items);
    cerrarModalItem();
    render();
    actualizarTomasDia();
  });

  btnEliminarItem.addEventListener("click", () => {
    if (!itemEditandoId) return;
    estado.items = estado.items.filter((i) => i.id !== itemEditandoId);
    estado.tomas = estado.tomas.filter((t) => t.itemId !== itemEditandoId);
    guardarItems(estado.items);
    guardarTomas(estado.tomas);
    cerrarModalItem();
    render();
    actualizarTomasDia();
  });

  inputNombre.addEventListener("input", actualizarVistaPrevia);
  inputColorPersonalizado.addEventListener("input", () => {
    colorSeleccionado = inputColorPersonalizado.value;
    renderPickerColor();
    actualizarVistaPrevia();
  });
  btnCancelarItem.addEventListener("click", cerrarModalItem);
  btnCerrarModalItem.addEventListener("click", cerrarModalItem);
  btnAgregarItem.addEventListener("click", () => abrirModalItem());
  modalItem.addEventListener("click", (e) => {
    if (e.target === modalItem) cerrarModalItem();
  });

  // --- Modal de día (gestión de dosis) ---
  function horaActual(): string {
    const d = new Date();
    return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  }

  function abrirModalDia(clave: string): void {
    fechaSeleccionada = clave;
    const [anio, mes, dia] = clave.split("-").map(Number);
    const fecha = new Date(anio, mes - 1, dia);
    diaModalTitulo.textContent = fecha.toLocaleDateString("es-ES", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
    renderListaTomasDia(listaTomasDia);
    modalDia.classList.add("modal-overlay--open");
  }

  function cerrarModalDia(): void {
    modalDia.classList.remove("modal-overlay--open");
    fechaSeleccionada = null;
    dosisEditandoId = null;
  }

  function renderListaTomasDia(container: HTMLElement = listaTomasDia): void {
    if (container === listaTomasDia) {
      estadoVacioDia.classList.toggle("hidden", estado.items.length > 0);
    }
    if (estado.items.length === 0) {
      container.innerHTML = "";
      return;
    }

    const [horaDef, minDef] = horaActual().split(":");
    const horas = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, "0"));
    const minutos = Array.from({ length: 12 }, (_, i) => String(i * 5).padStart(2, "0"));

    // Formulario unificado: selector de medicamento + hora + cantidad
    let html = `<div class="dosis-agregar-unificado">
      <select data-item-select class="dosis-agregar__item-select" aria-label="Seleccionar medicamento">
        <option value="">Seleccionar medicamento</option>
        ${estado.items.map(item => `<option value="${item.id}">${item.emoji} ${escaparHTML(item.nombre)}</option>`).join("")}
      </select>
      <span class="dosis-agregar__hora-select">
        <select class="dosis-agregar__horas" aria-label="Hora" disabled>
          ${horas.map(h => `<option value="${h}"${h === horaDef ? " selected" : ""}>${h}</option>`).join("")}
        </select>
        <span class="dosis-agregar__sep">:</span>
        <select class="dosis-agregar__minutos" aria-label="Minutos" disabled>
          ${minutos.map(m => `<option value="${m}"${m === minDef ? " selected" : ""}>${m}</option>`).join("")}
        </select>
      </span>
      <span class="dosis-agregar__label">Cantidad</span>
      <input type="number" class="dosis-agregar__cant" value="1" min="1" disabled />
      <button type="button" class="dosis-agregar__btn" disabled><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg></button>
    </div>`;

    // Cada ítem con sus dosis existentes (sin formulario de agregar)
    const itemsConDosis = estado.items
      .map(item => {
        const toma = estado.tomas.find((t) => t.itemId === item.id && t.fecha === fechaSeleccionada);
        const dosis = (toma?.dosis ?? []).slice().sort((a, b) => a.hora.localeCompare(b.hora));
        return { item, dosis, total: dosis.reduce((s, d) => s + d.cantidad, 0), colorTexto: colorTextoLegible(item.color) };
      })
      .filter(({ dosis }) => dosis.length > 0);

    html += itemsConDosis
      .map(({ item, dosis, total: totalPildoras, colorTexto }) => {
        let dosisHTML = `<div class="dosis-lista">${dosis
            .map((d) => {
              if (d.id === dosisEditandoId) {
                const [h, m] = d.hora.split(":");
                return `<div class="dosis-entry dosis-entry--editing" data-item-id="${item.id}" data-dosis-id="${d.id}">
                  <span class="dosis-agregar__hora-select">
                    <select class="dosis-agregar__horas" aria-label="Hora">
                      ${horas.map(opt => `<option value="${opt}"${opt === h ? " selected" : ""}>${opt}</option>`).join("")}
                    </select>
                    <span class="dosis-agregar__sep">:</span>
                    <select class="dosis-agregar__minutos" aria-label="Minutos">
                      ${minutos.map(opt => `<option value="${opt}"${opt === m ? " selected" : ""}>${opt}</option>`).join("")}
                    </select>
                  </span>
                  <input type="number" class="dosis-agregar__cant" value="${d.cantidad}" min="1" aria-label="Cantidad de pastillas" />
                  <button type="button" class="dosis-entry__guardar" data-item-id="${item.id}" data-dosis-id="${d.id}" aria-label="Guardar dosis"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg></button>
                  <button type="button" class="dosis-entry__eliminar" data-item-id="${item.id}" data-dosis-id="${d.id}" aria-label="Eliminar dosis"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg></button>
                </div>`;
              }
              return `<div class="dosis-entry" data-item-id="${item.id}" data-dosis-id="${d.id}">
                <span class="dosis-entry__hora">${escaparHTML(d.hora)}</span>
                <span class="dosis-entry__cant">${d.cantidad} ${d.cantidad === 1 ? "pastilla" : "pastillas"}</span>
                <button type="button" class="dosis-entry__eliminar" data-item-id="${item.id}" data-dosis-id="${d.id}" aria-label="Eliminar dosis de las ${d.hora}"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg></button>
              </div>`;
            })
            .join("")}</div>`;

        return `<div class="fila-toma-dosis">
            <div class="fila-toma-dosis__header">
              <div class="fila-toma-dosis__info">
                <span class="tag-pill" style="background-color:${item.color};color:${colorTexto}">
                  <span aria-hidden="true">${item.emoji}</span><span>${escaparHTML(item.nombre)}</span>
                </span>
                ${dosis.length > 0 ? `<button type="button" class="fila-toma-dosis__editar" data-item-id="${item.id}" aria-label="Editar ${escaparHTML(item.nombre)}"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z"/><path d="m15 5 4 4"/></svg></button>` : ""}
              </div>
              ${totalPildoras > 0 ? `<span class="fila-toma-dosis__total">Total: ${totalPildoras} ${totalPildoras === 1 ? "pastilla" : "pastillas"}</span>` : ""}
            </div>
            ${dosisHTML}
          </div>`;
      })
      .join("");

    // Anotación general del día (una sola, al final)
    if (fechaSeleccionada) {
      const notaDelDia = estado.notas?.[fechaSeleccionada] ?? "";
      if (notaDelDia) {
        html += `<div class="anotacion">
          <p class="anotacion__label">Anotación del día</p>
          <div class="anotacion__texto">${escaparHTML(notaDelDia)}</div>
          <div class="anotacion__acciones">
            <button type="button" class="anotacion-btn-editar" data-anotacion-editar>Editar</button>
            <button type="button" class="anotacion-btn-eliminar" data-anotacion-eliminar>Eliminar</button>
          </div>
        </div>`;
      } else {
        html += `<div class="anotacion">
          <label class="anotacion__label" for="anotacion-dia">Anotación del día (opcional)</label>
          <div class="anotacion__wrapper">
            <textarea id="anotacion-dia" class="anotacion-textarea" data-anotacion-dia maxlength="140" rows="2" placeholder="Ej: Me olvidé / No lo tenía disponible..."></textarea>
            <span class="anotacion-contador">0/140</span>
          </div>
          <button type="button" class="anotacion-btn-guardar" data-anotacion-guardar>Guardar</button>
        </div>`;
      }
    }

    container.innerHTML = html;

    // --- Event listeners ---

    // Eliminar dosis
    container.querySelectorAll<HTMLButtonElement>(".dosis-entry__eliminar").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        if (!fechaSeleccionada) return;
        eliminarDosis(btn.dataset.itemId!, fechaSeleccionada, btn.dataset.dosisId!);
      });
    });

    // Click en entry para editar inline
    container.querySelectorAll<HTMLElement>(".dosis-entry:not(.dosis-entry--editing)").forEach((entry) => {
      entry.addEventListener("click", (e) => {
        if ((e.target as HTMLElement).closest(".dosis-entry__eliminar")) return;
        const dosisId = entry.dataset.dosisId;
        if (dosisId) entrarEditarDosis(dosisId);
      });
    });

    // Guardar edición inline
    container.querySelectorAll<HTMLButtonElement>(".dosis-entry__guardar").forEach((btn) => {
      btn.addEventListener("click", () => {
        const dosisId = btn.dataset.dosisId;
        const itemId = btn.dataset.itemId;
        if (!dosisId || !itemId || !fechaSeleccionada) return;
        const entry = btn.closest(".dosis-entry")!;
        const horaSelect = entry.querySelector<HTMLSelectElement>(".dosis-agregar__horas")!;
        const minSelect = entry.querySelector<HTMLSelectElement>(".dosis-agregar__minutos")!;
        const cantInput = entry.querySelector<HTMLInputElement>(".dosis-agregar__cant")!;
        const hora = `${horaSelect.value}:${minSelect.value}`;
        const cantidad = parseInt(cantInput.value, 10) || 1;
        guardarDosisEditada(itemId, fechaSeleccionada, dosisId, cantidad, hora);
      });
    });

    // Editar ítem (✎)
    container.querySelectorAll<HTMLButtonElement>(".fila-toma-dosis__editar").forEach((btn) => {
      btn.addEventListener("click", () => {
        const item = estado.items.find((i) => i.id === btn.dataset.itemId);
        if (!item) return;
        itemModalDesdeDia = fechaSeleccionada;
        cerrarModalDia();
        abrirModalItem(item);
      });
    });

    // Formulario unificado: seleccionar medicamento habilita el resto
    const itemSelect = container.querySelector<HTMLSelectElement>("[data-item-select]");
    const formHoras = container.querySelector<HTMLSelectElement>(".dosis-agregar-unificado .dosis-agregar__horas");
    const formMinutos = container.querySelector<HTMLSelectElement>(".dosis-agregar-unificado .dosis-agregar__minutos");
    const formCant = container.querySelector<HTMLInputElement>(".dosis-agregar-unificado .dosis-agregar__cant");
    const formBtn = container.querySelector<HTMLButtonElement>(".dosis-agregar-unificado .dosis-agregar__btn");
    const unificado = container.querySelector<HTMLElement>(".dosis-agregar-unificado");

    function habilitarForm(habilitado: boolean): void {
      if (formHoras) formHoras.disabled = !habilitado;
      if (formMinutos) formMinutos.disabled = !habilitado;
      if (formCant) formCant.disabled = !habilitado;
      if (formBtn) formBtn.disabled = !habilitado;
    }

    if (itemSelect && unificado) {
      itemSelect.addEventListener("change", () => {
        habilitarForm(itemSelect.value !== "");
      });

      // Botón +
      const btnUnificado = unificado.querySelector<HTMLButtonElement>(".dosis-agregar__btn");
      if (btnUnificado) {
        btnUnificado.addEventListener("click", () => {
          if (!fechaSeleccionada || !itemSelect.value) return;
          const horaSelect = unificado.querySelector<HTMLSelectElement>(".dosis-agregar__horas")!;
          const minSelect = unificado.querySelector<HTMLSelectElement>(".dosis-agregar__minutos")!;
          const cantInput = unificado.querySelector<HTMLInputElement>(".dosis-agregar__cant")!;
          if (!horaSelect.value || !minSelect.value) return;
          agregarDosis(itemSelect.value, fechaSeleccionada, parseInt(cantInput.value, 10) || 1, `${horaSelect.value}:${minSelect.value}`);
        });
      }

      // Enter en cantidad
      const cantInput = unificado.querySelector<HTMLInputElement>(".dosis-agregar__cant");
      if (cantInput) {
        cantInput.addEventListener("keydown", (e: KeyboardEvent) => {
          if (e.key === "Enter" && itemSelect.value !== "") {
            e.preventDefault();
            if (btnUnificado) btnUnificado.click();
          }
        });
      }
    }

    // --- Anotación del día: contador + guardar + editar ---
    const textareaNota = container.querySelector<HTMLTextAreaElement>("[data-anotacion-dia]");
    const btnGuardarNota = container.querySelector<HTMLButtonElement>("[data-anotacion-guardar]");
    if (textareaNota && btnGuardarNota) {
      textareaNota.addEventListener("input", () => {
        const valor = textareaNota.value;
        const contador = textareaNota.closest(".anotacion__wrapper")?.querySelector<HTMLSpanElement>(".anotacion-contador");
        if (contador) {
          contador.textContent = `${valor.length}/140`;
          contador.className = `anotacion-contador ${valor.length > 112 ? (valor.length >= 140 ? "anotacion-contador--rojo" : "anotacion-contador--naranja") : ""}`;
        }
      });
      btnGuardarNota.addEventListener("click", () => {
        if (!fechaSeleccionada) return;
        const valor = textareaNota.value.trim();
        if (!estado.notas) estado.notas = {};
        if (valor) {
          estado.notas[fechaSeleccionada] = valor;
        } else {
          delete estado.notas[fechaSeleccionada];
        }
        guardarNotas(estado.notas);
        renderGrillaCalendario();
        renderMiniCalendario();
        actualizarTomasDia();
      });
    }
    container.querySelectorAll<HTMLButtonElement>("[data-anotacion-editar]").forEach((btn) => {
      btn.addEventListener("click", () => {
        if (!fechaSeleccionada) return;
        const valor = estado.notas?.[fechaSeleccionada] ?? "";
        delete estado.notas?.[fechaSeleccionada];
        guardarNotas(estado.notas ?? {});
        actualizarTomasDia();
        // Pre-llenar el textarea con el valor anterior
        const textarea = container.querySelector<HTMLTextAreaElement>("[data-anotacion-dia]");
        if (textarea && valor) {
          textarea.value = valor;
          textarea.dispatchEvent(new Event("input"));
        }
      });
    });

    // Eliminar nota con confirmación
    container.querySelectorAll<HTMLButtonElement>("[data-anotacion-eliminar]").forEach((btn) => {
      btn.addEventListener("click", () => {
        if (!fechaSeleccionada) return;
        const accionDiv = btn.closest(".anotacion__acciones");
        if (!accionDiv) return;
        accionDiv.innerHTML = `<span class="anotacion-confirmar-texto">¿Eliminar nota?</span>
          <div class="anotacion-confirmar-botones">
            <button type="button" class="anotacion-btn-confirmar" data-anotacion-confirmar-eliminar>Sí</button>
            <button type="button" class="anotacion-btn-cancelar" data-anotacion-cancelar-eliminar>Cancelar</button>
          </div>`;
        accionDiv.querySelector<HTMLButtonElement>("[data-anotacion-cancelar-eliminar]")!.addEventListener("click", () => {
          actualizarTomasDia();
        });
        accionDiv.querySelector<HTMLButtonElement>("[data-anotacion-confirmar-eliminar]")!.addEventListener("click", () => {
          if (!fechaSeleccionada) return;
          delete estado.notas?.[fechaSeleccionada];
          guardarNotas(estado.notas ?? {});
          renderGrillaCalendario();
          renderMiniCalendario();
          actualizarTomasDia();
        });
      });
    });

    // Enter en inline editing
    const manejarEnterEditar = (el: HTMLElement) => {
      el.addEventListener("keydown", (e: KeyboardEvent) => {
        if (e.key === "Enter") {
          e.preventDefault();
          const entry = el.closest(".dosis-entry--editing") as HTMLElement;
          if (!entry) return;
          const guardarBtn = entry.querySelector<HTMLButtonElement>(".dosis-entry__guardar");
          if (guardarBtn) guardarBtn.click();
        }
      });
    };
    container.querySelectorAll<HTMLElement>(".dosis-entry--editing .dosis-agregar__horas, .dosis-entry--editing .dosis-agregar__minutos, .dosis-entry--editing .dosis-agregar__cant").forEach(manejarEnterEditar);
  }

  function agregarDosis(itemId: string, fecha: string, cantidad: number, hora: string): void {
    let toma = estado.tomas.find((t) => t.itemId === itemId && t.fecha === fecha);
    if (!toma) {
      toma = { itemId, fecha, dosis: [] };
      estado.tomas.push(toma);
    }
    toma.dosis.push({ id: generarId(), cantidad, hora });
    guardarTomas(estado.tomas);
    renderGrillaCalendario();
    renderMiniCalendario();
    renderEstadisticas();
    actualizarTomasDia();
  }

  function eliminarDosis(itemId: string, fecha: string, dosisId: string): void {
    const tomaIdx = estado.tomas.findIndex((t) => t.itemId === itemId && t.fecha === fecha);
    if (tomaIdx === -1) return;
    estado.tomas[tomaIdx].dosis = estado.tomas[tomaIdx].dosis.filter((d) => d.id !== dosisId);
    if (estado.tomas[tomaIdx].dosis.length === 0) {
      estado.tomas.splice(tomaIdx, 1);
    }
    guardarTomas(estado.tomas);
    renderGrillaCalendario();
    renderMiniCalendario();
    renderEstadisticas();
    actualizarTomasDia();
  }

  function entrarEditarDosis(dosisId: string): void {
    dosisEditandoId = dosisId;
    actualizarTomasDia();
  }

  function guardarDosisEditada(itemId: string, fecha: string, dosisId: string, cantidad: number, hora: string): void {
    const toma = estado.tomas.find((t) => t.itemId === itemId && t.fecha === fecha);
    if (!toma) return;
    const dosis = toma.dosis.find((d) => d.id === dosisId);
    if (!dosis) return;
    dosis.cantidad = cantidad;
    dosis.hora = hora;
    guardarTomas(estado.tomas);
    dosisEditandoId = null;
    renderGrillaCalendario();
    renderMiniCalendario();
    renderEstadisticas();
    actualizarTomasDia();
  }

  btnCerrarModalDia.addEventListener("click", cerrarModalDia);
  modalDia.addEventListener("click", (e) => {
    if (e.target === modalDia) cerrarModalDia();
  });

  btnAgregarDesdeVacio.addEventListener("click", () => {
    itemModalDesdeDia = fechaSeleccionada;
    cerrarModalDia();
    abrirModalItem();
  });

  btnAgregarDesdeVacioMobile.addEventListener("click", () => {
    itemModalDesdeDia = fechaSeleccionada;
    cerrarDetalleMobile();
    abrirModalItem();
  });

  btnDiaAnterior.addEventListener("click", () => navegarDiaMobile(-1));
  btnDiaSiguiente.addEventListener("click", () => navegarDiaMobile(1));

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      if (itemModalDesdeDia) {
        cerrarModalItem();
      } else {
        cerrarModalDia();
        cerrarModalItem();
      }
    }
  });

  // Reset views when switching between mobile and desktop
  const mql = window.matchMedia("(min-width: 640px)");
  mql.addEventListener("change", (ev) => {
    if (ev.matches) {
      cerrarDetalleMobile();
    } else {
      cerrarModalDia();
      dosisEditandoId = null;
    }
  });

  // --- Navegación de mes ---
  btnMesAnterior.addEventListener("click", () => {
    mesVisible -= 1;
    if (mesVisible < 0) {
      mesVisible = 11;
      anioVisible -= 1;
    }
    render();
  });

  btnMesSiguiente.addEventListener("click", () => {
    mesVisible += 1;
    if (mesVisible > 11) {
      mesVisible = 0;
      anioVisible += 1;
    }
    render();
  });

  btnHoy.addEventListener("click", () => {
    anioVisible = hoy.getFullYear();
    mesVisible = hoy.getMonth();
    render();
  });

  // --- Selector de temas ---
  const TEMAS = [
    { id: "light", label: "Claro", dot: "#2f5d53" },
    { id: "midnight", label: "Medianoche", dot: "#a78bfa" },
    { id: "ocean", label: "Océano", dot: "#22d3ee" },
    { id: "ruby", label: "Rubí", dot: "#f43f5e" },
    { id: "amber", label: "Ámbar", dot: "#f59e0b" },
    { id: "plum", label: "Ciruela", dot: "#fb7185" },
  ];

  let temaActivo = cargarTema() || "light";

  function aplicarTema(tema: string): void {
    temaActivo = tema;
    if (tema === "light") {
      document.documentElement.removeAttribute("data-theme");
    } else {
      document.documentElement.setAttribute("data-theme", tema);
    }
    guardarTema(tema);
    renderPopoverTemas();
  }

  function renderPopoverTemas(): void {
    popoverTemas.innerHTML = TEMAS.map(
      (t) => `<button type="button" class="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-ink transition hover:bg-paper-alt" data-tema="${t.id}">
        <span class="flex h-5 w-5 shrink-0 items-center justify-center rounded-full" style="background-color:${t.dot}${temaActivo === t.id ? ";box-shadow:0 0 0 2px var(--color-ink)" : ""}">${temaActivo === t.id ? '<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" class="text-white"><path d="M20 6 9 17l-5-5"/></svg>' : ""}</span>
        <span>${t.label}</span>
        ${t.id !== "light" ? '<span class="ml-auto text-[0.6rem] text-slate">◆</span>' : ""}
      </button>`
    ).join("");

    popoverTemas.querySelectorAll<HTMLButtonElement>("[data-tema]").forEach((btn) => {
      btn.addEventListener("click", () => {
        aplicarTema(btn.dataset.tema!);
        cerrarPopoverTemas();
      });
    });
  }

  function abrirPopoverTemas(): void {
    popoverTemas.classList.remove("hidden");
  }

  function cerrarPopoverTemas(): void {
    popoverTemas.classList.add("hidden");
  }

  btnTemas.addEventListener("click", (e) => {
    e.stopPropagation();
    popoverTemas.classList.contains("hidden") ? abrirPopoverTemas() : cerrarPopoverTemas();
  });

  document.addEventListener("click", (e) => {
    if (!popoverTemas.classList.contains("hidden") && !btnTemas.contains(e.target as Node) && !popoverTemas.contains(e.target as Node)) {
      cerrarPopoverTemas();
    }
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") cerrarPopoverTemas();
  });

  aplicarTema(temaActivo);

  render();
}
