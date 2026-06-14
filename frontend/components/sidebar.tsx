"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { getStats } from "@/lib/api";
import { useTheme } from "@/components/providers";
import { Button } from "@/components/ui/button";
import { Sparkles, Megaphone, Droplet, Database, MessageSquare, Users, ShoppingBag, DollarSign, Percent, Zap, Sun, Moon, Home } from "lucide-react";

const navItems = [
  { name: "Home", href: "/", icon: Home },
  { name: "AI Copilot", href: "/ai-copilot", icon: MessageSquare },
  { name: "Campaigns", href: "/campaigns", icon: Megaphone },
  { name: "Datasets", href: "/datasets", icon: Database },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();

  // Fetch live stats every 6 seconds to update the insights board dynamically
  const { data: stats } = useQuery({
    queryKey: ["sidebar-stats"],
    queryFn: getStats,
    refetchInterval: 6000,
  });

  return (
    <aside className="fixed inset-y-0 left-0 z-20 flex w-72 flex-col border-r border-zinc-100 bg-white/70 backdrop-blur-md dark:border-zinc-800/80 dark:bg-zinc-950/70">
      {/* Brand Header */}
      <div className="flex h-16 items-center gap-2 border-b border-zinc-100 px-6 dark:border-zinc-900">
        <Droplet className="h-5 w-5 text-sky-500 fill-sky-500 animate-pulse" />
        <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-sky-500 via-cyan-500 to-indigo-500 bg-clip-text text-transparent">
          Dewy.
        </span>
        <span className="rounded-full bg-sky-100 px-2 py-0.5 text-xs font-bold text-sky-700 dark:bg-sky-950/40 dark:text-sky-300">
          AI CRM
        </span>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={toggleTheme}
          className="ml-auto rounded-full border border-zinc-200/70 bg-white/80 text-zinc-700 shadow-sm hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900/80 dark:text-zinc-200 dark:hover:bg-zinc-800"
        >
          {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </Button>
      </div>

      {/* Nav Links */}
      <nav className="space-y-1 px-4 py-6">
        {navItems.map((item) => {
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3 rounded-lg px-4 py-3 text-base font-medium transition-all duration-150 ${
                isActive
                  ? "bg-gradient-to-r from-sky-50/80 to-purple-50/80 text-sky-600 shadow-sm dark:from-sky-950/20 dark:to-purple-950/20 dark:text-sky-400"
                  : "text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-zinc-50"
              }`}
            >
              <item.icon className={`h-4.5 w-4.5 ${isActive ? "text-sky-500" : ""}`} />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* Persistent Insights Sidebar */}
      <div className="flex-1 flex flex-col justify-end px-4 pb-6">
        <div className="rounded-xl border border-zinc-200/60 bg-zinc-50/30 p-4 dark:border-zinc-800/80 dark:bg-zinc-900/30">
          <div className="flex items-center gap-1.5 mb-3">
            <Zap className="h-4 w-4 text-sky-500 fill-sky-500/10 animate-pulse" />
            <span className="text-sm font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              Live Insights
            </span>
          </div>

          <div className="space-y-3">
            {/* Customers */}
            <div className="flex justify-between items-center text-sm">
              <span className="text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5 text-zinc-400" />
                Customers
              </span>
              <div className="text-right">
                <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                  {stats ? stats.total_customers.toLocaleString() : "1,000"}
                </span>
                <span className="text-xs text-green-500 ml-1.5 font-medium">
                  {stats ? stats.total_customers_growth || "+12%" : "+12%"}
                </span>
              </div>
            </div>

            {/* Orders */}
            <div className="flex justify-between items-center text-sm">
              <span className="text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5">
                <ShoppingBag className="h-3.5 w-3.5 text-zinc-400" />
                Orders
              </span>
              <div className="text-right">
                <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                  {stats ? stats.total_orders.toLocaleString() : "7,328"}
                </span>
                <span className="text-xs text-green-500 ml-1.5 font-medium">
                  {stats ? stats.total_orders_growth || "+8%" : "+8%"}
                </span>
              </div>
            </div>

            {/* Revenue */}
            <div className="flex justify-between items-center text-sm">
              <span className="text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5">
                <DollarSign className="h-3.5 w-3.5 text-zinc-400" />
                Revenue
              </span>
              <div className="text-right">
                <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                  ₹{stats ? stats.revenue.toLocaleString(undefined, { maximumFractionDigits: 0 }) : "841,283"}
                </span>
                <span className="text-xs text-green-500 ml-1.5 font-medium">
                  {stats ? stats.revenue_growth || "+15%" : "+15%"}
                </span>
              </div>
            </div>

            {/* Campaigns */}
            <div className="flex justify-between items-center text-sm">
              <span className="text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5">
                <Megaphone className="h-3.5 w-3.5 text-zinc-400" />
                Campaigns
              </span>
              <div className="text-right text-zinc-800 dark:text-zinc-200 font-semibold">
                {stats ? stats.campaign_count : "1"}
                <span className="text-xs text-zinc-400 font-normal ml-1.5">
                  ({stats ? stats.active_campaign_count || 0 : 0} active)
                </span>
              </div>
            </div>

            {/* Open Rate */}
            <div className="flex justify-between items-center text-sm">
              <span className="text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5">
                <Percent className="h-3.5 w-3.5 text-zinc-400" />
                Open Rate
              </span>
              <div className="text-right text-zinc-800 dark:text-zinc-200 font-semibold">
                {stats ? (stats.open_rate * 100).toFixed(1) : "0.0"}%
              </div>
            </div>

            {/* Top Opportunity */}
            <div className="border-t border-zinc-100 pt-3 mt-1 dark:border-zinc-800/80 text-sm">
              <span className="text-xs font-bold text-zinc-400 uppercase tracking-wide block mb-1">
                Top Opportunity
              </span>
              <div className="rounded-lg bg-sky-50/50 p-2.5 text-sky-600 font-medium text-sm flex items-center gap-1.5 dark:bg-sky-950/20 dark:text-sky-400">
                <Sparkles className="h-3.5 w-3.5 fill-sky-500/10 text-sky-500 flex-shrink-0" />
                <span className="line-clamp-1">{stats ? stats.top_opportunity : "Win Back Dormant Customers"}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
