"use client";

import { useEffect, useState } from "react";

const sections = [
  { id: "introduction", label: "Introduction", group: "Getting started" },
  { id: "quickstart", label: "Quickstart", group: "Getting started" },
  { id: "authentication", label: "Authentication", group: "Getting started" },
  { id: "projects", label: "Projects", group: "Core concepts" },
  { id: "event-types", label: "Event Types", group: "Core concepts" },
  { id: "subscribers", label: "Subscribers", group: "Core concepts" },
  { id: "preferences", label: "Preferences", group: "Core concepts" },
  { id: "trigger", label: "Trigger notification", group: "API Reference" },
  { id: "subscribers-api", label: "Subscribers", group: "API Reference" },
  { id: "events-api", label: "Event types", group: "API Reference" },
  { id: "logs-api", label: "Delivery logs", group: "API Reference" },
  { id: "webhooks", label: "Webhook verification", group: "Guides" },
  { id: "sdk", label: "SDK usage", group: "Guides" },
  { id: "idempotency", label: "Idempotency", group: "Guides" },
  { id: "channels", label: "Channels", group: "Guides" },
];

const groups = ["Getting started", "Core concepts", "API Reference", "Guides"];

export function DocsSidebar() {
  const [activeId, setActiveId] = useState<string>("introduction");

  useEffect(() => {
    const observers: IntersectionObserver[] = [];

    const visible = new Map<string, number>();

    sections.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (!el) return;

      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              visible.set(id, entry.intersectionRatio);
            } else {
              visible.delete(id);
            }
            if (visible.size > 0) {
              const mostVisible = [...visible.entries()].sort(
                (a, b) => b[1] - a[1],
              )[0];
              if (mostVisible) {
                setActiveId(mostVisible[0]);
              }
            }
          });
        },
        {
          rootMargin: "-20% 0px -60% 0px", 
          threshold: [0, 0.25, 0.5, 0.75, 1],
        },
      );

      observer.observe(el);
      observers.push(observer);
    });

    return () => observers.forEach((o) => o.disconnect());
  }, []);

  function scrollTo(id: string) {
    document.getElementById(id)?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }

  return (
    <aside className="hidden lg:block w-52 shrink-0">
      <div className="sticky top-24">
        {groups.map((group) => (
          <div key={group} className="mb-6">
            <p className="text-[#333] text-[10px] font-medium uppercase tracking-widest mb-2">
              {group}
            </p>
            <div className="space-y-0.5">
              {sections
                .filter((s) => s.group === group)
                .map((section) => {
                  const isActive = activeId === section.id;
                  return (
                    <button
                      key={section.id}
                      onClick={() => scrollTo(section.id)}
                      className={`w-full text-left text-xs py-1 px-2 rounded-md transition-all duration-200 ${
                        isActive
                          ? "text-white bg-[#1a1a1a]"
                          : "text-[#525252] hover:text-[#a3a3a3]"
                      }`}
                    >
                      {isActive && (
                        <span className="inline-block w-1 h-1 rounded-full bg-white mr-2 mb-0.5" />
                      )}
                      {section.label}
                    </button>
                  );
                })}
            </div>
          </div>
        ))}
      </div>
    </aside>
  );
}
