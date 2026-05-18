"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function RevokeShareTokenButton({ tokenId }: { tokenId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function handleRevoke() {
    if (!window.confirm("Revoke this share link? Recipients will lose access immediately.")) return;
    setBusy(true);
    await fetch(`/api/admin/share-tokens/${tokenId}/revoke`, { method: "DELETE" });
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
