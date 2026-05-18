"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function RevokeAccountantConnectionButton({
  connectionId,
}: {
  connectionId: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function handleRevoke() {
    if (
      !window.confirm(
        "Revoke this accountant's access? They will be locked out of the magic-link portal immediately."
      )
    )
      return;
    setBusy(true);
    await fetch(`/api/admin/accountant-connections/${connectionId}/revoke`, {
      method: "DELETE",
    });
    setBusy(false);
    router.refresh();
  }

  return (
    <button
      onClick={handleRevoke}
      disabled={busy}
      className="t-utility !text-[12px] !text-[var(--color-mark)]"
    >
      {busy ? "REVOKING…" : "REVOKE →"}
    </button>
  );
}
