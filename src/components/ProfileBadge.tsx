import React from "react";
import type { Profile } from "../lib/profile";
import { avatarFrom, bestName } from "../lib/profile";
import { shortNpub } from "../lib/npub";

export default function ProfileBadge({
  npub,
  profile,
  size = 40,
  status = "open",
}: {
  npub: string;
  profile: Profile | null;
  size?: number;
  status?: "open" | "connecting" | "closed" | "error";
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
      <div
        className={`rounded-full overflow-hidden bg-slate-800 flex items-center justify-center shrink-0 ${ringClass}`}
        style={{ width: dim, height: dim }}
      >
        {src && imgOk ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={src}
            alt=""
            className="w-full h-full object-cover"
            onError={() => setImgOk(false)}
            referrerPolicy="no-referrer"
          />
        ) : (
          <span className="text-slate-400 text-sm">👤</span>
        )}
      </div>
    </div>
  );
}
