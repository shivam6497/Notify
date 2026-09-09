"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled
          ? "bg-[#0d0d0d]/80 backdrop-blur-xl border-b border-white/5 shadow-lg shadow-black/20"
          : "bg-transparent border-b border-transparent"
      }`}
    >
      <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
        <div className="flex items-center gap-2 animate-fade-up">
          <div className="w-6 h-6 rounded-md bg-white flex items-center justify-center">
            <span className="text-black font-bold text-xs">N</span>
          </div>
          <span className="text-white font-medium text-sm tracking-tight">
            notify
          </span>
        </div>
        <div className="flex items-center gap-6 animate-fade-up">
          <Link
            href="#features"
            className="text-[#525252] hover:text-white text-sm transition-colors duration-300 hidden sm:block"
          >
            Features
          </Link>
          <Link
            href="#how-it-works"
            className="text-[#525252] hover:text-white text-sm transition-colors duration-300 hidden sm:block"
          >
            How it works
          </Link>
          <Link
            href="/docs"
            className="text-[#525252] hover:text-white text-sm transition-colors hidden sm:block"
          >
            Docs
          </Link>
          <Link
            href="/login"
            className="text-[#525252] hover:text-white text-sm transition-colors duration-300"
          >
            Sign in
          </Link>
          <Link
            href="/register"
            className="bg-white hover:bg-zinc-100 text-black text-sm font-medium rounded-lg px-3.5 py-1.5 transition-all duration-300 hover:shadow-lg hover:shadow-white/10 hover:scale-105 active:scale-95"
          >
            Get started
          </Link>
        </div>
      </div>
    </nav>
  );
}
