import React from "react";
import type { Settings } from "../state/settings";
import { copyText, copyPassword } from "../lib/clipboard";
import { toHref, hostnameFromSite } from "../lib/url";
import {
  OfflineFavicon,
  EditIcon,
  DeleteIcon,
  RestoreIcon,
  SpinnerIcon,
} from "./Icons";

type Props = {
  item: any;
  code: string;
  settings: Settings;
  isBusy: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onRestore: () => void;
  badFavicons: Record<string, boolean>;
  setBadFavicons: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  faviconRetry: number;
  style?: React.CSSProperties;
};

function faviconUrlForHost(host: string, settings: Settings): string {
  if (settings.favicon?.source === "custom") {
    const base = (settings.favicon.customBase || "").trim();
    const normalized = base ? base.replace(/\/?$/, "/") : "";
    return `${normalized}${host}.ico`;
  }
  return `https://icons.duckduckgo.com/ip3/${host}.ico`;
}

export default function ItemRow({
  item,
  code,
  settings,
  isBusy,
  onEdit,
  onDelete,
  onRestore,
  badFavicons,
  setBadFavicons,
  faviconRetry,
  style,
}: Props) {
  const siteHref = toHref(item.site);
  const host = hostnameFromSite(item.site);
  const displayHost = host || item.site;
  const showFavicon = settings.showFavicons && !!host && !badFavicons[host];

  const trunc = (enabled: boolean) =>
    enabled
      ? "block max-w-[40ch] overflow-hidden text-ellipsis whitespace-nowrap"
      : "";

  return (
    <tr style={style} className="border-b border-slate-800/60">
      <td className="py-2 px-2">
        <span className="inline-flex items-center gap-2">
          {showFavicon ? (
            <img
              key={`${host}-${faviconRetry}`}
              src={faviconUrlForHost(host!, settings)}
              alt=""
              aria-hidden="true"
              className="w-5 h-5 rounded-sm bg-slate-800/50"
              loading="lazy"
              decoding="async"
              referrerPolicy="no-referrer"
              onError={() =>
                setBadFavicons((m) => ({
                  ...m,
                  [host!]: true,
                }))
              }
            />
          ) : (
            <OfflineFavicon className="w-5 h-5" aria-hidden="true" />
          )}
          <span
            className={trunc(settings.truncateFields)}
            title={String(item.title || "")}
          >
            {item.title || "(untitled)"}
          </span>
        </span>
      </td>

      <td className="py-2 px-2">{item.category || "Uncategorized"}</td>

      <td className="py-2 px-2">
        {siteHref ? (
          <a
            href={siteHref}
            target="_blank"
            rel="noopener noreferrer"
            className="underline decoration-dotted hover:decoration-solid"
            title={siteHref}
          >
            <span
              className={trunc(settings.truncateFields)}
              title={String(displayHost || "")}
            >
              {displayHost}
            </span>
          </a>
        ) : (
          <span
            className={trunc(settings.truncateFields)}
            title={String(displayHost || "")}
          >
            {displayHost || "—"}
          </span>
        )}
      </td>

      <td className="py-2 px-2">
        {item.username ? (
          <span
            className="cursor-pointer hover:underline decoration-dotted"
            title="Copy username"
            onClick={() => copyText(item.username, settings.clipboardClearSec)}
          >
            {item.username}
          </span>
        ) : (
          "—"
        )}
      </td>

      <td className="py-2 px-2">
        {item.password ? (
          <span
            className="hover:underline"
            onClick={() =>
              copyPassword(item.password, settings.clipboardClearSec)
            }
            title="Copy password"
          >
            **********
          </span>
        ) : (
          "—"
        )}
      </td>

      <td className="py-2 px-2 font-mono tabular-nums text-center">
        {code && code !== "—" ? (
          <span
            className="cursor-pointer hover:underline decoration-dotted"
            title="Copy 2FA token"
            onClick={() => copyText(code, settings.clipboardClearSec)}
          >
            {code}
          </span>
        ) : (
          "—"
        )}
      </td>

      <td className="py-2 px-2">
        <div className="flex items-center gap-2 justify-end">
          {!item.deleted && (
            <button
              className="px-2 py-1 rounded border border-slate-600 hover:bg-slate-600/50 disabled:opacity-50"
              onClick={onEdit}
              disabled={isBusy}
              title="Edit"
              aria-label="Edit item"
            >
              <EditIcon size={20} />
            </button>
          )}
          {!item.deleted ? (
            <button
              className="px-2 py-1 rounded border border-rose-400 text-rose-400 hover:bg-rose-600/50 disabled:opacity-50"
              onClick={onDelete}
              disabled={isBusy}
              title="Delete"
              aria-label="Delete item"
              aria-busy={isBusy}
            >
              {!isBusy && <DeleteIcon size={20} />}
              {isBusy ? <SpinnerIcon size={20} className="animate-spin" /> : ""}
            </button>
          ) : (
            <button
              className="px-2 py-1 rounded border border-emerald-600 text-emerald-300 hover:bg-emerald-600/40 disabled:opacity-50"
              onClick={onRestore}
              disabled={isBusy}
              title="Restore"
              aria-label="Restore item"
            >
              {!isBusy && <RestoreIcon size={20} />}
              {isBusy ? <SpinnerIcon size={20} className="animate-spin" /> : ""}
            </button>
          )}
        </div>
      </td>
    </tr>
  );
}
