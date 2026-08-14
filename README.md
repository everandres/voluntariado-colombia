# Puntos de Voluntariado

**En vivo: https://voluntariado-colombia.vercel.app**

Dashboard en vivo de los puntos que necesitan voluntarios y donaciones, leído
directamente de un Google Sheet colaborativo que varias personas editan al mismo
tiempo.

**Para registrar o actualizar un punto**, edita el Sheet — la página lo refleja
en segundos, sin recargar:
[Google Sheet colaborativo](https://docs.google.com/spreadsheets/d/1-hMGwC0XaSu5ddZ896gYyVRpmbPkVYg3NJ_6rSxK4Y8/edit)

## Cómo funciona

- El Sheet es público, así que se lee por su endpoint `gviz` en formato CSV.
- Los route handlers (`app/api/sheet`, `app/api/sheets`) hacen ese fetch en el
  servidor: evitan CORS y cachean 5 s para amortiguar el polling de varios
  visitantes al mismo tiempo.
- El cliente reconsulta cada 5 s (`app/hooks/useSheetData.ts`), así que el
  retraso máximo entre una edición y verla en pantalla es de unos 10 s.
- Las pestañas del documento se descubren en vivo desde el propio Sheet, con un
  listado estático en `lib/sheet.ts` como respaldo.

### Particularidades de los datos

Cada hoja tiene su propio esquema y arrastra columnas fantasma (encabezados
vacíos, notas del autor puestas como encabezado, nombres como `x` o
`Columna 1`). `parseSheetCsv` en `lib/sheet.ts` las descarta y normaliza los
nombres. Las celdas traen saltos de línea y énfasis estilo WhatsApp
(`*texto*`), que se renderizan como tal.

Las direcciones no se ubican en un mapa: se enlazan a la búsqueda de Google
Maps. La geocodificación gratuita no distingue entre las varias vías homónimas
de Bogotá porque ignora el número de placa, y ubicaba los puntos en localidades
equivocadas.

## Desarrollo

```bash
npm install
npm run dev     # http://localhost:3000
npm run build
npm run lint
```

Next.js 16 (App Router, Turbopack) · Gasoek One para el título y Google Sans
Flex para el resto · paleta de la bandera de Colombia.
