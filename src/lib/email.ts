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

export interface ReminderEmailParams {
  to: string;
  businessName: string;
  deadlineName: string;
  daysUntilDue: number;
  dueDate: string;
  deadlineUrl: string;
}

export async function sendReminderEmail(params: ReminderEmailParams) {
  const { to, businessName, deadlineName, daysUntilDue, dueDate, deadlineUrl } =
    params;

  const safeName = escapeHtml(businessName);
  const safeDeadline = escapeHtml(deadlineName);
  const safeDueDate = escapeHtml(dueDate);
  const safeUrl = deadlineUrl.startsWith("https://") ? deadlineUrl : "";

  const urgencyLine =
    daysUntilDue <= 7
      ? `⚠️ This deadline is due in ${daysUntilDue} day${daysUntilDue === 1 ? "" : "s"}.`
      : `Your deadline is coming up in ${daysUntilDue} days.`;

  const { error } = await getResend().emails.send({
    from: FROM,
    to,
    subject: `Reminder: "${deadlineName}" is due in ${daysUntilDue} days`,
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 520px; margin: 0 auto; padding: 24px;">
        <div style="margin-bottom: 24px;">
          <span style="font-weight: 700; font-size: 18px; color: #1e293b;">OperatorOS</span>
        </div>

        <p style="color: #475569; margin-bottom: 8px;">Hi ${safeName},</p>
        <p style="color: #475569; margin-bottom: 16px;">${urgencyLine}</p>

        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
          <p style="margin: 0 0 4px; font-size: 12px; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em;">Deadline</p>
          <p style="margin: 0 0 12px; font-size: 18px; font-weight: 600; color: #0f172a;">${safeDeadline}</p>
          <p style="margin: 0; font-size: 14px; color: #64748b;">Due: <strong>${safeDueDate}</strong></p>
        </div>

        <a href="${safeUrl}" style="display: inline-block; background: #2563eb; color: white; font-weight: 600; font-size: 14px; padding: 12px 24px; border-radius: 10px; text-decoration: none; margin-bottom: 24px;">
          View deadline →
        </a>

        <p style="font-size: 12px; color: #94a3b8; border-top: 1px solid #f1f5f9; padding-top: 16px; margin: 0;">
          You're receiving this because you have an account on OperatorOS.
          <a href="${process.env.NEXT_PUBLIC_APP_URL}/billing" style="color: #94a3b8;">Manage subscription</a>
        </p>
      </div>
    `,
  });

  if (error) throw new Error(`Email send failed: ${error.message}`);
}
