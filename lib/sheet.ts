import Papa from "papaparse";

export const SHEET_ID = "1-hMGwC0XaSu5ddZ896gYyVRpmbPkVYg3NJ_6rSxK4Y8";
export const GID = "0";

export function buildCsvUrl(sheetId = SHEET_ID, gid = GID) {
  return `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv&gid=${gid}`;
}

export type SheetRow = Record<string, string>;

/**
 * Los headers del Sheet traen texto de UI pegado (enlaces y notas que se ven
 * como parte de la celda). Mapeamos el header crudo al nombre limpio.
 */
const HEADER_ALIASES: Record<string, string> = {
  "También puedes ver esta información en un mapa LUGAR": "LUGAR",
  "Míralo aquí SE NECESITAN VOLUNTARIOS": "SE NECESITAN VOLUNTARIOS",
  "Y preguntarle a Gemini si tienes alguna duda HORARIOS": "HORARIOS",
  "Pregunta haciendo click aquí NOTAS": "NOTAS",
};

function cleanHeader(raw: string) {
  const trimmed = raw.trim().replace(/\s+/g, " ");
  return HEADER_ALIASES[trimmed] ?? trimmed;
}

/**
 * El Sheet tiene 28 columnas pero solo las primeras tienen nombre; el resto
 * llega con header vacío. Parseamos sin `header: true` (que colapsaría todas
 * las columnas sin nombre en una sola clave) y descartamos esas columnas.
 */
export function parseSheetCsv(csvText: string): {
  columns: string[];
  rows: SheetRow[];
} {
  const { data } = Papa.parse<string[]>(csvText, { skipEmptyLines: true });

  const headerRow = data[0] ?? [];
  const named = headerRow
    .map((raw, index) => ({ index, name: cleanHeader(raw) }))
    .filter(({ name }) => name.length > 0);

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
