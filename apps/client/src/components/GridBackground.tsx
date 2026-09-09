"use client";

import { useEffect, useRef } from "react";

export function GridBackground() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      el.style.setProperty("--mouse-x", `${x}px`);
      el.style.setProperty("--mouse-y", `${y}px`);
    };

    el.addEventListener("mousemove", handleMouseMove);
    return () => el.removeEventListener("mousemove", handleMouseMove);
  }, []);

  return (
    <div ref={containerRef} className="absolute inset-0 overflow-hidden">
      {/* static grid */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)
          `,
          backgroundSize: "32px 32px",
        }}
      />
      {/* radial glow that follows mouse */}
      <div
        className="absolute w-[500px] h-[500px] rounded-full opacity-[0.04] pointer-events-none transition-opacity duration-300"
        style={{
          background:
            "radial-gradient(circle, rgba(255,255,255,0.4), transparent 70%)",
          left: "var(--mouse-x, 50%)",
          top: "var(--mouse-y, 50%)",
          transform: "translate(-50%, -50%)",
        }}
      />
    </div>
  );
}
