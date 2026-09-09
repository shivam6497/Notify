"use client";

import { Rocket, Zap, Users, Bell } from "lucide-react";
import { GridBackground } from "./GridBackground";
import { useScrollReveal } from "@/hooks/useScrollReveal";

export function HowItWorksSection() {
  const { ref: sectionRef, isVisible } = useScrollReveal(0.1);

  const steps = [
    {
      number: "01",
      title: "Create a project",
      description:
        "Sign up, create a project, and get your API key in under a minute.",
      icon: <Rocket className="w-4 h-4" />,
    },
    {
      number: "02",
      title: "Define event types",
      description:
        'Create events like "order.placed" or "user.signup" and choose which channels they support.',
      icon: <Zap className="w-4 h-4" />,
    },
    {
      number: "03",
      title: "Register subscribers",
      description:
        "Add your users as subscribers with their email and webhook URL via the API.",
      icon: <Users className="w-4 h-4" />,
    },
    {
      number: "04",
      title: "Trigger notifications",
      description:
        "Call POST /v1/notify from your server. We handle the fan-out, retries, and delivery tracking.",
      icon: <Bell className="w-4 h-4" />,
    },
  ];

  return (
    <section
      id="how-it-works"
      className="relative py-24 px-6"
      ref={sectionRef}
    >
      <GridBackground />
      <div className="max-w-6xl mx-auto relative z-10">
        <div
          className={`text-center mb-16 reveal ${isVisible ? "visible" : ""}`}
        >
          <p className="text-[#525252] text-xs font-medium uppercase tracking-widest mb-3">
            How it works
          </p>
          <h2 className="text-white text-3xl sm:text-4xl font-semibold tracking-tight">
            Up and running in minutes
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 perspective-container">
          {steps.map((step, i) => (
            <div
              key={step.number}
              className={`relative reveal ${isVisible ? "visible" : ""}`}
              style={{ transitionDelay: `${0.2 + i * 0.15}s` }}
            >
              {/* connector line */}
              {i < steps.length - 1 && (
                <div
                  className={`hidden lg:block absolute top-5 left-[calc(100%_-_8px)] w-full h-px z-0 transition-all duration-1000 ${
                    isVisible ? "bg-[#262626] scale-x-100" : "bg-transparent scale-x-0"
                  }`}
                  style={{
                    transformOrigin: "left center",
                    transitionDelay: `${0.5 + i * 0.2}s`,
                  }}
                />
              )}
              <div className="card-3d glow-border bg-[#141414] border border-[#262626] rounded-xl p-5 relative z-10 h-full group hover:border-[#333] transition-all duration-300">
                {/* step number with glow */}
                <div className="flex items-center gap-3 mb-4">
                  <div className="relative">
                    <p className="text-[#333] text-xs font-mono group-hover:text-[#525252] transition-colors duration-300">
                      {step.number}
                    </p>
                  </div>
                  <span className="text-[#525252] opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    {step.icon}
                  </span>
                </div>
                <h3 className="text-white text-sm font-medium mb-2 group-hover:translate-x-0.5 transition-transform duration-300">
                  {step.title}
                </h3>
                <p className="text-[#525252] text-xs leading-relaxed">
                  {step.description}
                </p>

                {/* hover glow */}
                <div className="absolute inset-0 rounded-xl bg-gradient-to-b from-white/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
