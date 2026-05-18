import { Resend } from "resend";

let _resend: Resend | null = null;

function getResend(): Resend {
  if (!_resend) {
    if (!process.env.RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY is not set");
    }
    _resend = new Resend(process.env.RESEND_API_KEY);
  }
  return _resend;
}

const FROM = process.env.EMAIL_FROM ?? "OperatorOS <reminders@operatoros.com>";

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;");
}

function formatCents(cents: number | null | undefined): string {
  if (!cents || cents <= 0) return "";
  if (cents < 100000) return `$${(cents / 100).toFixed(0)}`;
  return `$${(cents / 100).toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
}

const SEVERITY_LABEL: Record<string, string> = {
  critical: "Critical",
  high: "High",
  medium: "Medium",
  low: "Low",
  info: "Informational",
};

const SEVERITY_COLOR: Record<string, string> = {
  critical: "#dc2626",
  high: "#ea580c",
  medium: "#ca8a04",
  low: "#64748b",
  info: "#94a3b8",
};

export interface ReminderEmailParams {
  to: string;
  businessName: string;
  deadlineName: string;
  daysUntilDue: number;
  dueDate: string;
  deadlineUrl: string;
  governingAgency?: string | null;
  severity?: string | null;
  penaltyEstimateCents?: number | null;
  statuteCitation?: string | null;
  sourceUrl?: string | null;
  unsubscribeUrl?: string | null;
}

export async function sendReminderEmail(params: ReminderEmailParams) {
  const {
    to,
    businessName,
    deadlineName,
    daysUntilDue,
    dueDate,
    deadlineUrl,
    governingAgency,
    severity,
    penaltyEstimateCents,
    statuteCitation,
    sourceUrl,
    unsubscribeUrl,
  } = params;

  const safeName = escapeHtml(businessName);
  const safeDeadline = escapeHtml(deadlineName);
  const safeDueDate = escapeHtml(dueDate);
  const safeUrl = deadlineUrl.startsWith("https://") ? deadlineUrl : "";
  const safeAgency = governingAgency ? escapeHtml(governingAgency) : null;
  const safeStatute = statuteCitation ? escapeHtml(statuteCitation) : null;
  const safeSourceUrl =
    sourceUrl && sourceUrl.startsWith("https://") ? sourceUrl : null;
  const safeUnsubUrl =
    unsubscribeUrl && unsubscribeUrl.startsWith("https://") ? unsubscribeUrl : null;

  const sev = severity ?? "medium";
  const sevColor = SEVERITY_COLOR[sev] ?? SEVERITY_COLOR.medium;
  const sevLabel = SEVERITY_LABEL[sev] ?? SEVERITY_LABEL.medium;
  const penaltyText = formatCents(penaltyEstimateCents);

  // Subject leads with risk dollars when known, otherwise with severity.
  const subjectPrefix =
    penaltyText
      ? `${penaltyText} penalty if missed`
      : sev === "critical" || sev === "high"
      ? `${sevLabel} priority`
      : "Reminder";

  const subject = `${subjectPrefix}: "${deadlineName}" due in ${daysUntilDue} day${daysUntilDue === 1 ? "" : "s"}`;

  const urgencyLine =
    daysUntilDue <= 1
      ? `This deadline is due ${daysUntilDue === 0 ? "today" : "tomorrow"}.`
      : daysUntilDue <= 7
      ? `This deadline is due in ${daysUntilDue} days.`
      : `Your deadline is coming up in ${daysUntilDue} days.`;

  const { error } = await getResend().emails.send({
    from: FROM,
    to,
    subject,
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 560px; margin: 0 auto; padding: 24px;">
        <div style="margin-bottom: 20px;">
          <span style="font-weight: 700; font-size: 18px; color: #1e293b;">OperatorOS</span>
        </div>

        <p style="color: #475569; margin: 0 0 8px;">Hi ${safeName},</p>
        <p style="color: #475569; margin: 0 0 16px;">${urgencyLine}</p>

        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin-bottom: 20px;">
          <p style="margin: 0 0 4px; font-size: 12px; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em;">Deadline</p>
          <p style="margin: 0 0 12px; font-size: 18px; font-weight: 600; color: #0f172a;">${safeDeadline}</p>
          <p style="margin: 0 0 4px; font-size: 14px; color: #64748b;">Due: <strong>${safeDueDate}</strong></p>
          ${safeAgency ? `<p style="margin: 0 0 4px; font-size: 13px; color: #64748b;">Agency: ${safeAgency}</p>` : ""}
          <p style="margin: 0 0 4px; font-size: 13px; color: ${sevColor};">
            <strong>${sevLabel} severity</strong>${penaltyText ? ` &middot; estimated penalty <strong>${penaltyText}</strong>` : ""}
          </p>
          ${safeStatute ? `<p style="margin: 0; font-size: 12px; color: #94a3b8;">${safeStatute}</p>` : ""}
        </div>

        <a href="${safeUrl}" style="display: inline-block; background: #2563eb; color: white; font-weight: 600; font-size: 14px; padding: 12px 24px; border-radius: 10px; text-decoration: none; margin-bottom: 16px;">
          View deadline →
        </a>

        ${safeSourceUrl ? `<p style="font-size: 12px; color: #64748b; margin: 0 0 16px;">Agency source: <a href="${safeSourceUrl}" style="color: #2563eb;">${escapeHtml(safeSourceUrl)}</a></p>` : ""}

        <p style="font-size: 11px; color: #94a3b8; border-top: 1px solid #f1f5f9; padding-top: 12px; margin: 16px 0 0;">
          Estimated penalty figures are statutory defaults; the actual amount may vary. OperatorOS does not provide legal, tax, or accounting advice — confirm exact requirements with the relevant agency or your accountant.
        </p>

        <p style="font-size: 11px; color: #94a3b8; margin: 12px 0 0;">
          ${safeUnsubUrl ? `<a href="${safeUnsubUrl}" style="color: #94a3b8;">Unsubscribe from these reminders</a> &middot; ` : ""}
          <a href="${process.env.NEXT_PUBLIC_APP_URL}/billing" style="color: #94a3b8;">Manage subscription</a>
        </p>
      </div>
    `,
  });

  if (error) throw new Error(`Email send failed: ${error.message}`);
}

