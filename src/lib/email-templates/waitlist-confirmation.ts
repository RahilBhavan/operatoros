type WaitlistConfirmationParams = {
  referralLink: string;
  state: string | null;
};

export function buildWaitlistConfirmation({
  referralLink,
  state,
}: WaitlistConfirmationParams): { subject: string; html: string } {
  const region = state ?? "your region";

  const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>You're on the OperatorOS waitlist</title>
  </head>
  <body style="margin:0;padding:0;background:#F4EDE0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#14213D;">
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#F4EDE0;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="520" style="max-width:520px;width:100%;background:#F4EDE0;border:2px solid #14213D;">
            <tr>
              <td style="background:#14213D;color:#F4EDE0;padding:20px 24px;text-align:left;">
                <span style="display:inline-block;width:32px;height:32px;line-height:32px;text-align:center;background:#C8102E;color:#F4EDE0;font-weight:900;font-size:20px;vertical-align:middle;">O</span>
                <span style="font-size:13px;letter-spacing:0.12em;text-transform:uppercase;font-weight:700;margin-left:12px;vertical-align:middle;">OperatorOS</span>
              </td>
            </tr>
            <tr>
              <td style="padding:32px 28px 8px;">
                <p style="margin:0 0 4px;font-size:11px;letter-spacing:0.14em;text-transform:uppercase;font-weight:700;color:#C8102E;">Waitlist · confirmed</p>
                <h1 style="margin:0;font-size:30px;line-height:1.1;font-weight:900;letter-spacing:-0.01em;color:#14213D;">You&rsquo;re on the list.</h1>
              </td>
            </tr>
            <tr>
              <td style="padding:16px 28px 8px;">
                <p style="margin:0 0 14px;font-size:15px;line-height:1.55;color:#14213D;">
                  Thanks for joining the OperatorOS waitlist. We onboard businesses in priority order by jurisdiction, and we&rsquo;ll email you when ${region} goes live in the next cohort.
                </p>
                <p style="margin:0;font-size:15px;line-height:1.55;color:#14213D;">
                  Want to skip the line? Share your invite link &mdash; each signup that uses it bumps you forward in the queue for your state.
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding:20px 28px 8px;">
                <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border:2px solid #14213D;background:#ECE3D0;">
                  <tr>
                    <td style="padding:14px 16px;font-size:11px;letter-spacing:0.12em;text-transform:uppercase;font-weight:700;color:#14213D;">
                      Your invite link
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:0 16px 14px;font-family:'SFMono-Regular',Menlo,Monaco,Consolas,monospace;font-size:13px;color:#14213D;word-break:break-all;">
                      <a href="${referralLink}" style="color:#C8102E;text-decoration:underline;text-decoration-thickness:2px;text-underline-offset:3px;">${referralLink}</a>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding:24px 28px 32px;">
                <p style="margin:0;font-size:12px;line-height:1.55;color:#14213D;opacity:0.7;">
                  You can ignore this email and you&rsquo;ll still be invited in the next cohort for ${region}.
                </p>
              </td>
            </tr>
            <tr>
              <td style="background:#14213D;color:#F4EDE0;padding:14px 24px;font-size:11px;letter-spacing:0.12em;text-transform:uppercase;text-align:center;">
                Compliance OS for the 1&ndash;50 employee business
              </td>
            </tr>
          </table>
          <p style="margin:18px auto 0;max-width:520px;font-size:11px;line-height:1.5;color:#14213D;opacity:0.6;text-align:center;">
            Information provided by OperatorOS is not legal, tax, accounting, or compliance advice. Verify obligations with a licensed professional before relying on them.
          </p>
        </td>
      </tr>
    </table>
  </body>
</html>`;

  return {
    subject: "You're on the OperatorOS waitlist",
    html,
  };
}
