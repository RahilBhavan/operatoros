import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const maxDuration = 30;

const RATE_LIMIT = 5;

const INSIGHTS_PROMPT = (context: string) => `You are a compliance advisor for small businesses. Analyze the business context below and return 2-3 proactive compliance insights about commonly missed deadlines or renewal obligations.

Business context:
${context}

Return ONLY a JSON array of insight objects in this exact format:
[
  {
    "title": "Short insight title (max 8 words)",
    "body": "One sentence explaining the risk or action needed. End with: Verify exact requirements with your accountant or the relevant agency.",
    "urgency": "high" | "medium" | "low"
  }
]

Focus on: commonly missed recurring deadlines for this entity type and industry, federal/state tax filing thresholds, license renewal patterns, OSHA obligations. Be specific to entity type and state if known. Do not repeat deadlines already tracked. Return only the JSON array, no other text.`;

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: "AI not configured" }, { status: 503 });
  }

  const { data: business } = await supabase
    .from("businesses")
    .select("id, name, entity_type, employee_count, industry_sic_code, plan_tier, billing_status")
    .eq("owner_id", user.id)
    .single();

  if (!business) {
    return NextResponse.json({ error: "Business not found" }, { status: 404 });
  }

  const { data: deadlines } = await supabase
    .from("deadlines")
    .select("name, due_date, status, governing_agency, deadline_type")
    .eq("business_id", business.id)
    .order("due_date", { ascending: true })
    .limit(20);

  const { data: allowed, error: rateError } = await supabase.rpc(
    "try_consume_ai_rate_limit",
    { p_max: RATE_LIMIT, p_window: "1 hour" }
  );

  if (rateError || allowed !== true) {
    return NextResponse.json(
      { error: "Rate limit reached — try again in an hour." },
      { status: 429 }
    );
  }

  const context = [
    `Entity type: ${business.entity_type ?? "unknown"}`,
    `Industry SIC: ${business.industry_sic_code ?? "unknown"}`,
    `Employees: ${business.employee_count ?? "unknown"}`,
    `Current tracked deadlines: ${(deadlines ?? [])
      .map((d) => `${d.name} (${d.due_date}, ${d.status})`)
      .join("; ") || "none"}`,
  ].join("\n");

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const response = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 512,
    messages: [{ role: "user", content: INSIGHTS_PROMPT(context) }],
  });

  const rawText =
    response.content[0].type === "text" ? response.content[0].text : "[]";

  let insights: Array<{ title: string; body: string; urgency: string }> = [];
  try {
    const match = rawText.match(/\[[\s\S]*\]/);
    if (match) insights = JSON.parse(match[0]);
  } catch {
    // Return empty array on parse failure rather than 500
  }

  return NextResponse.json({ insights });
}
