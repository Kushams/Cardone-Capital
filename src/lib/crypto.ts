import { createCipheriv, createDecipheriv, createHash, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

/**
 * Taxpayer-ID protection (CLONE-PROMPT §17): AES-256-GCM at rest, masked in every UI,
 * full value only ever decrypted inside generateInstance() at PDF generation time. Never log it.
 */
const DEV_KEY_FILE = path.join(process.cwd(), "storage", ".dev-key");

function loadKey(): Buffer {
  const env = process.env.TAX_ID_KEY;
  if (env) {
    const k = Buffer.from(env, "base64");
    if (k.length !== 32) throw new Error("TAX_ID_KEY must be 32 bytes, base64-encoded");
    return k;
  }
  if (process.env.NODE_ENV === "production") throw new Error("TAX_ID_KEY is required in production");
  // Development convenience only: a random local key, git-ignored.
  if (!existsSync(DEV_KEY_FILE)) {
    mkdirSync(path.dirname(DEV_KEY_FILE), { recursive: true });
    writeFileSync(DEV_KEY_FILE, randomBytes(32).toString("base64"), { mode: 0o600 });
  }
  return Buffer.from(readFileSync(DEV_KEY_FILE, "utf8").trim(), "base64");
}

let cached: Buffer | null = null;
const key = () => (cached ??= loadKey());

export function encryptSecret(plain: string): string {
  const iv = randomBytes(12);
  const c = createCipheriv("aes-256-gcm", key(), iv);
  const ct = Buffer.concat([c.update(plain, "utf8"), c.final()]);
  return ["v1", iv.toString("base64"), c.getAuthTag().toString("base64"), ct.toString("base64")].join(":");
}

/** Decrypt ONLY at document-generation time. */
export function decryptSecret(blob: string): string {
  const [v, iv, tag, ct] = blob.split(":");
  if (v !== "v1") throw new Error("Unknown ciphertext version");
  const d = createDecipheriv("aes-256-gcm", key(), Buffer.from(iv, "base64"));
  d.setAuthTag(Buffer.from(tag, "base64"));
  return Buffer.concat([d.update(Buffer.from(ct, "base64")), d.final()]).toString("utf8");
}

/** "…1234" — at most the last 4 characters are ever shown. */
export function maskTaxId(plain: string | null | undefined): string {
  if (!plain) return "--";
  const digits = plain.replace(/[^0-9A-Za-z]/g, "");
  return "…" + digits.slice(-4);
}

export function maskEncrypted(blob: string | null | undefined): string {
  if (!blob) return "--";
  return maskTaxId(decryptSecret(blob));
}

// ---- password hashing (scrypt) ----
export function hashPassword(pw: string): string {
  const salt = randomBytes(16);
  const h = scryptSync(pw, salt, 64);
  return `s1:${salt.toString("base64")}:${h.toString("base64")}`;
}
export function verifyPassword(pw: string, stored: string): boolean {
  const [v, salt, hash] = stored.split(":");
  if (v !== "s1") return false;
  const h = scryptSync(pw, Buffer.from(salt, "base64"), 64);
  const b = Buffer.from(hash, "base64");
  return b.length === h.length && timingSafeEqual(b, h);
}

// ---- opaque tokens (invites / sessions): only the SHA-256 is stored ----
export const newToken = () => randomBytes(32).toString("base64url");
export const sha256 = (s: string) => createHash("sha256").update(s).digest("hex");
