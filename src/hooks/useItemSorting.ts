import React from "react";
import { inPlaceSort } from "fast-sort";
import type { Settings } from "../state/settings";

export type SortKey = "title" | "category" | "site" | "username" | "updatedAt";

export default function useItemSorting(rows: any[], settings: Settings) {
  const [query, setQuery] = React.useState("");
  const [sortBy, setSortBy] = React.useState<SortKey>("title");
  const [sortDir, setSortDir] = React.useState<"asc" | "desc">("asc");
  const sortInitRef = React.useRef(false);
  const sortedRef = React.useRef<any[]>([]);

  // initialize sort from settings once
  React.useEffect(() => {
    if (sortInitRef.current) return;
    if (settings?.defaultSort) {
      setSortBy(settings.defaultSort.key as SortKey);
      setSortDir(settings.defaultSort.dir);
      sortInitRef.current = true;
    }
  }, [settings?.defaultSort]);

  const deferredQuery = React.useDeferredValue(query);

  const filtered = React.useMemo(() => {
    const q = deferredQuery.trim().toLowerCase();
    return rows
      .filter((r) => (settings.showDeleted ? true : !r.deleted))
      .filter((r) => {
        if (!q) return true;
        const hay =
          `${r.title ?? ""} ${r.site ?? ""} ${r.username ?? ""} ${r.category ?? ""} ${r.type ?? ""}`.toLowerCase();
        return hay.includes(q);
      });
  }, [rows, deferredQuery, settings.showDeleted]);

  const visible = React.useMemo(() => {
    if (sortedRef.current !== filtered) {
      sortedRef.current = filtered.slice();
    }
    const arr = sortedRef.current;
    inPlaceSort(arr)[sortDir === "asc" ? "asc" : "desc"]((r) => {
      const v =
        r[sortBy] ??
        (sortBy === "category"
          ? "Uncategorized"
          : sortBy === "updatedAt"
            ? 0
            : "");
      return sortBy === "updatedAt" ? v || 0 : String(v);
    });
    return arr;
  }, [filtered, sortBy, sortDir]);

  const toggleSort = (key: SortKey) => {
    if (sortBy === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortBy(key);
      setSortDir(key === "updatedAt" ? "desc" : "asc");
    }
  };

  const sortIndicator = (key: SortKey) =>
    sortBy === key ? (sortDir === "asc" ? "▲" : "▼") : "";

  return {
    query,
    setQuery,
    visible,
    toggleSort,
    sortIndicator,
  };
}
