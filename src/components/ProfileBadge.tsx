import React from "react";
import type { Profile } from "../lib/profile";
import { avatarFrom, bestName } from "../lib/profile";
import { shortNpub } from "../lib/npub";
import { SettingsIcon } from "./Icons";

export default function ProfileBadge({
  npub,
  profile,
  size = 40,
  status = "open",
  onClick,
  showSettingsIcon = false,
}: {
  npub: string;
  profile: Profile | null;
  size?: number;
  status?: "open" | "connecting" | "closed" | "error";
  onClick?: () => void;
  showSettingsIcon?: boolean;
}) {
  const [imgOk, setImgOk] = React.useState(true);
  const src = avatarFrom(profile);
  const name = bestName(profile, shortNpub(npub));
  const ringClass =
    status === "open"
      ? "ring-2 ring-green-500"
      : status === "connecting"
        ? "ring-2 ring-yellow-500"
        : "ring-2 ring-red-500";

  const dim = `${size}px`;

  return (
    <div className="flex items-center gap-3">
      <div className="leading-tight text-right hidden sm:block">
        <div className="font-medium">{name}</div>
        <div className="text-xs text-slate-400 break-all">
          {shortNpub(npub)}
        </div>
      </div>
      <div className="relative shrink-0" style={{ width: dim, height: dim }}>
        <button
          type="button"
          onClick={onClick}
          className={`relative w-full h-full rounded-full overflow-hidden bg-slate-800 flex items-center justify-center ${ringClass} ${onClick ? "cursor-pointer" : ""}`}
          title={onClick ? "Open settings" : undefined}
        >
          {src && imgOk ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={src}
              alt=""
              className="absolute inset-0 w-full h-full object-cover"
              onError={() => setImgOk(false)}
              referrerPolicy="no-referrer"
            />
          ) : (
            <span className="text-slate-400 text-sm">👤</span>
          )}
        </button>
        {showSettingsIcon && (
          <SettingsIcon
            size={18}
            className="absolute -bottom-1 -right-1 bg-slate-800 rounded-full p-0.5"
          />
        )}
      </div>
    </div>
  );
}
