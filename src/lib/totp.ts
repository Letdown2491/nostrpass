// Minimal TOTP (RFC-6238) using WebCrypto (HMAC-SHA1)
// Accepts common Base32 secrets (case/space/“=” insensitive).

const B32 = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
// Cache of imported CryptoKeys, indexed by SHA-256 of normalized secrets
const keyCache = new Map<string, CryptoKey>();

function bufToHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export function clearTotpCache() {
  keyCache.clear();
}

function base32Decode(b32: string): Uint8Array {
  const s = b32.toUpperCase().replace(/[\s=]/g, "");
  let bits = 0;
  let value = 0;
  const out: number[] = [];
  for (let i = 0; i < s.length; i++) {
    const idx = B32.indexOf(s[i]);
    if (idx === -1) throw new Error("Invalid base32 char");
    value = (value << 5) | idx;
    bits += 5;
    if (bits >= 8) {
      out.push((value >>> (bits - 8)) & 0xff);
      bits -= 8;
    }
  }
  return new Uint8Array(out);
}

async function hotp(
  key: CryptoKey,
  counter: number,
  digits = 6,
): Promise<string> {
  // 8-byte big-endian counter
  const msg = new ArrayBuffer(8);
  const view = new DataView(msg);
  const hi = Math.floor(counter / 0x100000000);
  const lo = counter >>> 0;
  view.setUint32(0, hi);
  view.setUint32(4, lo);

  const sigBuf = await crypto.subtle.sign("HMAC", key, msg);
  const h = new Uint8Array(sigBuf);

  const offset = h[h.length - 1] & 0x0f;
  const bin =
    ((h[offset] & 0x7f) << 24) |
    ((h[offset + 1] & 0xff) << 16) |
    ((h[offset + 2] & 0xff) << 8) |
    (h[offset + 3] & 0xff);

  const mod = 10 ** digits;
  const code = (bin % mod).toString().padStart(digits, "0");
  return code;
}

export async function totpFromBase32(
  secretB32: string,
  epochMs = Date.now(),
  step = 30,
  digits = 6,
): Promise<string | null> {
  try {
    const normalized = secretB32.toUpperCase().replace(/[\s=]/g, "");
    const sec = base32Decode(normalized);
    const buf = new ArrayBuffer(sec.length);
    new Uint8Array(buf).set(sec);
    const digest = await crypto.subtle.digest("SHA-256", buf);
    const hash = bufToHex(digest);
    let key = keyCache.get(hash);
    if (!key) {
      key = await crypto.subtle.importKey(
        "raw",
        buf,
        { name: "HMAC", hash: "SHA-1" },
        false,
        ["sign"],
      );
      keyCache.set(hash, key);
    }
    const counter = Math.floor(epochMs / 1000 / step);
    return await hotp(key, counter, digits);
  } catch {
    return null;
  }
}
