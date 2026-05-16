"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function RevokeInviteButton({ membershipId }: { membershipId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function handleRevoke() {
    setBusy(true);
    await fetch(`/api/team/invite?id=${encodeURIComponent(membershipId)}`, {
      method: "DELETE",
    });
    setBusy(false);
    router.refresh();
  }

  return (
    <button
      onClick={handleRevoke}
      disabled={busy}
      className="t-utility !text-[12px] hover:text-[var(--color-mark)] disabled:opacity-50"
    >
      {busy ? "REVOKING…" : "REVOKE →"}
    </button>
  );
}
