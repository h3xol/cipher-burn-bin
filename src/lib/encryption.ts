const encoder = new TextEncoder();
const decoder = new TextDecoder();

export const toBase64 = (data: ArrayBuffer | Uint8Array) => {
  const bytes = data instanceof Uint8Array ? data : new Uint8Array(data);
  let binary = "";
  bytes.forEach((b) => {
    binary += String.fromCharCode(b);
  });
  return btoa(binary);
};

export const fromBase64 = (value: string) => {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
};

const toBase64Url = (value: ArrayBuffer | Uint8Array) =>
  toBase64(value).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

const fromBase64Url = (value: string) =>
  fromBase64(value.replace(/-/g, "+").replace(/_/g, "/"));

const concatUint8 = (a: Uint8Array, b: Uint8Array) => {
  const merged = new Uint8Array(a.length + b.length);
  merged.set(a, 0);
  merged.set(b, a.length);
  return merged;
};

const toHex = (data: Uint8Array) =>
  Array.from(data)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

type DerivedKeys = {
  aesKey: CryptoKey;
  hmacKey: CryptoKey;
};

const deriveKeys = async (keyMaterial: Uint8Array, salt: Uint8Array): Promise<DerivedKeys> => {
  const hkdfKey = await crypto.subtle.importKey("raw", keyMaterial, "HKDF", false, ["deriveKey"]);

  const aesKey = await crypto.subtle.deriveKey(
    {
      name: "HKDF",
      salt,
      info: encoder.encode("cipher"),
      hash: "SHA-256",
    },
    hkdfKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );

  const hmacKey = await crypto.subtle.deriveKey(
    {
      name: "HKDF",
      salt,
      info: encoder.encode("integrity"),
      hash: "SHA-256",
    },
    hkdfKey,
    { name: "HMAC", hash: "SHA-256", length: 256 },
    false,
    ["sign", "verify"],
  );

  return { aesKey, hmacKey };
};

const signMac = async (hmacKey: CryptoKey, data: Uint8Array) => {
  const macBuffer = await crypto.subtle.sign("HMAC", hmacKey, data);
  return new Uint8Array(macBuffer);
};

export type EncryptedPayload = {
  version: "v1";
  iv: string; // base64
  salt: string; // base64
  mac: string; // base64
  ciphertext?: string; // base64 (inline text payloads)
  storagePath?: string; // reference to storage when content is stored outside DB
};

type EncryptionOutput = {
  payload: EncryptedPayload;
  key: string; // base64url encoded key material that lives only in the URL fragment
  ciphertext: Uint8Array;
};

const encryptBytes = async (data: Uint8Array): Promise<EncryptionOutput> => {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const keyMaterial = crypto.getRandomValues(new Uint8Array(32));

  const { aesKey, hmacKey } = await deriveKeys(keyMaterial, salt);
  const ciphertextBuffer = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, aesKey, data);
  const ciphertext = new Uint8Array(ciphertextBuffer);
  const mac = await signMac(hmacKey, concatUint8(iv, ciphertext));

  const payload: EncryptedPayload = {
    version: "v1",
    iv: toBase64(iv),
    salt: toBase64(salt),
    mac: toBase64(mac),
  };

  return {
    payload,
    key: toBase64Url(keyMaterial),
    ciphertext,
  };
};

export const encryptText = async (value: string): Promise<EncryptionOutput> => {
  const data = encoder.encode(value);
  const encrypted = await encryptBytes(data);
  return {
    ...encrypted,
    payload: {
      ...encrypted.payload,
      ciphertext: toBase64(encrypted.ciphertext),
    },
  };
};

export const encryptBinary = async (data: Uint8Array) => encryptBytes(data);

const decryptBytesInternal = async (
  payload: EncryptedPayload,
  key: string,
  ciphertextInput?: Uint8Array,
): Promise<Uint8Array> => {
  if (payload.version !== "v1") {
    throw new Error("Unsupported payload version");
  }

  const keyMaterial = fromBase64Url(key);
  const salt = fromBase64(payload.salt);
  const iv = fromBase64(payload.iv);
  const ciphertext =
    ciphertextInput ?? (payload.ciphertext ? fromBase64(payload.ciphertext) : null);

  if (!ciphertext) {
    throw new Error("Missing ciphertext for decryption");
  }

  const { aesKey, hmacKey } = await deriveKeys(keyMaterial, salt);

  const macValid = await crypto.subtle.verify(
    "HMAC",
    hmacKey,
    fromBase64(payload.mac),
    concatUint8(iv, ciphertext),
  );

  if (!macValid) {
    throw new Error("Integrity check failed");
  }

  const plaintextBuffer = await crypto.subtle.decrypt(
    {
      name: "AES-GCM",
      iv,
    },
    aesKey,
    ciphertext,
  );

  return new Uint8Array(plaintextBuffer);
};

export const decryptText = async (payload: EncryptedPayload, key: string): Promise<string> => {
  const bytes = await decryptBytesInternal(payload, key);
  return decoder.decode(bytes);
};

export const decryptBinary = async (
  payload: EncryptedPayload,
  key: string,
  ciphertext: Uint8Array,
): Promise<Uint8Array> => decryptBytesInternal(payload, key, ciphertext);

const DEFAULT_PBKDF2_ITERATIONS = 120000;

export const derivePasswordHash = async (
  password: string,
  saltB64?: string,
  iterations = DEFAULT_PBKDF2_ITERATIONS,
) => {
  const salt = saltB64 ? fromBase64(saltB64) : crypto.getRandomValues(new Uint8Array(16));
  const baseKey = await crypto.subtle.importKey("raw", encoder.encode(password), "PBKDF2", false, [
    "deriveBits",
  ]);

  const derived = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt,
      iterations,
      hash: "SHA-256",
    },
    baseKey,
    256,
  );

  const hashBytes = new Uint8Array(derived);

  return {
    hashHex: toHex(hashBytes),
    saltB64: toBase64(salt),
    iterations,
  };
};
