import React from "react";
import type { Profile } from "../lib/profile";
import { avatarFrom, bestName } from "../lib/profile";
import { shortNpub } from "../lib/npub";

export default function ProfileBadge({
  npub,
  profile,
  size = 40,
}: {
  npub: string;
  profile: Profile | null;
  size?: number;
}) {
  const [imgOk, setImgOk] = React.useState(true);
  const src = avatarFrom(profile);
  const name = bestName(profile, shortNpub(npub));

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
        className="rounded-full overflow-hidden bg-slate-800 flex items-center justify-center shrink-0"
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
