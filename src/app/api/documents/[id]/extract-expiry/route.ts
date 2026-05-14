import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const maxDuration = 30;

const EXTRACTION_PROMPT = `You are a compliance document analyzer. Extract the expiry or renewal date from this document.

Return ONLY a JSON object in this exact format:
{
  "expiry_date": "YYYY-MM-DD",
  "document_type": "brief description of what this document is",
  "holder_name": "name on the document if visible"
}

If no expiry date is found, set "expiry_date" to null.
Do not include any explanation outside the JSON.`;

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: document } = await supabase
    .from("documents")
    .select("id, file_path, file_type, file_name, business_id")
    .eq("id", id)
    .single();

  if (!document) {
    return NextResponse.json({ error: "Document not found" }, { status: 404 });
  }

  // Verify ownership
  const { data: business } = await supabase
    .from("businesses")
    .select("id")
    .eq("id", document.business_id)
    .eq("owner_id", user.id)
    .single();

  if (!business) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: "AI extraction not configured" },
      { status: 503 }
    );
  }

  const admin = createAdminClient();
  const { data: signedData } = await admin.storage
    .from("documents")
    .createSignedUrl(document.file_path, 60);

  if (!signedData?.signedUrl) {
    return NextResponse.json(
      { error: "Failed to access document" },
      { status: 500 }
    );
  }

  const fileResponse = await fetch(signedData.signedUrl);
  if (!fileResponse.ok) {
    return NextResponse.json(
      { error: "Failed to download document" },
      { status: 500 }
    );
  }

  const fileBuffer = await fileResponse.arrayBuffer();
  const base64 = Buffer.from(fileBuffer).toString("base64");

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const isPdf = document.file_type === "application/pdf";
  const isImage = document.file_type.startsWith("image/");

  if (!isPdf && !isImage) {
    return NextResponse.json(
      { error: "Only PDF and image files support AI extraction" },
      { status: 400 }
    );
  }

  const messageContent = isPdf
    ? [
        {
          type: "document" as const,
          source: {
            type: "base64" as const,
            media_type: "application/pdf" as const,
            data: base64,
          },
        },
        { type: "text" as const, text: EXTRACTION_PROMPT },
      ]
    : [
        {
          type: "image" as const,
          source: {
            type: "base64" as const,
            media_type: document.file_type as
              | "image/jpeg"
              | "image/png"
              | "image/webp",
            data: base64,
          },
        },
        { type: "text" as const, text: EXTRACTION_PROMPT },
      ];

  const response = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 256,
    messages: [{ role: "user", content: messageContent }],
  });

  const rawText =
    response.content[0].type === "text" ? response.content[0].text : "";

  let extracted: { expiry_date: string | null; document_type?: string } = {
    expiry_date: null,
  };

  try {
    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      extracted = JSON.parse(jsonMatch[0]);
    }
  } catch {
    // extraction failed — keep null
  }

  if (extracted.expiry_date) {
    await supabase
      .from("documents")
      .update({ expiry_date: extracted.expiry_date })
      .eq("id", id);
  }

  return NextResponse.json({
    expiry_date: extracted.expiry_date,
    document_type: extracted.document_type ?? null,
  });
}
