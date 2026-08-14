"use client";

import { useEffect, useState } from "react";
import type { SheetRow } from "@/lib/sheet";

export function useSheetData(intervalMs = 5000) {
  const [rows, setRows] = useState<SheetRow[]>([]);
  const [columns, setColumns] = useState<string[]>([]);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();

    const fetchData = async () => {
      try {
        const res = await fetch("/api/sheet", { signal: controller.signal });
        const json = await res.json();
        if (!isMounted) return;

        if (json.error) {
          setError(json.error);
        } else {
          // No vaciamos la tabla en cada tick: solo reemplazamos con datos buenos.
          setRows(json.rows);
          setColumns(json.columns);
          setUpdatedAt(json.updatedAt);
          setError(null);
        }
      } catch (e) {
        if (!isMounted || controller.signal.aborted) return;
        setError(e instanceof Error ? e.message : "Error desconocido");
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, intervalMs);
    return () => {
      isMounted = false;
      controller.abort();
      clearInterval(interval);
    };
  }, [intervalMs]);

  return { rows, columns, updatedAt, loading, error };
}
