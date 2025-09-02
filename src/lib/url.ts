export function toHref(site?: string | null): string | null {
  if (!site) return null;
  const v = String(site).trim();
  if (!v) return null;
  const hasProto = /^https?:\/\//i.test(v);
  const looksLikeDomain =
    /^[a-z0-9.-]+\.[a-z]{2,}([/:?#].*)?$/i.test(v) || v.startsWith("www.");
  if (hasProto) return v;
  if (looksLikeDomain) return `https://${v}`;
  return null;
}

export function hostnameFromSite(site?: string | null): string | null {
  const href = toHref(site);
  if (!href) return null;
  try {
    const u = new URL(href);
    return (u.hostname || "").toLowerCase();
  } catch {
    return null;
  }
}
