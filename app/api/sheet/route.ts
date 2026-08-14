import { buildCsvUrl, parseSheetCsv } from "@/lib/sheet";

export async function GET() {
  try {
    // Cachea 5 s en el servidor: amortigua el polling de varios clientes.
    const res = await fetch(buildCsvUrl(), { next: { revalidate: 5 } });
    if (!res.ok) throw new Error(`Sheet fetch failed: ${res.status}`);

    const csvText = await res.text();
    const { columns, rows } = parseSheetCsv(csvText);

    return Response.json({
      columns,
      rows,
      updatedAt: new Date().toISOString(),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error desconocido";
    return Response.json({ error: message }, { status: 500 });
  }
}