export interface CorrectionStatusEmailParams {
  to: string;
  ruleName: string;
  status: "accepted" | "rejected";
  reviewNote?: string | null;
  appUrl: string;
}

// Sent to the accountant who proposed a rule correction once an admin accepts
// or rejects it. Failure to send is logged at the call site (fire-and-forget)
// — the correction state has already been committed.
export async function sendCorrectionStatusEmail(params: CorrectionStatusEmailParams) {
  const { to, ruleName, status, reviewNote, appUrl } = params;
  const safeRule = escapeHtml(ruleName);
  const safeNote = reviewNote ? escapeHtml(reviewNote) : null;
  const safeAppUrl = appUrl.replace(/\/$/, "");

  const headline =
    status === "accepted"
      ? "Your correction was accepted"
      : "Your correction was reviewed";
  const subject = `${headline}: ${ruleName}`;

  const body =
    status === "accepted"
      ? `An OperatorOS admin accepted your correction to <strong>${safeRule}</strong>. A new version of the rule is now live, and businesses on the affected deadline see the updated guidance on their dashboard.`
      : `An OperatorOS admin reviewed your correction to <strong>${safeRule}</strong> and decided not to apply it.`;

  const noteBlock = safeNote
    ? `<div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; margin: 16px 0;">
         <p style="margin: 0 0 4px; font-size: 11px; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em;">Reviewer note</p>
         <p style="margin: 0; font-size: 14px; color: #0f172a; line-height: 1.55;">${safeNote}</p>
       </div>`
    : "";

  const { error } = await getResend().emails.send({
    from: process.env.EMAIL_FROM ?? "noreply@operatoros.com",
    to,
    subject,
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 560px; margin: 0 auto; padding: 24px;">
        <div style="margin-bottom: 20px;">
          <span style="font-weight: 700; font-size: 18px; color: #1e293b;">OperatorOS</span>
        </div>

        <p style="color: #0f172a; font-size: 18px; font-weight: 600; margin: 0 0 12px;">${headline}</p>
        <p style="color: #475569; font-size: 14px; line-height: 1.55; margin: 0 0 12px;">${body}</p>
        ${noteBlock}

        <a href="${safeAppUrl}" style="display: inline-block; background: #2563eb; color: white; font-weight: 600; font-size: 14px; padding: 12px 24px; border-radius: 10px; text-decoration: none; margin: 8px 0 16px;">
          Open OperatorOS →
        </a>

        <p style="font-size: 11px; color: #94a3b8; border-top: 1px solid #f1f5f9; padding-top: 12px; margin: 16px 0 0;">
          This email is sent automatically when an OperatorOS admin reviews a correction you proposed. Reply to this email if anything looks wrong.
        </p>
      </div>
    `,
  });

  if (error) throw new Error(`Correction-status email send failed: ${error.message}`);
}

export interface TrialEndingEmailParams {
  to: string;
  businessName: string | null;
  trialEndIso: string;
  billingUrl: string;
}

export async function sendTrialEndingEmail(params: TrialEndingEmailParams) {
  const { to, businessName, trialEndIso, billingUrl } = params;
  const safeName = businessName ? escapeHtml(businessName) : "there";
  const safeBilling = billingUrl.startsWith("https://") ? billingUrl : "";
  const trialEndsLabel = new Date(trialEndIso).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  const subject = `Your OperatorOS trial ends ${trialEndsLabel}`;

  const { error } = await getResend().emails.send({
    from: FROM,
    to,
    subject,
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 560px; margin: 0 auto; padding: 24px;">
        <div style="margin-bottom: 20px;">
          <span style="font-weight: 700; font-size: 18px; color: #1e293b;">OperatorOS</span>
        </div>

        <p style="color: #0f172a; font-size: 18px; font-weight: 600; margin: 0 0 12px;">Your trial ends ${trialEndsLabel}</p>
        <p style="color: #475569; font-size: 14px; line-height: 1.55; margin: 0 0 16px;">
          Hi ${safeName} — heads up that your OperatorOS trial converts to a paid subscription on <strong>${trialEndsLabel}</strong>. You don't need to do anything to keep your deadlines, reminders, and AI insights running.
        </p>
        <p style="color: #475569; font-size: 14px; line-height: 1.55; margin: 0 0 20px;">
          If you'd like to change plans, update payment, or cancel before the trial ends, you can do all three from the billing page.
        </p>

        <a href="${safeBilling}" style="display: inline-block; background: #2563eb; color: white; font-weight: 600; font-size: 14px; padding: 12px 24px; border-radius: 10px; text-decoration: none; margin: 0 0 16px;">
          Manage billing →
        </a>

        <p style="font-size: 11px; color: #94a3b8; border-top: 1px solid #f1f5f9; padding-top: 12px; margin: 16px 0 0;">
          This is the standard Stripe trial-ending notice — sent once, three days before the trial converts.
        </p>
      </div>
    `,
  });

  if (error) throw new Error(`Trial-ending email send failed: ${error.message}`);
}
