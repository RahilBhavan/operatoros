import type { Metadata } from "next";
import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  Destination,
  Body,
  Caption,
  Utility,
  Index,
} from "@/components/doctrine";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  robots: { index: false, follow: false, nocache: true },
};

export default async function UnsubscribePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const supabase = createAdminClient();

  const { data: ok } = await supabase.rpc("unsubscribe_reminders", {
    p_token: token,
  });

  return (
    <div className="min-h-screen bg-[var(--color-field)] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-[480px] border-2 border-[var(--color-ground)]">
        <div
          className={`px-7 pt-6 pb-7 text-[var(--color-field)] ${
            ok ? "bg-[var(--color-ground)]" : "bg-[var(--color-mark)]"
          }`}
        >
          <div className="flex items-center justify-between mb-6">
            <Index className="!text-[12px] !text-[var(--color-field)] opacity-80">
              REMINDERS · {ok ? "PAUSED" : "INVALID"}
            </Index>
            <span className="tag-tab -mt-6">{ok ? "OK" : "ERR"}</span>
            <Utility className="opacity-80">SECTOR · {ok ? "C" : "X"}</Utility>
          </div>
          <Destination className="!text-[var(--color-field)] !text-[60px] !leading-none">
            {ok ? "PAUSED." : "INVALID."}
          </Destination>
        </div>

        <div className="bg-[var(--color-field)] px-7 py-7">
          <Body>
            {ok
              ? "We've turned off email reminders for this account. You can re-enable them anytime from your settings."
              : "We couldn't find an active reminder preference matching this link. It may have already been used, or the URL may be incorrect."}
          </Body>
          <Link
            href="/dashboard"
            className="inline-block mt-6 t-link t-utility"
          >
            Go to dashboard →
          </Link>
        </div>
      </div>
    </div>
  );
}
