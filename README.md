# NostrPass
A local-first password manager powered by **Nostr**. Your credentials are encrypted in the browser and synced as app-data events to your relays. Nothing sensitive leaves your device unencrypted.

## Features
- **NIP-07 sign-in**: Connect with a browser Nostr signer such as Alby.
- **End-to-end encryption**: Client-side passphrase → Argon2id key derivation → XChaCha20-Poly1305 AEAD.
- **Per-item addressing**: Each record is a **kind 30078** (parameterized-replaceable) event keyed by a `d` tag.
- **Fast UI**: New/Edit via modals, searchable & sortable table, optional favicons.
- **Copy helpers**: Click to copy **username**, **password**, or **2FA token**.
- **TOTP support**: Store a Base32 **2FA Secret Key**.
- **Offline support**: currently the app does support offline actions (add/edit/delete) which will sync back to the selected relays after internet access is restored.
- **Settings**: Synced and local device settings.

## How it works (short)
- **Identity & signing**: A NIP-07 signer provides your pubkey (npub) and signs events.
- **Storage & sync**: Items are **kind 30078** events with a stable `["d","com.you.pm:item:<opaque>"]`. The newest per `d` wins on relays.
- **Encryption**: Your passphrase derives a key (Argon2id). Item content is encrypted with XChaCha20-Poly1305. KDF params are stored alongside ciphertext so another device can decrypt after you unlock.

## Quick start

### Prerequisites
- **Node.js 18+** and **pnpm** or **Docker** installed.
- A **NIP-07** browser signer such as Alby, Amber, or Nostr Connect.

### Install & run (Docker)
```bash
# clone the repo
git clone https://github.com/Letdown2491/nostrpass
cd nostrpass
# build and run docker image
docker build --no-cache -t nostrpass .
docker run --rm -p 8080:3000 nostrpass
# then open the printed URL (usually http://localhost:5173)
```

### Install & run (NPM)
```bash
# clone the repo
git clone https://github.com/Letdown2491/nostrpass
cd nostrpass
# install dependencies
pnpm install            # or: npm install / yarn
# start the dev server
pnpm dev                # or: npm run dev / yarn dev
# then open the printed URL (usually http://localhost:5173)
pnpm build              # or: npm run build / yarn build
```

### Using the app
- **Connect Nostr Signer**: authorize your browser extension when prompted.
- **Unlock**: choose a passphrase; it’s kept in memory for this session only, but is required to decrypt your login entries. If you use a different passphrase on next login, you will not be able to decrypt existing notes and you will not see them in the UI.
- **Create a login**: click New Login, fill in fields (Title, Site, Username, Password, optional 2FA Secret Key, Notes), then Encrypt & Publish.
- **Sync & decrypt**: the newest version of each item is fetched from your relays and decrypted locally after EOSE.

### Configuration
- **Relays**: Configure your preferred read/write relays from the Settings modal. The list is synced to your Nostr settings.
- **Favicons**: You can show site icons in the table (DuckDuckGo ip3 or a custom proxy). Toggle and source are in Settings.
- **Sorting & truncation**: Default sort (e.g., Title A→Z) and truncation (ellipsis with tooltip) can be configured in Settings.

## Troubleshooting
- **Signer not detected**: Make sure a NIP-07 extension is installed and enabled, then reload the page.
- **No items after publish**: Check the browser console for relay OK acks and EOSE. Ensure at least one relay accepts writes and that you’re subscribed to the same relays for reads.
- **Decryption errors**: Confirm you’ve unlocked with the same passphrase used to create your items. If you rotate your passphrase, old items can’t decrypt without the original.

## Security note
This project is a starter/experimental app. Review the code, threat model, and your relay trust before storing highly sensitive data. Use at your own risk. All event metadata, including tags such as the `d` identifier, is visible to relays. Avoid placing secrets or personal data in metadata fields. Future protocol enhancements may allow envelope-level encryption of additional fields; this project will evaluate such features if they become available.
