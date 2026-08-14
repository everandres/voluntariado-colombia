"use client";

import { useSheetData } from "./hooks/useSheetData";

const cellStyle: React.CSSProperties = {
  border: "1px solid #ddd",
  padding: 8,
  verticalAlign: "top",
  whiteSpace: "pre-line",
  minWidth: 140,
};

export default function Page() {
  const { rows, columns, updatedAt, loading, error } = useSheetData(5000);

  if (loading) return <p style={{ padding: 24 }}>Cargando datos...</p>;

  const hasData = rows.length > 0;

  return (
    <main style={{ padding: 24, fontFamily: "sans-serif" }}>
      <h1 style={{ margin: 0 }}>Voluntariado — datos en vivo</h1>
      <p style={{ color: "#666", fontSize: 13 }}>
        Última actualización:{" "}
        {updatedAt ? new Date(updatedAt).toLocaleTimeString() : "—"} · {rows.length}{" "}
        registros
      </p>

      {error && (
        <p style={{ color: "#b00", fontSize: 13 }}>
          Error: {error}
          {hasData && " (mostrando los últimos datos recibidos)"}
        </p>
      )}

      {!hasData && !error && <p>No hay datos para mostrar.</p>}

      {hasData && (
        <div style={{ overflowX: "auto", marginTop: 16 }}>
          <table style={{ borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr>
                {columns.map((col) => (
                  <th
                    key={col}
                    style={{ ...cellStyle, textAlign: "left", background: "#f5f5f5" }}
                  >
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr key={i}>
                  {columns.map((col) => (
                    <td key={col} style={cellStyle}>
                      {row[col]}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
