# 📅 Calendario de medicamentos y suplementos

Aplicación web para registrar en un calendario mensual la toma diaria de medicamentos y suplementos, con etiquetas personalizables (emoji + color) por cada ítem.

## Stack

- **Astro 7** (última versión) + **TypeScript** (sin frameworks de UI — toda la interactividad es TypeScript vanilla en `<script>` de Astro)
- **pnpm** como gestor de paquetes
- **Tailwind CSS v4**
- **localStorage** para persistencia (no hay backend ni base de datos)

## Funcionalidad

- Agregar ítems (medicamentos/suplementos) con nombre, emoji y color propios.
- Categorías rápidas predefinidas: 💊 Medicamento, 🌿 Suplemento, o "Etiqueta personalizada" (elegís cualquier emoji del set disponible).
- Selector de color por paleta o color personalizado (`<input type="color">`).
- Calendario mensual navegable (mes anterior/siguiente, volver a "Hoy").
- Al tocar un día se abre un panel para marcar qué ítems se tomaron ese día.
- Cada día muestra las etiquetas (emoji + color) de los ítems marcados como tomados, de forma consistente en todo el calendario.
- Editar o eliminar ítems ya creados (tocando su chip en "Tus ítems").
- Todo se guarda automáticamente en `localStorage` del navegador.

## Estructura del proyecto

```
src/
├── layouts/
│   └── Layout.astro        # Layout base (fuentes, meta tags)
├── lib/
│   ├── types.ts             # Tipos: Item, Toma, EstadoApp
│   ├── storage.ts           # Lectura/escritura en localStorage
│   ├── presets.ts            # Emojis y colores disponibles
│   ├── fechas.ts              # Utilidades de fechas y grilla del mes
│   ├── color.ts               # Contraste de texto y escape de HTML
│   └── app.ts                 # Lógica principal: render + eventos
├── pages/
│   └── index.astro            # Página única con todo el markup
└── styles/
    └── global.css              # Tokens de diseño (Tailwind @theme) y componentes
```

## Comandos

| Comando           | Acción                                      |
| ------------------ | -------------------------------------------- |
| `pnpm install`      | Instala las dependencias                     |
| `pnpm dev`          | Servidor de desarrollo en `localhost:4321`   |
| `pnpm build`        | Compila el sitio a `./dist/`                 |
| `pnpm preview`      | Previsualiza el build de producción          |

## Notas de diseño

Paleta: fondo *paper* (`#F4F6F5`), texto *ink* (`#1C2624`), acento principal *moss* (`#2F5D53`) y acento secundario *clay* (`#C97B5A`). Tipografías: **Sora** (títulos), **Inter** (texto), **JetBrains Mono** (números de día). El calendario se inspira visualmente en un organizador de pastillas: celdas con bordes suaves y etiquetas en forma de cápsula.

Como no hay base de datos, los datos son locales a cada navegador/dispositivo — no hay sincronización entre dispositivos.
