"use client";

import { useState } from "react";
import { PlaceCard } from "./components/PlaceCard";
import { useSheetData, useSheetTabs } from "./hooks/useSheetData";
import { DEFAULT_GID, SHEET_ID } from "@/lib/sheet";

export default function Page() {
  const tabs = useSheetTabs();
  const [gid, setGid] = useState(DEFAULT_GID);
  const { rows, columns, updatedAt, loading, error } = useSheetData(gid);

  const needKey = columns.find((col) => col.startsWith("SE NECESITAN"));
  const needCount = needKey
    ? rows.filter((row) => /^s[ií]/i.test(row[needKey] ?? "")).length
    : 0;

  return (
    <main className="page">
      <header className="masthead">
        <h1 className="title display">
          Puntos de <span className="title-accent">Voluntariado</span>
        </h1>
        <p className="tagline">
          Información en vivo desde el Google Sheet colaborativo. Se actualiza
          sola cada pocos segundos — no hace falta recargar.
        </p>

        <nav className="tabs" role="tablist" aria-label="Hojas del documento">
          {tabs.map((tab) => (
            <button
              key={tab.gid}
              role="tab"
              type="button"
              aria-selected={tab.gid === gid}
              className="tab"
              onClick={() => setGid(tab.gid)}
            >
              {tab.name}
            </button>
          ))}
        </nav>
      </header>

      <div className="metabar">
        <div className="stat">
          <span className="stat-num">{rows.length}</span>
          <span className="stat-label">registros</span>
        </div>
        {needKey && (
          <div className="stat">
            <span className="stat-num">{needCount}</span>
            <span className="stat-label">
              {needKey.replace("SE NECESITAN ", "necesitan ")}
            </span>
          </div>
        )}
        <div className="live">
          <span className="live-dot" aria-hidden="true" />
          {updatedAt
            ? `En vivo · ${new Date(updatedAt).toLocaleTimeString()}`
            : "Conectando"}
        </div>
      </div>

      {error && (
        <p className="notice notice-error">
          Error: {error}
          {rows.length > 0 && " — mostrando los últimos datos recibidos."}
        </p>
      )}

      {loading && (
        <div className="skeleton-grid">
          {Array.from({ length: 6 }, (_, i) => (
            <div key={i} className="skeleton" />
          ))}
        </div>
      )}

      {!loading && rows.length === 0 && !error && (
        <p className="notice">Esta hoja no tiene registros todavía.</p>
      )}

      {rows.length > 0 && (
        <div className="grid">
          {rows.map((row, i) => (
            <PlaceCard key={i} row={row} columns={columns} />
          ))}
        </div>
      )}

      <footer className="footer">
        Fuente:{" "}
        <a
          href={`https://docs.google.com/spreadsheets/d/${SHEET_ID}/edit#gid=${gid}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          Google Sheet original
        </a>
      </footer>
    </main>
  );
}
