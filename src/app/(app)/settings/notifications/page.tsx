import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import NotificationPreferencesForm from "@/components/settings/NotificationPreferencesForm";

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
    <div className="flex flex-col gap-8 max-w-[720px]">
      <header className="border-b-2 border-[var(--color-ground)] pb-5">
        <div className="t-utility mb-2">PA-NTF</div>
        <h1
          style={{
            fontFamily: "var(--font-destination)",
            fontWeight: 900,
            fontSize: "clamp(36px, 5vw, 56px)",
            lineHeight: 1,
            letterSpacing: "-0.02em",
            textTransform: "uppercase",
          }}
        >
          Notifications
        </h1>
        <p
          className="mt-3 max-w-[640px]"
          style={{ fontFamily: "var(--font-index)", fontSize: 15 }}
        >
          Choose how deadline reminders reach you. Email is the default;
          SMS adds field-worker coverage if you&rsquo;re away from a desk.
        </p>
      </header>

      {!smsConfigured ? (
        <div className="border-2 border-[var(--color-ground)] px-5 py-4">
          <div className="t-utility mb-1">SMS not configured on this deployment</div>
          <p style={{ fontFamily: "var(--font-index)", fontSize: 14 }}>
            Your operator hasn&rsquo;t connected a Twilio account yet, so the
            SMS option below is informational. Email reminders continue to
            work as usual.
          </p>
        </div>
      ) : null}

      <NotificationPreferencesForm
        initial={prefs}
        smsConfigured={smsConfigured}
      />
    </div>
  );
}
