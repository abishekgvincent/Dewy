"use client";

import React, { Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { getCampaigns, getCampaign } from "@/lib/api";
import LayoutWrapper from "@/components/layout-wrapper";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Megaphone, 
  Loader2, 
  ArrowLeft, 
  Send, 
  CheckCircle, 
  Eye, 
  MousePointerClick, 
  ShoppingBag, 
  DollarSign, 
  Mail, 
  Sparkles, 
  RefreshCw,
  Users
} from "lucide-react";
import Link from "next/link";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";

// Inner component that reads search params
function CampaignsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const campaignIdStr = searchParams.get("id");
  const campaignId = campaignIdStr ? parseInt(campaignIdStr) : null;

  // 1. Fetch campaigns (for list view)
  const { data: campaigns, isLoading: listLoading } = useQuery({
    queryKey: ["campaigns"],
    queryFn: getCampaigns,
    enabled: !campaignId,
    refetchInterval: 5000,
  });

  // 2. Fetch single campaign details (for detail view)
  // Auto-refresh every 4 seconds if campaign is running, to watch simulation live!
  const { data: campaign, isLoading: detailLoading, error: detailError, refetch: refetchDetail } = useQuery({
    queryKey: ["campaign", campaignId],
    queryFn: () => getCampaign(campaignId!),
    enabled: !!campaignId,
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      return status === "Running" ? 3000 : 8000; // poll faster during run
    },
    retry: 1,
  });

  const handleBack = () => {
    router.push("/campaigns");
  };

  // State 1: Detail/Analytics View
  if (campaignId) {
    if (detailLoading) {
      return (
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="h-8 w-8 animate-spin text-sky-500" />
            <p className="text-base text-zinc-500 font-medium">Loading campaign analytics...</p>
          </div>
        </div>
      );
    }

    if (detailError || !campaign) {
      return (
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-red-950 dark:border-red-900/50 dark:bg-red-950/20 dark:text-red-300">
          <h2 className="text-lg font-semibold">Campaign Not Found</h2>
          <p className="text-sm mb-4">The campaign with ID {campaignId} could not be loaded.</p>
          <Button onClick={handleBack} variant="outline">Back to Campaigns</Button>
        </div>
      );
    }

    const { stats } = campaign;
    
    // Funnel Data for Recharts
    const funnelData = [
      { name: "Sent", count: stats.sent, percentage: 100, color: "#6366f1" },
      { name: "Delivered", count: stats.delivered, percentage: stats.sent ? Math.round((stats.delivered / stats.sent) * 100) : 0, color: "#8b5cf6" },
      { name: "Opened", count: stats.opened, percentage: stats.delivered ? Math.round((stats.opened / stats.delivered) * 100) : 0, color: "#ec4899" },
      { name: "Clicked", count: stats.clicked, percentage: stats.opened ? Math.round((stats.clicked / stats.opened) * 100) : 0, color: "#f43f5e" },
      { name: "Purchased", count: stats.purchased, percentage: stats.clicked ? Math.round((stats.purchased / stats.clicked) * 100) : 0, color: "#10b981" },
    ];

    return (
      <div className="flex flex-col gap-6">
        {/* Detail Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <Button onClick={handleBack} variant="outline" size="icon" className="h-9 w-9">
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">{campaign.name}</h1>
                <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${
                  campaign.status === "Completed"
                    ? "bg-green-50 text-green-700 dark:bg-green-950/20 dark:text-green-400"
                    : campaign.status === "Running"
                    ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/20 dark:text-indigo-400 animate-pulse"
                    : "bg-zinc-100 text-zinc-700 dark:bg-zinc-900 dark:text-zinc-300"
                }`}>
                  {campaign.status}
                </span>
              </div>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                Segment: <span className="font-semibold">{campaign.segment?.name}</span> | Channel: {campaign.channel}
              </p>
            </div>
          </div>
          <Button onClick={() => refetchDetail()} variant="outline" size="sm" className="h-9 flex gap-1.5 items-center">
            <RefreshCw className="h-4 w-4 text-zinc-500" />
            Sync Metrics
          </Button>
        </div>

        {/* Stats Cards Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
          <Card className="border-zinc-100 bg-white dark:border-zinc-900 dark:bg-zinc-950">
            <CardContent className="pt-6 flex flex-col gap-1">
              <div className="flex justify-between items-center text-zinc-400">
                <span className="text-sm font-semibold uppercase tracking-wider">Sent</span>
                <Send className="h-4 w-4 text-indigo-500" />
              </div>
              <p className="text-2xl font-bold text-zinc-950 dark:text-zinc-50">{stats.sent.toLocaleString()}</p>
              <p className="text-sm text-zinc-400 font-medium">100% of audience</p>
            </CardContent>
          </Card>

          <Card className="border-zinc-100 bg-white dark:border-zinc-900 dark:bg-zinc-950">
            <CardContent className="pt-6 flex flex-col gap-1">
              <div className="flex justify-between items-center text-zinc-400">
                <span className="text-sm font-semibold uppercase tracking-wider">Delivered</span>
                <CheckCircle className="h-4 w-4 text-purple-500" />
              </div>
              <p className="text-2xl font-bold text-zinc-950 dark:text-zinc-50">{stats.delivered.toLocaleString()}</p>
              <p className="text-sm text-green-500 font-medium">
                {stats.sent ? ((stats.delivered / stats.sent) * 100).toFixed(1) : 0}% delivery rate
              </p>
            </CardContent>
          </Card>

          <Card className="border-zinc-100 bg-white dark:border-zinc-900 dark:bg-zinc-950">
            <CardContent className="pt-6 flex flex-col gap-1">
              <div className="flex justify-between items-center text-zinc-400">
                <span className="text-sm font-semibold uppercase tracking-wider">Opened</span>
                <Eye className="h-4 w-4 text-sky-500" />
              </div>
              <p className="text-2xl font-bold text-zinc-950 dark:text-zinc-50">{stats.opened.toLocaleString()}</p>
              <p className="text-sm text-sky-500 font-medium">
                {stats.delivered ? ((stats.opened / stats.delivered) * 100).toFixed(1) : 0}% open rate
              </p>
            </CardContent>
          </Card>

          <Card className="border-zinc-100 bg-white dark:border-zinc-900 dark:bg-zinc-950">
            <CardContent className="pt-6 flex flex-col gap-1">
              <div className="flex justify-between items-center text-zinc-400">
                <span className="text-sm font-semibold uppercase tracking-wider">Clicked</span>
                <MousePointerClick className="h-4 w-4 text-cyan-500" />
              </div>
              <p className="text-2xl font-bold text-zinc-950 dark:text-zinc-50">{stats.clicked.toLocaleString()}</p>
              <p className="text-sm text-cyan-500 font-medium">
                {stats.opened ? ((stats.clicked / stats.opened) * 100).toFixed(1) : 0}% CTR
              </p>
            </CardContent>
          </Card>

          <Card className="border-zinc-100 bg-white dark:border-zinc-900 dark:bg-zinc-950">
            <CardContent className="pt-6 flex flex-col gap-1">
              <div className="flex justify-between items-center text-zinc-400">
                <span className="text-sm font-semibold uppercase tracking-wider">Purchased</span>
                <ShoppingBag className="h-4 w-4 text-emerald-500" />
              </div>
              <p className="text-2xl font-bold text-zinc-950 dark:text-zinc-50">{stats.purchased.toLocaleString()}</p>
              <p className="text-sm text-emerald-500 font-medium">
                {stats.clicked ? ((stats.purchased / stats.clicked) * 100).toFixed(1) : 0}% conversion
              </p>
            </CardContent>
          </Card>

          <Card className="border-zinc-100 bg-white dark:border-zinc-900 dark:bg-zinc-950">
            <CardContent className="pt-6 flex flex-col gap-1">
              <div className="flex justify-between items-center text-zinc-400">
                <span className="text-sm font-semibold uppercase tracking-wider">Revenue</span>
                <DollarSign className="h-4 w-4 text-amber-500" />
              </div>
              <p className="text-2xl font-bold text-zinc-950 dark:text-zinc-50">${stats.revenue.toLocaleString()}</p>
              <p className="text-sm text-zinc-400 font-medium">
                ${stats.purchased ? (stats.revenue / stats.purchased).toFixed(2) : 0} avg order
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Funnel Graph + AI Insights */}
        <div className="grid gap-6 lg:grid-cols-7">
          {/* Funnel chart */}
          <Card className="border border-zinc-100 bg-white dark:border-zinc-900 dark:bg-zinc-950 lg:col-span-4">
            <CardHeader>
              <CardTitle className="text-base font-semibold">Conversion Funnel</CardTitle>
              <CardDescription>Visualizing customer drop-offs and conversions</CardDescription>
            </CardHeader>
            <CardContent className="h-80 pl-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={funnelData} margin={{ top: 20, right: 30, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-zinc-100 dark:stroke-zinc-800" />
                  <XAxis dataKey="name" stroke="#a1a1aa" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="#a1a1aa" fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip 
                    formatter={(v: any, name: any, item: any) => [
                      `${v.toLocaleString()} (${item.payload.percentage}% rate)`, 
                      "Count"
                    ]}
                    contentStyle={{ backgroundColor: "#18181b", borderColor: "#27272a", color: "#fff", borderRadius: "8px", fontSize: "12px" }}
                  />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]} barSize={35}>
                    {funnelData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* AI Insights Card */}
          <Card className="border border-zinc-100 bg-white dark:border-zinc-900 dark:bg-zinc-950 lg:col-span-3">
            <CardHeader>
              <CardTitle className="text-base font-semibold flex items-center gap-1 text-purple-600 dark:text-purple-400">
                <Sparkles className="h-5 w-5 fill-purple-500 text-purple-500" />
                AI Post-Campaign Insights
              </CardTitle>
              <CardDescription>Gemini-powered evaluation of performance</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              {campaign.insight ? (
                <>
                  <div className="flex flex-col gap-1">
                    <h4 className="text-sm font-bold uppercase tracking-wider text-zinc-400">Performance Summary</h4>
                    <p className="text-sm text-zinc-600 dark:text-zinc-300 leading-relaxed">
                      {campaign.insight.summary}
                    </p>
                  </div>
                  <div className="flex flex-col gap-1 border-t border-zinc-100 pt-3 dark:border-zinc-900">
                    <h4 className="text-sm font-bold uppercase tracking-wider text-zinc-400">Recommendations & Follow-up</h4>
                    <p className="text-sm text-zinc-600 dark:text-zinc-300 leading-relaxed whitespace-pre-line">
                      {campaign.insight.recommendations}
                    </p>
                  </div>
                </>
              ) : (
                <div className="flex h-full min-h-[180px] flex-col items-center justify-center text-center p-4">
                  <Loader2 className="h-6 w-6 animate-spin text-purple-500 mb-2" />
                  <p className="text-sm text-zinc-400 font-medium">
                    {campaign.status === "Running" 
                      ? "Waiting for campaign to complete sending before generating AI insights..."
                      : "Generating campaign insights..."}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Communications log */}
        <Card className="border border-zinc-100 bg-white dark:border-zinc-900 dark:bg-zinc-950">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Individual Communication Logs</CardTitle>
            <CardDescription>Live update status of every message sent</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto max-h-[350px]">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-zinc-100 text-sm font-semibold text-zinc-500 uppercase tracking-wider dark:border-zinc-900">
                    <th className="pb-3">Customer</th>
                    <th className="pb-3">Email</th>
                    <th className="pb-3">Channel</th>
                    <th className="pb-3">Status</th>
                    <th className="pb-3 text-right">Sent Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-900 text-sm">
                  {campaign.communications.map((co) => (
                    <tr key={co.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/10">
                      <td className="py-2 font-semibold text-zinc-900 dark:text-white">{co.customer_name}</td>
                      <td className="py-2 text-zinc-500">{co.customer_email}</td>
                      <td className="py-2 font-medium text-zinc-600 dark:text-zinc-400">{co.channel}</td>
                      <td className="py-2">
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-bold ${
                          co.status === "Purchased"
                            ? "bg-green-100 text-green-800 dark:bg-green-950/20 dark:text-green-400"
                            : co.status === "Opened" || co.status === "Clicked"
                            ? "bg-sky-100 text-sky-800 dark:bg-sky-950/20 dark:text-sky-400"
                            : co.status === "Failed"
                            ? "bg-red-100 text-red-800 dark:bg-red-950/20 dark:text-red-400"
                            : "bg-indigo-50 text-indigo-850 dark:bg-indigo-950/20 dark:text-indigo-400"
                        }`}>
                          {co.status}
                        </span>
                      </td>
                      <td className="py-2 text-right text-zinc-400 font-mono">
                        {new Date(co.sent_at).toLocaleTimeString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // State 2: List View
  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-white">
            Campaign Logs
          </h1>
          <p className="text-base text-zinc-500 dark:text-zinc-400">
            View history, delivery metrics, and conversion rates of launched campaigns.
          </p>
        </div>
        <Link 
          href="/"
          className="flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-sky-500 to-cyan-500 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:opacity-90 transition-opacity"
        >
          <Sparkles className="h-4 w-4 fill-white" />
          Create with AI
        </Link>
      </div>

      {/* Campaigns Grid */}
      {listLoading ? (
        <div className="flex min-h-[40vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-sky-500" />
        </div>
      ) : !campaigns || campaigns.length === 0 ? (
        <Card className="border border-dashed border-zinc-200 dark:border-zinc-800 text-center p-12">
          <CardContent className="flex flex-col items-center gap-4">
            <Megaphone className="h-12 w-12 text-zinc-300 dark:text-zinc-700" />
            <div>
              <h3 className="font-semibold text-zinc-900 dark:text-white">No Campaigns Launched</h3>
              <p className="text-sm text-zinc-400 max-w-sm mt-1">
                You have not launched any marketing campaigns yet. Create your first segment in AI Copilot.
              </p>
            </div>
            <Link href="/">
              <Button>Start AI Copilot</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {campaigns.map((c) => (
            <Card
              key={c.id}
              role="button"
              tabIndex={0}
              onClick={() => router.push(`/campaigns?id=${c.id}`)}
              onKeyDown={(e) => e.key === "Enter" && router.push(`/campaigns?id=${c.id}`)}
              className="cursor-pointer border border-zinc-100 bg-white/50 backdrop-blur-md transition-all hover:border-sky-300 hover:shadow-md dark:border-zinc-900 dark:bg-zinc-950/50 dark:hover:border-sky-900 flex flex-col justify-between"
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between w-full">
                  <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold ${
                    c.status === "Completed"
                      ? "bg-green-50 text-green-700 dark:bg-green-950/20 dark:text-green-400"
                      : c.status === "Running"
                      ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/20 dark:text-indigo-400 animate-pulse"
                      : "bg-zinc-100 text-zinc-700 dark:bg-zinc-900 dark:text-zinc-300"
                  }`}>
                    {c.status}
                  </span>
                  <span className="text-xs text-zinc-400 font-medium">
                    {new Date(c.created_at).toLocaleDateString()}
                  </span>
                </div>
                <CardTitle className="text-base font-bold text-zinc-950 dark:text-zinc-50 mt-2 line-clamp-1">
                  {c.name}
                </CardTitle>
                <CardDescription className="text-sm">
                  Segment: <span className="font-medium text-zinc-700 dark:text-zinc-300">{c.segment_name || "Custom"}</span>
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                <p className="text-sm text-zinc-500 dark:text-zinc-400 line-clamp-2 italic">
                  {`"${c.message}"`}
                </p>
                <div className="flex items-center justify-between border-t border-zinc-100 pt-3 dark:border-zinc-900 text-xs">
                  <span className="inline-flex items-center gap-1 text-zinc-400">
                    <Mail className="h-3.5 w-3.5" />
                    {c.channel}
                  </span>
                  <span className="inline-flex items-center gap-1 font-semibold text-zinc-900 dark:text-zinc-50">
                    <Users className="h-3.5 w-3.5 text-zinc-400" />
                    {c.audience_size || 0} reached
                  </span>
                </div>
                <Button 
                  onClick={(e) => {
                    e.stopPropagation();
                    router.push(`/campaigns?id=${c.id}`);
                  }}
                  className="w-full bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-white dark:hover:bg-zinc-100 dark:text-zinc-950"
                  size="sm"
                >
                  View Live Analytics
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

export default function CampaignsPage() {
  return (
    <LayoutWrapper>
      <Suspense fallback={
        <div className="flex min-h-[60vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-sky-500" />
        </div>
      }>
        <CampaignsContent />
      </Suspense>
    </LayoutWrapper>
  );
}
