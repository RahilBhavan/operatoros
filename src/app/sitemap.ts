import type { MetadataRoute } from "next";
import { getAppUrl } from "@/lib/app-url";

const siteUrl = getAppUrl();

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return [
    {
      url: `${siteUrl}/`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 1.0,
    },
    {
      url: `${siteUrl}/security`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${siteUrl}/status`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.6,
    },
    {
      url: `${siteUrl}/terms`,
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${siteUrl}/privacy`,
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.3,
    },
  ];
}
