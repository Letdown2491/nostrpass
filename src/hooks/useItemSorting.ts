import React from "react";
import type { Settings } from "../state/settings";

export type SortKey = "title" | "category" | "site" | "username" | "updatedAt";

export default function useItemSorting(rows: any[], settings: Settings) {
  const [query, setQuery] = React.useState("");
  const [sortBy, setSortBy] = React.useState<SortKey>("title");
  const [sortDir, setSortDir] = React.useState<"asc" | "desc">("asc");
  const sortInitRef = React.useRef(false);

  // initialize sort from settings once
  React.useEffect(() => {
    if (sortInitRef.current) return;
    if (settings?.defaultSort) {
      setSortBy(settings.defaultSort.key as SortKey);
      setSortDir(settings.defaultSort.dir);
      sortInitRef.current = true;
    }
  }, [settings?.defaultSort]);

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows
      .filter((r) => (settings.showDeleted ? true : !r.deleted))
      .filter((r) => {
        if (!q) return true;
        const hay =
          `${r.title ?? ""} ${r.site ?? ""} ${r.username ?? ""} ${r.category ?? ""} ${r.type ?? ""}`.toLowerCase();
        return hay.includes(q);
      });
  }, [rows, query, settings.showDeleted]);

  const visible = React.useMemo(() => {
    const arr = filtered.slice();
    arr.sort((a, b) => {
      const va = a[sortBy] ?? (sortBy === "category" ? "Uncategorized" : "");
      const vb = b[sortBy] ?? (sortBy === "category" ? "Uncategorized" : "");
      let cmp = 0;
      if (sortBy === "updatedAt") cmp = (va || 0) - (vb || 0);
      else cmp = String(va).localeCompare(String(vb));
      return sortDir === "asc" ? cmp : -cmp;
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
