"use client";

import React, { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { 
  getDatasetIntelligence, 
  getMarketingOpportunities, 
  aiRecommendSegments, 
  aiRecommendChannels, 
  aiMessageVariants, 
  createCampaign, 
  sendCampaign,
  AIRecommendationSegment,
  AIRecommendationChannel,
  AIMessageVariant,
  RevenueExplanationData
} from "@/lib/api";
import LayoutWrapper from "@/components/layout-wrapper";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import RevenueExplanation from "@/components/revenue-explanation";
import { calculateProjections } from "@/lib/projections";
import { 
  Sparkles, 
  Loader2, 
  Send, 
  Bot, 
  User, 
  Check, 
  MessageSquare, 
  Users, 
  ShoppingBag, 
  DollarSign, 
  Percent, 
  ArrowRight, 
  Play, 
  TrendingUp, 
  Lightbulb, 
  Info,
  Calendar,
  Layers,
  Phone,
  Mail,
  MessageCircle,
  Zap,
  CheckCircle,
  HelpCircle
} from "lucide-react";
import toast from "react-hot-toast";

interface ChatMessage {
  id: string;
  sender: "user" | "assistant";
  text?: string;
  widgetType?: "opportunities" | "segments" | "channels" | "messages" | "summary" | "launch-success";
  widgetData?: any;
}

const getGoalSpecificCopy = (goal: string) => {
  const g = goal.toLowerCase();
  if (g.includes("repeat") || g.includes("accessory")) {
    return "Awesome, let's target customers likely due for a repeat purchase.\n\nI've ranked the highest-performing audiences below.";
  }
  if (g.includes("dormant")) {
    return "Awesome, let's re-engage inactive customers.\n\nI've ranked the highest recovery-potential audiences below.";
  }
  if (g.includes("jeans") || g.includes("apparel")) {
    return "Great choice.\n\nI've identified the strongest cross-sell audiences based on purchase affinity data.";
  }
  return `Awesome, let's target customers for "${goal}".\n\nI've ranked the highest-performing audiences below.`;
};

export default function AICopilotPage() {
  const router = useRouter();
  const [inputText, setInputText] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      sender: "assistant",
      text: "Hi! I'm Dewy, your AI Campaign Copilot. I've analyzed your database and identified the top marketing opportunities. Pick one to begin, or type a custom goal in the chat below!",
      widgetType: "opportunities"
    }
  ]);
  const [isThinking, setIsThinking] = useState(false);
  
  // Copilot workflow state variables
  const [activeGoal, setActiveGoal] = useState("");
  const [selectedSegment, setSelectedSegment] = useState<AIRecommendationSegment | null>(null);
  const [selectedChannel, setSelectedChannel] = useState<AIRecommendationChannel | null>(null);
  const [selectedMessage, setSelectedMessage] = useState<AIMessageVariant | null>(null);
  const [expandedMessage, setExpandedMessage] = useState<AIMessageVariant | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Queries for insights sidebar
  const { data: intelligence, isLoading: intelLoading } = useQuery({
    queryKey: ["dataset-intelligence"],
    queryFn: getDatasetIntelligence,
    refetchInterval: 12000, // refresh stats every 12 seconds
  });

  const { data: opportunities, isLoading: oppsLoading } = useQuery({
    queryKey: ["marketing-opportunities"],
    queryFn: getMarketingOpportunities,
    refetchInterval: 12000,
  });

  // Scroll to bottom of chat
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isThinking]);

  // Handler for custom goal text submit
  const handleCustomGoalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const userGoal = inputText.trim();
    setInputText("");
    
    // Add user message to timeline
    const userMsgId = `user-${Date.now()}`;
    setMessages(prev => [
      ...prev,
      {
        id: userMsgId,
        sender: "user",
        text: userGoal
      }
    ]);

    // Restart workflow
    setActiveGoal(userGoal);
    setSelectedSegment(null);
    setSelectedChannel(null);
    setSelectedMessage(null);
    setIsThinking(true);

    try {
      const segmentRecs = await aiRecommendSegments(userGoal);
      
      setMessages(prev => [
        ...prev,
        {
          id: `assistant-seg-${Date.now()}`,
          sender: "assistant",
          text: `Based on your goal "${userGoal}", I've analyzed the customer database and recommended these high-potential target audiences. Select a segment to proceed:`,
          widgetType: "segments",
          widgetData: segmentRecs
        }
      ]);
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Failed to generate segments.");
      setMessages(prev => [
        ...prev,
        {
          id: `assistant-err-${Date.now()}`,
          sender: "assistant",
          text: "Sorry, I ran into an error trying to process that objective. Could you try rephrasing or checking your database connection?"
        }
      ]);
    } finally {
      setIsThinking(false);
    }
  };

  // Handler for selecting an opportunity card
  const handleSelectOpportunity = async (opp: any) => {
    // Add user message
    setMessages(prev => [
      ...prev,
      {
        id: `user-opp-${Date.now()}`,
        sender: "user",
        text: `Goal: ${opp.title}`
      }
    ]);

    // Set state
    setActiveGoal(opp.title);
    setSelectedSegment(null);
    setSelectedChannel(null);
    setSelectedMessage(null);
    setIsThinking(true);

    try {
      const segmentRecs = await aiRecommendSegments(opp.title);
      setMessages(prev => [
        ...prev,
        {
          id: `assistant-seg-${Date.now()}`,
          sender: "assistant",
          text: getGoalSpecificCopy(opp.title),
          widgetType: "segments",
          widgetData: segmentRecs
        }
      ]);
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Failed to analyze opportunity.");
      setMessages(prev => [
        ...prev,
        {
          id: `assistant-err-${Date.now()}`,
          sender: "assistant",
          text: "I was unable to analyze the segment statistics. Please check the Datasets tab to verify if database files have been uploaded."
        }
      ]);
    } finally {
      setIsThinking(false);
    }
  };

  // Handler for selecting a segment recommendation card
  const handleSelectSegment = async (seg: AIRecommendationSegment) => {
    setSelectedSegment(seg);
    setSelectedChannel(null);
    setSelectedMessage(null);

    // Add user message
    setMessages(prev => [
      ...prev,
      {
        id: `user-seg-${Date.now()}`,
        sender: "user",
        text: `Target Segment: ${seg.name} (${seg.audience_size} customers)`
      }
    ]);

    setIsThinking(true);

    try {
      const channelRecs = await aiRecommendChannels({
        segment_name: seg.name,
        filters: seg.filters
      });

      setMessages(prev => [
        ...prev,
        {
          id: `assistant-chan-${Date.now()}`,
          sender: "assistant",
          text: `For a segment of ${seg.audience_size} customers, here are the channel recommendations ranked by predicted engagement score:`,
          widgetType: "channels",
          widgetData: channelRecs
        }
      ]);
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Failed to recommend channels.");
      setMessages(prev => [
        ...prev,
        {
          id: `assistant-err-${Date.now()}`,
          sender: "assistant",
          text: "Sorry, I had trouble evaluating marketing channels for this segment. Please try again."
        }
      ]);
    } finally {
      setIsThinking(false);
    }
  };

  // Handler for selecting a channel card
  const handleSelectChannel = async (chan: AIRecommendationChannel) => {
    if (!selectedSegment) return;
    setSelectedChannel(chan);
    setSelectedMessage(null);

    // Add user message
    setMessages(prev => [
      ...prev,
      {
        id: `user-chan-${Date.now()}`,
        sender: "user",
        text: `Selected Channel: ${chan.channel}`
      }
    ]);

    setIsThinking(true);

    try {
      const messageVariants = await aiMessageVariants({
        segment_name: selectedSegment.name,
        channel: chan.channel
      });

      setMessages(prev => [
        ...prev,
        {
          id: `assistant-msg-${Date.now()}`,
          sender: "assistant",
          text: `I've generated three personalized copy variants for ${chan.channel}. Select your preferred copy variant below:`,
          widgetType: "messages",
          widgetData: messageVariants
        }
      ]);
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Failed to generate message copy.");
      setMessages(prev => [
        ...prev,
        {
          id: `assistant-err-${Date.now()}`,
          sender: "assistant",
          text: "I couldn't draft the message variants. Check your Gemini API status."
        }
      ]);
    } finally {
      setIsThinking(false);
    }
  };

  // Handler for selecting a message copy variant card
  const handleSelectMessageVariant = (variant: AIMessageVariant) => {
    setSelectedMessage(variant);

    // Add user message
    setMessages(prev => [
      ...prev,
      {
        id: `user-msg-${Date.now()}`,
        sender: "user",
        text: `Selected Message: ${variant.variant}`
      }
    ]);

    // Append Campaign Summary
    setMessages(prev => [
      ...prev,
      {
        id: `assistant-sum-${Date.now()}`,
        sender: "assistant",
        text: "Here is your full campaign blueprint. Review the delivery predictions and click Launch Campaign to run the delivery simulation.",
        widgetType: "summary"
      }
    ]);
  };

  // Handler for launching campaign
  const handleLaunchCampaign = async () => {
    if (!activeGoal || !selectedSegment || !selectedChannel || !selectedMessage) {
      toast.error("Campaign setup details are incomplete.");
      return;
    }

    setIsThinking(true);

    try {
      // 1. Create campaign draft
      const campaignPayload = {
        name: `${activeGoal} - ${selectedChannel.channel}`,
        channel: selectedChannel.channel,
        message: selectedMessage.message,
        segment_name: selectedSegment.name,
        filters: selectedSegment.filters,
        description: `Generated for goal: ${activeGoal}`
      };

      const campaign = await createCampaign(campaignPayload);
      
      // 2. Dispatch to channel simulator
      await sendCampaign(campaign.id);

      toast.success("Campaign launched successfully!");

      setMessages(prev => [
        ...prev,
        {
          id: `assistant-success-${Date.now()}`,
          sender: "assistant",
          text: `🚀 Campaign "${campaign.name}" is now running! The channel simulator is sending messages asynchronously. You can watch the delivery updates, customer order counts, and post-campaign analytics in real-time on the Campaigns page.`,
          widgetType: "launch-success",
          widgetData: {
            campaign_id: campaign.id,
            campaign_name: campaign.name,
            audience_size: selectedSegment.audience_size
          }
        }
      ]);
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Failed to launch campaign.");
      setMessages(prev => [
        ...prev,
        {
          id: `assistant-err-${Date.now()}`,
          sender: "assistant",
          text: "Something went wrong during the launch trigger. Please check if the Channel Simulator is active."
        }
      ]);
    } finally {
      setIsThinking(false);
    }
  };

  // Restart flow
  const handleRestart = () => {
    setMessages([
      {
        id: `welcome-${Date.now()}`,
        sender: "assistant",
        text: "Let's launch another marketing campaign! What is your next business objective?",
        widgetType: "opportunities"
      }
    ]);
    setActiveGoal("");
    setSelectedSegment(null);
    setSelectedChannel(null);
    setSelectedMessage(null);
  };

  // Channel icons mapper
  const getChannelIcon = (channel: string) => {
    switch (channel.toLowerCase()) {
      case "whatsapp": return <MessageCircle className="h-4 w-4 text-emerald-500 fill-emerald-500/10" />;
      case "email": return <Mail className="h-4 w-4 text-indigo-500" />;
      case "sms": return <Phone className="h-4 w-4 text-sky-500" />;
      default: return <Zap className="h-4 w-4 text-amber-500" />;
    }
  };

  const summaryRevenueExplanation = (): RevenueExplanationData | null => {
    if (!selectedSegment || !selectedMessage) {
      return null;
    }

    const averageOrderValue = selectedSegment.average_spend > 0 ? selectedSegment.average_spend : 1200;
    const expectedEngagementRate = selectedMessage.predicted_ctr;
    const expectedConversionRate = 10;

    return {
      audience_size: selectedSegment.audience_size,
      expected_engagement_rate: expectedEngagementRate,
      expected_conversion_rate: expectedConversionRate,
      average_order_value: averageOrderValue,
      projected_revenue: Math.round(
        selectedSegment.audience_size *
        (expectedEngagementRate / 100) *
        (expectedConversionRate / 100) *
        averageOrderValue
      ),
    };
  };

  return (
    <LayoutWrapper>
      {/* Outer Flex Container for Chat and right-side Persistent Intelligence Sidebar */}
      <div className="flex flex-col xl:flex-row gap-6 w-full items-start">
        
        {/* Main Chat Column */}
        <div className="flex-1 flex flex-col w-full h-[calc(100vh-7rem)] min-h-[720px] border border-zinc-100 dark:border-zinc-900 bg-white/50 dark:bg-zinc-950/50 backdrop-blur-md rounded-2xl overflow-hidden shadow-xl">
          
          {/* Chat Header */}
          <div className="flex items-center gap-3 border-b border-zinc-100 dark:border-zinc-900 px-6 py-4 bg-white/70 dark:bg-zinc-950/70">
            <div className="rounded-lg bg-sky-50 dark:bg-sky-950/30 p-2">
              <Sparkles className="h-5 w-5 text-sky-500 fill-sky-500/10 animate-pulse" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-zinc-900 dark:text-white">AI Campaign Copilot</h1>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">Describe your marketing goal and launch campaigns instantly</p>
            </div>
          </div>

          {/* Chat Messages Log */}
          <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6 scrollbar-thin">
            {messages.map((msg) => {
              const isAssistant = msg.sender === "assistant";
              return (
                <div key={msg.id} className={`flex gap-3 max-w-full ${isAssistant ? "justify-start" : "justify-end"}`}>
                  
                  {isAssistant && (
                    <div className="rounded-full bg-zinc-100 dark:bg-zinc-800 p-2 h-8 w-8 flex items-center justify-center border border-zinc-200 dark:border-zinc-700">
                      <Bot className="h-4 w-4 text-zinc-600 dark:text-zinc-300" />
                    </div>
                  )}

                  <div className="flex flex-col gap-3 max-w-full lg:max-w-[94%]">
                    {msg.text && (
                      <div className={`rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm border ${
                        isAssistant 
                          ? "bg-zinc-50 border-zinc-100 text-zinc-800 dark:bg-zinc-900/60 dark:border-zinc-800/80 dark:text-zinc-300" 
                          : "bg-gradient-to-r from-sky-500 to-cyan-500 border-sky-400 text-white font-medium"
                      }`}>
                        {msg.text}
                      </div>
                    )}

                    {/* Timeline Embedded Selection Widgets */}
                    {isAssistant && msg.widgetType === "opportunities" && (
                      <div className="grid gap-3 mt-2 sm:grid-cols-2 xl:grid-cols-3">
                        {oppsLoading ? (
                          <div className="col-span-3 flex justify-center py-6">
                            <Loader2 className="h-6 w-6 animate-spin text-sky-500" />
                          </div>
                        ) : !opportunities || opportunities.length === 0 ? (
                          <div className="col-span-3 p-4 border border-dashed rounded-xl text-center text-xs text-zinc-400">
                            Upload a customer CSV in the Datasets tab to discover active opportunities.
                          </div>
                        ) : (
                          opportunities.slice(0, 3).map((opp: any) => (
                            <Card
                              key={opp.id}
                              role="button"
                              tabIndex={0}
                              onClick={() => !isThinking && handleSelectOpportunity(opp)}
                              onKeyDown={(e) => e.key === "Enter" && !isThinking && handleSelectOpportunity(opp)}
                              className="cursor-pointer border-zinc-200/80 dark:border-zinc-900 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md shadow-sm transition-all hover:border-sky-300 hover:shadow-md dark:hover:border-sky-900 flex flex-col justify-between"
                            >
                              <CardHeader className="p-4 pb-2">
                                <div className="flex justify-between items-start">
                                  <Badge className="bg-sky-100 text-sky-700 hover:bg-sky-100 dark:bg-sky-950/40 dark:text-sky-300 text-[9px] font-bold">
                                    {opp.confidence}% Confidence
                                  </Badge>
                                  <span className="text-emerald-600 dark:text-emerald-400 text-xs font-bold font-mono">
                                    ₹{opp.potential_revenue?.toLocaleString()}
                                  </span>
                                </div>
                                <CardTitle className="text-xs font-bold text-zinc-900 dark:text-zinc-50 mt-2 line-clamp-1">
                                  {opp.title}
                                </CardTitle>
                              </CardHeader>
                              <CardContent className="p-4 pt-0 flex flex-col gap-3">
                                <div className="space-y-1">
                                  <div className="text-xs font-bold uppercase tracking-wide text-zinc-400">Why This Recommendation?</div>
                                  <p className="text-sm text-zinc-500 leading-relaxed whitespace-pre-line">
                                    {opp.reason}
                                  </p>
                                </div>
                                <RevenueExplanation
                                  data={opp.revenue_explanation ?? {
                                    audience_size: opp.audience_size ?? 0,
                                    average_order_value: opp.average_order_value ?? 0,
                                    projected_revenue: opp.potential_revenue ?? 0,
                                  }}
                                />
                                <Button 
                                  size="sm" 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleSelectOpportunity(opp);
                                  }}
                                  disabled={isThinking}
                                  className="w-full h-9 text-sm bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-100 font-bold"
                                >
                                  Start Campaign
                                </Button>
                              </CardContent>
                            </Card>
                          ))
                        )}
                      </div>
                    )}

                    {isAssistant && msg.widgetType === "segments" && msg.widgetData && (
                      <div className="grid gap-3 mt-2 sm:grid-cols-2 xl:grid-cols-3">
                        {msg.widgetData.length === 0 ? (
                          <div className="rounded-xl border border-dashed border-zinc-300 p-4 text-sm text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
                            No matching audience found for this goal. Try broadening your targeting criteria.
                          </div>
                        ) : msg.widgetData.map((seg: AIRecommendationSegment, i: number) => (
                          <Card
                            key={i}
                            role="button"
                            tabIndex={0}
                            onClick={() => !isThinking && handleSelectSegment(seg)}
                            onKeyDown={(e) => e.key === "Enter" && !isThinking && handleSelectSegment(seg)}
                            className="cursor-pointer border-zinc-200/80 dark:border-zinc-900 bg-white/85 dark:bg-zinc-950/85 backdrop-blur-md shadow-sm transition-all hover:border-sky-300 hover:shadow-md dark:hover:border-sky-900 flex flex-col justify-between"
                          >
                            <CardHeader className="p-4 pb-2">
                              <div className="flex justify-between items-start">
                                <Badge className="bg-purple-100 text-purple-700 hover:bg-purple-100 dark:bg-purple-950/40 dark:text-purple-300 text-[9px] font-bold">
                                  {seg.confidence}% Confidence
                                </Badge>
                                <span className="text-zinc-400 text-[10px] font-semibold flex items-center gap-1 font-mono">
                                  <Users className="h-3 w-3" /> {seg.audience_size} users
                                </span>
                              </div>
                              <CardTitle className="text-xs font-extrabold text-zinc-900 dark:text-zinc-50 mt-2">
                                {seg.name}
                              </CardTitle>
                            </CardHeader>
                            <CardContent className="p-4 pt-0 flex flex-col gap-3">
                              <div className="space-y-1">
                                <div className="text-xs font-bold uppercase tracking-wide text-zinc-400">Why This Recommendation?</div>
                                <p className="text-sm text-zinc-500 leading-relaxed whitespace-pre-line">
                                  {seg.reason}
                                </p>
                              </div>
                              <div className="text-sm text-zinc-500">
                                This segment represents {seg.audience_share}% of the current customer base.
                              </div>
                              {seg.average_spend > 0 && (
                                <div className="text-xs font-mono font-medium text-zinc-500">
                                  Avg Spend: ₹{Math.round(seg.average_spend).toLocaleString()}
                                </div>
                              )}
                              <Button 
                                size="sm" 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleSelectSegment(seg);
                                }}
                                disabled={isThinking}
                                className="w-full h-9 text-sm bg-sky-500 hover:bg-sky-600 text-white font-bold"
                              >
                                Select Audience
                              </Button>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}

                    {isAssistant && msg.widgetType === "channels" && msg.widgetData && (
                      <div className="grid gap-3 mt-2 sm:grid-cols-2 md:grid-cols-4">
                        {msg.widgetData.map((chan: AIRecommendationChannel, i: number) => (
                          <Card
                            key={i}
                            role="button"
                            tabIndex={0}
                            onClick={() => !isThinking && handleSelectChannel(chan)}
                            onKeyDown={(e) => e.key === "Enter" && !isThinking && handleSelectChannel(chan)}
                            className="cursor-pointer border-zinc-200/80 dark:border-zinc-900 bg-white/85 dark:bg-zinc-950/85 backdrop-blur-md shadow-sm hover:border-sky-300 hover:shadow-md dark:hover:border-sky-900 flex flex-col justify-between"
                          >
                            <CardHeader className="p-3 pb-1">
                              <div className="flex justify-between items-center">
                                <span className="font-bold text-xs text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                                  {getChannelIcon(chan.channel)}
                                  {chan.channel}
                                </span>
                                <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400">{chan.score} pts</span>
                              </div>
                            </CardHeader>
                            <CardContent className="p-3 pt-0 flex flex-col gap-2">
                              <div className="space-y-1">
                                <div className="text-xs font-bold uppercase tracking-wide text-zinc-400">Why This Recommendation?</div>
                                <p className="text-sm text-zinc-500 leading-relaxed whitespace-pre-line">
                                  {chan.reason}
                                </p>
                              </div>
                              <Button 
                                size="sm" 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleSelectChannel(chan);
                                }}
                                disabled={isThinking}
                                className="w-full h-9 text-sm bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-100 font-bold"
                              >
                                Use Channel
                              </Button>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}

                    {isAssistant && msg.widgetType === "messages" && msg.widgetData && (
                      <div className="mt-2 flex gap-3 overflow-x-auto pb-2">
                        {msg.widgetData.map((variant: AIMessageVariant, i: number) => (
                          <Card
                            key={i}
                            role="button"
                            tabIndex={0}
                            onClick={() => !isThinking && handleSelectMessageVariant(variant)}
                            onKeyDown={(e) => e.key === "Enter" && !isThinking && handleSelectMessageVariant(variant)}
                            className="min-w-[280px] flex-1 cursor-pointer border-zinc-200/80 dark:border-zinc-900 bg-white/85 dark:bg-zinc-950/85 backdrop-blur-md shadow-sm hover:border-sky-300 hover:shadow-md dark:hover:border-sky-900 flex flex-col justify-between"
                          >
                            <CardHeader className="p-4 pb-2">
                              <div className="flex justify-between items-start">
                                <Badge className="bg-sky-50 text-sky-700 hover:bg-sky-100 dark:bg-sky-950/40 dark:text-sky-300 text-[9px] font-bold">
                                  Predicted CTR: {variant.predicted_ctr}%
                                </Badge>
                                <span className="text-[9px] font-bold text-zinc-400">Conf: {variant.confidence}%</span>
                              </div>
                              <CardTitle className="text-xs font-bold text-zinc-900 dark:text-zinc-50 mt-2">
                                {variant.variant}
                              </CardTitle>
                            </CardHeader>
                            <CardContent className="p-4 pt-0 flex flex-col gap-3">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setExpandedMessage(variant);
                                }}
                                className="text-left text-sm text-zinc-700 dark:text-zinc-200 italic bg-zinc-50/50 dark:bg-zinc-900/40 p-3 rounded border border-zinc-100 dark:border-zinc-850 line-clamp-5 leading-7 font-mono transition hover:border-sky-300 dark:hover:border-sky-800"
                              >
                                {`"${variant.message}"`}
                              </button>
                              <div className="space-y-1">
                                <div className="text-xs font-bold uppercase tracking-wide text-zinc-400">Why This Recommendation?</div>
                                <p className="text-sm text-zinc-500 leading-relaxed whitespace-pre-line">
                                  {variant.reasoning}
                                </p>
                              </div>
                              <Button 
                                size="sm" 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleSelectMessageVariant(variant);
                                }}
                                disabled={isThinking}
                                className="w-full h-9 text-sm bg-sky-500 hover:bg-sky-600 text-white font-bold"
                              >
                                Choose Variant
                              </Button>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}

                    {isAssistant && msg.widgetType === "summary" && selectedSegment && selectedChannel && selectedMessage && (
                      <Card className="border border-sky-100 dark:border-sky-950 bg-white/95 dark:bg-zinc-950/95 shadow-md max-w-lg mt-2">
                        <CardHeader className="pb-3 border-b border-zinc-100 dark:border-zinc-900">
                          <CardTitle className="text-xs font-extrabold uppercase tracking-wider text-sky-500 flex items-center gap-1.5">
                            <Layers className="h-4 w-4" /> Campaign Launch Blueprint
                          </CardTitle>
                          <CardDescription className="text-sm">Review predicted outcomes and dispatch</CardDescription>
                        </CardHeader>
                        <CardContent className="p-4 space-y-4 text-sm">
                          {/* Details Grid */}
                          <div className="grid grid-cols-2 gap-3 pb-3 border-b border-zinc-100 dark:border-zinc-900 text-sm">
                            <div>
                              <span className="text-zinc-400 block text-xs uppercase tracking-wide">Goal</span>
                              <span className="font-semibold text-zinc-800 dark:text-zinc-200">{activeGoal}</span>
                            </div>
                            <div>
                              <span className="text-zinc-400 block text-xs uppercase tracking-wide">Audience Segment</span>
                              <span className="font-semibold text-zinc-800 dark:text-zinc-200">{selectedSegment.name}</span>
                            </div>
                            <div>
                              <span className="text-zinc-400 block text-xs uppercase tracking-wide">Audience Size</span>
                              <span className="font-semibold text-zinc-800 dark:text-zinc-200">{selectedSegment.audience_size} reached</span>
                            </div>
                            <div>
                              <span className="text-zinc-400 block text-xs uppercase tracking-wide">Channel</span>
                              <span className="font-semibold text-zinc-800 dark:text-zinc-200 flex items-center gap-1">
                                {getChannelIcon(selectedChannel.channel)}
                                {selectedChannel.channel}
                              </span>
                            </div>
                          </div>

                          {/* Message copy */}
                          <div>
                            <span className="text-zinc-400 block text-xs uppercase tracking-wide mb-1">Personalized Message</span>
                            <div className="bg-zinc-50 dark:bg-zinc-900/60 p-3 rounded-lg border border-zinc-100 dark:border-zinc-800 font-mono italic text-sm leading-7 text-zinc-700 dark:text-zinc-300">
                              {`"${selectedMessage.message}"`}
                            </div>
                          </div>
                          {summaryRevenueExplanation() && (
                            <RevenueExplanation data={summaryRevenueExplanation()!} />
                          )}

                          {/* Simulated Funnel Projections */}
                          <div>
                            <span className="text-zinc-400 block text-xs uppercase tracking-wide mb-2">Simulated Outcome Projections</span>
                            
                            {/* Projections calculations */}
                            {(() => {
                              const size = selectedSegment.audience_size;
                              const basket = selectedSegment.average_spend > 0 ? selectedSegment.average_spend : 1200;
                              const clickMult = selectedMessage.predicted_ctr;
                              const purchMult = 10; // Expected Conversion 10%

                              const proj = calculateProjections(size, clickMult, purchMult, basket);
                              const compositeConf = Math.round((selectedSegment.confidence + selectedChannel.confidence + selectedMessage.confidence) / 3);

                              return (
                                <div className="space-y-2">
                                  <div className="grid grid-cols-2 gap-2 text-center text-sm sm:grid-cols-3">
                                    <div className="rounded bg-zinc-50/80 p-1.5 dark:bg-zinc-900/40">
                                      <span className="text-zinc-400 block text-[10px] uppercase tracking-wide">Audience Size</span>
                                      <span className="font-bold text-zinc-800 dark:text-zinc-200">{proj.audienceSize}</span>
                                    </div>
                                    <div className="rounded bg-zinc-50/80 p-1.5 dark:bg-zinc-900/40">
                                      <span className="text-zinc-400 block text-[10px] uppercase tracking-wide">Exp. Engagement</span>
                                      <span className="font-bold text-zinc-800 dark:text-zinc-200">{proj.expectedEngagementRate}%</span>
                                    </div>
                                    <div className="rounded bg-zinc-50/80 p-1.5 dark:bg-zinc-900/40">
                                      <span className="text-zinc-400 block text-[10px] uppercase tracking-wide">Exp. Conversion</span>
                                      <span className="font-bold text-zinc-800 dark:text-zinc-200">{proj.expectedConversionRate}%</span>
                                    </div>
                                    <div className="rounded bg-zinc-50/80 p-1.5 dark:bg-zinc-900/40">
                                      <span className="text-zinc-400 block text-[10px] uppercase tracking-wide">Avg Order Value</span>
                                      <span className="font-bold text-zinc-800 dark:text-zinc-200">₹{proj.averageOrderValue.toLocaleString()}</span>
                                    </div>
                                    <div className="rounded bg-zinc-50/80 p-1.5 dark:bg-zinc-900/40">
                                      <span className="text-zinc-400 block text-[10px] uppercase tracking-wide">Exp. Purchasers</span>
                                      <span className="font-bold text-emerald-600 dark:text-emerald-400">{proj.purchasers}</span>
                                    </div>
                                    <div className="rounded bg-zinc-50/80 p-1.5 dark:bg-zinc-900/40">
                                      <span className="text-zinc-400 block text-[10px] uppercase tracking-wide">Exp. Revenue</span>
                                      <span className="font-bold text-sky-600 dark:text-sky-400">₹{proj.expectedRevenue.toLocaleString()}</span>
                                    </div>
                                  </div>
                                  <div className="flex justify-between items-center text-sm pt-1">
                                    <span className="text-zinc-400">Composite Score</span>
                                    <Badge className="bg-sky-100 text-sky-700 hover:bg-sky-100 dark:bg-sky-950/40 dark:text-sky-400 font-bold font-mono">
                                      {compositeConf}% Confidence
                                    </Badge>
                                  </div>
                                </div>
                              );
                            })()}
                          </div>

                          {/* Launch Button */}
                          <Button 
                            onClick={handleLaunchCampaign}
                            disabled={isThinking}
                            className="w-full bg-gradient-to-r from-sky-500 via-cyan-500 to-indigo-500 text-white font-bold h-11 text-sm shadow-md"
                          >
                            {isThinking ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Ingesting & Launching...
                              </>
                            ) : (
                              <>
                                <Play className="mr-2 h-3.5 w-3.5 fill-white" /> Launch Campaign Simulator
                              </>
                            )}
                          </Button>
                        </CardContent>
                      </Card>
                    )}

                    {isAssistant && msg.widgetType === "launch-success" && msg.widgetData && (
                      <Card className="border border-green-200 dark:border-green-900 bg-green-50/20 dark:bg-green-950/15 max-w-md mt-2">
                        <CardContent className="p-4 space-y-3.5 text-sm text-zinc-800 dark:text-zinc-300">
                          <div className="flex items-center gap-2 text-green-600 dark:text-green-400 font-bold">
                            <CheckCircle className="h-5 w-5 text-green-500" />
                            Campaign Dispatched Successfully!
                          </div>
                          <div className="space-y-1 bg-white/40 dark:bg-zinc-950/30 p-2.5 rounded-lg border border-green-100/30 font-mono text-sm">
                            <div>Campaign: {msg.widgetData.campaign_name}</div>
                            <div>Audience Reach: {msg.widgetData.audience_size} customers</div>
                            <div>Status: Dispatching to Simulator</div>
                          </div>
                          <div className="flex gap-2">
                            <Button 
                              size="sm"
                              onClick={() => router.push(`/campaigns?id=${msg.widgetData.campaign_id}`)}
                              className="bg-green-600 hover:bg-green-700 text-white font-semibold text-sm h-9 flex-1"
                            >
                              Track Live Delivery
                            </Button>
                            <Button 
                              size="sm"
                              variant="outline"
                              onClick={handleRestart}
                              className="border-zinc-200 dark:border-zinc-800 text-sm h-9 flex-1 font-semibold"
                            >
                              Start New Campaign
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    )}

                  </div>
                </div>
              );
            })}

            {isThinking && (
              <div className="flex gap-3 justify-start">
                <div className="rounded-full bg-zinc-100 dark:bg-zinc-800 p-2 h-8 w-8 flex items-center justify-center border border-zinc-200 dark:border-zinc-700 animate-bounce">
                  <Bot className="h-4 w-4 text-zinc-500" />
                </div>
                <div className="bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-100 dark:border-zinc-800/80 rounded-2xl px-4 py-2.5 text-sm text-zinc-500 flex items-center gap-1.5 shadow-sm">
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-sky-500" />
                  <span>Dewy is thinking...</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Chat Form Input */}
          <div className="border-t border-zinc-100 dark:border-zinc-900 p-4 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md">
            <form onSubmit={handleCustomGoalSubmit} className="flex gap-2 items-center">
              <Input
                placeholder="e.g. Target TechEnthusiast profiles, or win back dormant users..."
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                disabled={isThinking}
                className="flex-1 border-zinc-200 dark:border-zinc-800 focus-visible:ring-sky-500 h-11 text-base shadow-sm bg-white dark:bg-zinc-900/40"
              />
              <Button 
                type="submit" 
                size="icon"
                disabled={isThinking || !inputText.trim()}
                className="bg-gradient-to-r from-sky-500 to-cyan-500 text-white h-11 w-11 shrink-0 shadow-sm"
              >
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </div>
        </div>

        {/* Right-Side Persistent Dataset Insights Panel */}
        <aside className="w-full xl:w-96 border border-zinc-100 dark:border-zinc-900 bg-white/50 dark:bg-zinc-950/50 backdrop-blur-md rounded-2xl p-5 shadow-lg flex flex-col gap-5">
          <div className="flex items-center gap-2 border-b border-zinc-100 dark:border-zinc-900 pb-3">
            <Layers className="h-4.5 w-4.5 text-sky-500" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Dataset Intelligence</h2>
          </div>

          {intelLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-sky-500" />
            </div>
          ) : !intelligence || intelligence.total_customers === 0 ? (
            <div className="text-center py-6 text-sm text-zinc-400 flex flex-col gap-2.5 items-center">
              <Info className="h-6 w-6 text-zinc-300" />
              <span>No customer data ingested. Load the seeded Consumer dataset under the Datasets tab.</span>
               <Button size="sm" onClick={() => router.push("/datasets")} className="h-9 text-sm mt-1 bg-sky-500 text-white">Go to Datasets</Button>
            </div>
          ) : (
            <div className="space-y-4 text-sm">
              
              {/* Customer breakdown */}
              <div className="space-y-2.5 pb-3.5 border-b border-zinc-100 dark:border-zinc-900">
                <div className="flex justify-between items-center text-sm font-semibold text-zinc-800 dark:text-zinc-200">
                  <span>VIP Customers</span>
                  <div className="flex items-center gap-1.5">
                    <span>{intelligence.vip_percentage}%</span>
                    <Badge className="bg-green-50 text-green-700 hover:bg-green-50 dark:bg-green-950/20 dark:text-green-400 text-xs font-bold py-0">
                      Conf: {Math.round(intelligence.confidence_scores?.vip * 100)}%
                    </Badge>
                  </div>
                </div>

                <div className="flex justify-between items-center text-sm font-semibold text-zinc-800 dark:text-zinc-200">
                  <span>Dormant Customers</span>
                  <div className="flex items-center gap-1.5">
                    <span>{intelligence.dormant_percentage}%</span>
                    <Badge className="bg-green-50 text-green-700 hover:bg-green-50 dark:bg-green-950/20 dark:text-green-400 text-xs font-bold py-0">
                      Conf: {Math.round(intelligence.confidence_scores?.dormant * 100)}%
                    </Badge>
                  </div>
                </div>

                <div className="flex justify-between items-center text-sm font-semibold text-zinc-800 dark:text-zinc-200">
                  <span>Refill Candidates</span>
                  <div className="flex items-center gap-1.5">
                    <span>{intelligence.refill_candidates_count} users</span>
                    <Badge className="bg-green-50 text-green-700 hover:bg-green-50 dark:bg-green-950/20 dark:text-green-400 text-xs font-bold py-0">
                      Conf: {Math.round(intelligence.confidence_scores?.refills * 100)}%
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Affinity rules */}
              <div className="pb-3.5 border-b border-zinc-100 dark:border-zinc-900">
                <span className="text-xs font-bold text-zinc-400 uppercase tracking-wide block mb-2">Product Affinity Rules</span>
                <div className="space-y-1.5">
                  {intelligence.affinity_rules?.slice(0, 2).map((rule: any, i: number) => (
                    <div key={i} className="flex justify-between items-center p-2 rounded bg-zinc-50 dark:bg-zinc-900/40 border border-zinc-100 dark:border-zinc-900 text-sm">
                      <span className="font-medium text-zinc-600 dark:text-zinc-400">{rule.from} &rarr; {rule.to}</span>
                      <span className="font-bold text-sky-500 font-mono">{Math.round(rule.confidence * 100)}%</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* demographic quick stats */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-zinc-500 dark:text-zinc-400">Primary Hub City</span>
                  <span className="font-semibold text-zinc-800 dark:text-zinc-200">{intelligence.top_city}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-zinc-500 dark:text-zinc-400">Highest Spending Age</span>
                  <span className="font-semibold text-zinc-800 dark:text-zinc-200">{intelligence.highest_spending_age_group}</span>
                </div>
              </div>

            </div>
          )}
        </aside>

      </div>
      <Dialog open={!!expandedMessage} onOpenChange={(open) => !open && setExpandedMessage(null)}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{expandedMessage?.variant}</DialogTitle>
            <DialogDescription>
              Full generated campaign copy
            </DialogDescription>
          </DialogHeader>
          <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4 font-mono text-sm leading-7 text-zinc-800 dark:border-zinc-800 dark:bg-zinc-900/70 dark:text-zinc-100">
            {expandedMessage ? `"${expandedMessage.message}"` : ""}
          </div>
          {expandedMessage?.reasoning && (
            <p className="text-sm leading-6 text-zinc-500 dark:text-zinc-400">
              {expandedMessage.reasoning}
            </p>
          )}
        </DialogContent>
      </Dialog>
    </LayoutWrapper>
  );
}
