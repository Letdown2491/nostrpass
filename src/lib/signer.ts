import { generateSecretKey } from "nostr-tools";
import { BunkerSigner, parseBunkerInput } from "nostr-tools/nip46";

export interface NostrSigner {
  getPublicKey(): Promise<string>;
  signEvent(event: any): Promise<any>;
}

class SignerManager extends EventTarget implements NostrSigner {
  private signer: NostrSigner | null = null;
  private connectUrl: string | null = null;

  /**
   * Establish a signer. If a Nostr Connect URL is supplied a NIP-46
   * bunker signer will be created. Otherwise falls back to a NIP-07
   * signer exposed on `window.nostr`.
   */
  async connect(nostrConnectUrl?: string): Promise<void> {
    this.dispatchEvent(new Event("connecting"));
    try {
      if (nostrConnectUrl) {
        this.connectUrl = nostrConnectUrl;
        const pointer = await parseBunkerInput(nostrConnectUrl);
        if (!pointer) throw new Error("invalid nostr connect url");
        const sk = generateSecretKey();
        const bunker = new BunkerSigner(sk, pointer);
        await bunker.connect();
        this.signer = bunker;
      } else if ((globalThis as any).nostr) {
        this.signer = (globalThis as any).nostr as NostrSigner;
        this.connectUrl = null;
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

  private async ensureSigner(): Promise<void> {
    if (!this.signer) {
      if (this.connectUrl) {
        await this.connect(this.connectUrl);
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
