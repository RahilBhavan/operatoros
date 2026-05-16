import type { MetadataRoute } from "next";

const siteUrl =
  process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ??
  "https://operatoros.com";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/terms", "/privacy", "/security", "/status"],
        disallow: [
          "/share/",
          "/accountant/",
          "/unsubscribe/",
          "/invite/",
          "/admin",
          "/admin/",
          "/admin-accept/",
          "/api/",
          "/dashboard",
          "/billing",
          "/settings",
          "/settings/",
          "/onboarding",
          "/sign-in",
          "/sign-up",
        ],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  };
}
