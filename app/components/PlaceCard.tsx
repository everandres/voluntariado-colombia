"use client";

import { useState } from "react";
import { isColumn, type SheetRow } from "@/lib/sheet";

/** Columnas que se muestran como botón en vez de texto. */
const ACTION_KEYS = [
  "LINK DE INSCRIPCIÓN",
  "GRUPO DE WHATSAPP",
  "INSTAGRAM",
  "CONTACTO CLAVE",
] as const;

const ACTION_LABELS: Record<string, string> = {
  "LINK DE INSCRIPCIÓN": "Inscribirme",
  "GRUPO DE WHATSAPP": "WhatsApp",
  INSTAGRAM: "Instagram",
  "CONTACTO CLAVE": "Llamar",
};

/** A partir de este largo el campo se colapsa detrás de un "ver todo". */
const LONG_TEXT = 260;

function isUrl(value: string) {
  return /^https?:\/\//i.test(value);
}

/**
 * En el Sheet la gente escribe énfasis estilo WhatsApp: *texto*. Lo pasamos a
 * <strong> para que las listas largas de ítems se lean mejor.
 */
function withEmphasis(text: string) {
  return text.split(/\*([^*\n]+)\*/g).map((part, i) =>
    i % 2 === 1 ? <strong key={i}>{part}</strong> : part,
  );
}

/** Búsqueda de la dirección en Google Maps. */
function mapsSearchUrl(address: string) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    `${address}, Bogotá, Colombia`,
  )}`;
}

function Field({
  label,
  value,
  asAddress = false,
}: {
  label: string;
  value: string;
  asAddress?: boolean;
}) {
  const collapsible = value.length > LONG_TEXT;
  const [open, setOpen] = useState(false);

  return (
    <div>
      <div className="field-label">{label}</div>
      <div
        className={collapsible && !open ? "field-value clamped" : "field-value"}
      >
        {asAddress ? (
          <a
            className="field-link"
            href={mapsSearchUrl(value)}
            target="_blank"
            rel="noopener noreferrer"
            title="Buscar esta dirección en Google Maps"
          >
            {value}
            <span className="field-link-hint" aria-hidden="true">
              ↗
            </span>
          </a>
        ) : (
          withEmphasis(value)
        )}
      </div>
      {collapsible && (
        <button
          type="button"
          className="expand-toggle"
          aria-expanded={open}
          onClick={() => setOpen((prev) => !prev)}
        >
          {open ? "Ver menos ↑" : "Ver todo ↓"}
        </button>
      )}
    </div>
  );
}

/** Los teléfonos vienen sueltos o dentro de una frase; sacamos los dígitos. */
function phoneDigits(value: string) {
  const digits = value.replace(/[^\d]/g, "");
  return digits.length >= 7 ? digits : null;
}

/** Devuelve el href del campo, o null si no es enlazable. */
function actionHref(key: string, value: string) {
  if (isUrl(value)) return value;

  if (key === "INSTAGRAM") {
    return `https://instagram.com/${value.replace(/^@/, "").trim()}`;
  }

  if (key === "CONTACTO CLAVE") {
    const digits = phoneDigits(value);
    return digits ? `tel:${digits}` : null;
  }

  return null;
}

export function PlaceCard({
  row,
  columns,
}: {
  row: SheetRow;
  columns: string[];
}) {
  const titleKey = columns.find((col) => isColumn(col, "LUGAR")) ?? columns[0];
  const needKey = columns.find((col) => col.startsWith("SE NECESITAN"));
  const need = needKey ? row[needKey] : "";
  // El Sheet usa SI / NO, pero también estados intermedios como
  // "VALIDANDO INFORMACIÓN": esos no son un "no", van en neutro.
  const needsHelp = /^s[ií]\b/i.test(need);
  const doesNotNeed = /^no\b/i.test(need);

  // El encabezado real puede venir con texto pegado o acentuado distinto, así
  // que resolvemos cada columna de acción por comparación normalizada.
  const actionColumns = ACTION_KEYS.map((key) => ({
    key,
    column: columns.find((col) => isColumn(col, key)),
  })).filter((entry) => entry.column && row[entry.column]);

  const textKeys = columns.filter(
    (col) =>
      col !== titleKey &&
      col !== needKey &&
      !actionColumns.some((entry) => entry.column === col) &&
      row[col],
  );

  const actions = actionColumns
    .map(({ key, column }) => ({
      key,
      href: actionHref(key, row[column as string]),
    }))
    .filter((action) => action.href !== null);

  // Un contacto que no es enlazable (p. ej. "preguntar por Ana") se muestra
  // como texto para no perder el dato.
  const contactColumn = actionColumns.find(
    (entry) => entry.key === "CONTACTO CLAVE",
  )?.column;
  const unlinkableContact =
    contactColumn && !actions.some((a) => a.key === "CONTACTO CLAVE")
      ? row[contactColumn]
      : null;

  return (
    <article className="card">
      <header className="card-head">
        {need && (
          <span
            className={`badge ${
              needsHelp ? "badge-on" : doesNotNeed ? "badge-off" : "badge-wip"
            }`}
          >
            {needsHelp ? "Se necesita" : doesNotNeed ? "No se necesita" : need}
          </span>
        )}
        <h2 className="card-title">{row[titleKey] || "Sin nombre"}</h2>
      </header>

      <div className="fields">
        {textKeys.map((key) => (
          <Field
            key={key}
            label={key}
            value={row[key]}
            asAddress={isColumn(key, "DIRECCIÓN")}
          />
        ))}

        {unlinkableContact && (
          <Field label="Contacto clave" value={unlinkableContact} />
        )}
      </div>

      {actions.length > 0 && (
        <div className="actions">
          {actions.map(({ key, href }) => (
            <a
              key={key}
              className={
                key === "LINK DE INSCRIPCIÓN" ? "action action-primary" : "action"
              }
              href={href as string}
              target={href!.startsWith("tel:") ? undefined : "_blank"}
              rel="noopener noreferrer"
            >
              {ACTION_LABELS[key] ?? key}
            </a>
          ))}
        </div>
      )}
    </article>
  );
}
