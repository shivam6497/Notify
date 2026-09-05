"use client";

import { Mail, Webhook, Monitor, Zap, Shield, BarChart3 } from "lucide-react";
import { useScrollReveal, useTilt } from "@/hooks/useScrollReveal";
import { useRef, useEffect, useCallback } from "react";

function FeatureCard({
  icon,
  title,
  description,
  index,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  index: number;
}) {
  const cardRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    const el = cardRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    el.style.transform = `perspective(600px) rotateY(${x * 8}deg) rotateX(${-y * 8}deg) scale3d(1.03, 1.03, 1.03)`;
  }, []);

  const handleMouseLeave = useCallback(() => {
    const el = cardRef.current;
    if (!el) return;
    el.style.transform = "perspective(600px) rotateY(0) rotateX(0) scale3d(1,1,1)";
  }, []);

  useEffect(() => {
    const el = cardRef.current;
    if (!el) return;
    el.addEventListener("mousemove", handleMouseMove);
    el.addEventListener("mouseleave", handleMouseLeave);
    return () => {
      el.removeEventListener("mousemove", handleMouseMove);
      el.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, [handleMouseMove, handleMouseLeave]);

  return (
    <div
      ref={cardRef}
      className="card-3d glow-border bg-[#141414] border border-[#262626] rounded-xl p-5 hover:border-[#333] transition-all duration-300"
      style={{ transitionDelay: `${index * 0.1}s` }}
    >
      {/* icon with glow */}
      <div className="relative w-9 h-9 rounded-lg bg-[#1a1a1a] border border-[#262626] flex items-center justify-center text-[#525252] mb-4 group-hover:text-white transition-colors">
        <div className="absolute inset-0 rounded-lg bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity" />
        {icon}
      </div>
      <h3 className="text-white text-sm font-medium mb-2">{title}</h3>
      <p className="text-[#525252] text-xs leading-relaxed">{description}</p>
    </div>
  );
}

export function FeaturesSection() {
  const { ref: sectionRef, isVisible } = useScrollReveal();

  const features = [
    {
      icon: <Zap className="w-5 h-5" />,
      title: "Fan-out delivery",
      description:
        "One API call fans out to email, webhook, and in-app channels simultaneously. No extra code, no extra complexity.",
    },
    {
      icon: <Shield className="w-5 h-5" />,
      title: "Smart retries",
      description:
        "Automatic retry with exponential backoff. 4xx responses aren't retried — 5xx errors are. Your deliveries land.",
    },
    {
      icon: <BarChart3 className="w-5 h-5" />,
      title: "Delivery logs",
      description:
        "Every attempt logged. See exactly what happened, when, and why. Filter by status, channel, or subscriber.",
    },
    {
      icon: <Monitor className="w-5 h-5" />,
      title: "Real-time in-app",
      description:
        "Socket.IO powered in-app notifications. Offline users get their missed notifications on next connect.",
    },
    {
      icon: <Mail className="w-5 h-5" />,
      title: "Email via Resend",
      description:
        "Reliable email delivery powered by Resend. High deliverability, no server configuration needed.",
    },
    {
      icon: <Webhook className="w-5 h-5" />,
      title: "Webhook delivery",
      description:
        "POST to any endpoint with your payload. Signed requests so your server can verify they're from us.",
    },
  ];

  return (
    <section id="features" className="relative py-24 px-6" ref={sectionRef}>
      <div className="max-w-6xl mx-auto">
        <div
          className={`text-center mb-16 reveal ${isVisible ? "visible" : ""}`}
        >
          <p className="text-[#525252] text-xs font-medium uppercase tracking-widest mb-3">
            Features
          </p>
          <h2 className="text-white text-3xl sm:text-4xl font-semibold tracking-tight">
            Everything you need
          </h2>
          <p className="text-[#525252] text-base mt-4 max-w-xl mx-auto">
            Built for developers who want reliable notification delivery without
            building the infrastructure themselves.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 perspective-container">
          {features.map((feature, i) => (
            <div
              key={feature.title}
              className={`reveal ${isVisible ? "visible" : ""}`}
              style={{ transitionDelay: `${0.15 + i * 0.1}s` }}
            >
              <FeatureCard {...feature} index={i} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
