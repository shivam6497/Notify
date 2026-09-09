"use client";

import { GridBackground } from "./GridBackground";
import Link from "next/link";
import { ArrowRight, Mail, Webhook, Monitor } from "lucide-react";
import { useEffect, useState } from "react";
import { useTilt } from "@/hooks/useScrollReveal";

function FloatingOrb({
  className,
  delay = "0s",
}: {
  className: string;
  delay?: string;
}) {
  return (
    <div
      className={`absolute rounded-full blur-3xl pointer-events-none ${className}`}
      style={{ animationDelay: delay }}
    />
  );
}

function FloatingIcon({
  icon,
  className,
  animation,
}: {
  icon: React.ReactNode;
  className: string;
  animation: string;
}) {
  return (
    <div
      className={`absolute hidden lg:flex w-12 h-12 rounded-xl glass items-center justify-center text-[#525252] ${animation} ${className}`}
    >
      {icon}
    </div>
  );
}

export function HeroSection() {
  const [mounted, setMounted] = useState(false);
  const tiltRef = useTilt<HTMLDivElement>(6);

  useEffect(() => setMounted(true), []);

  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center text-center px-6 pt-14 overflow-hidden">
      <GridBackground />

      {/* animated gradient orbs */}
      <FloatingOrb
        className="w-[500px] h-[500px] bg-purple-500/8 top-1/4 -left-40 animate-glow-pulse"
        delay="0s"
      />
      <FloatingOrb
        className="w-[400px] h-[400px] bg-blue-500/8 top-1/3 -right-32 animate-glow-pulse"
        delay="2s"
      />
      <FloatingOrb
        className="w-[300px] h-[300px] bg-emerald-500/5 bottom-1/4 left-1/3 animate-glow-pulse"
        delay="4s"
      />

      {/* orbiting ring — decorative */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] pointer-events-none hidden lg:block">
        <div className="absolute inset-0 rounded-full border border-[#1a1a1a] animate-spin-slow" />
        <div
          className="absolute inset-8 rounded-full border border-[#141414] animate-spin-slow"
          style={{ animationDirection: "reverse", animationDuration: "45s" }}
        />
      </div>

      {/* floating icons */}
      <FloatingIcon
        icon={<Mail className="w-5 h-5" />}
        className="top-[25%] left-[12%]"
        animation="animate-float"
      />
      <FloatingIcon
        icon={<Webhook className="w-5 h-5" />}
        className="top-[20%] right-[10%]"
        animation="animate-float-slow"
      />
      <FloatingIcon
        icon={<Monitor className="w-5 h-5" />}
        className="bottom-[30%] left-[8%]"
        animation="animate-float-reverse"
      />

      <div
        className={`relative z-10 max-w-3xl mx-auto transition-all duration-1000 ${
          mounted
            ? "opacity-100 translate-y-0"
            : "opacity-0 translate-y-8"
        }`}
      >
        {/* badge */}
        <div className="inline-flex items-center gap-2 bg-[#141414] border border-[#262626] rounded-full px-3 py-1.5 mb-8 animate-fade-up-delay-1">
          <div className="relative">
            <div className="w-1.5 h-1.5 rounded-full bg-[#22c55e]" />
            <div className="absolute inset-0 w-1.5 h-1.5 rounded-full bg-[#22c55e] animate-pulse-ring" />
          </div>
          <span className="text-[#a3a3a3] text-xs">
            Production ready · Self-hostable
          </span>
        </div>

        {/* headline */}
        <h1 className="text-white text-4xl sm:text-5xl md:text-6xl font-semibold tracking-tight leading-[1.1] mb-6 animate-fade-up-delay-2">
          Notification infrastructure
          <br />
          <span className="gradient-text">built for developers</span>
        </h1>

        <p className="text-[#525252] text-base sm:text-lg max-w-xl mx-auto mb-10 leading-relaxed animate-fade-up-delay-3">
          Send email, webhook, and in-app notifications with a single API call.
          Fan-out to multiple channels, track every delivery, and let your users
          control their preferences.
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-16 animate-fade-up-delay-4">
          <Link
            href="/register"
            className="group flex items-center gap-2 bg-white hover:bg-zinc-100 text-black text-sm font-medium rounded-lg px-5 py-2.5 transition-all duration-300 w-full sm:w-auto justify-center hover:shadow-xl hover:shadow-white/10 hover:scale-105 active:scale-95"
          >
            Start for free
            <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-0.5" />
          </Link>
          <Link
            href="#how-it-works"
            className="flex items-center gap-2 bg-transparent hover:bg-[#141414] border border-[#262626] hover:border-[#333] text-[#a3a3a3] hover:text-white text-sm rounded-lg px-5 py-2.5 transition-all duration-300 w-full sm:w-auto justify-center hover:scale-105 active:scale-95"
          >
            See how it works
          </Link>
        </div>

        {/* code snippet — 3D tilt */}
        <div className="perspective-container animate-fade-up-delay-5">
          <div
            ref={tiltRef}
            className="card-3d bg-[#141414] border border-[#262626] rounded-xl p-5 text-left max-w-lg mx-auto relative overflow-hidden"
          >
            {/* shimmer overlay */}
            <div className="absolute inset-0 animate-shimmer pointer-events-none" />

            <div className="flex items-center gap-1.5 mb-4 relative z-10">
              <div className="w-2.5 h-2.5 rounded-full bg-[#ff5f57]" />
              <div className="w-2.5 h-2.5 rounded-full bg-[#febc2e]" />
              <div className="w-2.5 h-2.5 rounded-full bg-[#28c840]" />
              <span className="text-[#333] text-xs font-mono ml-2">
                trigger a notification
              </span>
            </div>
            <pre className="font-mono text-xs leading-relaxed overflow-x-auto relative z-10">
              <span className="text-[#525252]">curl </span>
              <span className="text-white">
                https://api.notify.dev/v1/notify \
              </span>
              {"\n"}
              <span className="text-[#525252]"> -H </span>
              <span className="text-white">
                &quot;Authorization: Bearer nk_live_...&quot; \
              </span>
              {"\n"}
              <span className="text-[#525252]"> -d </span>
              <span className="text-[#525252]">{"{"}</span>
              {"\n"}
              <span className="text-[#525252]">
                {"       "}&quot;eventSlug&quot;:{" "}
              </span>
              <span className="text-[#22c55e]">&quot;order.placed&quot;</span>
              <span className="text-[#525252]">,</span>
              {"\n"}
              <span className="text-[#525252]">
                {"       "}&quot;subscriberId&quot;:{" "}
              </span>
              <span className="text-[#22c55e]">&quot;usr_123&quot;</span>
              <span className="text-[#525252]">,</span>
              {"\n"}
              <span className="text-[#525252]">
                {"       "}&quot;payload&quot;:{" "}
              </span>
              <span className="text-[#525252]">{"{ ... }"}</span>
              {"\n"}
              <span className="text-[#525252]">{"  }"}</span>
              {"\n\n"}
              <span className="text-[#22c55e]">{"// "}</span>
              <span className="text-[#525252]">
                → email + webhook + in-app, all at once
              </span>
            </pre>
          </div>
        </div>
      </div>

      {/* scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-fade-in z-10">
        <div className="w-5 h-8 rounded-full border border-[#262626] flex justify-center pt-1.5">
          <div className="w-1 h-2 rounded-full bg-[#525252] animate-float" />
        </div>
      </div>
    </section>
  );
}
