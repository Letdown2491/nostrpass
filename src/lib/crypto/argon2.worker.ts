import { argon2id } from "hash-wasm";

self.onmessage = async (event: MessageEvent) => {
  const { id, passphrase, kdf, salt } = event.data as {
    id: number;
    passphrase: string;
    kdf: { m: number; t: number; p: number };
    salt: ArrayBuffer;
  };
  try {
    const key = await argon2id({
      password: passphrase,
      salt: new Uint8Array(salt),
      parallelism: kdf.p,
      iterations: kdf.t,
      memorySize: kdf.m,
      hashLength: 32,
      outputType: "binary",
    });
    // Transfer the underlying buffer for efficiency
    (self as any).postMessage({ id, key }, [key.buffer]);
  } catch (error: any) {
    (self as any).postMessage({ id, error: error?.message ?? String(error) });
  }
};
