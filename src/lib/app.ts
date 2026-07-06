import type { Item } from "./types";
import { cargarEstado, guardarItems, guardarTomas, generarId } from "./storage";
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

  // --- Días de la semana (encabezado) ---
  const encabezadoDias = $<HTMLElement>("#encabezado-dias");
  encabezadoDias.innerHTML = NOMBRES_DIA_CORTO.map(
    (d) => `<div class="text-center text-xs font-medium uppercase tracking-wider text-slate py-2">${d}</div>`
  ).join("");

  // --- Render principal ---
  function render(): void {
    mesTitulo.textContent = `${NOMBRES_MES[mesVisible]} ${anioVisible}`;
    renderGrillaCalendario();
    renderListaItems();
  }

  function renderGrillaCalendario(): void {
    const celdas = generarGrillaMes(anioVisible, mesVisible);
    grillaCalendario.innerHTML = celdas
      .map((celda) => {
        const tomasDelDia = estado.tomas.filter((t) => t.fecha === celda.clave);
        const tagsHTML = tomasDelDia
          .map((t) => estado.items.find((i) => i.id === t.itemId))
          .filter((item): item is Item => Boolean(item))
          .map((item) => {
            const colorTexto = colorTextoLegible(item.color);
            return `<span class="tag-pill" style="background-color:${item.color};color:${colorTexto}" title="${escaparHTML(item.nombre)}">
                <span aria-hidden="true">${item.emoji}</span><span class="truncate">${escaparHTML(item.nombre)}</span>
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

        return `<button type="button" class="${clasesCelda}" data-fecha="${celda.clave}" aria-label="Ver toma del día ${celda.numero}">
            <span class="celda-dia__numero">${celda.numero}</span>
            <span class="celda-dia__tags">${tagsHTML}</span>
          </button>`;
      })
      .join("");

    grillaCalendario.querySelectorAll<HTMLButtonElement>("[data-fecha]").forEach((btn) => {
      btn.addEventListener("click", () => abrirModalDia(btn.dataset.fecha!));
    });
  }

  function renderListaItems(): void {
    estadoVacioItems.classList.toggle("hidden", estado.items.length > 0);
    listaItems.innerHTML = estado.items
      .map((item) => {
        const colorTexto = colorTextoLegible(item.color);
        return `<button type="button" class="tag-pill tag-pill--chip" style="background-color:${item.color};color:${colorTexto}" data-item-id="${item.id}">
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

    modalItem.classList.remove("hidden");
    inputNombre.focus();
  }

  function cerrarModalItem(): void {
    modalItem.classList.add("hidden");
    formItem.reset();
    itemEditandoId = null;
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
  });

  btnEliminarItem.addEventListener("click", () => {
    if (!itemEditandoId) return;
    estado.items = estado.items.filter((i) => i.id !== itemEditandoId);
    estado.tomas = estado.tomas.filter((t) => t.itemId !== itemEditandoId);
    guardarItems(estado.items);
    guardarTomas(estado.tomas);
    cerrarModalItem();
    render();
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

  // --- Modal de día (marcar tomas) ---
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
    renderListaTomasDia();
    modalDia.classList.remove("hidden");
  }

  function cerrarModalDia(): void {
    modalDia.classList.add("hidden");
    fechaSeleccionada = null;
  }

  function renderListaTomasDia(): void {
    estadoVacioDia.classList.toggle("hidden", estado.items.length > 0);
    if (estado.items.length === 0) {
      listaTomasDia.innerHTML = "";
      return;
    }
    listaTomasDia.innerHTML = estado.items
      .map((item) => {
        const tomado = estado.tomas.some((t) => t.itemId === item.id && t.fecha === fechaSeleccionada);
        return `<label class="fila-toma">
            <input type="checkbox" class="fila-toma__check" data-item-id="${item.id}" ${tomado ? "checked" : ""} />
            <span class="tag-pill" style="background-color:${item.color};color:${colorTextoLegible(item.color)}">
              <span aria-hidden="true">${item.emoji}</span><span>${escaparHTML(item.nombre)}</span>
            </span>
          </label>`;
      })
      .join("");

    listaTomasDia.querySelectorAll<HTMLInputElement>("[data-item-id]").forEach((chk) => {
      chk.addEventListener("change", () => {
        if (!fechaSeleccionada) return;
        toggleToma(chk.dataset.itemId!, fechaSeleccionada, chk.checked);
      });
    });
  }

  function toggleToma(itemId: string, fecha: string, tomado: boolean): void {
    if (tomado) {
      estado.tomas.push({ itemId, fecha });
    } else {
      estado.tomas = estado.tomas.filter((t) => !(t.itemId === itemId && t.fecha === fecha));
    }
    guardarTomas(estado.tomas);
    renderGrillaCalendario();
  }

  btnCerrarModalDia.addEventListener("click", cerrarModalDia);
  modalDia.addEventListener("click", (e) => {
    if (e.target === modalDia) cerrarModalDia();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      cerrarModalDia();
      cerrarModalItem();
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

  render();
}
