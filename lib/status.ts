/**
 * Estado de cada punto, leído de la columna "SE NECESITAN …".
 *
 * El Sheet no usa un vocabulario cerrado: hoy hay SI, NO y
 * "VALIDANDO INFORMACIÓN", y mañana puede aparecer otra cosa. Por eso todo lo
 * que no sea un sí o un no explícito cae en "other" y se muestra con el texto
 * que traiga el Sheet, en azul neutro — pintarlo de rojo diría que no
 * necesitan ayuda, que no es lo mismo que no saberlo todavía.
 */
export type NeedStatus = "on" | "off" | "other";

export function needStatus(value: string): NeedStatus {
  if (/^s[ií]\b/i.test(value)) return "on";
  if (/^no\b/i.test(value)) return "off";
  return "other";
}

export const BADGE_CLASS: Record<NeedStatus, string> = {
  on: "badge badge-on",
  off: "badge badge-off",
  other: "badge badge-wip",
};

/** Texto del badge: los sí/no se normalizan, el resto va tal cual. */
export function needLabel(value: string, status = needStatus(value)) {
  if (status === "on") return "Se necesita";
  if (status === "off") return "No se necesita";
  return value;
}

/**
 * "SE NECESITAN VOLUNTARIOS" -> "voluntarios". Se usa para redactar la leyenda
 * según la hoja, que también puede pedir donaciones.
 */
export function needSubject(needKey: string) {
  return needKey.replace(/^SE NECESITAN\s*/i, "").toLowerCase() || "ayuda";
}

/** Explicación de cada estado, para la leyenda. */
export function needMeaning(status: NeedStatus, subject: string) {
  if (status === "on") return `Necesitan ${subject} ahora`;
  if (status === "off") return `Por ahora no necesitan ${subject}`;
  return "Todavía sin confirmar";
}
