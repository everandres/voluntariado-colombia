"use client";

import { useEffect, useState } from "react";
import type { SheetRow, SheetTab } from "@/lib/sheet";
import { SHEET_TABS } from "@/lib/sheet";

type SheetPayload = {
  gid: string;
  rows: SheetRow[];
  columns: string[];
  updatedAt: string;
};

const EMPTY: { rows: SheetRow[]; columns: string[] } = { rows: [], columns: [] };

export function useSheetData(gid: string, intervalMs = 5000) {
  // El gid viaja dentro del estado para que al cambiar de hoja los datos de la
  // anterior se consideren obsoletos sin tener que resetear en el efecto.
  const [data, setData] = useState<SheetPayload | null>(null);
  const [failure, setFailure] = useState<{ gid: string; message: string } | null>(
    null,
  );

  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();

    const fetchData = async () => {
      try {
        const res = await fetch(`/api/sheet?gid=${encodeURIComponent(gid)}`, {
          signal: controller.signal,
        });
        const json = await res.json();
        if (!isMounted) return;

        if (json.error) {
          setFailure({ gid, message: json.error });
        } else {
          // Solo reemplazamos con datos buenos: la vista no parpadea en cada tick.
          setData({
            gid,
            rows: json.rows,
            columns: json.columns,
            updatedAt: json.updatedAt,
          });
          setFailure(null);
        }
      } catch (e) {
        if (!isMounted || controller.signal.aborted) return;
        setFailure({
          gid,
          message: e instanceof Error ? e.message : "Error desconocido",
        });
      }
    };

    fetchData();
    const interval = setInterval(fetchData, intervalMs);
    return () => {
      isMounted = false;
      controller.abort();
      clearInterval(interval);
    };
  }, [gid, intervalMs]);

  const fresh = data?.gid === gid ? data : null;
  const error = failure?.gid === gid ? failure.message : null;

  return {
    rows: fresh?.rows ?? EMPTY.rows,
    columns: fresh?.columns ?? EMPTY.columns,
    updatedAt: fresh?.updatedAt ?? null,
    loading: !fresh && !error,
    error,
  };
}

/** Pestañas del documento; arranca con el listado estático y lo refresca. */
export function useSheetTabs() {
  const [discovered, setDiscovered] = useState<SheetTab[] | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    fetch("/api/sheets", { signal: controller.signal })
      .then((res) => res.json())
      .then((json) => {
        if (Array.isArray(json.tabs) && json.tabs.length > 0) {
          setDiscovered(json.tabs);
        }
      })
      .catch(() => {
        // Nos quedamos con SHEET_TABS.
      });

    return () => controller.abort();
  }, []);

  return discovered ?? SHEET_TABS;
}
