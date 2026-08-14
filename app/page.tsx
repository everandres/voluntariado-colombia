"use client";

import { useState } from "react";
import { PlaceCard } from "./components/PlaceCard";
import { StatusLegend } from "./components/StatusLegend";
import { needLabel, needStatus } from "@/lib/status";
import { useSheetData, useSheetTabs } from "./hooks/useSheetData";
import { DEFAULT_GID, SHEET_ID } from "@/lib/sheet";

/** El Sheet abierto en la pestaña que se está viendo. */
function sheetUrl(gid: string) {
  return `https://docs.google.com/spreadsheets/d/${SHEET_ID}/edit#gid=${gid}`;
}

/** Bandera de Colombia: franjas 1/2 amarillo, 1/4 azul, 1/4 rojo sobre 3:2. */
function ColombiaFlag() {
  return (
    <svg
      className="flag"
      viewBox="0 0 3 2"
      role="img"
      aria-label="Bandera de Colombia"
    >
      <rect width="3" height="1" fill="var(--amarillo)" />
      <rect y="1" width="3" height="0.5" fill="var(--azul)" />
      <rect y="1.5" width="3" height="0.5" fill="var(--rojo)" />
    </svg>
  );
}

export default function Page() {
  const tabs = useSheetTabs();
  const [gid, setGid] = useState(DEFAULT_GID);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const { rows, columns, updatedAt, loading, error } = useSheetData(gid);

  const needKey = columns.find((col) => col.startsWith("SE NECESITAN"));
  const needCount = needKey
    ? rows.filter((row) => needStatus(row[needKey] ?? "") === "on").length
    : 0;

  const visibleRows =
    statusFilter && needKey
      ? rows.filter((row) => needLabel(row[needKey] ?? "") === statusFilter)
      : rows;

  const toggleFilter = (label: string) =>
    setStatusFilter((current) => (current === label ? null : label));

  return (
    <main className="page">
      <header className="masthead">
        <div className="masthead-top">
          <h1 className="title display">
            <span className="title-primero">Puntos de</span>{" "}
            <span className="title-accent">Voluntariado</span>
          </h1>
          <ColombiaFlag />
        </div>
        <p className="tagline">
          Información en vivo desde un{" "}
          <a
            className="tagline-link"
            href={sheetUrl(gid)}
            target="_blank"
            rel="noopener noreferrer"
          >
            Google Sheet colaborativo
          </a>
          : ábrelo para registrar un punto nuevo o actualizar los datos de uno
          existente. Esta página se actualiza sola cada pocos segundos — no hace
          falta recargar.
        </p>

        <nav className="tabs" role="tablist" aria-label="Hojas del documento">
          {tabs.map((tab) => (
            <button
              key={tab.gid}
              role="tab"
              type="button"
              aria-selected={tab.gid === gid}
              className="tab"
              onClick={() => {
                setGid(tab.gid);
                setStatusFilter(null);
              }}
            >
              {tab.name}
            </button>
          ))}
        </nav>
      </header>

      <div className="metabar">
        <div className="stat">
          <span className="stat-num">{visibleRows.length}</span>
          <span className="stat-label">
            {statusFilter ? `de ${rows.length} registros` : "registros"}
          </span>
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

      {rows.length > 0 && needKey && (
        <StatusLegend
          rows={rows}
          needKey={needKey}
          active={statusFilter}
          onToggle={toggleFilter}
        />
      )}

      {visibleRows.length > 0 && (
        <div className="grid">
          {visibleRows.map((row, i) => (
            <PlaceCard key={i} row={row} columns={columns} />
          ))}
        </div>
      )}

      <footer className="footer">
        Fuente:{" "}
        <a href={sheetUrl(gid)} target="_blank" rel="noopener noreferrer">
          Google Sheet original
        </a>
      </footer>
    </main>
  );
}
