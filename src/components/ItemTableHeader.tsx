import React from "react";
import type { SortKey } from "../hooks/useItemSorting";

type Props = {
  remaining: number;
  toggleSort: (key: SortKey) => void;
  sortIndicator: (key: SortKey) => string;
};

function Th({
  label,
  onClick,
  ind,
}: {
  label: string;
  onClick: () => void;
  ind: string;
}) {
  return (
    <th
      className="py-2 px-2 cursor-pointer select-none"
      onClick={onClick}
      title="Sort"
    >
      <span className="inline-flex items-center gap-1">
        {label} <span className="text-xs">{ind}</span>
      </span>
    </th>
  );
}

export default function ItemTableHeader({
  remaining,
  toggleSort,
  sortIndicator,
}: Props) {
  return (
    <thead>
      <tr className="text-left text-slate-400 border-b border-slate-800">
        <Th
          label="Title"
          onClick={() => toggleSort("title")}
          ind={sortIndicator("title")}
        />
        <Th
          label="Category"
          onClick={() => toggleSort("category")}
          ind={sortIndicator("category")}
        />
        <Th
          label="Site"
          onClick={() => toggleSort("site")}
          ind={sortIndicator("site")}
        />
        <th className="py-2 px-2 text-right">Actions</th>
      </tr>
    </thead>
  );
}
