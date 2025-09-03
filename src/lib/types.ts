export type KdfParams = {
  name: "argon2id";
  salt_b64: string;
  m: number;
  t: number;
  p: number;
};

export interface LoginItem {
  id: string;
  type: "login";
  title: string;
  tags?: string[];
  category: string;
  createdAt: number;
  updatedAt: number;
  version: number;
  deleted?: boolean;
  site: string;
  username: string;
  password: string;
  url?: string;
  notes?: string;
  totpSecret?: string;
}

export type Envelope = {
  v: 1;
  alg: "xchacha20poly1305";
  nonce: string; // base64
  salt: string; // base64 (itemSalt for subkey derivation)
  ad?: string;
  kdf: KdfParams; // duplicated for recovery/bootstrap
  ct: string; // base64 ciphertext
};

export type NostrEvent = {
  id: string;
  pubkey: string;
  created_at: number;
  kind: number;
  tags: string[][];
  content: string;
  sig: string;
};

export interface PublishResult {
  successes: string[];
  failures: Record<string, string>;
}
