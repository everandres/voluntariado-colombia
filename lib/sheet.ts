import Papa from "papaparse";

export const SHEET_ID = "1-hMGwC0XaSu5ddZ896gYyVRpmbPkVYg3NJ_6rSxK4Y8";

export type SheetTab = { name: string; gid: string };

/**
 * Hojas conocidas del documento. Se usan como fallback y para el render
 * inicial; `/api/sheets` intenta descubrirlas en vivo desde el propio Sheet
 * por si agregan pestañas nuevas.
 */
export const SHEET_TABS: SheetTab[] = [
  { name: "VOLUNTARIADO BOGOTÁ", gid: "0" },
  { name: "DONACIONES BOGOTÁ", gid: "1994734491" },
  { name: "VOLUNTARIADO NACIONAL", gid: "986235580" },
];

export const DEFAULT_GID = SHEET_TABS[0].gid;

export function buildCsvUrl(gid: string, sheetId = SHEET_ID) {
  return `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv&gid=${gid}`;
}

/** Los gids se interpolan en una URL: solo aceptamos dígitos. */
export function isValidGid(gid: string) {
  return /^\d+$/.test(gid);
}

export type SheetRow = Record<string, string>;

/**
 * Alias exactos, solo para lo que la heurística de abajo no puede deducir.
 * Todo lo demás (texto de UI pegado al encabezado) se limpia por patrón.
 */
const HEADER_ALIASES: Record<string, string> = {
  "SE NECESITAN VOLUNTARIOS YA": "SE NECESITAN VOLUNTARIOS",
  x: "DETALLES",
};

/**
 * En el Sheet hay enlaces y notas flotantes puestos encima de la fila de
 * encabezados ("Míralo aquí", "Pregunta haciendo click aquí", "También puedes
 * ver esta información en un mapa"). Al exportar a CSV se pegan al nombre de la
 * columna que tengan debajo, y se MUEVEN de columna cuando alguien edita el
 * documento — por eso no sirve un mapa de encabezados exactos.
 *
 * Los nombres reales van en MAYÚSCULAS y el ruido en Sentence case, así que nos
 * quedamos con el tramo final en mayúsculas. Lo que no encaje se devuelve tal
 * cual y lo filtra isJunkHeader.
 */
const UPPERCASE_TAIL = /([A-ZÁÉÍÓÚÜÑ][A-ZÁÉÍÓÚÜÑ0-9 ]*)$/;

function cleanHeader(raw: string) {
  const trimmed = raw.trim().replace(/\s+/g, " ");

  const alias = HEADER_ALIASES[trimmed];
  if (alias) return alias;

  return UPPERCASE_TAIL.exec(trimmed)?.[1].trim() ?? trimmed;
}

/**
 * Compara nombres de columna ignorando acentos y mayúsculas, para que el código
 * no dependa de cómo esté escrito el encabezado en el Sheet ese día.
 */
export function isColumn(column: string, name: string) {
  const fold = (text: string) =>
    text
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "") // marcas de acento
      .trim()
      .toUpperCase();

  return fold(column) === fold(name);
}

/** Columnas que no son datos: sin nombre, placeholders o notas sueltas. */
function isJunkHeader(name: string) {
  return (
    name.length === 0 ||
    /^Columna \d+$/i.test(name) ||
    /^https?:\/\//i.test(name) ||
    name.endsWith(":")
  );
}

/**
 * Cada hoja tiene su propio esquema y arrastra columnas fantasma (headers
 * vacíos, notas del autor puestas como encabezado). Parseamos sin
 * `header: true` — que colapsaría todas las columnas sin nombre en una sola
 * clave — y descartamos las que no son datos.
 */
export function parseSheetCsv(csvText: string): {
  columns: string[];
  rows: SheetRow[];
} {
  const { data } = Papa.parse<string[]>(csvText, { skipEmptyLines: true });

  const headerRow = data[0] ?? [];
  const named = headerRow
    .map((raw, index) => ({ index, name: cleanHeader(raw) }))
    .filter(({ name }) => !isJunkHeader(name));

  const columns = named.map(({ name }) => name);

  const rows = data
    .slice(1)
    .map((cells) => {
      const row: SheetRow = {};
      for (const { index, name } of named) {
        row[name] = (cells[index] ?? "").trim();
      }
      return row;
    })
    .filter((row) => columns.some((col) => row[col] !== ""));

  return { columns, rows };
}

/**
 * Descubre las pestañas leyendo el HTML público del Sheet (`htmlview`), donde
 * Google inyecta `items.push({name: "...", ..., gid: "..."})` por hoja. Es
 * scraping, así que ante cualquier cambio de formato cae al listado estático.
 */
export function parseSheetTabs(html: string): SheetTab[] {
  const found: SheetTab[] = [];
  const re = /items\.push\(\{name: "(.*?)"[\s\S]*?gid: "(\d+)"/g;

  for (const match of html.matchAll(re)) {
    found.push({ name: match[1].trim(), gid: match[2] });
  }

  return found.length > 0 ? found : SHEET_TABS;
}
