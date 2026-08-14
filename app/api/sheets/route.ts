import { parseSheetTabs, SHEET_ID, SHEET_TABS } from "@/lib/sheet";

export async function GET() {
  try {
    // Las pestañas cambian poco: 60 s de caché es suficiente.
    const res = await fetch(
      `https://docs.google.com/spreadsheets/d/${SHEET_ID}/htmlview`,
      { next: { revalidate: 60 } },
    );
    if (!res.ok) throw new Error(`Sheet fetch failed: ${res.status}`);

    return Response.json({ tabs: parseSheetTabs(await res.text()) });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error desconocido";
    console.error("[api/sheets]:", message);
    // El listado estático mantiene la UI usable si el descubrimiento falla.
    return Response.json({ tabs: SHEET_TABS, warning: message });
  }
}
