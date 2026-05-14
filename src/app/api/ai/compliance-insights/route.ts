import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const maxDuration = 30;

const RATE_LIMIT = 5;
const RATE_WINDOW_MS = 60 * 60 * 1000;

// Untyped client used only for the RPC not yet in generated types
function createRawAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

async function checkRateLimit(userId: string): Promise<boolean> {
  const admin = createRawAdminClient();
  const { data, error } = await admin.rpc("check_and_increment_rate_limit", {
    p_user_id: userId,
    p_rate_limit: RATE_LIMIT,
    p_window_ms: RATE_WINDOW_MS,
  });
  if (error) {
    // On RPC failure, fail open rather than block all users
    console.error("[rate-limit] RPC error:", error.message);
    return true;
  }
  return data === true;
}

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

  // AI insights are a Growth/Scale feature
  const tier = business.plan_tier as string | null;
  if (tier !== "growth" && tier !== "scale") {
    return NextResponse.json(
      { error: "AI insights require a Growth or Scale plan.", upgradeRequired: true },
      { status: 403 }
    );
  }

  if (!(await checkRateLimit(user.id))) {
    return NextResponse.json(
      { error: "Rate limit reached — try again in an hour." },
      { status: 429 }
    );
  }

  const { data: deadlines } = await supabase
    .from("deadlines")
    .select("name, due_date, status, governing_agency, deadline_type")
    .eq("business_id", business.id)
    .order("due_date", { ascending: true })
    .limit(20);

  const context = [
    `Entity type: ${business.entity_type ?? "unknown"}`,
    `Industry SIC: ${business.industry_sic_code ?? "unknown"}`,
    `Employees: ${business.employee_count ?? "unknown"}`,
    `Current tracked deadlines: ${(deadlines ?? [])
      .map((d) => `${d.name} (${d.due_date}, ${d.status})`)
      .join("; ") || "none"}`,
  ].join("\n");

  try {
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
      // Return empty insights on parse failure rather than 500
    }

    return NextResponse.json({ insights });
  } catch (err) {
    console.error("[ai-insights] Anthropic API error:", err);
    return NextResponse.json(
      { error: "AI service temporarily unavailable. Please try again." },
      { status: 502 }
    );
  }
}
