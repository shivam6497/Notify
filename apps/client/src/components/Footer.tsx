"use client";

import Link from "next/link";
import { useScrollReveal } from "@/hooks/useScrollReveal";

export function Footer() {
  const { ref, isVisible } = useScrollReveal(0.3);

  return (
    <footer className="border-t border-[#1a1a1a] py-8 px-6" ref={ref}>
      <div
        className={`max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 reveal ${isVisible ? "visible" : ""}`}
      >
        <div className="flex items-center gap-2 group">
          <div className="w-5 h-5 rounded-md bg-white flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
            <span className="text-black font-bold text-[10px]">N</span>
          </div>
          <span className="text-[#525252] text-xs">notify</span>
        </div>
        <p className="text-[#333] text-xs">
          Notification infrastructure for developers
        </p>
        <div className="flex items-center gap-4">
          <Link
            href="/login"
            className="text-[#333] hover:text-white text-xs transition-colors duration-300"
          >
            Sign in
          </Link>
          <Link
            href="/register"
            className="text-[#333] hover:text-white text-xs transition-colors duration-300"
          >
            Get started
          </Link>
        </div>
      </div>
    </footer>
  );
}
