"use client";

import { useState } from "react";
import {
  Shield,
  Bell,
  FileText,
  CheckCircle,
  AlertTriangle,
  TrendingDown,
  ArrowRight,
  Check,
  X,
} from "lucide-react";

const PRICING_TIERS = [
  {
    name: "Starter",
    price: 29,
    description: "For sole proprietors and micro-businesses",
    features: [
      "1 location",
      "Up to 2 users",
      "50 deadlines tracked",
      "500 MB document storage",
      "Email reminders",
      "Basic PDF audit export",
    ],
    notIncluded: ["SMS reminders", "Team assignments", "Accountant view"],
    highlighted: false,
  },
  {
    name: "Growth",
    price: 79,
    description: "For businesses with employees and multiple compliance needs",
    features: [
      "3 locations",
      "Up to 10 users",
      "Unlimited deadlines",
      "5 GB document storage",
      "Email + SMS reminders",
      "Full PDF audit export",
      "Team assignments",
      "Accountant view",
      "Compliance health score",
    ],
    notIncluded: [],
    highlighted: true,
  },
  {
    name: "Scale",
    price: 149,
    description: "For multi-location businesses and growing teams",
    features: [
      "10 locations",
      "Unlimited users",
      "Unlimited deadlines",
      "25 GB document storage",
      "Email + SMS + WhatsApp",
      "Full audit export + API",
      "Team assignments",
      "Accountant view",
      "Compliance health score",
      "Dedicated CSM",
    ],
    notIncluded: [],
    highlighted: false,
  },
];

const PAIN_STATS = [
  {
    stat: "53%",
    label:
      "of small businesses had a near-miss or compliance failure in the past 2 years",
    icon: AlertTriangle,
    color: "text-red-600",
    bg: "bg-red-50",
  },
  {
    stat: "$14,200",
    label:
      "average cost per missed compliance deadline (fines, closures, lost contracts)",
    icon: TrendingDown,
    color: "text-orange-600",
    bg: "bg-orange-50",
  },
  {
    stat: "47",
    label:
      "median number of compliance deadlines a small business has per year",
    icon: Bell,
    color: "text-yellow-600",
    bg: "bg-yellow-50",
  },
];

const HOW_IT_WORKS = [
  {
    step: "1",
    title: "Answer 5 questions",
    description:
      "Tell us your industry, state, employee count, and entity type. We map every deadline that applies to your business — instantly.",
    icon: FileText,
  },
  {
    step: "2",
    title: "Review your compliance calendar",
    description:
      "See all your deadlines pre-populated with due dates, governing agencies, and document requirements. Add or edit anything.",
    icon: CheckCircle,
  },
  {
    step: "3",
    title: "Never miss a deadline again",
    description:
      "We send multi-channel reminders 120, 90, 60, 30, 14, and 7 days out. Your documents are stored and audit-ready in 30 seconds.",
    icon: Shield,
  },
];

const DEADLINE_CATEGORIES = [
  {
    title: "Business License Renewals",
    pct: "28%",
    desc: "City, county, and state licenses",
  },
  {
    title: "Employee Certifications",
    pct: "22%",
    desc: "OSHA, food handler, CDL, safety certs",
  },
  {
    title: "COI / Insurance Renewals",
    pct: "17%",
    desc: "Certificates of insurance for GC work",
  },
  {
    title: "Entity Filings",
    pct: "13%",
    desc: "Annual state reports, registered agent",
  },
  {
    title: "Equipment Inspections",
    pct: "9%",
    desc: "Fire safety, health dept, OSHA logs",
  },
  {
    title: "Tax Deadlines",
    pct: "7%",
    desc: "Sales tax, payroll tax, quarterly estimates",
  },
  {
    title: "Other Permits & Filings",
    pct: "4%",
    desc: "EPA, DOT, state board renewals",
  },
];

