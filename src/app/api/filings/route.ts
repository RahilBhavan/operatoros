import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { checkBaaForPhi } from "@/lib/security/baa-gate";
import { dbError } from "@/lib/api/respond";
import {
  FILING_CATALOG,
  isFilingsConfigured,
  type FilingKind,
} from "@/lib/filings";
import { entitlementsFor } from "@/lib/entitlements";

export const runtime = "nodejs";

const VALID_KINDS = new Set(Object.keys(FILING_CATALOG)) as Set<FilingKind>;

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!isFilingsConfigured()) {
    return NextResponse.json(
      {
        error:
          "Filings-as-a-service is not yet available — partner integration pending.",
      },
      { status: 503 }
    );
  }

  let body: Record<string, unknown> = {};
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const kindRaw = typeof body.filing_kind === "string" ? body.filing_kind : "";
  if (!VALID_KINDS.has(kindRaw as FilingKind)) {
    return NextResponse.json({ error: "Unknown filing_kind" }, { status: 400 });
  }
  const kind = kindRaw as FilingKind;
  const def = FILING_CATALOG[kind];

  const deadlineId =
    typeof body.deadline_id === "string" ? body.deadline_id : null;

  const { data: business } = await supabase
    .from("businesses")
    .select("id, industry_slug, plan_tier")
    .eq("owner_id", user.id)
    .single();
  if (!business) {
    return NextResponse.json({ error: "Business not found" }, { status: 404 });
  }

  // Filings is a paid-tier feature — the partner-routing margin only
  // makes sense for Business/Accountant plans.
  const ents = entitlementsFor(business.plan_tier);
  if (!ents.ai) {
    return NextResponse.json(
      {
        error: "Filings-as-a-service requires a paid plan.",
        upgradeRequired: true,
      },
      { status: 403 }
    );
  }

  const baa = await checkBaaForPhi(supabase, {
    businessId: business.id,
    industrySlug: business.industry_slug,
  });
  if (baa) return NextResponse.json({ error: baa.error }, { status: baa.status });

  const { data, error } = await supabase
    .from("filings")
    .insert({
      business_id: business.id,
      deadline_id: deadlineId,
      filing_kind: kind,
      // Default the partner to harbor_compliance; the partner-router can
      // re-assign once it's built.
      provider: "harbor_compliance",
      price_cents: def.priceCents,
      created_by: user.id,
    })
    .select("id")
    .single();

  if (error || !data) {
    return dbError("filings/POST", error);
  }

  // Stripe one-time-charge checkout would be created here. For now we
  // return the filing id; the UI surfaces a placeholder.
  return NextResponse.json({
    id: data.id,
    checkout_url: null,
    status: "pending",
  });
}
