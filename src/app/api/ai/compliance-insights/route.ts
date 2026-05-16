import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createHash } from "node:crypto";

export const runtime = "nodejs";
export const maxDuration = 30;

const RATE_LIMIT_BUSINESS = 10;
const RATE_LIMIT_ACCOUNTANT = 30;
const CACHE_TTL_HOURS = 6;

type InsightUrgency = "high" | "medium" | "low";

type Insight = {
  title: string;
  body: string;
  urgency: InsightUrgency;
  source_url?: string;
};

const INDUSTRY_PROMPT_HINT: Record<string, string> = {
  restaurant:
    "Focus on: food handler card renewal cycles, liquor license filings, monthly state sales tax, county health inspection windows, OSHA reporting if 10+ employees.",
  construction:
    "Focus on: state contractor license renewal, subcontractor COI expiry, OSHA 300/300A, prevailing wage reporting, COI requirements for general contractors and bonding.",
  healthcare:
    "Focus on: DEA registration triennial cycle, HIPAA risk assessment, state professional board CE credits, Medicare/Medicaid revalidation if applicable, OSHA bloodborne pathogen training.",
  retail:
    "Focus on: sales tax nexus across states where you ship, seller's permit renewal, marketplace facilitator obligations, ADA storefront compliance.",
  personal_services:
    "Focus on: state cosmetology / barber board CE, establishment license renewal, sanitation inspection cadence.",
  business_services:
    "Focus on: professional liability (E&O) policy renewal, CPA/Bar/EA CE credit deadlines, state board registration renewals, client data retention rules.",
  manufacturing:
    "Focus on: EPA hazardous waste reporting, air permit/emissions inventory, OSHA recordkeeping, state environmental agency renewals.",
  transportation:
    "Focus on: USDOT biennial update, MCS-150 if applicable, CDL/medical card renewals, IFTA fuel-tax filings, IRP registration.",
  fitness:
    "Focus on: facility license renewal, instructor cert expiry (NASM/ACE/CPR), member contract cancellation laws.",
};

function buildPrompt(args: {
  entity: string | null;
  industry: string | null;
  state: string | null;
  employees: number | null;
  tracked: Array<{ name: string; due_date: string; status: string; governing_agency: string | null }>;
}): string {
  const industryHint =
    args.industry && INDUSTRY_PROMPT_HINT[args.industry]
      ? INDUSTRY_PROMPT_HINT[args.industry]
      : "Focus on: commonly missed recurring deadlines for this entity type and state.";

  const trackedList = args.tracked.length
    ? args.tracked
        .slice(0, 40)
        .map((d) => `- ${d.name} (${d.governing_agency ?? "agency"}, due ${d.due_date}, ${d.status})`)
        .join("\n")
    : "(none tracked yet)";

  return `You are a compliance advisor for US small businesses. Surface 2–3 proactive insights about obligations the operator has NOT already tracked.

Business profile:
- Entity type: ${args.entity ?? "unknown"}
- Industry: ${args.industry ?? "unknown"}
- State: ${args.state ?? "unknown"}
- Employees: ${args.employees ?? "unknown"}

Already tracked deadlines (do NOT duplicate these):
${trackedList}

${industryHint}

For each insight, cite the responsible agency or statute when known. If you are uncertain, mark it as low urgency and tell the operator to confirm with their accountant.

Return ONLY a JSON array. Each element:
{
  "title": "short title (max 8 words)",
  "body": "1 sentence: the obligation, when it hits, and what triggers it. End with: Verify exact requirements with your accountant or the relevant agency.",
  "urgency": "high" | "medium" | "low",
  "source_url": "optional canonical .gov URL if you can name one"
}

No prose outside the JSON array. If you have nothing useful to say, return [].`;
}

function contextHash(parts: Record<string, unknown>): string {
  return createHash("sha256").update(JSON.stringify(parts)).digest("hex").slice(0, 32);
}

