"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Body, Caption, Utility, Index, Button } from "@/components/doctrine";

export default function InviteMemberForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"member" | "admin">("member");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");
    setSubmitting(true);

    const res = await fetch("/api/team/invite", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email, role }),
    });

    setSubmitting(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data?.error ?? "Failed to send invite");
      return;
    }
    setSuccess(`Invite sent to ${email}.`);
    setEmail("");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="border-2 border-[var(--color-ground)]">
      <div className="bg-[var(--color-ground)] text-[var(--color-field)] px-5 py-2.5 flex items-center justify-between">
        <Utility className="!text-[var(--color-field)] !opacity-100">
          INVITE TEAMMATE
        </Utility>
        <Index className="!text-[var(--color-field)] !text-[12px] ">
          PA-INV
        </Index>
      </div>
      <div className="bg-[var(--color-field)] px-5 py-5 flex flex-col sm:flex-row gap-3 sm:items-end">
        <label htmlFor="invite-email" className="flex-1 flex flex-col gap-1">
          <Utility className="!text-[12px]">EMAIL</Utility>
          <input
            id="invite-email"
            type="email"
            required
            placeholder="email@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={submitting}
            className="t-input"
          />
        </label>
        <label htmlFor="invite-role" className="sm:w-40 flex flex-col gap-1">
          <Utility className="!text-[12px]">ROLE</Utility>
          <select
            id="invite-role"
            value={role}
            onChange={(e) => setRole(e.target.value as "member" | "admin")}
            disabled={submitting}
            className="t-input"
          >
            <option value="member">Member</option>
            <option value="admin">Admin</option>
          </select>
        </label>
        <Button type="submit" disabled={submitting || !email} variant="ground">
          {submitting ? "Sending…" : "Send invite →"}
        </Button>
      </div>
      {(error || success) && (
        <div className="bg-[var(--color-field)] px-5 pb-5">
          {error && (
            <div className="border-2 border-[var(--color-mark)] bg-[var(--color-mark)] text-[var(--color-field)] px-3 py-2">
              <Utility className="!text-[var(--color-field)] !opacity-100 !text-[12px] mb-0.5">ERROR</Utility>
              <Body className="!text-[var(--color-field)] !text-[13px]">{error}</Body>
            </div>
          )}
          {success && (
            <div className="border-2 border-[var(--color-ground)] px-3 py-2">
              <Utility className="!opacity-100 !text-[12px] mb-0.5">CONFIRMED</Utility>
              <Body className="!text-[13px]">{success}</Body>
            </div>
          )}
        </div>
      )}
      <div className="bg-[var(--color-field)] px-5 pb-4">
        <Caption className="!text-[12px] ">
          Invites expire after 14 days. Members view the dashboard; admins manage billing and the team.
        </Caption>
      </div>
    </form>
  );
}
