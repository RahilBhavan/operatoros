import { NextResponse } from "next/server";

type PostgresError = { code?: string; message?: string } | null | undefined;

/**
 * Sanitised 500 for DB insert/update failures. Logs the raw error
 * server-side (so on-call still sees the postgres detail) but returns a
 * generic message — no schema names, constraint identifiers, or
 * statement excerpts to the client. Use after every supabase mutation
 * where the caller previously echoed `error.message` back.
 *
 * Returns NextResponse so it can be `return`ed directly from the route.
 */
export function dbError(
  where: string,
  error: PostgresError
): NextResponse {
  console.error(`[${where}] db failure`, error);
  return NextResponse.json(
    { error: "Failed to save record. Please retry or contact support." },
    { status: 500 }
  );
}
