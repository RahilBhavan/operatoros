import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

/** Serve service worker with explicit headers (public/ is unreliable on some Vercel builds). */
export async function GET() {
  const body = await readFile(join(process.cwd(), "public/sw.js"), "utf8");
  return new NextResponse(body, {
    headers: {
      "Content-Type": "application/javascript; charset=utf-8",
      "Cache-Control": "no-cache, no-store, must-revalidate",
      "Service-Worker-Allowed": "/",
    },
  });
}
