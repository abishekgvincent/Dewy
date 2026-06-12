"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { aiSegment, AISegmentResponse } from "@/lib/api";
import LayoutWrapper from "@/components/layout-wrapper";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Sparkles, Loader2, ArrowRight, UserCheck, DollarSign, ListFilter, Droplet } from "lucide-react";
import toast from "react-hot-toast";

const SUGGESTED_PROMPTS = [
  "Win back customers who haven't purchased in 90 days",
  "Sunscreen buyers who have never purchased a moisturizer",
  "VIP customers with total spend over $200",
  "Oily and sensitive skin customers for acne care promotion",
];

export default function AICopilotPage() {
  const router = useRouter();
  const [prompt, setPrompt] = useState("");
  const [segmentResult, setSegmentResult] = useState<AISegmentResponse | null>(null);

  const mutation = useMutation({
    mutationFn: aiSegment,
    onSuccess: (data) => {
      setSegmentResult(data);
      toast.success("Audience segment identified!");
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.detail || "Failed to analyze prompt.");
    },
  });

  const handleSearch = () => {
    if (!prompt.trim()) {
      toast.error("Please enter a marketing goal.");
      return;
    }
    mutation.mutate(prompt);
  };

  const handleProceed = () => {
    if (!segmentResult) return;
    // Store segment details in sessionStorage for the Campaign Builder page
    sessionStorage.setItem(
      "dewy_temp_segment",
      JSON.stringify({
        name: segmentResult.segment_name,
        filters: segmentResult.filters,
        audience_size: segmentResult.audience_size,
      })
    );
    router.push("/campaign-builder");
  };

  return (
    <LayoutWrapper>
      {/* Header */}
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-white flex items-center gap-2">
          <Sparkles className="h-7 w-7 text-pink-500 fill-pink-500 animate-pulse" />
          AI Campaign Copilot
        </h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Describe your marketing goal in plain English, and let Gemini identify the target audience.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Prompts Input Section */}
        <div className="md:col-span-1 flex flex-col gap-6">
          <Card className="border-zinc-200/80 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
            <CardHeader>
              <CardTitle className="text-sm font-semibold uppercase tracking-wider text-zinc-500">What is your goal?</CardTitle>
              <CardDescription>Enter a natural language request.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <Textarea
                placeholder="e.g. Win back customers who haven't ordered in 90 days..."
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="min-h-[120px] resize-none border-zinc-200 focus:border-pink-500 dark:border-zinc-800"
              />
              <Button
                onClick={handleSearch}
                disabled={mutation.isPending}
                className="w-full bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 text-white hover:opacity-90 transition-opacity"
              >
                {mutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Analyzing segment...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4 fill-white" />
                    Generate Segment
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Quick Suggestions */}
          <Card className="border-zinc-200/80 bg-white/50 backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-950/50">
            <CardHeader className="py-4">
              <CardTitle className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Suggested Goals</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2 pb-4">
              {SUGGESTED_PROMPTS.map((p, i) => (
                <button
                  key={i}
                  onClick={() => setPrompt(p)}
                  className="text-left text-xs text-zinc-600 hover:text-pink-500 dark:text-zinc-400 dark:hover:text-pink-400 border border-zinc-100 hover:border-pink-100 rounded-lg p-2.5 transition-all bg-white dark:bg-zinc-900/50 dark:border-zinc-800 dark:hover:border-zinc-700"
                >
                  "{p}"
                </button>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Results Section */}
        <div className="md:col-span-2 flex flex-col gap-6">
          {!segmentResult ? (
            <div className="flex h-full min-h-[300px] flex-col items-center justify-center border border-dashed border-zinc-200 rounded-xl bg-zinc-50/50 dark:border-zinc-800 dark:bg-zinc-900/10 text-center p-6">
              <Sparkles className="h-12 w-12 text-zinc-300 dark:text-zinc-700 mb-3" />
              <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">Waiting for Goal</h3>
              <p className="text-xs text-zinc-400 max-w-xs mt-1">
                Input your campaign goals on the left, and click Generate Segment to view matching audience and spend statistics.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
              {/* Segment Overview Stats */}
              <div className="grid gap-4 sm:grid-cols-3">
                <Card className="border-zinc-100 bg-white dark:border-zinc-900 dark:bg-zinc-950">
                  <CardContent className="pt-6 flex items-center gap-3">
                    <div className="rounded-lg bg-pink-50 p-2 dark:bg-pink-950/30">
                      <UserCheck className="h-5 w-5 text-pink-500" />
                    </div>
                    <div>
                      <p className="text-xs text-zinc-400 font-semibold uppercase tracking-wider">Audience Size</p>
                      <p className="text-xl font-bold text-zinc-950 dark:text-zinc-50">{segmentResult.audience_size.toLocaleString()}</p>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-zinc-100 bg-white dark:border-zinc-900 dark:bg-zinc-950">
                  <CardContent className="pt-6 flex items-center gap-3">
                    <div className="rounded-lg bg-purple-50 p-2 dark:bg-purple-950/30">
                      <DollarSign className="h-5 w-5 text-purple-500" />
                    </div>
                    <div>
                      <p className="text-xs text-zinc-400 font-semibold uppercase tracking-wider">Avg Spend</p>
                      <p className="text-xl font-bold text-zinc-950 dark:text-zinc-50">${segmentResult.average_spend.toFixed(2)}</p>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-zinc-100 bg-white dark:border-zinc-900 dark:bg-zinc-950">
                  <CardContent className="pt-6 flex items-center gap-3">
                    <div className="rounded-lg bg-indigo-50 p-2 dark:bg-indigo-950/30">
                      <ListFilter className="h-5 w-5 text-indigo-500" />
                    </div>
                    <div className="overflow-hidden">
                      <p className="text-xs text-zinc-400 font-semibold uppercase tracking-wider">Filters</p>
                      <p className="text-xs font-mono font-medium truncate text-zinc-950 dark:text-zinc-50">
                        {JSON.stringify(segmentResult.filters)}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Segment Customers Preview List */}
              <Card className="border-zinc-100 bg-white dark:border-zinc-900 dark:bg-zinc-950">
                <CardHeader className="flex flex-row items-center justify-between pb-4">
                  <div>
                    <CardTitle className="text-base font-semibold">
                      Segment: {segmentResult.segment_name}
                    </CardTitle>
                    <CardDescription>Sample customer matches in this segment</CardDescription>
                  </div>
                  <Button
                    onClick={handleProceed}
                    className="bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-white dark:hover:bg-zinc-100 dark:text-zinc-950"
                  >
                    Configure Campaign
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="overflow-y-auto max-h-[300px]">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-zinc-100 text-xs font-semibold text-zinc-500 uppercase tracking-wider dark:border-zinc-900">
                          <th className="pb-3">Name</th>
                          <th className="pb-3">Email</th>
                          <th className="pb-3">Skin Type</th>
                          <th className="pb-3">Persona</th>
                          <th className="pb-3 text-right">Total Spend</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-100 dark:divide-zinc-900 text-xs">
                        {segmentResult.customers.map((c) => (
                          <tr key={c.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/10">
                            <td className="py-2.5 font-medium text-zinc-950 dark:text-zinc-50">{c.name}</td>
                            <td className="py-2.5 text-zinc-500 dark:text-zinc-400">{c.email}</td>
                            <td className="py-2.5">
                              <span className="inline-flex items-center rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200">
                                {c.skin_type || "N/A"}
                              </span>
                            </td>
                            <td className="py-2.5">
                              <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                                c.persona === "VIP" 
                                  ? "bg-pink-100 text-pink-800 dark:bg-pink-950/20 dark:text-pink-400"
                                  : c.persona === "Dormant"
                                  ? "bg-zinc-100 text-zinc-800 dark:bg-zinc-900 dark:text-zinc-300"
                                  : "bg-indigo-50 text-indigo-800 dark:bg-indigo-950/20 dark:text-indigo-400"
                              }`}>
                                {c.persona}
                              </span>
                            </td>
                            <td className="py-2.5 text-right font-medium text-zinc-950 dark:text-zinc-50">${c.total_spend.toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </LayoutWrapper>
  );
}
