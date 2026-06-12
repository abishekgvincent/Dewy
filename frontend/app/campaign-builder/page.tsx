"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "@tanstack/react-query";
import { aiRecommendChannel, aiMessage, createCampaign, sendCampaign } from "@/lib/api";
import LayoutWrapper from "@/components/layout-wrapper";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  Megaphone, 
  Loader2, 
  Sparkles, 
  Users, 
  MessageSquare, 
  HelpCircle, 
  FileText,
  Mail,
  Smartphone,
  MessageCircle,
  Play
} from "lucide-react";
import toast from "react-hot-toast";

const CHANNELS = ["WhatsApp", "SMS", "Email", "RCS"];

export default function CampaignBuilderPage() {
  const router = useRouter();
  const [segment, setSegment] = useState<{
    name: string;
    filters: Record<string, any>;
    audience_size: number;
  } | null>(null);

  const [campaignName, setCampaignName] = useState("");
  const [selectedChannel, setSelectedChannel] = useState("WhatsApp");
  const [messageText, setMessageText] = useState("");

  const [recommendation, setRecommendation] = useState<{
    recommended_channel: string;
    reasoning: string;
  } | null>(null);

  const [variants, setVariants] = useState<{
    variant_a: string;
    variant_b: string;
    variant_c: string;
  } | null>(null);

  const [selectedVariant, setSelectedVariant] = useState<"A" | "B" | "C" | "Custom">("Custom");

  // 1. Restore segment from sessionStorage
  useEffect(() => {
    const data = sessionStorage.getItem("dewy_temp_segment");
    if (data) {
      const parsed = JSON.parse(data);
      setSegment(parsed);
      setCampaignName(`${parsed.name} Campaign`);
    } else {
      toast.error("No segment selected. Redirecting to AI Copilot.");
      router.push("/ai-copilot");
    }
  }, [router]);

  // 2. Fetch Channel Recommendation
  const recommendMutation = useMutation({
    mutationFn: aiRecommendChannel,
    onSuccess: (data) => {
      setRecommendation(data);
      setSelectedChannel(data.recommended_channel);
      // Once channel is recommended, trigger message variants generation
      if (segment) {
        messageMutation.mutate({ segmentName: segment.name, channel: data.recommended_channel });
      }
    },
    onError: (err: any) => {
      console.error("Channel recommendation failed", err);
    }
  });

  // 3. Fetch Message Variants
  const messageMutation = useMutation({
    mutationFn: ({ segmentName, channel }: { segmentName: string; channel: string }) => 
      aiMessage(segmentName, channel),
    onSuccess: (data) => {
      setVariants(data);
      // Default to variant_a
      setMessageText(data.variant_a);
      setSelectedVariant("A");
      toast.success("AI messages copy variants generated!");
    },
    onError: (err: any) => {
      toast.error("Failed to generate campaign messages.");
    }
  });

  // Call recommendation once segment is loaded
  useEffect(() => {
    if (segment && !recommendation) {
      recommendMutation.mutate({
        segment_name: segment.name,
        filters: segment.filters,
      });
    }
  }, [segment]);

  // Handle changing the channel manually - regenerates variants
  const handleChannelChange = (channel: string) => {
    setSelectedChannel(channel);
    if (segment) {
      messageMutation.mutate({ segmentName: segment.name, channel });
    }
  };

  // Select variant helper
  const handleSelectVariant = (variant: "A" | "B" | "C", text: string) => {
    setSelectedVariant(variant);
    setMessageText(text);
  };

  // 4. Launch Campaign Mutation
  const launchMutation = useMutation({
    mutationFn: async () => {
      if (!segment) throw new Error("No segment");
      // Step A: Create campaign (and segment inside backend)
      const camp = await createCampaign({
        name: campaignName,
        channel: selectedChannel,
        message: messageText,
        segment_name: segment.name,
        filters: segment.filters,
        description: `Campaign target segment: ${segment.name}`,
      });
      // Step B: Trigger send
      await sendCampaign(camp.id);
      return camp;
    },
    onSuccess: (data) => {
      toast.success("Campaign launched successfully!");
      // Redirect to Campaign Analytics
      router.push(`/campaigns?id=${data.id}`);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.detail || "Failed to launch campaign.");
    }
  });

  const handleLaunch = () => {
    if (!campaignName.trim()) {
      toast.error("Please enter a campaign name.");
      return;
    }
    if (!messageText.trim()) {
      toast.error("Please enter or select message copy.");
      return;
    }
    launchMutation.mutate();
  };

  if (!segment) {
    return (
      <LayoutWrapper>
        <div className="flex h-[50vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-pink-500" />
        </div>
      </LayoutWrapper>
    );
  }

  const isGenerating = recommendMutation.isPending || messageMutation.isPending;

  return (
    <LayoutWrapper>
      {/* Header */}
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-white flex items-center gap-2">
          <Megaphone className="h-7 w-7 text-pink-500" />
          Campaign Builder
        </h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Refine segment parameters, select communication channel, personalize messages, and launch your campaign.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Left column: Campaign and Segment info */}
        <div className="md:col-span-1 flex flex-col gap-6">
          {/* Segment Details */}
          <Card className="border border-zinc-100 bg-white dark:border-zinc-900 dark:bg-zinc-950">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold uppercase tracking-wider text-zinc-500">Selected Audience</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div>
                <h3 className="font-semibold text-zinc-900 dark:text-white text-base">{segment.name}</h3>
                <p className="text-xs text-zinc-400 mt-0.5">Filters: {JSON.stringify(segment.filters)}</p>
              </div>
              <div className="flex items-center gap-2 rounded-lg bg-pink-50/50 p-3 dark:bg-pink-950/10">
                <Users className="h-5 w-5 text-pink-500" />
                <div>
                  <p className="text-xs text-zinc-400 font-semibold">Audience size</p>
                  <p className="text-sm font-bold text-zinc-900 dark:text-white">{segment.audience_size.toLocaleString()} customers</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Campaign details */}
          <Card className="border border-zinc-100 bg-white dark:border-zinc-900 dark:bg-zinc-950">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold uppercase tracking-wider text-zinc-500">General Settings</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-zinc-500">Campaign Name</label>
                <Input
                  value={campaignName}
                  onChange={(e) => setCampaignName(e.target.value)}
                  placeholder="Enter campaign name..."
                  className="border-zinc-200 focus:border-pink-500 dark:border-zinc-800"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-zinc-500">Marketing Channel</label>
                <div className="grid grid-cols-2 gap-2">
                  {CHANNELS.map((ch) => {
                    const isSelected = selectedChannel === ch;
                    return (
                      <button
                        key={ch}
                        onClick={() => handleChannelChange(ch)}
                        className={`flex items-center justify-center gap-2 rounded-lg py-2.5 text-xs font-semibold border transition-all ${
                          isSelected
                            ? "bg-pink-50 border-pink-500 text-pink-600 dark:bg-pink-950/20 dark:border-pink-500 dark:text-pink-400"
                            : "bg-white border-zinc-100 hover:border-zinc-200 text-zinc-700 dark:bg-zinc-900 dark:border-zinc-800 dark:text-zinc-300 dark:hover:border-zinc-700"
                        }`}
                      >
                        {ch === "Email" && <Mail className="h-3.5 w-3.5" />}
                        {ch === "SMS" && <Smartphone className="h-3.5 w-3.5" />}
                        {ch === "WhatsApp" && <MessageCircle className="h-3.5 w-3.5" />}
                        {ch === "RCS" && <MessageSquare className="h-3.5 w-3.5" />}
                        {ch}
                      </button>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right column: Copilot recommendation & message copy options */}
        <div className="md:col-span-2 flex flex-col gap-6">
          {/* AI Channel Recommendation Card */}
          {recommendation && (
            <Card className="border-l-4 border-l-purple-500 border-zinc-100 bg-white shadow-sm dark:border-zinc-900 dark:bg-zinc-950">
              <CardHeader className="py-4">
                <CardTitle className="text-xs font-semibold text-purple-600 dark:text-purple-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="h-4 w-4 fill-purple-500 text-purple-500 animate-pulse" />
                  AI Channel Recommendation
                </CardTitle>
              </CardHeader>
              <CardContent className="pb-4">
                <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
                  Recommended: <span className="text-purple-600 dark:text-purple-400 font-bold">{recommendation.recommended_channel}</span>
                </p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 leading-relaxed">
                  {recommendation.reasoning}
                </p>
              </CardContent>
            </Card>
          )}

          {/* AI Message Variants Card */}
          <Card className="border border-zinc-100 bg-white dark:border-zinc-900 dark:bg-zinc-950">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">AI Copywriting Assistants</CardTitle>
              <CardDescription>Select one of the AI-generated variants or customize your own copy.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-6">
              {isGenerating ? (
                <div className="flex min-h-[150px] items-center justify-center">
                  <div className="flex flex-col items-center gap-2">
                    <Loader2 className="h-6 w-6 animate-spin text-pink-500" />
                    <span className="text-xs text-zinc-400 font-medium">Gemini is writing templates...</span>
                  </div>
                </div>
              ) : variants ? (
                <div className="grid gap-4 sm:grid-cols-3">
                  <button
                    onClick={() => handleSelectVariant("A", variants.variant_a)}
                    className={`text-left border rounded-xl p-4 transition-all duration-200 flex flex-col gap-2 ${
                      selectedVariant === "A"
                        ? "border-pink-500 bg-pink-50/20 shadow-sm dark:bg-pink-950/10"
                        : "border-zinc-100 hover:border-zinc-200 bg-zinc-50/50 dark:border-zinc-800 dark:hover:border-zinc-700"
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="text-xs font-bold text-pink-600 dark:text-pink-400 uppercase">Variant A</span>
                      <FileText className="h-3.5 w-3.5 text-zinc-400" />
                    </div>
                    <p className="text-xs text-zinc-600 dark:text-zinc-400 line-clamp-3 leading-relaxed">
                      {variants.variant_a}
                    </p>
                  </button>

                  <button
                    onClick={() => handleSelectVariant("B", variants.variant_b)}
                    className={`text-left border rounded-xl p-4 transition-all duration-200 flex flex-col gap-2 ${
                      selectedVariant === "B"
                        ? "border-pink-500 bg-pink-50/20 shadow-sm dark:bg-pink-950/10"
                        : "border-zinc-100 hover:border-zinc-200 bg-zinc-50/50 dark:border-zinc-800 dark:hover:border-zinc-700"
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="text-xs font-bold text-pink-600 dark:text-pink-400 uppercase">Variant B</span>
                      <FileText className="h-3.5 w-3.5 text-zinc-400" />
                    </div>
                    <p className="text-xs text-zinc-600 dark:text-zinc-400 line-clamp-3 leading-relaxed">
                      {variants.variant_b}
                    </p>
                  </button>

                  <button
                    onClick={() => handleSelectVariant("C", variants.variant_c)}
                    className={`text-left border rounded-xl p-4 transition-all duration-200 flex flex-col gap-2 ${
                      selectedVariant === "C"
                        ? "border-pink-500 bg-pink-50/20 shadow-sm dark:bg-pink-950/10"
                        : "border-zinc-100 hover:border-zinc-200 bg-zinc-50/50 dark:border-zinc-800 dark:hover:border-zinc-700"
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="text-xs font-bold text-pink-600 dark:text-pink-400 uppercase">Variant C</span>
                      <FileText className="h-3.5 w-3.5 text-zinc-400" />
                    </div>
                    <p className="text-xs text-zinc-600 dark:text-zinc-400 line-clamp-3 leading-relaxed">
                      {variants.variant_c}
                    </p>
                  </button>
                </div>
              ) : (
                <div className="text-center py-6 text-zinc-400 text-xs">
                  Generate copy by selecting a channel.
                </div>
              )}

              {/* Message Input Box */}
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-zinc-500">Edit Final Copy</label>
                  <span className="text-[10px] text-zinc-400 font-mono">
                    Characters: {messageText.length}
                  </span>
                </div>
                <Textarea
                  value={messageText}
                  onChange={(e) => {
                    setMessageText(e.target.value);
                    setSelectedVariant("Custom");
                  }}
                  placeholder="Write your campaign copy here..."
                  className="min-h-[160px] border-zinc-200 focus:border-pink-500 dark:border-zinc-800 leading-relaxed font-sans"
                />
              </div>

              {/* Launch Action */}
              <Button
                onClick={handleLaunch}
                disabled={launchMutation.isPending || isGenerating}
                className="w-full bg-gradient-to-r from-pink-500 to-rose-500 text-white font-bold"
              >
                {launchMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Launching Campaign...
                  </>
                ) : (
                  <>
                    <Play className="mr-2 h-4 w-4 fill-white" />
                    Launch Campaign Now
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </LayoutWrapper>
  );
}
