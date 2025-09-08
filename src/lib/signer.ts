import { generateSecretKey, SimplePool } from "nostr-tools";
import { BunkerSigner, parseBunkerInput } from "nostr-tools/nip46";
import type { BunkerPointer } from "nostr-tools/nip46";
import { getConversationKey, decrypt } from "nostr-tools/nip44";
import { buildNostrConnectURI } from "./nostrConnect";

export interface NostrSigner {
  getPublicKey(): Promise<string>;
  signEvent(event: any): Promise<any>;
}

class SignerManager extends EventTarget implements NostrSigner {
  private signer: NostrSigner | null = null;
  private pointer: BunkerPointer | null = null;
  private clientSecret: Uint8Array | null = null;

  /**
   * Establish a signer. If a Nostr Connect URL is supplied a NIP-46
   * bunker signer will be created. Otherwise falls back to a NIP-07
   * signer exposed on `window.nostr`.
   */
  async connect(nostrConnectUrl?: string): Promise<void> {
    this.dispatchEvent(new Event("connecting"));
    try {
      if (nostrConnectUrl) {
        const pointer = await parseBunkerInput(nostrConnectUrl);
        if (!pointer) throw new Error("invalid nostr connect url");
        const sk = this.clientSecret ?? generateSecretKey();
        this.clientSecret = sk;
        this.pointer = pointer;
        const bunker = new BunkerSigner(sk, pointer);
        await bunker.connect();
        this.signer = bunker;
      } else if (this.pointer && this.clientSecret) {
        const bunker = new BunkerSigner(this.clientSecret, this.pointer);
        await bunker.connect();
        this.signer = bunker;
      } else if ((globalThis as any).nostr) {
        this.signer = (globalThis as any).nostr as NostrSigner;
        this.pointer = null;
        this.clientSecret = null;
      } else {
        throw new Error("NIP-07 signer not found");
      }
      this.dispatchEvent(new Event("open"));
    } catch (err) {
      this.signer = null;
      this.dispatchEvent(new CustomEvent("error", { detail: err }));
      this.dispatchEvent(new Event("closed"));
      throw err;
    }
  }

  async connectWithDeepLink(
    relays: string[],
    metadata?: Record<string, any>,
  ): Promise<void> {
    this.dispatchEvent(new Event("connecting"));
    try {
      const { uri, secretKey, publicKey, secret } = buildNostrConnectURI(
        relays,
        metadata,
      );
      this.clientSecret = secretKey;
      // open deep link
      try {
        if (typeof window !== "undefined") window.location.href = uri;
      } catch {
        /* ignore */
      }

      const pool = new SimplePool();
      let sub: { close: () => void } | undefined;
      const event: any = await new Promise((resolve, reject) => {
        const timer = setTimeout(() => {
          if (sub) sub.close();
          reject(new Error("no signer detected"));
        }, 5000);
        sub = pool.subscribe(
          relays,
          { kinds: [24133], "#p": [publicKey], limit: 1 },
          {
            onevent: (ev) => {
              clearTimeout(timer);
              if (sub) sub.close();
              resolve(ev);
            },
            onclose: () => {},
          },
        );
      });
      pool.close(relays);
      const convKey = getConversationKey(secretKey, event.pubkey);
      const msg = JSON.parse(decrypt(event.content, convKey));
      if (msg.method !== "connect") throw new Error("unexpected response");
      const [signerPub, receivedSecret] = msg.params;
      if (receivedSecret !== secret)
        throw new Error("invalid secret from signer");
      this.pointer = { pubkey: signerPub, relays, secret };
      const bunker = new BunkerSigner(secretKey, this.pointer);
      await bunker.connect();
      this.signer = bunker;
      this.dispatchEvent(new Event("open"));
    } catch (err) {
      this.signer = null;
      this.dispatchEvent(new CustomEvent("error", { detail: err }));
      this.dispatchEvent(new Event("closed"));
      throw err;
    }
  }

  private async ensureSigner(): Promise<void> {
    if (!this.signer) {
      if (this.pointer && this.clientSecret) {
        await this.connect();
      } else if ((globalThis as any).nostr) {
        this.signer = (globalThis as any).nostr as NostrSigner;
      } else {
        throw new Error("no signer available");
      }
    }
  }

  async getPublicKey(): Promise<string> {
    await this.ensureSigner();
    if (!this.signer) throw new Error("no signer available");
    try {
      return await this.signer.getPublicKey();
    } catch (err) {
      // attempt reconnect and retry once
      this.dispatchEvent(new CustomEvent("error", { detail: err }));
      this.dispatchEvent(new Event("closed"));
      await this.ensureSigner();
      return await this.signer!.getPublicKey();
    }
  }

  async signEvent(event: any): Promise<any> {
    await this.ensureSigner();
    if (!this.signer) throw new Error("no signer available");
    try {
      return await this.signer.signEvent(event);
    } catch (err) {
      this.dispatchEvent(new CustomEvent("error", { detail: err }));
      this.dispatchEvent(new Event("closed"));
      await this.ensureSigner();
      return await this.signer!.signEvent(event);
    }
  }
}

export const signer = new SignerManager();

export default signer;
