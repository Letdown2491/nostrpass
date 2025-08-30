# NostrPass

A minimal starter that:
- Authenticates with **NIP-07** (browser signer).
- Stores each vault record as a **kind 30078** (parameterized replaceable) Nostr event addressed by a `["d","com.you.pm:item:<uuid>"]` tag.
- Encrypts all sensitive data client-side using **Argon2id** (vault key) + **HKDF subkeys** per item + **XChaCha20-Poly1305** AEAD.
- Syncs via relays. Records are **newest-wins** per `d`.

> Nostr events strictly use only NIP-01 fields: `id, pubkey, created_at, kind, tags, content, sig`. `content` is the stringified ciphertext envelope.

## Quick start

```bash
pnpm i   # or npm i / yarn
pnpm dev # open http://localhost:5173
```

Steps:
1. Click **Connect Nostr Signer** (needs NIP-07 extension like Alby).
2. Click **Unlock** and enter a passphrase (local only).
3. Create a **New Login** and publish — it encrypts and sends a kind 30078 event to relays.
4. Items list decrypts locally using your passphrase.

## Security model (brief)

- **Local-first**: encryption happens in the browser; relays see ciphertext only.
- **Vault key**: derived from passphrase via **Argon2id** (64MiB, t=3, p=1 by default).
- **Per-item subkeys**: **HKDF-SHA256** with random 16-byte salt per item.
- **Cipher**: **XChaCha20-Poly1305**.
- **Envelope**: includes `kdf` params + `salt` so a new device can derive keys from any record plus the passphrase.
- **Addressable records**: kind 30078 + `["d","com.you.pm:item:<uuid>"]`. Latest event per (`pubkey`,`kind`,`d`) wins.

## Notes

- This is a minimal starter: no migrations, no history UI, no clipboard hygiene yet.
- For production: add autolock timers, export/import, history/versioning, TOTP, tags/folders, conflict resolution details, and remote signer (NIP-46) support.
- Optional fallback store: write the same inner envelope as a **kind 4** DM-to-self (NIP-04) if you need legacy relay support.

---

## Troubleshooting: “I don’t see my notes/items”

- Make sure you clicked **Connect Nostr Signer** and then **Unlock**.
- Ensure your relay list includes **at least one write-enabled relay**. Defaults: nos.lol, relay.damus.io, relay.snort.social.
- Open DevTools → Console: after publishing you should see at least one `OK true` from a relay. If all `OK` are false, that relay is not accepting writes.
- The app now **subscribes automatically** after you connect; items should appear after `EOSE`.
