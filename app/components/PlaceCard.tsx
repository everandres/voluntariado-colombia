"use client";

import { useState } from "react";
import type { SheetRow } from "@/lib/sheet";

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

function Field({ label, value }: { label: string; value: string }) {
  const collapsible = value.length > LONG_TEXT;
  const [open, setOpen] = useState(false);

  return (
    <div>
      <div className="field-label">{label}</div>
      <div
        className={collapsible && !open ? "field-value clamped" : "field-value"}
      >
        {withEmphasis(value)}
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
  const titleKey = columns.includes("LUGAR") ? "LUGAR" : columns[0];
  const needKey = columns.find((col) => col.startsWith("SE NECESITAN"));
  const need = needKey ? row[needKey] : "";
  const needsHelp = /^s[ií]/i.test(need);

  const textKeys = columns.filter(
    (col) =>
      col !== titleKey &&
      col !== needKey &&
      !ACTION_KEYS.includes(col as (typeof ACTION_KEYS)[number]) &&
      row[col],
  );

  const actions = ACTION_KEYS.filter((key) => columns.includes(key) && row[key])
    .map((key) => ({ key, value: row[key], href: actionHref(key, row[key]) }))
    .filter((action) => action.href !== null);

  // Un contacto que no es enlazable (p. ej. "preguntar por Ana") se muestra
  // como texto para no perder el dato.
  const unlinkableContact =
    row["CONTACTO CLAVE"] && !actions.some((a) => a.key === "CONTACTO CLAVE")
      ? row["CONTACTO CLAVE"]
      : null;

  return (
    <article className="card">
      <header className="card-head">
        {need && (
          <span className={needsHelp ? "badge badge-on" : "badge"}>
            {needsHelp
              ? "Se necesita"
              : /^no$/i.test(need)
                ? "No se necesita"
                : need}
          </span>
        )}
        <h2 className="card-title">{row[titleKey] || "Sin nombre"}</h2>
      </header>

      <div className="fields">
        {textKeys.map((key) => (
          <Field key={key} label={key} value={row[key]} />
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
