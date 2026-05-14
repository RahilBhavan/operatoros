import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "OperatorOS — Never Miss a Compliance Deadline Again",
  description:
    "Auto-discovers every regulatory deadline for your small business. Stores your documents. Sends reminders before things lapse. Audit-ready in 30 seconds.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full">{children}</body>
    </html>
  );
}
