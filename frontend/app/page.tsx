"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "@tanstack/react-query";
import { uploadDataset, getDatasets } from "@/lib/api";
import LayoutWrapper from "@/components/layout-wrapper";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, Database, Upload, ArrowRight, Play, Loader2, CheckCircle, Info } from "lucide-react";
import toast from "react-hot-toast";

export default function HomePage() {
  const router = useRouter();

  // Query to check if any dataset is already loaded
  const { data: datasets, isLoading: datasetsLoading } = useQuery({
    queryKey: ["datasets"],
    queryFn: getDatasets,
  });

  const uploadMutation = useMutation({
    mutationFn: uploadDataset,
    onSuccess: (data) => {
      toast.success(data.message || "Seeded dataset successfully loaded!");
      router.push("/ai-copilot");
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.detail || "Failed to load seeded dataset.");
    }
  });

  const handleLoadDemoDataset = () => {
    const formData = new FormData();
    formData.append("name", "Consumer Brand (Preloaded)");
    formData.append("preloaded", "true");
    uploadMutation.mutate(formData);
  };

  const hasDatasets = datasets && datasets.length > 0;

  return (
    <LayoutWrapper>
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)] py-12 px-4">
        
        {/* Hero Section */}
        <div className="text-center max-w-2xl mb-12 space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-sky-200 bg-sky-50/50 text-sky-600 dark:border-sky-900/30 dark:bg-sky-950/20 dark:text-sky-400 text-xs font-bold uppercase tracking-wider mb-2">
            <Sparkles className="h-3.5 w-3.5 fill-sky-500/10 animate-pulse" />
            AI-Native CRM Platform
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight bg-gradient-to-r from-zinc-900 via-sky-900 to-indigo-900 bg-clip-text text-transparent dark:from-white dark:via-zinc-200 dark:to-sky-400">
            Welcome to Dewy
          </h1>
          <p className="text-base sm:text-lg text-zinc-500 dark:text-zinc-400 leading-relaxed">
            Intelligently identify, segment, and convert shopper cohorts using natural language directives and automated campaign simulations.
          </p>
        </div>

        {/* Action Panel */}
        <div className="grid gap-6 md:grid-cols-2 max-w-4xl w-full">
          
          {/* Card 1: Load Seeded Demo */}
          <Card className="border-zinc-200/80 bg-white shadow-md dark:border-zinc-800 dark:bg-zinc-950 flex flex-col justify-between transition-all hover:shadow-lg">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-bold text-zinc-950 dark:text-white flex items-center gap-2">
                <Play className="h-5 w-5 text-sky-500 fill-sky-500/10" />
                Quick Start: Demo Dataset
              </CardTitle>
              <CardDescription className="text-sm">
                Get started instantly by loading our pre-seeded synthetic consumer brand dataset.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg bg-zinc-50 dark:bg-zinc-900/40 p-4 border border-zinc-100 dark:border-zinc-900 text-xs space-y-2 text-zinc-500 dark:text-zinc-450">
                <div className="font-semibold text-zinc-700 dark:text-zinc-300">Seeded Dataset Includes:</div>
                <div>• 1,000 synthetic consumer profiles</div>
                <div>• 100 products across Apparel, Tech, Home & Beauty</div>
                <div>• 7,200+ transaction histories and affinity rules</div>
              </div>
              <Button 
                onClick={handleLoadDemoDataset}
                disabled={uploadMutation.isPending}
                className="w-full bg-gradient-to-r from-sky-500 to-cyan-500 hover:from-sky-600 hover:to-cyan-600 text-white font-bold h-11 shadow-sm flex items-center justify-center gap-2"
              >
                {uploadMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Ingesting demo files...
                  </>
                ) : (
                  <>
                    Load Seeded Dataset <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Card 2: Custom Data Ingestion */}
          <Card className="border-zinc-200/80 bg-white shadow-md dark:border-zinc-800 dark:bg-zinc-950 flex flex-col justify-between transition-all hover:shadow-lg">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-bold text-zinc-950 dark:text-white flex items-center gap-2">
                <Upload className="h-5 w-5 text-indigo-500" />
                Ingest Your Own Data
              </CardTitle>
              <CardDescription className="text-sm">
                Import custom customer directory, transactions, and product catalog CSV datasets.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg bg-zinc-50 dark:bg-zinc-900/40 p-4 border border-zinc-100 dark:border-zinc-900 text-xs space-y-2 text-zinc-500 dark:text-zinc-450">
                <div className="font-semibold text-zinc-700 dark:text-zinc-300">File Ingestion Schema:</div>
                <div>• <strong>customers.csv</strong>: name, email, phone, city, age_group</div>
                <div>• <strong>products.csv</strong>: name, category, price, refill_cycle_days</div>
                <div>• <strong>orders.csv</strong>: customer_id, order_amount, order_date</div>
              </div>
              <Button 
                variant="outline"
                onClick={() => router.push("/datasets")}
                className="w-full border-zinc-200 hover:border-zinc-300 text-zinc-800 dark:border-zinc-800 dark:text-zinc-200 dark:hover:border-zinc-700 font-bold h-11 flex items-center justify-center gap-2"
              >
                Go to Ingest Terminal <ArrowRight className="h-4 w-4" />
              </Button>
            </CardContent>
          </Card>

        </div>

        {/* Dynamic Context Shortcut */}
        {hasDatasets && (
          <div className="mt-8 flex flex-col items-center gap-3 animate-in fade-in duration-300">
            <div className="text-sm text-zinc-400 flex items-center gap-1.5 font-medium">
              <CheckCircle className="h-4 w-4 text-emerald-500" />
              Active database record directories detected.
            </div>
            <Button
              onClick={() => router.push("/ai-copilot")}
              className="bg-zinc-900 hover:bg-zinc-850 text-white dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-100 font-bold h-10 px-6 rounded-lg shadow-sm"
            >
              Enter AI Copilot Workspace
            </Button>
          </div>
        )}

      </div>
    </LayoutWrapper>
  );
}
