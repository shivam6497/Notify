"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { useAuthStore } from "@/store/index";
import { logout } from "@/lib/api/index";
import {
  LayoutDashboard,
  Key,
  Bell,
  Users,
  ScrollText,
  LogOut,
  ChevronRight,
} from "lucide-react";

interface SidebarLinkProps {
  href: string;
  icon: React.ReactNode;
  label: string;
  active: boolean;
}

function SidebarLink({ href, icon, label, active }: SidebarLinkProps) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all duration-150 ${
        active
          ? "bg-[#1a1a1a] text-white"
          : "text-[#525252] hover:text-[#a3a3a3] hover:bg-[#141414]"
      }`}
    >
      <span className={active ? "text-white" : "text-[#525252]"}>{icon}</span>
      {label}
      {active && <ChevronRight className="w-3 h-3 ml-auto text-[#525252]" />}
    </Link>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const {
    user,
    isAuthenticated,
    isLoading,
    logout: logoutStore,
  } = useAuthStore();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const mobileMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isLoading, isAuthenticated]);

  // Close mobile menu when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        mobileMenuRef.current &&
        !mobileMenuRef.current.contains(e.target as Node)
      ) {
        setMobileMenuOpen(false);
      }
    }
    if (mobileMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [mobileMenuOpen]);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0d0d0d] flex items-center justify-center">
        <div className="w-4 h-4 border border-white/20 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) return null;

  const projectMatch = pathname.match(/\/dashboard\/([^/]+)/);
  const projectId = projectMatch?.[1];

  const projectNavItems = projectId
    ? [
        {
          href: `/dashboard/${projectId}`,
          icon: <LayoutDashboard className="w-4 h-4" />,
          label: "Overview",
          exact: true,
        },
        {
          href: `/dashboard/${projectId}/keys`,
          icon: <Key className="w-4 h-4" />,
          label: "API Keys",
          exact: false,
        },
        {
          href: `/dashboard/${projectId}/events`,
          icon: <Bell className="w-4 h-4" />,
          label: "Events",
          exact: false,
        },
        {
          href: `/dashboard/${projectId}/subscribers`,
          icon: <Users className="w-4 h-4" />,
          label: "Subscribers",
          exact: false,
        },
        {
          href: `/dashboard/${projectId}/logs`,
          icon: <ScrollText className="w-4 h-4" />,
          label: "Logs",
          exact: false,
        },
      ]
    : [];

  async function handleLogout() {
    await logout();
    logoutStore();
    window.location.href = "/";
  }

  return (
    <div className="min-h-screen bg-[#0d0d0d] flex">
      {/* sidebar */}
      <aside className="hidden md:flex w-56 shrink-0 flex-col border-r border-[#262626] bg-[#0d0d0d] sticky top-0 h-screen">
        {/* logo */}
        <div className="h-14 flex items-center px-4 border-b border-[#262626]">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-white flex items-center justify-center">
              <span className="text-black font-bold text-xs">N</span>
            </div>
            <span className="text-white font-medium text-sm tracking-tight">
              notify
            </span>
          </Link>
        </div>

        <div className="flex-1 flex flex-col px-3 py-4 gap-6 overflow-y-auto">
          {/* projects link */}
          <div>
            <p className="text-[#333] text-[10px] font-medium uppercase tracking-widest px-3 mb-1.5">
              General
            </p>
            <SidebarLink
              href="/dashboard"
              icon={<LayoutDashboard className="w-4 h-4" />}
              label="Projects"
              active={pathname === "/dashboard"}
            />
          </div>

          {/* project nav — only shown inside a project */}
          {projectId && projectNavItems.length > 0 && (
            <div>
              <p className="text-[#333] text-[10px] font-medium uppercase tracking-widest px-3 mb-1.5">
                Project
              </p>
              <div className="space-y-0.5">
                {projectNavItems.map((item) => (
                  <SidebarLink
                    key={item.href}
                    href={item.href}
                    icon={item.icon}
                    label={item.label}
                    active={
                      item.exact
                        ? pathname === item.href
                        : pathname.startsWith(item.href)
                    }
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* user + logout */}
        <div className="border-t border-[#262626] p-3">
          <div className="flex items-center gap-2.5 px-2 py-2 mb-1">
            {/* avatar */}
            <div className="w-6 h-6 rounded-full bg-[#1a1a1a] border border-[#262626] flex items-center justify-center shrink-0">
              {user?.picture ? (
                <img
                  src={user.picture}
                  alt={user.name ?? ""}
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                <span className="text-white text-[10px] font-medium">
                  {user?.email?.[0]?.toUpperCase()}
                </span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-xs font-medium truncate">
                {user?.name ?? user?.email}
              </p>
              <p className="text-[#525252] text-[10px] truncate">
                {user?.email}
              </p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[#525252] hover:text-red-400 hover:bg-red-400/5 text-sm transition-all duration-150"
          >
            <LogOut className="w-4 h-4" />
            Sign out
          </button>
        </div>
      </aside>

      {/* mobile header */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 h-14 bg-[#0d0d0d] border-b border-[#262626] flex items-center justify-between px-4">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-white flex items-center justify-center">
            <span className="text-black font-bold text-xs">N</span>
          </div>
          <span className="text-white font-medium text-sm">notify</span>
        </Link>

        <div className="flex items-center gap-2">
          {/* mobile nav — horizontal scroll */}
          {projectId && (
            <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
              {projectNavItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs whitespace-nowrap transition-all ${
                    item.exact
                      ? pathname === item.href
                        ? "bg-[#1a1a1a] text-white"
                        : "text-[#525252]"
                      : pathname.startsWith(item.href)
                        ? "bg-[#1a1a1a] text-white"
                        : "text-[#525252]"
                  }`}
                >
                  {item.icon}
                </Link>
              ))}
            </div>
          )}

          {/* mobile user menu trigger */}
          <div className="relative" ref={mobileMenuRef}>
            <button
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              className="w-8 h-8 rounded-full bg-[#1a1a1a] border border-[#262626] flex items-center justify-center shrink-0 transition-all hover:border-[#404040]"
              aria-label="User menu"
            >
              {user?.picture ? (
                <img
                  src={user.picture}
                  alt={user.name ?? ""}
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                <span className="text-white text-xs font-medium">
                  {user?.email?.[0]?.toUpperCase()}
                </span>
              )}
            </button>

            {/* mobile dropdown menu */}
            {mobileMenuOpen && (
              <div className="absolute right-0 top-full mt-2 w-56 bg-[#141414] border border-[#262626] rounded-xl shadow-2xl shadow-black/50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
                {/* user info */}
                <div className="px-4 py-3 border-b border-[#262626]">
                  <p className="text-white text-sm font-medium truncate">
                    {user?.name ?? user?.email}
                  </p>
                  <p className="text-[#525252] text-xs truncate mt-0.5">
                    {user?.email}
                  </p>
                </div>

                {/* sign out */}
                <div className="p-1.5">
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-[#a3a3a3] hover:text-red-400 hover:bg-red-400/5 text-sm transition-all duration-150"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* main content */}
      <main className="flex-1 flex flex-col min-w-0 md:pt-0 pt-14 overflow-y-auto w-full">
        {children}
      </main>
    </div>
  );
}