export async function POST(_req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: "AI not configured" }, { status: 503 });
  }

  const { data: business } = await supabase
    .from("businesses")
    .select("id, name, entity_type, employee_count, industry_slug, plan_tier, billing_status")
    .eq("owner_id", user.id)
    .single();

  if (!business) {
    return NextResponse.json({ error: "Business not found" }, { status: 404 });
  }

  const tier = business.plan_tier as string | null;
  if (tier !== "business" && tier !== "accountant") {
    return NextResponse.json(
      { error: "AI insights require a paid plan.", upgradeRequired: true },
      { status: 403 }
    );
  }

  const rateLimit = tier === "accountant" ? RATE_LIMIT_ACCOUNTANT : RATE_LIMIT_BUSINESS;

  const { data: allowed, error: rateError } = await supabase.rpc(
    "try_consume_ai_rate_limit",
    { p_max: rateLimit, p_window: "1 hour" }
  );
  if (rateError || allowed !== true) {
    return NextResponse.json(
      { error: "Rate limit reached — try again in an hour." },
      { status: 429 }
    );
  }

  const { data: locationRow } = await supabase
    .from("locations")
    .select("state")
    .eq("business_id", business.id)
    .limit(1)
    .maybeSingle();

  const { data: deadlines } = await supabase
    .from("deadlines")
    .select("name, due_date, status, governing_agency, deadline_type")
    .eq("business_id", business.id)
    .order("due_date", { ascending: true })
    .limit(40);

  const tracked = (deadlines ?? []).map((d) => ({
    name: d.name,
    due_date: d.due_date,
    status: d.status,
    governing_agency: d.governing_agency,
  }));

  const ctx = {
    entity: business.entity_type,
    industry: business.industry_slug,
    state: locationRow?.state ?? null,
    employees: business.employee_count,
    trackedNames: tracked.map((t) => t.name).sort(),
  };
  const hash = contextHash(ctx);

  const admin = createAdminClient();
  const cacheMaxAgeMs = CACHE_TTL_HOURS * 60 * 60 * 1000;

  const { data: cached } = await admin
    .from("ai_insight_cache")
    .select("insights, context_hash, generated_at")
    .eq("business_id", business.id)
    .maybeSingle();

  if (
    cached &&
    cached.context_hash === hash &&
    Date.now() - new Date(cached.generated_at).getTime() < cacheMaxAgeMs
  ) {
    return NextResponse.json({ insights: cached.insights, cached: true });
  }

  try {
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const prompt = buildPrompt({
      entity: business.entity_type,
      industry: business.industry_slug,
      state: locationRow?.state ?? null,
      employees: business.employee_count,
      tracked,
    });

    const response = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 768,
      messages: [{ role: "user", content: prompt }],
    });

    const rawText =
      response.content[0].type === "text" ? response.content[0].text : "[]";

    let insights: Insight[] = [];
    try {
      const match = rawText.match(/\[[\s\S]*\]/);
      if (match) {
        const parsed = JSON.parse(match[0]) as Insight[];
        // Filter out insights whose title closely matches an existing tracked
        // deadline — guards against duplicate suggestions when the model
        // ignores the "do NOT duplicate" instruction.
        const trackedNamesLower = tracked.map((t) => t.name.toLowerCase());
        insights = parsed
          .filter((i) => typeof i.title === "string" && i.title.length > 0)
          .filter(
            (i) =>
              !trackedNamesLower.some(
                (n) => n.includes(i.title.toLowerCase()) || i.title.toLowerCase().includes(n)
              )
          )
          .slice(0, 5);
      }
    } catch {
      insights = [];
    }

    await admin
      .from("ai_insight_cache")
      .upsert({
        business_id: business.id,
        context_hash: hash,
        insights,
      });

    return NextResponse.json({ insights, cached: false });
  } catch (err) {
    console.error("[ai-insights] Anthropic API error:", err);
    return NextResponse.json(
      { error: "AI service temporarily unavailable. Please try again." },
      { status: 502 }
    );
  }
}
