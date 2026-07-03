"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
  Bot,
  Sparkles,
  Calendar,
  X,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Loader2,
  Lightbulb,
  Check,

  Target,
} from "lucide-react";
import { IconInstagram, IconFacebook, IconYoutube } from "@/components/icons";

interface Suggestion {
  id: string;
  org_id: string;
  topic: string;
  content_type: string;
  platform: string;
  reason: string;
  suggested_date: string | null;
  hook_idea: string;
  visual_idea: string;
  status: "pending" | "added_to_calendar" | "dismissed";
}

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
};

const cardAnim = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

const CONTENT_TYPE_COLORS: Record<string, string> = {
  educational: "bg-blue-100 text-blue-700",
  promotional: "bg-emerald-100 text-emerald-700",
  motivational: "bg-[rgba(79,70,229,0.08)] text-[#4F46E5]",
  "behind-the-scenes": "bg-amber-100 text-amber-700",
  festive: "bg-rose-100 text-rose-700",
  trending: "bg-cyan-100 text-cyan-700",
  product: "bg-indigo-100 text-indigo-700",
};

function PlatformIcon({ platform }: { platform: string }) {
  switch (platform) {
    case "instagram":
      return <IconInstagram className="w-3 h-3" />;
    case "facebook":
      return <IconFacebook className="w-3 h-3" />;
    case "youtube":
      return <IconYoutube className="w-3 h-3" />;
    default:
      return <Target className="w-3 h-3" />;
  }
}

