import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { QueryProvider } from "@/providers/QueryProvider";
import { AuthInitializer } from "@/components/AuthInitializer";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Notify — Notification Infrastructure for Developers",
    template: "%s | Notify",
  },
  description:
    "Send email, webhook, and in-app notifications with a single API call.",
  metadataBase: new URL("https://yourproductiondomain.com"),
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${GeistSans.variable} ${GeistMono.variable} font-sans antialiased`}
      >
        <QueryProvider>
          <AuthInitializer>{children}</AuthInitializer>
        </QueryProvider>
      </body>
    </html>
  );
}
