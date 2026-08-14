# Plan: Dashboard en Next.js alimentado por Google Sheets en tiempo real

## Contexto

- El Google Sheet se está editando en tiempo real por otras personas.
- Sheet ID: `1-hMGwC0XaSu5ddZ896gYyVRpmbPkVYg3NJ_6rSxK4Y8`
- GID de la pestaña a usar: `0` (ajustar si es otra pestaña)
- Permisos requeridos: el Sheet debe estar compartido como "Cualquier persona con el enlace puede ver".
- Estrategia de "tiempo real": no hay websockets con Google Sheets, se usa polling (fetch periódico) tanto en el servidor (con revalidate) como en el cliente (con setInterval).

## Objetivo

Crear un proyecto Next.js (App Router) que:
1. Lea datos de un Google Sheet público vía el endpoint `gviz` (CSV).
2. Los exponga a través de un Route Handler propio (para evitar CORS y controlar caché).
3. Los muestre en el cliente con polling automático, en una tabla simple como primera visualización.

## Pasos

### 1. Crear el proyecto

```bash
npx create-next-app@latest sheet-dashboard
cd sheet-dashboard
```

Opciones recomendadas: App Router = sí. TypeScript es opcional (el código de ejemplo está en JS).

### 2. Instalar dependencias

```bash
npm install papaparse
```

Opcional para gráficas más adelante:

```bash
npm install recharts
```

### 3. Crear Route Handler que lee el Sheet

Archivo: `app/api/sheet/route.js`

```js
import Papa from 'papaparse';

const SHEET_ID = '1-hMGwC0XaSu5ddZ896gYyVRpmbPkVYg3NJ_6rSxK4Y8';
const GID = '0';

export async function GET() {
  const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&gid=${GID}`;

  try {
    const res = await fetch(url, { next: { revalidate: 5 } }); // cachea 5s en el server
    if (!res.ok) throw new Error(`Sheet fetch failed: ${res.status}`);

    const csvText = await res.text();
    const { data } = Papa.parse(csvText, {
      header: true,
      skipEmptyLines: true,
    });

    return Response.json({ rows: data, updatedAt: new Date().toISOString() });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
```

Verificar visitando `http://localhost:3000/api/sheet` en el navegador — debe devolver JSON con `rows` y `updatedAt`.

### 4. Crear hook de polling en el cliente

Archivo: `app/hooks/useSheetData.js`

```jsx
'use client';
import { useEffect, useState } from 'react';

export function useSheetData(intervalMs = 5000) {
  const [rows, setRows] = useState([]);
  const [updatedAt, setUpdatedAt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      try {
        const res = await fetch('/api/sheet');
        const json = await res.json();
        if (!isMounted) return;

        if (json.error) {
          setError(json.error);
        } else {
          setRows(json.rows);
          setUpdatedAt(json.updatedAt);
          setError(null);
        }
      } catch (e) {
        if (isMounted) setError(e.message);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, intervalMs);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [intervalMs]);

  return { rows, updatedAt, loading, error };
}
```

### 5. Primera visualización: tabla en vivo

Archivo: `app/page.js`

```jsx
'use client';
import { useSheetData } from './hooks/useSheetData';

export default function Page() {
  const { rows, updatedAt, loading, error } = useSheetData(5000);

  if (loading) return <p style={{ padding: 20 }}>Cargando datos...</p>;
  if (error) return <p style={{ padding: 20, color: 'red' }}>Error: {error}</p>;

  const columns = Object.keys(rows[0] || {});

  return (
    <main style={{ padding: 24, fontFamily: 'sans-serif' }}>
      <h1>Datos en vivo</h1>
      <p style={{ color: '#666', fontSize: 13 }}>
        Última actualización: {updatedAt ? new Date(updatedAt).toLocaleTimeString() : '—'}
      </p>

      <table style={{ borderCollapse: 'collapse', marginTop: 16, width: '100%' }}>
        <thead>
          <tr>
            {columns.map((col) => (
              <th key={col} style={{ border: '1px solid #ddd', padding: 8, textAlign: 'left', background: '#f5f5f5' }}>
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i}>
              {columns.map((col) => (
                <td key={col} style={{ border: '1px solid #ddd', padding: 8 }}>
                  {row[col]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}
```

### 6. Correr el proyecto

```bash
npm run dev
```

Abrir `http://localhost:3000` y verificar que la tabla se actualice sola cada 5 segundos.

## Consideraciones adicionales

- **CORS**: al pasar por el Route Handler propio (`/api/sheet`) no debería haber problemas de CORS desde el cliente.
- **Rate limits**: Google no publica un límite claro para el endpoint `gviz`. Evitar polling muy agresivo (menos de 5s) si hay muchos usuarios concurrentes; el `revalidate: 5` en el servidor ya amortigua esto.
- **GID de la pestaña**: si el Sheet tiene varias pestañas y se necesita otra, cambiar el valor de `GID` (visible en la URL al cambiar de pestaña en Google Sheets).
- **Manejo de errores**: si el Sheet cambia de permisos o se borra, el Route Handler devuelve un error 500 con el mensaje — el cliente ya lo maneja mostrando el mensaje de error.

## Siguientes pasos (fuera de este plan inicial)

- Agregar gráficas con `recharts` sobre los datos parseados.
- Tipar los datos (si se usa TypeScript) según las columnas reales del Sheet.
- Mover el `SHEET_ID` y `GID` a variables de entorno (`.env.local`) en vez de hardcodearlos.
- Evaluar migrar a la API oficial de Google Sheets (v4) si se necesita escribir datos o autenticación más robusta.
