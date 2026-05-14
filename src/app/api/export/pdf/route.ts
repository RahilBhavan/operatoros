import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { escapeHtml } from "@/lib/deadline-utils";

// Returns HTML that the browser can print as PDF
// (server-rendered, no heavy PDF library needed for MVP)
export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: business } = await supabase
    .from("businesses")
    .select("id, name, plan_tier, billing_status")
    .eq("owner_id", user.id)
    .single();

  if (!business) {
    return NextResponse.json({ error: "Business not found" }, { status: 404 });
  }

  const isEligible =
    business.billing_status === "active" ||
    business.billing_status === "trialing";

  if (!isEligible) {
    return NextResponse.json(
      { error: "Active subscription required" },
      { status: 403 }
    );
  }

  const { data: deadlines } = await supabase
    .from("deadlines")
    .select("*")
    .eq("business_id", business.id)
    .order("due_date", { ascending: true });

  const now = new Date();
  const generated = now.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const rows = (deadlines ?? []).map((d) => {
    const days = Math.floor(
      (new Date(d.due_date).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );
    let status = d.status;
    if (status !== "compliant") {
      status = days < 0 ? "overdue" : days <= 30 ? "in_progress" : "upcoming";
    }
    return { ...d, computed: status, days };
  });

  const compliant = rows.filter((d) => d.computed === "compliant").length;
  const overdue = rows.filter((d) => d.computed === "overdue").length;
  const score =
    rows.length === 0
      ? 100
      : Math.round(
          ((compliant + rows.filter((d) => d.computed === "upcoming").length) /
            rows.length) *
            100
        );

  const statusColor: Record<string, string> = {
    compliant: "#16a34a",
    overdue: "#dc2626",
    in_progress: "#d97706",
    upcoming: "#2563eb",
  };

  const statusLabel: Record<string, string> = {
    compliant: "Compliant",
    overdue: "Overdue",
    in_progress: "In Progress",
    upcoming: "Upcoming",
  };

  const tableRows = rows
    .map(
      (d) => `
      <tr>
        <td>${escapeHtml(d.name)}</td>
        <td>${escapeHtml(d.deadline_type)}</td>
        <td>${escapeHtml(d.governing_agency ?? "—")}</td>
        <td>${new Date(d.due_date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</td>
        <td><span style="color:${statusColor[d.computed]};font-weight:600">${statusLabel[d.computed]}</span></td>
      </tr>
    `
    )
    .join("");

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${escapeHtml(business.name)} — Compliance Audit Report</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #0f172a; padding: 40px; font-size: 13px; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 32px; padding-bottom: 16px; border-bottom: 2px solid #e2e8f0; }
    .logo { font-weight: 800; font-size: 18px; color: #2563eb; }
    .meta { text-align: right; color: #64748b; font-size: 11px; }
    h1 { font-size: 22px; font-weight: 700; margin-bottom: 4px; }
    .subtitle { color: #64748b; margin-bottom: 24px; }
    .stats { display: flex; gap: 24px; margin-bottom: 32px; }
    .stat { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px 24px; text-align: center; }
    .stat-value { font-size: 28px; font-weight: 800; }
    .stat-label { font-size: 11px; color: #64748b; margin-top: 2px; }
    table { width: 100%; border-collapse: collapse; }
    th { text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; color: #64748b; padding: 8px 12px; background: #f8fafc; border-bottom: 1px solid #e2e8f0; }
    td { padding: 10px 12px; border-bottom: 1px solid #f1f5f9; font-size: 12px; }
    tr:last-child td { border-bottom: none; }
    .footer { margin-top: 32px; padding-top: 16px; border-top: 1px solid #e2e8f0; text-align: center; color: #94a3b8; font-size: 11px; }
    @media print { body { padding: 20px; } }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="logo">OperatorOS</div>
    </div>
    <div class="meta">
      <div>Compliance Audit Report</div>
      <div>Generated: ${generated}</div>
    </div>
  </div>

  <h1>${escapeHtml(business.name)}</h1>
  <p class="subtitle">Compliance summary across ${rows.length} deadline${rows.length !== 1 ? "s" : ""}</p>

  <div class="stats">
    <div class="stat">
      <div class="stat-value" style="color:${score >= 80 ? "#16a34a" : score >= 60 ? "#d97706" : "#dc2626"}">${score}%</div>
      <div class="stat-label">Compliance Score</div>
    </div>
    <div class="stat">
      <div class="stat-value" style="color:#dc2626">${overdue}</div>
      <div class="stat-label">Overdue</div>
    </div>
    <div class="stat">
      <div class="stat-value" style="color:#16a34a">${compliant}</div>
      <div class="stat-label">Compliant</div>
    </div>
    <div class="stat">
      <div class="stat-value">${rows.length}</div>
      <div class="stat-label">Total Deadlines</div>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th>Deadline</th>
        <th>Type</th>
        <th>Authority</th>
        <th>Due Date</th>
        <th>Status</th>
      </tr>
    </thead>
    <tbody>
      ${tableRows}
    </tbody>
  </table>

  <div class="footer">
    This report was generated by OperatorOS · operatoros.com
  </div>

  <script>window.onload = () => window.print();</script>
</body>
</html>`;

  return new NextResponse(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Content-Disposition": `inline; filename="compliance-report-${Date.now()}.html"`,
    },
  });
}

