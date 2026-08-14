"use client";

import type { SheetRow } from "@/lib/sheet";
import {
  BADGE_CLASS,
  needLabel,
  needMeaning,
  needStatus,
  needSubject,
  type NeedStatus,
} from "@/lib/status";

type Entry = { label: string; status: NeedStatus; count: number };

/** Estados presentes en la hoja, con cuántos puntos hay de cada uno. */
function buildEntries(rows: SheetRow[], needKey: string): Entry[] {
  const byLabel = new Map<string, Entry>();

  for (const row of rows) {
    const value = row[needKey];
    if (!value) continue;

    const status = needStatus(value);
    const label = needLabel(value, status);
    const seen = byLabel.get(label);

    if (seen) seen.count += 1;
    else byLabel.set(label, { label, status, count: 1 });
  }

  // Primero lo que necesita gente, al final lo que no.
  const order: Record<NeedStatus, number> = { on: 0, other: 1, off: 2 };
  return [...byLabel.values()].sort(
    (a, b) => order[a.status] - order[b.status] || b.count - a.count,
  );
}

export function StatusLegend({
  rows,
  needKey,
}: {
  rows: SheetRow[];
  needKey: string;
}) {
  const entries = buildEntries(rows, needKey);
  if (entries.length === 0) return null;

  const subject = needSubject(needKey);

  return (
    <section className="legend" aria-label="Qué significa cada etiqueta">
      <h2 className="legend-title">Qué significa cada etiqueta</h2>
      <ul className="legend-items">
        {entries.map(({ label, status, count }) => (
          <li key={label} className="legend-item">
            <span className={BADGE_CLASS[status]}>{label}</span>
            <span className="legend-text">
              {needMeaning(status, subject)}
              <span className="legend-count"> · {count}</span>
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
