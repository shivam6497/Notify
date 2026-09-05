"use client";

import { Mail, Webhook, Monitor, CheckCircle } from "lucide-react";
import { useScrollReveal, useTilt } from "@/hooks/useScrollReveal";

export function ChannelsSection() {
  const { ref: sectionRef, isVisible } = useScrollReveal(0.1);
  const diagramTilt = useTilt<HTMLDivElement>(5);

  return (
    <section className="py-24 px-6" ref={sectionRef}>
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          {/* left — text */}
          <div
            className={`reveal-left ${isVisible ? "visible" : ""}`}
          >
            <p className="text-[#525252] text-xs font-medium uppercase tracking-widest mb-3">
              Channels
            </p>
            <h2 className="text-white text-3xl sm:text-4xl font-semibold tracking-tight mb-6">
              Three channels,
              <br />
              <span className="gradient-text">one API call</span>
            </h2>
            <p className="text-[#525252] text-sm leading-relaxed mb-8">
              Your users choose what they want to receive and how. You just
              trigger the event — we handle the rest.
            </p>
            <div className="space-y-3">
              {[
                {
                  icon: <Mail className="w-4 h-4" />,
                  label: "Email",
                  desc: "Delivered via Resend with high inbox placement",
                  color: "text-blue-400",
                  bg: "bg-blue-400/10",
                  border: "border-blue-400/20",
                },
                {
                  icon: <Webhook className="w-4 h-4" />,
                  label: "Webhook",
                  desc: "HTTP POST to any endpoint, with retries",
                  color: "text-amber-400",
                  bg: "bg-amber-400/10",
                  border: "border-amber-400/20",
                },
                {
                  icon: <Monitor className="w-4 h-4" />,
                  label: "In-app",
                  desc: "Real-time via Socket.IO, buffered for offline users",
                  color: "text-[#22c55e]",
                  bg: "bg-[#22c55e]/10",
                  border: "border-[#22c55e]/20",
                },
              ].map((channel, i) => (
                <div
                  key={channel.label}
                  className={`flex items-center gap-3 bg-[#141414] border border-[#262626] rounded-lg p-3 hover:border-[#333] transition-all duration-300 hover:translate-x-1 reveal ${isVisible ? "visible" : ""}`}
                  style={{ transitionDelay: `${0.3 + i * 0.1}s` }}
                >
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${channel.color} ${channel.bg} border ${channel.border}`}
                  >
                    {channel.icon}
                  </div>
                  <div>
                    <p className="text-white text-sm font-medium">
                      {channel.label}
                    </p>
                    <p className="text-[#525252] text-xs">{channel.desc}</p>
                  </div>
                  <CheckCircle className="w-4 h-4 text-[#262626] ml-auto shrink-0" />
                </div>
              ))}
            </div>
          </div>

          {/* right — fan-out diagram with 3D tilt */}
          <div
            className={`perspective-container reveal-right ${isVisible ? "visible" : ""}`}
            style={{ transitionDelay: "0.3s" }}
          >
            <div
              ref={diagramTilt}
              className="card-3d bg-[#141414] border border-[#262626] rounded-xl p-6 font-mono text-xs relative overflow-hidden"
            >
              {/* shimmer */}
              <div className="absolute inset-0 animate-shimmer pointer-events-none" />

              <p className="text-[#525252] mb-4 relative z-10">Fan-out flow</p>

              {/* trigger */}
              <div className="bg-[#0d0d0d] border border-[#262626] rounded-lg p-3 mb-4 relative z-10 hover:border-[#333] transition-colors duration-300">
                <p className="text-[#525252]">POST /v1/notify</p>
                <p className="text-white mt-1">
                  event: <span className="text-[#22c55e]">&quot;order.placed&quot;</span>
                </p>
              </div>

              {/* animated arrow */}
              <div className="flex justify-center mb-4 relative z-10">
                <div className="flex flex-col items-center gap-1">
                  <div className="w-px h-4 bg-gradient-to-b from-[#262626] to-[#525252]" />
                  <div className="w-2 h-2 rotate-45 border-r border-b border-[#525252]" />
                </div>
              </div>

              {/* notify box — glowing */}
              <div className="relative z-10 mb-4">
                <div className="absolute inset-0 bg-white/5 rounded-lg blur-xl animate-glow-pulse" />
                <div className="relative bg-white/5 border border-white/10 rounded-lg p-3 text-center">
                  <p className="text-white font-medium">notify</p>
                  <p className="text-[#525252] text-[10px] mt-0.5">
                    fan-out engine
                  </p>
                </div>
              </div>

              {/* branch arrows */}
              <div className="flex justify-center mb-4 relative z-10">
                <div className="flex items-end gap-8">
                  <div className="w-px h-3 bg-blue-400/30" />
                  <div className="w-px h-3 bg-amber-400/30" />
                  <div className="w-px h-3 bg-[#22c55e]/30" />
                </div>
              </div>

              {/* branches */}
              <div className="grid grid-cols-3 gap-2 relative z-10">
                {[
                  {
                    label: "Email",
                    color: "text-blue-400",
                    border: "border-blue-400/20",
                    status: "✓ sent",
                  },
                  {
                    label: "Webhook",
                    color: "text-amber-400",
                    border: "border-amber-400/20",
                    status: "✓ 200 OK",
                  },
                  {
                    label: "In-app",
                    color: "text-[#22c55e]",
                    border: "border-[#22c55e]/20",
                    status: "✓ live",
                  },
                ].map((ch) => (
                  <div
                    key={ch.label}
                    className={`bg-[#0d0d0d] border ${ch.border} rounded-lg p-2 text-center hover:scale-105 transition-transform duration-300`}
                  >
                    <p className={`${ch.color} text-[10px] font-medium`}>
                      {ch.label}
                    </p>
                    <p className="text-[#525252] text-[10px] mt-1">
                      {ch.status}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
