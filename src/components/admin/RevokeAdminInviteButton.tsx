"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function RevokeAdminInviteButton({ id }: { id: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function handle() {
    if (!window.confirm("Revoke this admin invite?")) return;
    setBusy(true);
    await fetch(`/api/admin/invites?id=${encodeURIComponent(id)}`, {
      method: "DELETE",
    });
    setBusy(false);
    router.refresh();
  }

  return (
    <button
      onClick={handle}
      disabled={busy}
      className="t-utility !text-[12px] !text-[var(--color-mark)]"
    >
      {busy ? "REVOKING…" : "REVOKE →"}
    </button>
  );
}