export default function SuggestionsPage() {
  const supabase = createClient();
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [orgId, setOrgId] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [processing, setProcessing] = useState<string | null>(null);

  const fetchSuggestions = useCallback(async (autoRegenerate = true) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: org } = await supabase
      .from("organizations")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (!org) return;
    setOrgId(org.id);

    // Only fetch suggestions for the current month
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
      .toISOString().split("T")[0];
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)
      .toISOString().split("T")[0];

    const { data } = await supabase
      .from("ai_suggestions")
      .select("*")
      .eq("org_id", org.id)
      .gte("suggested_date", startOfMonth)
      .lte("suggested_date", endOfMonth)
      .order("suggested_date", { ascending: true });

    const results = data || [];
    setSuggestions(results);
    setLoading(false);

    // Auto-regenerate if no current-month suggestions exist
    const pendingCount = results.filter((s) => s.status === "pending").length;
    if (pendingCount === 0 && autoRegenerate && org.id) {
      setGenerating(true);
      try {
        const res = await fetch("/api/generate-suggestions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ org_id: org.id }),
        });
        const genData = await res.json();
        if (res.ok) {
          setSuggestions(genData.suggestions || []);
          const monthName = now.toLocaleString("en-US", { month: "long" });
          toast.success(`${genData.count} suggestions generated for ${monthName}!`);
        }
      } catch {
        // Silent fail — user can still click Refresh
      } finally {
        setGenerating(false);
      }
    }
  }, [supabase]);

  useEffect(() => {
    fetchSuggestions();
  }, [fetchSuggestions]);

  const handleGenerate = async () => {
    if (!orgId) return;

    setGenerating(true);
    try {
      const res = await fetch("/api/generate-suggestions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ org_id: orgId }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setSuggestions(data.suggestions);
      const monthName = new Date().toLocaleString("en-US", { month: "long" });
      toast.success(`${data.count} fresh suggestions for ${monthName}!`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to generate suggestions");
    } finally {
      setGenerating(false);
    }
  };

  const handleAddToCalendar = async (suggestion: Suggestion) => {
    setProcessing(suggestion.id);
    try {
      const res = await fetch("/api/add-to-calendar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ suggestion_id: suggestion.id, org_id: orgId }),
      });

      if (!res.ok) throw new Error("Failed to add to calendar");

      setSuggestions((prev) =>
        prev.map((s) => (s.id === suggestion.id ? { ...s, status: "added_to_calendar" } : s))
      );
      toast.success(`"${suggestion.topic}" added to calendar!`);
    } catch {
      toast.error("Failed to add to calendar");
    } finally {
      setProcessing(null);
    }
  };

  const handleDismiss = async (id: string) => {
    setProcessing(id);
    try {
      await supabase
        .from("ai_suggestions")
        .update({ status: "dismissed" })
        .eq("id", id);

      setSuggestions((prev) =>
        prev.map((s) => (s.id === id ? { ...s, status: "dismissed" } : s))
      );
      toast.success("Suggestion dismissed");
    } catch {
      toast.error("Failed to dismiss");
    } finally {
      setProcessing(null);
    }
  };

  const pendingSuggestions = suggestions.filter((s) => s.status === "pending");
  const addedSuggestions = suggestions.filter((s) => s.status === "added_to_calendar");

  if (loading) {
    return (
      <div className="space-y-6 max-w-[1200px]">
        <Skeleton className="h-8 w-48 rounded-xl" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-48 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-6 max-w-[1200px]"
    >
      <motion.div variants={cardAnim} className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-[#0A0A0A] tracking-tight">
            AI Suggestions
          </h1>
          <p className="text-sm text-[#0A0A0A]/50 mt-0.5">
            AI-generated content ideas based on your brand and performance data
          </p>
        </div>
        <Button
          onClick={handleGenerate}
          disabled={generating}
          className="rounded-xl bg-[#4F46E5] hover:bg-[#4338CA] px-5"
        >
          {generating ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Generating for {new Date().toLocaleString("en-US", { month: "long" })}...
            </>
          ) : (
            <>
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh Suggestions
            </>
          )}
        </Button>
      </motion.div>

      {/* Suggestions Grid */}
      {pendingSuggestions.length === 0 && addedSuggestions.length === 0 ? (
        <motion.div variants={cardAnim}>
          <Card className="border-0 shadow-card rounded-2xl">
            <CardContent className="p-12 text-center">
              <div className="w-12 h-12 rounded-xl bg-[#0A0A0A]/[0.06] flex items-center justify-center mx-auto mb-3">
                <Bot className="w-5 h-5 text-[#4F46E5]" />
              </div>
              <p className="text-sm font-medium text-[#0A0A0A]">No suggestions yet</p>
              <p className="text-xs text-[#0A0A0A]/50 mt-1 mb-4">
                Click &ldquo;Refresh Suggestions&rdquo; to get AI-powered content ideas
              </p>
              <Button
                onClick={handleGenerate}
                disabled={generating}
                className="rounded-xl bg-[#4F46E5] hover:bg-[#4338CA]"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Generate Ideas
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      ) : (
        <>
          {/* Pending */}
          {pendingSuggestions.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <AnimatePresence>
                {pendingSuggestions.map((suggestion) => {
                  const isExpanded = expandedId === suggestion.id;
                  const typeColor = CONTENT_TYPE_COLORS[suggestion.content_type] || "bg-gray-100 text-gray-600";

                  return (
                    <motion.div
                      key={suggestion.id}
                      variants={cardAnim}
                      layout
                      exit={{ opacity: 0, scale: 0.9, y: -20 }}
                    >
                      <Card className="border-0 shadow-card rounded-2xl overflow-hidden hover:shadow-card-hover transition-all">
                        <CardContent className="p-5 space-y-3">
                          {/* Header */}
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-2 flex-wrap">
                              <Badge className={`${typeColor} text-[10px] rounded-lg`}>
                                {suggestion.content_type}
                              </Badge>
                              <Badge className="bg-[#F5F5F3] text-[#0A0A0A]/70 text-[10px] rounded-lg gap-1">
                                <PlatformIcon platform={suggestion.platform} />
                                {suggestion.platform}
                              </Badge>
                            </div>
                            {suggestion.suggested_date && (
                              <span className="text-[10px] text-[#0A0A0A]/50">
                                {new Date(suggestion.suggested_date).toLocaleDateString("en-US", {
                                  month: "short",
                                  day: "numeric",
                                })}
                              </span>
                            )}
                          </div>

                          {/* Topic */}
                          <h3 className="text-sm font-semibold text-[#0A0A0A] leading-snug">
                            {suggestion.topic}
                          </h3>

                          {/* Hook */}
                          {suggestion.hook_idea && (
                            <div className="p-2.5 rounded-xl bg-[rgba(79,70,229,0.06)] border border-[rgba(79,70,229,0.12)]">
                              <p className="text-[10px] uppercase tracking-wider text-[#4F46E5] font-semibold mb-0.5">
                                Hook Idea
                              </p>
                              <p className="text-xs text-[#0A0A0A]/70">{suggestion.hook_idea}</p>
                            </div>
                          )}

                          {/* Expandable section */}
                          <button
                            onClick={() => setExpandedId(isExpanded ? null : suggestion.id)}
                            className="flex items-center gap-1 text-[10px] text-[#4F46E5] font-medium"
                          >
                            <Lightbulb className="w-3 h-3" />
                            {isExpanded ? "Hide details" : "Why this works"}
                            {isExpanded ? (
                              <ChevronUp className="w-3 h-3" />
                            ) : (
                              <ChevronDown className="w-3 h-3" />
                            )}
                          </button>

                          <AnimatePresence>
                            {isExpanded && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="overflow-hidden space-y-2"
                              >
                                {suggestion.reason && (
                                  <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-100">
                                    <p className="text-[10px] uppercase tracking-wider text-emerald-600 font-semibold mb-0.5">
                                      Why This Works
                                    </p>
                                    <p className="text-xs text-emerald-700">{suggestion.reason}</p>
                                  </div>
                                )}
                                {suggestion.visual_idea && (
                                  <div className="p-2.5 rounded-xl bg-[#F5F5F3]">
                                    <p className="text-[10px] uppercase tracking-wider text-[#0A0A0A]/50 font-semibold mb-0.5">
                                      Visual Concept
                                    </p>
                                    <p className="text-xs text-[#0A0A0A]/70">{suggestion.visual_idea}</p>
                                  </div>
                                )}
                              </motion.div>
                            )}
                          </AnimatePresence>

                          {/* Actions */}
                          <div className="flex gap-2 pt-2 border-t border-[rgba(0,0,0,0.06)]">
                            <Button
                              size="sm"
                              onClick={() => handleAddToCalendar(suggestion)}
                              disabled={processing === suggestion.id}
                              className="flex-1 rounded-xl bg-[#4F46E5] hover:bg-[#4338CA] text-xs"
                            >
                              {processing === suggestion.id ? (
                                <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                              ) : (
                                <Calendar className="w-3 h-3 mr-1" />
                              )}
                              Add to Calendar
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDismiss(suggestion.id)}
                              disabled={processing === suggestion.id}
                              className="rounded-xl border-[rgba(0,0,0,0.08)] text-xs"
                            >
                              <X className="w-3 h-3" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}

          {/* Already Added */}
          {addedSuggestions.length > 0 && (
            <motion.div variants={cardAnim}>
              <h3 className="text-sm font-semibold text-[#0A0A0A]/50 mb-3 flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-500" />
                Added to Calendar ({addedSuggestions.length})
              </h3>
              <div className="space-y-2">
                {addedSuggestions.map((s) => (
                  <div
                    key={s.id}
                    className="flex items-center gap-3 p-3 rounded-xl bg-white shadow-card"
                  >
                    <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
                      <Check className="w-4 h-4 text-emerald-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[#0A0A0A] truncate">{s.topic}</p>
                      <p className="text-[10px] text-[#0A0A0A]/50">{s.content_type} · {s.platform}</p>
                    </div>
                    <Badge className="bg-emerald-100 text-emerald-700 text-[10px]">Added</Badge>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </>
      )}
    </motion.div>
  );
}
