import { NextRequest, NextResponse } from "next/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { hashToken } from "@/lib/security/token-hash";
import { consumeRateLimit } from "@/lib/security/rate-limit";
import { ACCOUNTANT_NOTE_LIMIT } from "@/lib/security/rate-limits";

function createRawAdmin() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}
import { z } from "zod";

const NoteSchema = z.object({
  token: z.string().min(1),
  deadlineId: z.string().uuid(),
  note: z.string().min(1).max(1000),
});

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = NoteSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const { token, deadlineId, note } = parsed.data;
  const admin = createRawAdmin();

  // Verify the token grants access to the business that owns this deadline.
  // token_hash replaces the dropped plaintext token column.
  const { data: connection } = await admin
    .from("accountant_connections")
    .select("id, business_id")
    .eq("token_hash", hashToken(token))
    .single();

  if (!connection) {
    return NextResponse.json({ error: "Invalid token" }, { status: 403 });
  }

  // Rate-limit note writes per accountant connection so a leaked token
  // can't be used to spam thousands of notes against a single business.
  const allowed = await consumeRateLimit(
    `accountant-note:${connection.id}`,
    ACCOUNTANT_NOTE_LIMIT.max,
    ACCOUNTANT_NOTE_LIMIT.windowSeconds
  );
  if (!allowed) {
    return NextResponse.json(
      { error: "Too many notes. Try again in an hour." },
      { status: 429 }
    );
  }

  const { data: deadline } = await admin
    .from("deadlines")
    .select("id")
    .eq("id", deadlineId)
    .eq("business_id", connection.business_id)
    .single();

  if (!deadline) {
    return NextResponse.json({ error: "Deadline not found" }, { status: 404 });
  }

  // Upsert by (deadline_id, connection_id). The accountant_token column was
  // dropped and the unique index renamed in 20260517000002_audit_remediation.
  const { error } = await admin.from("accountant_deadline_notes").upsert(
    {
      deadline_id: deadlineId,
      connection_id: connection.id,
      note: note.trim(),
      updated_at: new Date().toISOString(),
    },
    { onConflict: "deadline_id,connection_id" }
  );

  if (error) {
    return NextResponse.json({ error: "Failed to save note" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
