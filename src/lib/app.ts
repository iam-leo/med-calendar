import type { Item } from "./types";
import { cargarEstado, guardarItems, guardarTomas, generarId, cargarTema, guardarTema } from "./storage";
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
  const btnToggleTema = $<HTMLButtonElement>("#btn-toggle-tema");
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
            return `<span class="tag-pill" style="background-color:${item.color};color:${colorTexto}" title="${escaparHTML(item.nombre)} — ${totalPildoras} píldora(s)">
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

    container.innerHTML = estado.items
      .map((item) => {
        const toma = estado.tomas.find((t) => t.itemId === item.id && t.fecha === fechaSeleccionada);
        const dosis = (toma?.dosis ?? []).slice().sort((a, b) => a.hora.localeCompare(b.hora));
        const totalPildoras = dosis.reduce((sum, d) => sum + d.cantidad, 0);
        const colorTexto = colorTextoLegible(item.color);

        let dosisHTML = "";
        if (dosis.length > 0) {
          dosisHTML = `<div class="dosis-lista">${dosis
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
                  <input type="number" class="dosis-agregar__cant" value="${d.cantidad}" min="1" aria-label="Cantidad de píldoras" />
                  <button type="button" class="dosis-entry__guardar" data-item-id="${item.id}" data-dosis-id="${d.id}" aria-label="Guardar dosis">✓</button>
                  <button type="button" class="dosis-entry__eliminar" data-item-id="${item.id}" data-dosis-id="${d.id}" aria-label="Eliminar dosis">✕</button>
                </div>`;
              }
              return `<div class="dosis-entry" data-item-id="${item.id}" data-dosis-id="${d.id}">
                <span class="dosis-entry__hora">${escaparHTML(d.hora)}</span>
                <span class="dosis-entry__cant">${d.cantidad} ${d.cantidad === 1 ? "píldora" : "píldoras"}</span>
                <button type="button" class="dosis-entry__eliminar" data-item-id="${item.id}" data-dosis-id="${d.id}" aria-label="Eliminar dosis de las ${d.hora}">✕</button>
              </div>`;
            })
            .join("")}</div>`;
        }

        return `<div class="fila-toma-dosis">
            <div class="fila-toma-dosis__header">
              <div class="fila-toma-dosis__info">
                <span class="tag-pill" style="background-color:${item.color};color:${colorTexto}">
                  <span aria-hidden="true">${item.emoji}</span><span>${escaparHTML(item.nombre)}</span>
                </span>
                <button type="button" class="fila-toma-dosis__editar" data-item-id="${item.id}" aria-label="Editar ${escaparHTML(item.nombre)}">✎</button>
              </div>
              ${totalPildoras > 0 ? `<span class="fila-toma-dosis__total">Total: ${totalPildoras} ${totalPildoras === 1 ? "píldora" : "píldoras"}</span>` : ""}
            </div>
            ${dosisHTML}
            <div class="dosis-agregar">
              <span class="dosis-agregar__hora-select">
                <select class="dosis-agregar__horas" data-item-id="${item.id}" aria-label="Hora">
                  ${horas.map(h => `<option value="${h}"${h === horaDef ? " selected" : ""}>${h}</option>`).join("")}
                </select>
                <span class="dosis-agregar__sep">:</span>
                <select class="dosis-agregar__minutos" data-item-id="${item.id}" aria-label="Minutos">
                  ${minutos.map(m => `<option value="${m}"${m === minDef ? " selected" : ""}>${m}</option>`).join("")}
                </select>
              </span>
              <input type="number" class="dosis-agregar__cant" value="1" min="1" data-item-id="${item.id}" aria-label="Cantidad de píldoras" />
              <button type="button" class="dosis-agregar__btn" data-item-id="${item.id}" aria-label="Agregar dosis">+</button>
            </div>
          </div>`;
      })
      .join("");

    container.querySelectorAll<HTMLButtonElement>(".dosis-entry__eliminar").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        if (!fechaSeleccionada) return;
        eliminarDosis(btn.dataset.itemId!, fechaSeleccionada, btn.dataset.dosisId!);
      });
    });

    container.querySelectorAll<HTMLElement>(".dosis-entry:not(.dosis-entry--editing)").forEach((entry) => {
      entry.addEventListener("click", (e) => {
        if ((e.target as HTMLElement).closest(".dosis-entry__eliminar")) return;
        const dosisId = entry.dataset.dosisId;
        if (dosisId) entrarEditarDosis(dosisId);
      });
    });

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

    container.querySelectorAll<HTMLButtonElement>(".fila-toma-dosis__editar").forEach((btn) => {
      btn.addEventListener("click", () => {
        const item = estado.items.find((i) => i.id === btn.dataset.itemId);
        if (!item) return;
        itemModalDesdeDia = fechaSeleccionada;
        cerrarModalDia();
        abrirModalItem(item);
      });
    });

    container.querySelectorAll<HTMLButtonElement>(".dosis-agregar__btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        if (!fechaSeleccionada) return;
        const itemId = btn.dataset.itemId!;
        const container = btn.closest(".dosis-agregar")!;
        const horaSelect = container.querySelector<HTMLSelectElement>(".dosis-agregar__horas")!;
        const minSelect = container.querySelector<HTMLSelectElement>(".dosis-agregar__minutos")!;
        const cantInput = container.querySelector<HTMLInputElement>(".dosis-agregar__cant")!;
        const hora = `${horaSelect.value}:${minSelect.value}`;
        const cantidad = parseInt(cantInput.value, 10) || 1;
        if (!horaSelect.value || !minSelect.value) return;
        agregarDosis(itemId, fechaSeleccionada, cantidad, hora);
      });
    });

    const manejarEnter = (sel: HTMLSelectElement | HTMLInputElement) => {
      if (!fechaSeleccionada) return;
      sel.addEventListener("keydown", (e: KeyboardEvent) => {
        if (e.key === "Enter") {
          e.preventDefault();
          const itemId = sel.dataset.itemId!;
          const container = sel.closest(".dosis-agregar")!;
          const horaSelect = container.querySelector<HTMLSelectElement>(".dosis-agregar__horas")!;
          const minSelect = container.querySelector<HTMLSelectElement>(".dosis-agregar__minutos")!;
          const cantInput = container.querySelector<HTMLInputElement>(".dosis-agregar__cant")!;
          const hora = `${horaSelect.value}:${minSelect.value}`;
          const cantidad = parseInt(cantInput.value, 10) || 1;
          if (!horaSelect.value || !minSelect.value) return;
          agregarDosis(itemId, fechaSeleccionada, cantidad, hora);
        }
      });
    };
    container.querySelectorAll<HTMLSelectElement>(".dosis-agregar__horas, .dosis-agregar__minutos").forEach(manejarEnter);
    container.querySelectorAll<HTMLInputElement>(".dosis-agregar__cant").forEach(manejarEnter);

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

  // --- Tema (dark/light) ---
  function aplicarTema(tema: string): void {
    if (tema === "dark") {
      document.documentElement.setAttribute("data-theme", "dark");
      btnToggleTema.setAttribute("aria-pressed", "true");
    } else {
      document.documentElement.removeAttribute("data-theme");
      btnToggleTema.setAttribute("aria-pressed", "false");
    }
  }

  btnToggleTema.addEventListener("click", () => {
    const actual = document.documentElement.getAttribute("data-theme");
    const nuevo = actual === "dark" ? "light" : "dark";
    aplicarTema(nuevo);
    guardarTema(nuevo);
  });

  const temaGuardado = cargarTema();
  if (temaGuardado === "dark") {
    aplicarTema("dark");
  } else if (temaGuardado === "light") {
    aplicarTema("light");
  }

  render();
}
