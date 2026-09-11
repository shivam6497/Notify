import type { Metadata } from "next";
import { CTASection } from "@/components/CTASection";
import { FeaturesSection } from "@/components/FeaturesSection";
import { Footer } from "@/components/Footer";
import { HeroSection } from "@/components/HeroSection";
import { HowItWorksSection } from "@/components/HowItWorksSection";
import { Navbar } from "@/components/Navbar";
import { ChannelsSection } from "@/components/ChannelsSection";

// ─── SEO ──────────────────────────────────────────────────
export const metadata: Metadata = {
  title: "Notify — Notification Infrastructure for Developers",
  description:
    "Send email, webhook, and in-app notifications with a single API call. Built for developers who need reliable, scalable notification delivery.",
  keywords: [
    "notification api",
    "email notifications",
    "webhook delivery",
    "in-app notifications",
    "developer tools",
    "notification infrastructure",
  ],
  openGraph: {
    title: "Notify — Notification Infrastructure for Developers",
    description:
      "Send email, webhook, and in-app notifications with a single API call.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Notify — Notification Infrastructure for Developers",
    description:
      "Send email, webhook, and in-app notifications with a single API call.",
  },
};


export default function LandingPage() {
  return (
    <main className="bg-[#0d0d0d] min-h-screen">
      <Navbar />
      <HeroSection />
      <FeaturesSection />
      <HowItWorksSection />
      <ChannelsSection />
      <CTASection />
      <Footer />
    </main>
  );
}
