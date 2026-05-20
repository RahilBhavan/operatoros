import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import NotificationPreferencesForm from "@/components/settings/NotificationPreferencesForm";
import { Breadcrumb } from "@/components/doctrine/Breadcrumb";
import { PageHeader } from "@/components/doctrine/PageHeader";
import { PageShell } from "@/components/doctrine/PageShell";
import { Body } from "@/components/doctrine/Typography";
import { settings } from "@/lib/ui-copy";

export const dynamic = "force-dynamic";

export default async function NotificationsSettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");

  const { data: prefs } = await supabase
    .from("notification_preferences")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  const smsConfigured = Boolean(process.env.TWILIO_ACCOUNT_SID);

  return (
    <PageShell width="narrow">
      <Breadcrumb
        items={[
          { label: "Settings", href: "/settings" },
          { label: "Notifications" },
        ]}
      />
      <PageHeader
        title={settings.notifications.title}
        description={settings.notifications.description}
      />

      {!smsConfigured ? (
        <div className="border-2 border-[var(--color-ground)] px-4 py-3">
          <p className="t-utility mb-1">SMS not available on this deployment</p>
          <Body>
            Your operator hasn&apos;t connected a Twilio account yet, so the SMS
            option below is informational. Email reminders continue to work as
            usual.
          </Body>
        </div>
      ) : null}

      <NotificationPreferencesForm
        initial={prefs}
        smsConfigured={smsConfigured}
      />
    </PageShell>
  );
}
