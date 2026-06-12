"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Sparkles, Megaphone, Users, Droplet } from "lucide-react";

const navItems = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "AI Copilot", href: "/ai-copilot", icon: Sparkles },
  { name: "Campaigns", href: "/campaigns", icon: Megaphone },
  { name: "Customers", href: "/customers", icon: Users },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed inset-y-0 left-0 z-20 flex w-64 flex-col border-r border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
      {/* Brand Logo Header */}
      <div className="flex h-16 items-center gap-2 border-b border-zinc-100 px-6 dark:border-zinc-900">
        <Droplet className="h-6 w-6 text-pink-500 fill-pink-500 animate-pulse" />
        <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 bg-clip-text text-transparent">
          Dewy.
        </span>
        <span className="rounded-full bg-pink-100 px-2 py-0.5 text-xs font-semibold text-pink-700 dark:bg-pink-950 dark:text-pink-300">
          AI CRM
        </span>
      </div>

      {/* Nav Links */}
      <nav className="flex-1 space-y-1 px-4 py-6">
        {navItems.map((item) => {
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-all duration-200 ${
                isActive
                  ? "bg-gradient-to-r from-pink-50/80 to-purple-50/80 text-pink-600 shadow-sm dark:from-pink-950/20 dark:to-purple-950/20 dark:text-pink-400"
                  : "text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-zinc-50"
              }`}
            >
              <item.icon className={`h-5 w-5 ${isActive ? "text-pink-500" : ""}`} />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* Skincare Tip Footer Card */}
      <div className="p-4 m-4 rounded-xl bg-zinc-50 border border-zinc-100 dark:bg-zinc-900/50 dark:border-zinc-800">
        <div className="flex items-center gap-2 mb-1">
          <Sparkles className="h-4 w-4 text-purple-500" />
          <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">AI Campaign Copilot</span>
        </div>
        <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-relaxed">
          Type marketing goals in plain English. Dewy segmenting, messaging, and insights are powered by Gemini.
        </p>
      </div>
    </aside>
  );
}
