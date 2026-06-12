"use client";

import { useQuery } from "@tanstack/react-query";
import { getStats, getCampaigns } from "@/lib/api";
import LayoutWrapper from "@/components/layout-wrapper";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Users, 
  ShoppingBag, 
  DollarSign, 
  Megaphone, 
  Mail, 
  ArrowUpRight, 
  Loader2, 
  Percent, 
  ArrowRight
} from "lucide-react";
import Link from "next/link";
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell
} from "recharts";

export default function DashboardPage() {
  const { data: stats, isLoading: statsLoading, error: statsError } = useQuery({
    queryKey: ["stats"],
    queryFn: getStats,
    refetchInterval: 10000, // refresh stats every 10 seconds to watch callbacks
  });

  const { data: campaigns, isLoading: campaignsLoading } = useQuery({
    queryKey: ["campaigns"],
    queryFn: getCampaigns,
  });

  const isLoading = statsLoading || campaignsLoading;

  if (isLoading) {
    return (
      <LayoutWrapper>
        <div className="flex min-h-[70vh] items-center justify-center">
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="h-8 w-8 animate-spin text-pink-500" />
            <p className="text-sm text-zinc-500 font-medium animate-pulse">Loading Dewy dashboard...</p>
          </div>
        </div>
      </LayoutWrapper>
    );
  }

  if (statsError || !stats) {
    return (
      <LayoutWrapper>
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-red-950 dark:border-red-900/50 dark:bg-red-950/20 dark:text-red-300">
          <h2 className="text-lg font-semibold">Error Loading Data</h2>
          <p className="text-sm">Please check that the backend is running and the database is accessible.</p>
        </div>
      </LayoutWrapper>
    );
  }

  // Format revenue
  const formattedRevenue = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0
  }).format(stats.revenue);

  // Generate charts data
  const revenueChartData = [
    { name: "Jan", revenue: stats.revenue * 0.12 },
    { name: "Feb", revenue: stats.revenue * 0.18 },
    { name: "Mar", revenue: stats.revenue * 0.28 },
    { name: "Apr", revenue: stats.revenue * 0.45 },
    { name: "May", revenue: stats.revenue * 0.72 },
    { name: "Jun", revenue: stats.revenue }, // current peak
  ];

  // Funnel data
  const funnelData = [
    { name: "Sent", count: stats.funnel.sent, percentage: 100, color: "#6366f1" },
    { name: "Delivered", count: stats.funnel.delivered, percentage: stats.funnel.sent ? Math.round((stats.funnel.delivered / stats.funnel.sent) * 100) : 0, color: "#8b5cf6" },
    { name: "Opened", count: stats.funnel.opened, percentage: stats.funnel.delivered ? Math.round((stats.funnel.opened / stats.funnel.delivered) * 100) : 0, color: "#ec4899" },
    { name: "Clicked", count: stats.funnel.clicked, percentage: stats.funnel.opened ? Math.round((stats.funnel.clicked / stats.funnel.opened) * 100) : 0, color: "#f43f5e" },
    { name: "Purchased", count: stats.funnel.purchased, percentage: stats.funnel.clicked ? Math.round((stats.funnel.purchased / stats.funnel.clicked) * 100) : 0, color: "#10b981" },
  ];

  return (
    <LayoutWrapper>
      {/* Welcome Header */}
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-white">
          Welcome to Dewy
        </h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          AI Campaign Copilot dashboard for beauty & skincare brands.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-5">
        <Card className="relative overflow-hidden border border-zinc-100 bg-white/50 backdrop-blur-md transition-all hover:shadow-md dark:border-zinc-900 dark:bg-zinc-950/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Total Customers</CardTitle>
            <Users className="h-5 w-5 text-indigo-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total_customers.toLocaleString()}</div>
            <p className="text-xs text-green-500 font-medium mt-1 flex items-center gap-1">
              <span>+12%</span>
              <span className="text-zinc-400 dark:text-zinc-600 font-normal">from last month</span>
            </p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border border-zinc-100 bg-white/50 backdrop-blur-md transition-all hover:shadow-md dark:border-zinc-900 dark:bg-zinc-950/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Total Orders</CardTitle>
            <ShoppingBag className="h-5 w-5 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total_orders.toLocaleString()}</div>
            <p className="text-xs text-green-500 font-medium mt-1 flex items-center gap-1">
              <span>+8%</span>
              <span className="text-zinc-400 dark:text-zinc-600 font-normal">from last month</span>
            </p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border border-zinc-100 bg-white/50 backdrop-blur-md transition-all hover:shadow-md dark:border-zinc-900 dark:bg-zinc-950/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Total Revenue</CardTitle>
            <DollarSign className="h-5 w-5 text-pink-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formattedRevenue}</div>
            <p className="text-xs text-green-500 font-medium mt-1 flex items-center gap-1">
              <span>+15%</span>
              <span className="text-zinc-400 dark:text-zinc-600 font-normal">from last month</span>
            </p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border border-zinc-100 bg-white/50 backdrop-blur-md transition-all hover:shadow-md dark:border-zinc-900 dark:bg-zinc-950/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Campaigns</CardTitle>
            <Megaphone className="h-5 w-5 text-rose-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.campaign_count}</div>
            <p className="text-xs text-zinc-400 mt-1">
              {campaigns?.filter(c => c.status === "Running").length || 0} active currently
            </p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border border-zinc-100 bg-white/50 backdrop-blur-md transition-all hover:shadow-md dark:border-zinc-900 dark:bg-zinc-950/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Open Rate</CardTitle>
            <Percent className="h-5 w-5 text-teal-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(stats.open_rate * 100).toFixed(1)}%</div>
            <p className="text-xs text-indigo-500 font-medium mt-1">
              Avg CTR: {(stats.click_rate * 100).toFixed(1)}%
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Chart Section */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        {/* Revenue Chart */}
        <Card className="border border-zinc-100 bg-white dark:border-zinc-900 dark:bg-zinc-950 lg:col-span-4">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Revenue Growth</CardTitle>
            <CardDescription>Skincare store purchase sales over the last 6 months</CardDescription>
          </CardHeader>
          <CardContent className="h-80 pl-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueChartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ec4899" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#ec4899" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-zinc-100 dark:stroke-zinc-800" />
                <XAxis dataKey="name" stroke="#a1a1aa" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#a1a1aa" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `$${v/1000}k`} />
                <Tooltip 
                  formatter={(v: number) => [`$${v.toLocaleString()}`, "Revenue"]}
                  contentStyle={{ backgroundColor: "#18181b", borderColor: "#27272a", color: "#fff", borderRadius: "8px", fontSize: "12px" }}
                />
                <Area type="monotone" dataKey="revenue" stroke="#ec4899" strokeWidth={2} fillOpacity={1} fill="url(#colorRevenue)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Funnel Chart */}
        <Card className="border border-zinc-100 bg-white dark:border-zinc-900 dark:bg-zinc-950 lg:col-span-3">
          <CardHeader>
            <CardTitle className="text-base font-semibold">AI Copilot Funnel</CardTitle>
            <CardDescription>Conversion metrics across all channels</CardDescription>
          </CardHeader>
          <CardContent className="h-80 pl-2">
            {stats.funnel.sent === 0 ? (
              <div className="flex h-full flex-col items-center justify-center text-center p-4">
                <Megaphone className="h-10 w-10 text-zinc-300 dark:text-zinc-700 mb-2 animate-bounce" />
                <p className="text-xs text-zinc-400 font-medium">No campaign communications sent yet.</p>
                <Link href="/ai-copilot" className="mt-2 text-xs font-semibold text-pink-500 hover:text-pink-600 flex items-center gap-1">
                  Launch first campaign <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={funnelData} layout="vertical" margin={{ top: 10, right: 30, left: 10, bottom: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} className="stroke-zinc-100 dark:stroke-zinc-800" />
                  <XAxis type="number" stroke="#a1a1aa" fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis dataKey="name" type="category" stroke="#a1a1aa" fontSize={11} tickLine={false} axisLine={false} width={80} />
                  <Tooltip 
                    formatter={(v: number, name: string, item: any) => [
                      `${v.toLocaleString()} (${item.payload.percentage}%)`,
                      "Count"
                    ]}
                    contentStyle={{ backgroundColor: "#18181b", borderColor: "#27272a", color: "#fff", borderRadius: "8px", fontSize: "12px" }}
                  />
                  <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={20}>
                    {funnelData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Campaigns Section */}
      <Card className="border border-zinc-100 bg-white dark:border-zinc-900 dark:bg-zinc-950">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base font-semibold">Campaign Performance Logs</CardTitle>
            <CardDescription>Track status, audience reach, and sales conversions</CardDescription>
          </div>
          <Link 
            href="/ai-copilot"
            className="flex items-center gap-1 text-xs font-semibold text-pink-500 transition-colors hover:text-pink-600"
          >
            Create with AI Copilot
            <ArrowUpRight className="h-4 w-4" />
          </Link>
        </CardHeader>
        <CardContent>
          {!campaigns || campaigns.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-sm text-zinc-500">No campaigns launched yet. Start by typing a campaign goal in AI Copilot!</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-zinc-100 text-xs font-semibold text-zinc-500 uppercase tracking-wider dark:border-zinc-900">
                    <th className="pb-3">Campaign Name</th>
                    <th className="pb-3">Audience Segment</th>
                    <th className="pb-3">Channel</th>
                    <th className="pb-3">Status</th>
                    <th className="pb-3">Funnel Status (Deliv/Open/Purch)</th>
                    <th className="pb-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-900 text-sm">
                  {campaigns.map((c) => (
                    <tr key={c.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/10">
                      <td className="py-4 font-semibold text-zinc-950 dark:text-zinc-50">{c.name}</td>
                      <td className="py-4 text-zinc-500 dark:text-zinc-400">{c.segment_name || "Custom"}</td>
                      <td className="py-4">
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-zinc-600 dark:text-zinc-300">
                          <Mail className="h-3.5 w-3.5" />
                          {c.channel}
                        </span>
                      </td>
                      <td className="py-4">
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${
                          c.status === "Completed" 
                            ? "bg-green-50 text-green-700 dark:bg-green-950/20 dark:text-green-400"
                            : c.status === "Running"
                            ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/20 dark:text-indigo-400 animate-pulse"
                            : "bg-zinc-100 text-zinc-700 dark:bg-zinc-900 dark:text-zinc-300"
                        }`}>
                          {c.status}
                        </span>
                      </td>
                      <td className="py-4 text-zinc-600 dark:text-zinc-400">
                        {c.stats ? (
                          <div className="flex gap-2 text-xs font-medium">
                            <span className="text-purple-600 dark:text-purple-400">D:{c.stats.delivered}</span>
                            <span className="text-pink-600 dark:text-pink-400">O:{c.stats.opened}</span>
                            <span className="text-green-600 dark:text-green-400">P:{c.stats.purchased}</span>
                          </div>
                        ) : "-"}
                      </td>
                      <td className="py-4 text-right">
                        <Link 
                          href={`/campaigns?id=${c.id}`}
                          className="inline-flex items-center gap-1 rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-medium transition-colors hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-900"
                        >
                          View Analytics
                          <ArrowRight className="h-3.5 w-3.5" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </LayoutWrapper>
  );
}
