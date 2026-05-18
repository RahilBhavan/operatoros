import { createHash } from "node:crypto";

/**
 * SHA-256 of a plaintext token, lowercase hex, 64 chars.
 *
 * Mirrors the SQL form `encode(sha256(token::bytea), 'hex')` so DB rows
 * written from migrations and rows written from the API hash identically.
 *
 * Use on every token-handling site:
 *   - On issue: store hashToken(plaintext) in *_hash columns; return plaintext.
 *   - On verify: hash the incoming token and look up by *_hash.
 */
export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}
