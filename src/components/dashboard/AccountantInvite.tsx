"use client";

import { useState } from "react";
import { Users, Copy, Check, ExternalLink } from "lucide-react";

interface Props {
  canInvite: boolean;
}

export default function AccountantInvite({ canInvite }: Props) {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [portalUrl, setPortalUrl] = useState("");
  const [copied, setCopied] = useState(false);

  if (!canInvite) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-5">
        <div className="flex items-center gap-2 mb-2">
          <Users className="w-4 h-4 text-slate-400" />
          <h3 className="text-sm font-semibold text-slate-700">Accountant Portal</h3>
          <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">
            Growth+
          </span>
        </div>
        <p className="text-xs text-slate-400">
          Share a live compliance dashboard with your accountant or CPA. Upgrade to Growth to enable.
        </p>
      </div>
    );
  }

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const res = await fetch("/api/accountant/invite", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ accountant_email: email, accountant_name: name }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error ?? "Failed to send invite");
      return;
    }

    const appUrl = window.location.origin;
    setPortalUrl(`${appUrl}/accountant/${data.token}`);
    setEmail("");
    setName("");
  }

  async function copyLink() {
    await navigator.clipboard.writeText(portalUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5">
      <div className="flex items-center gap-2 mb-4">
        <Users className="w-4 h-4 text-blue-600" />
        <h3 className="text-sm font-semibold text-slate-700">Accountant Portal</h3>
      </div>

      {portalUrl ? (
        <div>
          <p className="text-xs text-green-700 bg-green-50 rounded-lg px-3 py-2 mb-3">
            Invite sent! Share this link with your accountant:
          </p>
          <div className="flex items-center gap-2">
            <code className="text-xs bg-slate-100 rounded-lg px-3 py-2 flex-1 truncate text-slate-600">
              {portalUrl}
            </code>
            <button
              onClick={copyLink}
              className="flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 transition-colors shrink-0"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? "Copied!" : "Copy"}
            </button>
            <a
              href={portalUrl}
              target="_blank"
              rel="noreferrer"
              className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
          <button
            onClick={() => setPortalUrl("")}
            className="mt-3 text-xs text-blue-600 hover:underline"
          >
            Invite another accountant
          </button>
        </div>
      ) : (
        <form onSubmit={handleInvite} className="flex flex-col gap-3">
          <input
            type="text"
            placeholder="Accountant name (optional)"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <div className="flex gap-2">
            <input
              type="email"
              placeholder="accountant@firm.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="flex-1 px-3 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="submit"
              disabled={loading || !email}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white text-sm font-semibold rounded-xl transition-colors"
            >
              {loading ? "Sending…" : "Invite"}
            </button>
          </div>
          {error && (
            <p className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>
          )}
          <p className="text-xs text-slate-400">
            Your accountant gets a read-only view of your compliance calendar. No login required.
          </p>
        </form>
      )}
    </div>
  );
}