export default function LandingPage() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleWaitlist(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });

      const data: { error?: string } = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Something went wrong. Please try again.");
        return;
      }

      setSubmitted(true);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="border-b border-slate-100 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="w-6 h-6 text-blue-600" />
            <span className="font-bold text-xl text-slate-900">OperatorOS</span>
          </div>
          <a
            href="#waitlist"
            className="text-sm font-medium text-blue-600 hover:text-blue-700"
          >
            Join Waitlist →
          </a>
        </div>
      </nav>

      {/* Hero */}
      <section className="px-6 py-20 text-center">
        <div className="max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 text-sm font-medium px-4 py-1.5 rounded-full mb-6">
            <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
            Currently in Phase 0 — Chicago metro waitlist open
          </div>

          <h1 className="text-5xl font-extrabold text-slate-900 leading-tight mb-6">
            Never get blindsided by a{" "}
            <span className="text-blue-600">compliance failure</span> again
          </h1>

          <p className="text-xl text-slate-600 mb-10 leading-relaxed">
            OperatorOS auto-discovers every regulatory deadline your small
            business has, stores your documents, and sends reminders before
            anything lapses. Audit-ready in 30 seconds.
          </p>

          {submitted ? (
            <div className="inline-flex items-center gap-3 bg-green-50 border border-green-200 text-green-800 px-6 py-4 rounded-xl font-medium">
              <CheckCircle className="w-5 h-5 text-green-600" />
              You&apos;re on the list. We&apos;ll be in touch soon.
            </div>
          ) : (
            <form
              id="waitlist"
              onSubmit={handleWaitlist}
              className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto"
            >
              <input
                type="email"
                required
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex-1 px-4 py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-900 placeholder:text-slate-400"
              />
              <button
                type="submit"
                disabled={loading}
                className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold px-6 py-3 rounded-xl transition-colors whitespace-nowrap"
              >
                {loading ? "Joining..." : "Join Waitlist"}
                {!loading && <ArrowRight className="w-4 h-4" />}
              </button>
            </form>
          )}

          {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

          <p className="mt-4 text-sm text-slate-500">
            No spam. No credit card. Early access pricing locked in at signup.
          </p>
        </div>
      </section>

      {/* Pain stats */}
      <section className="bg-slate-50 px-6 py-16">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-center text-2xl font-bold text-slate-900 mb-12">
            The compliance gap that&apos;s costing small businesses $127B a year
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {PAIN_STATS.map(({ stat, label, icon: Icon, color, bg }) => (
              <div
                key={stat}
                className={`${bg} rounded-2xl p-6 flex flex-col items-start gap-3`}
              >
                <Icon className={`w-7 h-7 ${color}`} />
                <div className={`text-4xl font-extrabold ${color}`}>{stat}</div>
                <p className="text-slate-700 text-sm leading-relaxed">{label}</p>
              </div>
            ))}
          </div>
          <p className="text-center text-xs text-slate-400 mt-6">
            Sources: SBA, NFIB, synthetic 1M-business survey framework
          </p>
        </div>
      </section>

      {/* How it works */}
      <section className="px-6 py-20">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-center text-3xl font-bold text-slate-900 mb-4">
            From zero to audit-ready in under 30 minutes
          </h2>
          <p className="text-center text-slate-600 mb-16">
            No manual research. No spreadsheets. No forgotten deadlines.
          </p>
          <div className="grid md:grid-cols-3 gap-10">
            {HOW_IT_WORKS.map(({ step, title, description, icon: Icon }) => (
              <div key={step} className="flex flex-col items-start gap-4">
                <div className="flex items-center justify-center w-12 h-12 bg-blue-600 rounded-xl">
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <div className="text-xs font-bold text-blue-600 uppercase tracking-widest">
                  Step {step}
                </div>
                <h3 className="text-xl font-bold text-slate-900">{title}</h3>
                <p className="text-slate-600 leading-relaxed">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* What we track */}
      <section className="bg-slate-900 text-white px-6 py-20">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">
            We track what your calendar forgets
          </h2>
          <p className="text-slate-400 mb-12">
            The 7 deadline categories that cause 90% of small business
            compliance failures
          </p>
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4 text-left">
            {DEADLINE_CATEGORIES.map(({ title, pct, desc }) => (
              <div
                key={title}
                className="bg-slate-800 rounded-xl p-5 flex flex-col gap-1"
              >
                <div className="text-blue-400 text-xs font-bold uppercase tracking-widest mb-1">
                  {pct} of failures
                </div>
                <div className="font-semibold text-white">{title}</div>
                <div className="text-slate-400 text-sm">{desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="px-6 py-20">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-center text-3xl font-bold text-slate-900 mb-4">
            Simple, transparent pricing
          </h2>
          <p className="text-center text-slate-600 mb-4">
            The average missed compliance deadline costs{" "}
            <strong>$14,200</strong>. OperatorOS pays for itself after preventing
            one incident.
          </p>
          <p className="text-center text-sm text-blue-600 font-medium mb-12">
            Waitlist members lock in current pricing for life.
          </p>

          <div className="grid md:grid-cols-3 gap-6">
            {PRICING_TIERS.map((tier) => (
              <div
                key={tier.name}
                className={`rounded-2xl p-8 flex flex-col gap-5 border-2 relative ${
                  tier.highlighted
                    ? "border-blue-600 bg-blue-50"
                    : "border-slate-200 bg-white"
                }`}
              >
                {tier.highlighted && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-xs font-bold px-4 py-1 rounded-full">
                    MOST POPULAR
                  </div>
                )}
                <div>
                  <div className="text-xl font-bold text-slate-900">
                    {tier.name}
                  </div>
                  <div className="text-slate-500 text-sm mt-1">
                    {tier.description}
                  </div>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-extrabold text-slate-900">
                    ${tier.price}
                  </span>
                  <span className="text-slate-500">/mo</span>
                </div>
                <ul className="flex flex-col gap-2 flex-1">
                  {tier.features.map((f) => (
                    <li
                      key={f}
                      className="flex items-start gap-2 text-sm text-slate-700"
                    >
                      <Check className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
                      {f}
                    </li>
                  ))}
                  {tier.notIncluded.map((f) => (
                    <li
                      key={f}
                      className="flex items-start gap-2 text-sm text-slate-400"
                    >
                      <X className="w-4 h-4 mt-0.5 shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <a
                  href="#waitlist"
                  className={`text-center font-semibold py-3 rounded-xl transition-colors ${
                    tier.highlighted
                      ? "bg-blue-600 hover:bg-blue-700 text-white"
                      : "bg-slate-900 hover:bg-slate-700 text-white"
                  }`}
                >
                  Join Waitlist
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="bg-blue-600 px-6 py-16 text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl font-bold text-white mb-4">
            Join the waitlist today
          </h2>
          <p className="text-blue-100 mb-8">
            We&apos;re launching in the Chicago metro first. Waitlist members
            get early access, locked-in pricing, and a free 1:1 compliance audit
            session.
          </p>
          {submitted ? (
            <div className="inline-flex items-center gap-3 bg-white/20 text-white px-6 py-4 rounded-xl font-medium">
              <CheckCircle className="w-5 h-5" />
              You&apos;re on the list. We&apos;ll be in touch soon.
            </div>
          ) : (
            <form
              onSubmit={handleWaitlist}
              className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto"
            >
              <input
                type="email"
                required
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex-1 px-4 py-3 rounded-xl focus:outline-none text-slate-900 placeholder:text-slate-400"
              />
              <button
                type="submit"
                disabled={loading}
                className="flex items-center justify-center gap-2 bg-white hover:bg-slate-100 disabled:bg-white/70 text-blue-700 font-semibold px-6 py-3 rounded-xl transition-colors whitespace-nowrap"
              >
                {loading ? "Joining..." : "Get Early Access"}
                {!loading && <ArrowRight className="w-4 h-4" />}
              </button>
            </form>
          )}
          {error && <p className="mt-3 text-sm text-blue-100">{error}</p>}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-100 px-6 py-8 text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Shield className="w-4 h-4 text-blue-600" />
          <span className="font-bold text-slate-900">OperatorOS</span>
        </div>
        <p className="text-sm text-slate-500">
          Built for the 1–50 employee business. © 2026 OperatorOS.
        </p>
      </footer>
    </div>
  );
}
