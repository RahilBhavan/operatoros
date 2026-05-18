"use client";

import { useState, useTransition } from "react";
import {
  createInviteLink,
  revokeInviteLink,
} from "@/app/(app)/settings/network/actions";

export function CreateLinkForm({ appUrl }: { appUrl: string }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<{ code: string; url: string } | null>(
    null
  );

  function onSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await createInviteLink(formData);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      const url = `${appUrl.replace(/\/$/, "")}/i/${result.code}`;
      setCreated({ code: result.code, url });
    });
  }

  function copy(url: string) {
    void navigator.clipboard?.writeText(url);
  }

  return (
    <form
      action={onSubmit}
      className="border-2 border-[var(--color-ground)] p-5 flex flex-col gap-3"
    >
      <label
        className="text-[12px] font-bold uppercase tracking-wider"
        style={{ fontFamily: "var(--font-index)" }}
      >
        Label (optional)
        <input
          name="label"
          maxLength={120}
          placeholder="Q1 restaurant push"
          className="mt-1 block w-full border border-[var(--color-ground)] px-3 py-2 text-[14px] bg-[var(--color-field)]"
          style={{ fontFamily: "var(--font-body)" }}
          disabled={pending}
        />
      </label>
      <button
        type="submit"
        disabled={pending}
        className="self-start bg-[var(--color-ground)] text-[var(--color-field)] px-4 py-2 text-[12px] uppercase tracking-wider font-bold disabled:opacity-50"
        style={{ fontFamily: "var(--font-index)" }}
      >
        {pending ? "Creating…" : "Create link"}
      </button>
      {error ? (
        <div
          className="text-[12px] text-[var(--color-mark)] uppercase tracking-wider"
          style={{ fontFamily: "var(--font-utility)" }}
        >
          {error}
        </div>
      ) : null}
      {created ? (
        <div className="bg-[var(--color-field-soft)] border border-[var(--color-ground)] p-3 flex flex-col gap-2">
          <div
            className="text-[11px] uppercase tracking-wider text-[var(--color-ground)]"
            style={{ fontFamily: "var(--font-utility)" }}
          >
            New link — share with your client
          </div>
          <code className="text-[13px] break-all">{created.url}</code>
          <button
            type="button"
            onClick={() => copy(created.url)}
            className="self-start border border-[var(--color-ground)] px-3 py-1 text-[11px] uppercase tracking-wider"
            style={{ fontFamily: "var(--font-index)" }}
          >
            Copy
          </button>
        </div>
      ) : null}
    </form>
  );
}

export function RevokeLinkButton({ linkId }: { linkId: string }) {
  const [pending, startTransition] = useTransition();
  const [confirming, setConfirming] = useState(false);

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="border border-[var(--color-ground)] px-3 py-1 text-[11px] uppercase tracking-wider"
        style={{ fontFamily: "var(--font-index)" }}
      >
        Revoke
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <span
        className="text-[11px] uppercase tracking-wider"
        style={{ fontFamily: "var(--font-utility)" }}
      >
        Sure?
      </span>
      <button
        type="button"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            await revokeInviteLink(linkId);
            setConfirming(false);
          })
        }
        className="bg-[var(--color-mark)] text-white px-3 py-1 text-[11px] uppercase tracking-wider disabled:opacity-50"
        style={{ fontFamily: "var(--font-index)" }}
      >
        {pending ? "…" : "Yes"}
      </button>
      <button
        type="button"
        disabled={pending}
        onClick={() => setConfirming(false)}
        className="border border-[var(--color-ground)] px-3 py-1 text-[11px] uppercase tracking-wider disabled:opacity-50"
        style={{ fontFamily: "var(--font-index)" }}
      >
        No
      </button>
    </div>
  );
}
