/** User-facing strings — plain language first, brand codes optional. */

export const actions = {
  addDeadline: "+ Add deadline",
  addFirstDeadline: "+ Add your first deadline",
  exportPdf: "Export PDF",
  viewAllDeadlines: "View all deadlines →",
  updateDeadline: "Update →",
  viewDeadline: "View →",
} as const;

export const dashboard = {
  description:
    "Your compliance at a glance — what needs attention now, what’s coming up, and how your score is trending.",
  sections: {
    deadlines: {
      title: "Your deadlines",
      description: "Grouped by status. Open any item to log proof or adjust the due date.",
    },
    insights: {
      title: "Trends & AI insights",
      description:
        "Score history and suggested follow-ups. Verify anything material with your accountant or the agency.",
    },
    sharing: {
      title: "Compare & share",
      description:
        "See how you stack up against similar businesses and share read-only access with your accountant.",
    },
  },
  kpi: {
    overdue: "Overdue",
    dueSoon: "Due within 30 days",
    upcoming: "Upcoming",
    score: "Compliance score",
  },
} as const;

export const deadlineStatusGroup = {
  overdue: "Overdue",
  in_progress: "Due within 30 days",
  upcoming: "Upcoming",
  compliant: "Done this year",
} as const;

export const nav = {
  backToStaff: "← Back to staff",
  backToProjects: "← Back to projects",
  backToLocations: "← Back to locations",
  backToCoi: "← Back to recipients",
  backToDeadlines: "← Back to deadlines",
  backToAuditPrep: "← Back to audit prep",
  backToSettings: "← Back to settings",
  edit: "Edit →",
} as const;

export const settings = {
  notifications: {
    title: "Notifications",
    description:
      "Choose how deadline reminders reach you. Email is the default; SMS helps when you're away from a desk.",
  },
  integrations: {
    title: "Integrations",
    description:
      "Connect practice-management and accounting tools. Sync is read-only unless noted.",
  },
  baa: {
    title: "Business Associate Agreement",
    description:
      "Required when you store documents that may contain PHI-adjacent information.",
  },
  team: {
    title: "Team",
    description: "Invite colleagues and control who can view or edit compliance data.",
  },
  network: {
    title: "Network growth",
    description:
      "Track signups and paid conversions from businesses you refer (Accountant plan).",
  },
} as const;

export const billing = {
  title: "Billing",
  description: "Manage your plan, trial, and payment method.",
} as const;
