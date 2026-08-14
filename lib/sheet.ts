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

/** Texto comparable: sin acentos, en mayúsculas y con espacios colapsados. */
function normalizeText(text: string) {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // marcas de acento
    .replace(/\s+/g, " ")
    .trim()
    .toUpperCase();
}

/**
 * Catálogo de columnas conocidas. En vez de recortar el ruido del encabezado
 * —que unas veces va delante del nombre, otras detrás y otras a ambos lados—
 * buscamos la palabra clave donde sea que esté y devolvemos SIEMPRE el mismo
 * nombre canónico. Así la etiqueta que ve la gente no depende de lo que
 * alguien escriba alrededor.
 */
const KNOWN_COLUMNS: Array<{ canonical: string; pattern: RegExp }> = [
  { canonical: "LUGAR", pattern: /LUGAR/ },
  { canonical: "DIRECCIÓN", pattern: /DIRECCION/ },
  { canonical: "HORA DE ACTUALIZACIÓN", pattern: /HORA DE ACTUALIZACION/ },
  { canonical: "HORARIOS", pattern: /HORARIO/ },
  { canonical: "NOTAS", pattern: /NOTAS/ },
  { canonical: "LINK DE INSCRIPCIÓN", pattern: /INSCRIPCION/ },
  { canonical: "GRUPO DE WHATSAPP", pattern: /WHATSAPP|GRUPO DE WA\b/ },
  { canonical: "INSTAGRAM", pattern: /INSTAGRAM/ },
  { canonical: "CONTACTO CLAVE", pattern: /CONTACTO/ },
  { canonical: "FUNCIONES VOLUNTARIOS", pattern: /FUNCIONES/ },
  { canonical: "¿QUÉ INSUMOS NECESITAN?", pattern: /INSUMOS/ },
  // "SE NECESITAN VOLUNTARIOS SI" y "… YA" son la misma columna.
  { canonical: "SE NECESITAN VOLUNTARIOS", pattern: /SE NECESITAN VOLUNTARIOS/ },
  { canonical: "SE NECESITAN DONACIONES", pattern: /SE NECESITAN DONACIONES/ },
];

/** Alias exactos para encabezados sin ninguna palabra reconocible. */
const HEADER_ALIASES: Record<string, string> = {
  X: "DETALLES",
};

/**
 * Último recurso para encabezados que no están en el catálogo: si el ruido va
 * delante del nombre ("Míralo aquí DIRECCIÓN"), el nombre real es el tramo
 * final en mayúsculas. Lo que tampoco encaje se devuelve tal cual y lo filtra
 * isJunkHeader.
 */
const UPPERCASE_TAIL = /([A-ZÁÉÍÓÚÜÑ][A-ZÁÉÍÓÚÜÑ0-9 ]*)$/;

/** Tramos entre "¿" y "?": son preguntas de la interfaz, no nombres de columna. */
function questionRanges(text: string) {
  const ranges: Array<[number, number]> = [];
  const re = /¿[^?]*\?/g;
  for (const match of text.matchAll(re)) {
    ranges.push([match.index, match.index + match[0].length]);
  }
  return ranges;
}

/** Candidatos de un encabezado, del más al menos probable. */
function candidatesFor(normalized: string) {
  const questions = questionRanges(normalized);

  return KNOWN_COLUMNS.flatMap(({ canonical, pattern }) => {
    const at = normalized.search(pattern);
    if (at === -1) return [];
    const inQuestion = questions.some(([from, to]) => at >= from && at < to);
    return [{ canonical, at, inQuestion }];
  }).sort(
    (a, b) => Number(a.inQuestion) - Number(b.inQuestion) || a.at - b.at,
  );
}

/** Encabezado que no reconocemos: lo dejamos lo más limpio posible. */
function fallbackHeader(trimmed: string, normalized: string) {
  const alias = HEADER_ALIASES[normalized];
  if (alias) return alias;

  // Si el ruido va delante del nombre ("Míralo aquí DIRECCIÓN"), el nombre es
  // el tramo final en mayúsculas.
  return UPPERCASE_TAIL.exec(trimmed)?.[1].trim() ?? trimmed;
}

/**
 * Resuelve los encabezados de la hoja como conjunto, no uno por uno: un mismo
 * encabezado sucio puede contener varias palabras del catálogo (la columna
 * LUGAR de donaciones arrastra un "¿QUÉ INSUMOS NECESITA CADA PUNTO?"), así que
 * primero mandan las columnas cuyo nombre es exacto y cada nombre se asigna una
 * sola vez. Sin esto dos columnas colapsarían en la misma clave.
 */
function resolveHeaders(headerRow: string[]) {
  const prepared = headerRow.map((raw, index) => {
    const trimmed = raw.trim().replace(/\s+/g, " ");
    const normalized = normalizeText(trimmed);
    return { index, trimmed, normalized, candidates: candidatesFor(normalized) };
  });

  const resolved = new Map<number, string>();
  const taken = new Set<string>();

  // 1) Encabezados que son exactamente el nombre de una columna.
  for (const column of prepared) {
    const exact = column.candidates.find(
      (candidate) => normalizeText(candidate.canonical) === column.normalized,
    );
    if (exact && !taken.has(exact.canonical)) {
      resolved.set(column.index, exact.canonical);
      taken.add(exact.canonical);
    }
  }

  // 2) El resto se queda con su mejor candidato que siga libre.
  for (const column of prepared) {
    if (resolved.has(column.index)) continue;

    const free = column.candidates.find(({ canonical }) => !taken.has(canonical));
    if (free) {
      resolved.set(column.index, free.canonical);
      taken.add(free.canonical);
    } else {
      resolved.set(column.index, fallbackHeader(column.trimmed, column.normalized));
    }
  }

  return prepared.map(({ index }) => ({
    index,
    name: resolved.get(index) as string,
  }));
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

  const named = resolveHeaders(data[0] ?? []).filter(
    ({ name }) => !isJunkHeader(name),
  );

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
