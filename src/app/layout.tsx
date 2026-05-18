import type { Metadata, Viewport } from "next";
import { Inter, Roboto_Slab, Atkinson_Hyperlegible } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-destination",
  weight: ["400", "500", "600", "700", "800", "900"],
  display: "swap",
});

const robotoSlab = Roboto_Slab({
  subsets: ["latin"],
  variable: "--font-index",
  weight: ["400", "500", "700", "900"],
  display: "swap",
});

const atkinson = Atkinson_Hyperlegible({
  subsets: ["latin"],
  variable: "--font-a11y",
  weight: ["400", "700"],
  display: "swap",
});

const siteUrl =
  process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ??
  "https://operatoros.com";

const siteTitle = "OperatorOS — Never miss a compliance deadline again";
const siteDescription =
  "A 50-state compliance calendar with statute citations, severity-tiered risk scoring, and a portfolio view your accountant can actually use. Pre-populated in 30 seconds; audit-ready behind a one-click share link.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: siteTitle,
    template: "%s — OperatorOS",
  },
  description: siteDescription,
  applicationName: "OperatorOS",
  keywords: [
    "compliance software",
    "small business compliance",
    "regulatory deadlines",
    "accountant portfolio",
    "audit-ready",
    "compliance calendar",
    "OperatorOS",
  ],
  authors: [{ name: "OperatorOS" }],
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    url: siteUrl,
    siteName: "OperatorOS",
    title: siteTitle,
    description: siteDescription,
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: siteTitle,
    description: siteDescription,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export const viewport: Viewport = {
  themeColor: "#FFFFFF",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`h-full antialiased ${inter.variable} ${robotoSlab.variable} ${atkinson.variable}`}
    >
      <body className="min-h-full bg-field text-ground font-destination">
        {children}
      </body>
    </html>
  );
}
