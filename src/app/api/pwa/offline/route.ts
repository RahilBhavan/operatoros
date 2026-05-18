import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

/** Offline fallback page for the service worker precache list. */
export async function GET() {
  const body = await readFile(join(process.cwd(), "public/offline.html"), "utf8");
  return new NextResponse(body, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-cache, no-store, must-revalidate",
    },
  });
}
