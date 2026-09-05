"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { GridBackground } from "./GridBackground";
import { useScrollReveal } from "@/hooks/useScrollReveal";

export function CTASection() {
  const { ref: sectionRef, isVisible } = useScrollReveal(0.2);

  return (
    <section className="relative py-24 px-6 overflow-hidden" ref={sectionRef}>
      <GridBackground />

      {/* animated radial glow */}
      <div
        className="absolute inset-0 animate-glow-pulse pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(255,255,255,0.06) 0%, transparent 70%)",
        }}
      />

      {/* orbiting particles */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] pointer-events-none">
        <div className="absolute w-1.5 h-1.5 rounded-full bg-white/20 animate-orbit" />
        <div
          className="absolute w-1 h-1 rounded-full bg-white/10 animate-orbit"
          style={{ animationDelay: "-7s", animationDuration: "25s" }}
        />
        <div
          className="absolute w-1 h-1 rounded-full bg-white/15 animate-orbit"
          style={{ animationDelay: "-14s", animationDuration: "22s" }}
        />
      </div>

      <div
        className={`relative z-10 max-w-2xl mx-auto text-center reveal-scale ${isVisible ? "visible" : ""}`}
      >
        <h2 className="text-white text-3xl sm:text-4xl font-semibold tracking-tight mb-4">
          Start sending notifications
        </h2>
        <p className="text-[#525252] text-base mb-8">
          Free to get started. No credit card required.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/register"
            className="group relative flex items-center gap-2 bg-white hover:bg-zinc-100 text-black text-sm font-medium rounded-lg px-6 py-2.5 transition-all duration-300 w-full sm:w-auto justify-center hover:shadow-xl hover:shadow-white/20 hover:scale-105 active:scale-95 overflow-hidden"
          >
            {/* shimmer on button */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-black/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
            <span className="relative z-10">Create free account</span>
            <ArrowRight className="w-4 h-4 relative z-10 transition-transform duration-300 group-hover:translate-x-0.5" />
          </Link>
          <Link
            href="/login"
            className="text-[#525252] hover:text-white text-sm transition-colors duration-300"
          >
            Already have an account →
          </Link>
        </div>
      </div>
    </section>
  );
}
