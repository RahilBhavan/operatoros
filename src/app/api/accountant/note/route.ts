import { NextRequest, NextResponse } from "next/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

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

  // Verify the token grants access to the business that owns this deadline
  const { data: connection } = await admin
    .from("accountant_connections")
    .select("id, business_id")
    .eq("token", token)
    .single();

  if (!connection) {
    return NextResponse.json({ error: "Invalid token" }, { status: 403 });
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

  const { error } = await admin.from("accountant_deadline_notes").upsert(
    {
      deadline_id: deadlineId,
      accountant_token: token,
      note: note.trim(),
      updated_at: new Date().toISOString(),
    },
    { onConflict: "deadline_id,accountant_token" }
  );

  if (error) {
    return NextResponse.json({ error: "Failed to save note" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
