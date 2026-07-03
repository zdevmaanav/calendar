"use client";

import { useEffect, useState, useCallback, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  Sparkles,
  Image as ImageIcon,
  Download,
  RefreshCw,
  Send,
  Save,
  ChevronDown,
  ChevronUp,
  X,
  Loader2,
  Search,
  CalendarDays,
  ArrowRight,
} from "lucide-react";
import {
  IconInstagram,
  IconFacebook,
  IconYoutube,
} from "@/components/icons";
import { PipelineProgress } from "@/components/pipeline-progress";
import FusionTicker from "@/components/fusion/FusionTicker";

// --- Types ---
interface CalendarItem {
  id: string;
  org_id: string;
  date: string;
  platform: string;
  content_type: string;
  topic: string;
  caption_direction: string;
  visual_direction: string;
  occasion: string | null;
  priority: string;
  generated_caption: string | null;
  generated_hashtags: string[];
  generated_image_url: string | null;
  status: string;
  is_edited_by_user: boolean;
  use_assets: boolean;
  scheduled_post_time: string | null;
}

interface CaptionData {
  caption: string;
  hashtags: string[];
  cta: string;
  hook: string;
  estimated_reach: string;
}

// --- Constants ---
const PLATFORM_LIMITS: Record<string, number> = {
  instagram: 2200,
  facebook: 63206,
  youtube: 5000,
  all: 2200,
};

const CONTENT_TYPE_COLORS: Record<string, { bg: string; text: string }> = {
  educational: { bg: "#DBEAFE", text: "#1D4ED8" },
  promotional: { bg: "#D1FAE5", text: "#047857" },
  motivational: { bg: "#EDE9FE", text: "#6D28D9" },
  "behind-the-scenes": { bg: "#FEF3C7", text: "#B45309" },
  festive: { bg: "#FFE4E6", text: "#BE123C" },
  trending: { bg: "#CFFAFE", text: "#0E7490" },
  product: { bg: "#E0E7FF", text: "#4338CA" },
};

const ASPECT_RATIOS = [
  { value: "1:1", label: "Feed Post", width: 60, height: 60 },
  { value: "9:16", label: "Story / Reel", width: 45, height: 80 },
  { value: "16:9", label: "YouTube / Cover", width: 80, height: 45 },
  { value: "4:5", label: "Portrait Feed", width: 56, height: 70 },
];

// --- Animation variants ---
const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35 } },
};

// --- Helpers ---
function PlatformIcon({ platform, className = "w-4 h-4" }: { platform: string; className?: string }) {
  switch (platform) {
    case "instagram": return <IconInstagram className={className} />;
    case "facebook": return <IconFacebook className={className} />;
    case "youtube": return <IconYoutube className={className} />;
    default: return <IconInstagram className={className} />;
  }
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function ReachBadge({ reach }: { reach: string }) {
  const styles: Record<string, string> = {
    high: "bg-emerald-50 text-emerald-700 border-emerald-200",
    medium: "bg-amber-50 text-amber-700 border-amber-200",
    low: "bg-red-50 text-red-600 border-red-200",
  };
  return (
    <Badge className={`${styles[reach] || styles.medium} text-[10px] font-semibold px-2.5 py-0.5 border`}>
      {reach.charAt(0).toUpperCase() + reach.slice(1)} Reach
    </Badge>
  );
}

// --- Main Page (wrapped in Suspense for searchParams) ---

function CaptionImageStudioContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();
  const captionTextareaRef = useRef<HTMLTextAreaElement>(null);

  // Core state
  const [loading, setLoading] = useState(true);
  const [isLoadingPosts, setIsLoadingPosts] = useState(true);
  const [orgId, setOrgId] = useState("");
  const [posts, setPosts] = useState<CalendarItem[]>([]);
  const [selectedPost, setSelectedPost] = useState<CalendarItem | null>(null);
  const [postSearch, setPostSearch] = useState("");
  const [postDropdownOpen, setPostDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Caption state
  const [captionData, setCaptionData] = useState<CaptionData | null>(null);
  const [editedCaption, setEditedCaption] = useState("");
  const [editedHashtags, setEditedHashtags] = useState<string[]>([]);
  const [editedCta, setEditedCta] = useState("");
  const [captionLoading, setCaptionLoading] = useState(false);
  const [fusionSessionId, setFusionSessionId] = useState<string | null>(null);
  const [contextExpanded, setContextExpanded] = useState(false);
  const [newHashtag, setNewHashtag] = useState("");

  // Image state
  const [aspectRatio, setAspectRatio] = useState("1:1");
  const [useAssets, setUseAssets] = useState(false);
  const [imagePrompt, setImagePrompt] = useState("");
  const [promptExpanded, setPromptExpanded] = useState(false);
  const [imageLoading, setImageLoading] = useState(false);
  const [generationHistory, setGenerationHistory] = useState<string[]>([]);

  // Action state
  const [saving, setSaving] = useState(false);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [canvaLoading, setCanvaLoading] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [fetchError, setFetchError] = useState(false);

  // Brand profile for context card
  const [brandProfile, setBrandProfile] = useState<Record<string, unknown> | null>(null);

  // --- Data Fetching ---
  const fetchData = useCallback(async () => {
    try {
      setFetchError(false);
      setIsLoadingPosts(true);

      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        console.error('[Caption Studio] No user found');
        setLoading(false);
        return;
      }

      const { data: org, error: orgError } = await supabase
        .from("organizations")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (orgError || !org) {
        console.error('[Caption Studio] No org found for user:', orgError);
        setLoading(false);
        return;
      }
      setOrgId(org.id);
      console.log('Fetching posts for org:', org.id);

      // Fetch brand profile
      const { data: bp } = await supabase
        .from("brand_profiles")
        .select("*")
        .eq("org_id", org.id)
        .single();
      if (bp) setBrandProfile(bp);

      // Fetch ALL calendar posts - no status filter
      const { data: calendarData, error: postsError } = await supabase
        .from("content_calendar")
        .select("*")
        .eq("org_id", org.id)
        .order("date", { ascending: true });

      if (postsError) {
        console.error('Posts fetch error:', postsError);
        setFetchError(true);
        toast.error('Failed to load posts. Please refresh the page.');
        setLoading(false);
        return;
      }

      console.log('Posts found:', calendarData?.length);
      const allPosts = calendarData || [];
      setPosts(allPosts);

      // Pre-select from URL
      const postId = searchParams.get("post");
      if (postId) {
        const found = allPosts.find((p) => p.id === postId);
        if (found) {
          selectPost(found);
        }
      }
    } catch (err) {
      console.error('Unexpected error:', err);
      setFetchError(true);
      toast.error('Failed to load posts. Please refresh the page.');
    } finally {
      setLoading(false);
      setIsLoadingPosts(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supabase, searchParams]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // --- Post Selection ---
  const selectPost = useCallback((post: CalendarItem) => {
    setSelectedPost(post);
    setPostDropdownOpen(false);
    setPostSearch("");

    // Update URL
    const params = new URLSearchParams(window.location.search);
    params.set("post", post.id);
    router.replace(`/dashboard/caption-image?${params.toString()}`, { scroll: false });

    // Load existing data
    if (post.generated_caption) {
      setEditedCaption(post.generated_caption);
      setEditedHashtags(post.generated_hashtags || []);
      // Try to extract CTA from end of caption
      setEditedCta("");
      setCaptionData(null);
    } else {
      setEditedCaption("");
      setEditedHashtags([]);
      setEditedCta("");
      setCaptionData(null);
    }

    // Build default image prompt
    buildImagePrompt(post);

    // Fetch generation history
    fetchGenerationHistory(post);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  const buildImagePrompt = (post: CalendarItem) => {
    const colors = brandProfile && Array.isArray((brandProfile as Record<string, unknown>).primary_colors)
      ? ((brandProfile as Record<string, unknown>).primary_colors as string[]).join(", ")
      : "#4F46E5";

    const prompt = `${post.visual_direction || post.topic}.
Clean, minimal composition with generous negative space.
Single focal point, uncluttered background.
Brand colors: ${colors}.
Typography-forward design if text is needed.
No busy patterns, no collages, no image overload.
Professional, editorial aesthetic.
Flat or very subtle gradient background.
Platform: ${post.platform}, Aspect ratio: ${aspectRatio}`;

    setImagePrompt(prompt);
  };

  const fetchGenerationHistory = async (post: CalendarItem) => {
    try {
      const { data: files } = await supabase.storage
        .from("post-assets")
        .list(`post-images/${post.org_id}`, {
          search: post.id,
        });

      if (files && files.length > 0) {
        const urls = files
          .filter((f) => f.name.includes(post.id))
          .sort((a, b) => (b.created_at || "").localeCompare(a.created_at || ""))
          .map((f) => {
            const { data } = supabase.storage
              .from("post-assets")
              .getPublicUrl(`post-images/${post.org_id}/${f.name}`);
            return data.publicUrl;
          });
        setGenerationHistory(urls);
      } else {
        setGenerationHistory([]);
      }
    } catch {
      setGenerationHistory([]);
    }
  };

  // --- Caption Generation ---
  const handleGenerateCaption = async () => {
    if (!selectedPost) return;
    setCaptionLoading(true);
    setFusionSessionId(null);
    try {
      const res = await fetch("/api/generate-caption", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          calendar_item_id: selectedPost.id,
          org_id: orgId,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      // API now returns sessionId immediately — fusion runs in background
      setFusionSessionId(data.sessionId);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to generate caption");
      setCaptionLoading(false);
    }
  };

  /** Called by FusionTicker when the fusion pipeline completes. */
  const handleFusionComplete = useCallback(async (finalOutput: string) => {
    setCaptionLoading(false);
    setFusionSessionId(null);

    // Parse the JSON output from fusion
    try {
      let text = finalOutput.trim();
      if (text.startsWith("```json")) text = text.slice(7);
      if (text.startsWith("```")) text = text.slice(3);
      if (text.endsWith("```")) text = text.slice(0, -3);
      text = text.trim();

      const parsed = JSON.parse(text);
      const data: CaptionData = {
        caption: parsed.caption || finalOutput,
        hashtags: parsed.hashtags || [],
        cta: parsed.cta || "",
        hook: parsed.hook || "",
        estimated_reach: parsed.estimated_reach || "medium",
      };

      setCaptionData(data);
      setEditedCaption(data.caption);
      setEditedHashtags(data.hashtags);
      setEditedCta(data.cta);

      setSelectedPost((prev) =>
        prev ? { ...prev, generated_caption: data.caption, generated_hashtags: data.hashtags, status: "caption_generated" } : null
      );

      toast.success("Caption generated by AI Fusion!");
    } catch {
      // Fallback: use raw output as caption
      setEditedCaption(finalOutput);
      setCaptionData({
        caption: finalOutput,
        hashtags: [],
        cta: "",
        hook: finalOutput.split("\n")[0] || "",
        estimated_reach: "medium",
      });
      setSelectedPost((prev) =>
        prev ? { ...prev, generated_caption: finalOutput, status: "caption_generated" } : null
      );
      toast.success("Caption generated!");
    }
  }, []);

  /** Called by FusionTicker if the fusion pipeline fails. */
  const handleFusionFailed = useCallback((error: string) => {
    setCaptionLoading(false);
    setFusionSessionId(null);
    toast.error(`Caption generation failed: ${error}`);
  }, []);

  // --- Image Generation ---
  const handleGenerateImage = async () => {
    if (!selectedPost) return;
    setImageLoading(true);
    try {
      const res = await fetch("/api/generate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          calendar_item_id: selectedPost.id,
          org_id: orgId,
          aspect_ratio: aspectRatio,
          use_assets: useAssets,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        console.error("[Image Studio] API error:", data);
        throw new Error(data.error || data.details || "Image generation failed");
      }

      setSelectedPost((prev) =>
        prev ? { ...prev, generated_image_url: data.image_url, status: "image_generated" } : null
      );

      // Add to history
      setGenerationHistory((prev) => [data.image_url, ...prev]);

      toast.success("Image generated successfully!");
    } catch (err) {
      console.error("[Image Studio] Frontend error:", err);
      const msg = err instanceof Error ? err.message : "Failed to generate image";
      toast.error(`Image generation failed: ${msg}`);
    } finally {
      setImageLoading(false);
    }
  };

  // --- Hashtag Management ---
  const removeHashtag = (index: number) => {
    setEditedHashtags((prev) => prev.filter((_, i) => i !== index));
  };

  const addHashtag = () => {
    const tag = newHashtag.trim();
    if (!tag) return;
    const formatted = tag.startsWith("#") ? tag : `#${tag}`;
    setEditedHashtags((prev) => [...prev, formatted]);
    setNewHashtag("");
  };

  // --- Save ---
  const handleSaveAll = async () => {
    if (!selectedPost) return;
    setSaving(true);
    try {
      const updates: Record<string, unknown> = {};
      if (editedCaption) {
        updates.generated_caption = editedCaption;
        updates.generated_hashtags = editedHashtags;
      }

      const { error } = await supabase
        .from("content_calendar")
        .update(updates)
        .eq("id", selectedPost.id);

      if (error) throw error;

      setSelectedPost((prev) => prev ? {
        ...prev,
        generated_caption: editedCaption || prev.generated_caption,
        generated_hashtags: editedHashtags,
      } : null);

      toast.success("All changes saved!");
    } catch {
      toast.error("Failed to save changes");
    } finally {
      setSaving(false);
    }
  };

  // --- Send for Approval ---
  const handleSendForApproval = async () => {
    if (!selectedPost) return;

    const { error } = await supabase
      .from("content_calendar")
      .update({ status: "pending_approval" })
      .eq("id", selectedPost.id);

    if (error) {
      toast.error("Failed to send for approval");
    } else {
      toast.success("Post sent to Approval Queue!");
      setConfirmDialogOpen(false);
      router.push("/dashboard/approval");
    }
  };

  // --- Edit in Canva ---
  const handleEditInCanva = async () => {
    if (!selectedPost?.generated_image_url) {
      toast.error("No image to edit. Generate an image first.");
      return;
    }
    setCanvaLoading(true);
    try {
      const res = await fetch("/api/edit-in-canva", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image_url: selectedPost.generated_image_url,
          topic: selectedPost.topic || "Marketing Post",
          post_id: selectedPost.id,
          org_id: orgId,
        }),
      });
      const data = await res.json();
      console.log("Edit in Canva response:", data);

      if (!res.ok) {
        throw new Error(data.error || data.details || "Failed to open Canva");
      }

      if (!data.edit_url) {
        throw new Error("No edit URL returned from server");
      }

      // Open Canva editor in new tab
      window.open(data.edit_url, "_blank");
      toast.success("Opening in Canva editor!");
    } catch (err) {
      console.error("Edit in Canva frontend error:", err);
      const message = err instanceof Error ? err.message : "Failed to connect to Canva";
      toast.error(`Could not open Canva: ${message}`);
    } finally {
      setCanvaLoading(false);
    }
  };

  // --- Restore from history ---
  const restoreFromHistory = async (imageUrl: string) => {
    if (!selectedPost) return;

    await supabase
      .from("content_calendar")
      .update({ generated_image_url: imageUrl })
      .eq("id", selectedPost.id);

    setSelectedPost((prev) =>
      prev ? { ...prev, generated_image_url: imageUrl } : null
    );
    toast.success("Image restored from history");
  };

  // Auto-resize caption textarea
  useEffect(() => {
    if (captionTextareaRef.current) {
      captionTextareaRef.current.style.height = "auto";
      captionTextareaRef.current.style.height = captionTextareaRef.current.scrollHeight + "px";
    }
  }, [editedCaption]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setPostDropdownOpen(false);
        setPostSearch("");
      }
    }
    if (postDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [postDropdownOpen]);

  // --- Computed ---
  const hasCaption = !!editedCaption || !!selectedPost?.generated_caption;
  const hasImage = !!selectedPost?.generated_image_url;
  const canSendForApproval = hasCaption && hasImage;
  const charLimit = selectedPost ? PLATFORM_LIMITS[selectedPost.platform] || 2200 : 2200;

  // Filter posts for dropdown
  const filteredPosts = posts.filter((p) => {
    if (!postSearch) return true;
    const searchLower = postSearch.toLowerCase();
    return (
      p.topic.toLowerCase().includes(searchLower) ||
      p.platform.toLowerCase().includes(searchLower) ||
      p.date.includes(searchLower)
    );
  });

  // Group posts by month
  const groupedPosts = filteredPosts.reduce<Record<string, CalendarItem[]>>((groups, post) => {
    const d = new Date(post.date + "T00:00:00");
    const key = d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
    if (!groups[key]) groups[key] = [];
    groups[key].push(post);
    return groups;
  }, {});
  const shouldGroupByMonth = filteredPosts.length > 15;

  // --- Loading state ---
  if (loading) {
    return (
      <div className="space-y-6 max-w-[1400px]">
        <Skeleton className="h-8 w-72 rounded-xl" />
        <Skeleton className="h-12 w-full rounded-xl" />
        <Skeleton className="h-16 w-full rounded-xl" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Skeleton className="h-[500px] rounded-2xl" />
          <Skeleton className="h-[500px] rounded-2xl" />
        </div>
      </div>
    );
  }

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-6 max-w-[1400px] pb-24"
    >
      {/* Page Header */}
      <motion.div variants={fadeUp}>
        <h1 className="font-display text-2xl font-bold text-[#0A0A0A] tracking-tight">
          Caption & Image Studio
        </h1>
        <p className="text-sm text-[#0A0A0A]/50 mt-0.5">
          Your creative workspace for crafting captions and generating visuals
        </p>
      </motion.div>

      {/* Post Selector */}
      <motion.div variants={fadeUp} style={{ overflow: "visible", position: "relative", zIndex: 40 }}>
        <Card className="border-0 shadow-card rounded-2xl overflow-visible">
          <CardContent className="p-5" style={{ overflow: "visible" }}>
            <div className="flex items-center justify-between mb-2">
              <Label className="text-[10px] font-semibold uppercase tracking-wider text-[#0A0A0A]/50 block">
                Select a post from your calendar
              </Label>
              {!isLoadingPosts && posts.length > 0 && (
                <span className="text-xs text-[#0A0A0A]/50 font-medium">{posts.length} posts available</span>
              )}
            </div>
            <div className="relative" ref={dropdownRef}>
              {/* Dropdown Trigger */}
              <button
                onClick={() => setPostDropdownOpen(!postDropdownOpen)}
                className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-white border border-[#E2E8F0] hover:border-[#C7C4D8] transition-colors text-left"
                style={{ minHeight: 48 }}
              >
                {selectedPost ? (
                  <div className="flex items-center gap-3 min-w-0">
                    <PlatformIcon platform={selectedPost.platform} className="w-4 h-4 text-[#0A0A0A]/50 flex-shrink-0" />
                    <span className="text-sm font-medium text-[#0A0A0A] truncate">
                      {selectedPost.topic.length > 45 ? selectedPost.topic.slice(0, 45) + "..." : selectedPost.topic}
                    </span>
                  </div>
                ) : (
                  <span className="text-sm text-[#0A0A0A]/50">Choose a post to get started...</span>
                )}
                <ChevronDown className={`w-4 h-4 text-[#0A0A0A]/50 transition-transform flex-shrink-0 ${postDropdownOpen ? "rotate-180" : ""}`} />
              </button>

              {/* Dropdown Panel */}
              <AnimatePresence>
                {postDropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.15 }}
                    style={{ borderRadius: 12, border: "1px solid #E2E8F0", boxShadow: "0 8px 24px rgba(0,0,0,0.12)" }}
                    className="absolute z-50 mt-2 w-full bg-white overflow-hidden"
                  >
                    {/* Search Input */}
                    <div className="p-3 border-b border-[#E2E8F0]">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#0A0A0A]/25" />
                        <input
                          type="text"
                          placeholder="Search posts..."
                          value={postSearch}
                          onChange={(e) => setPostSearch(e.target.value)}
                          className="w-full pl-9 pr-4 py-2.5 rounded-lg bg-[#F5F5F3] text-sm text-[#0A0A0A] placeholder:text-[#0A0A0A]/25 outline-none focus:ring-2 focus:ring-[#4F46E5]/20"
                          autoFocus
                        />
                      </div>
                    </div>

                    {/* Posts List */}
                    <div style={{ maxHeight: 400, overflowY: "auto" }}>
                      {/* Loading state */}
                      {isLoadingPosts ? (
                        <div className="p-2">
                          {[1, 2, 3, 4].map((n) => (
                            <div key={n} className="flex items-center gap-3 px-4 animate-pulse" style={{ height: 64 }}>
                              <div className="w-5 h-5 rounded bg-[#E2E8F0] flex-shrink-0" />
                              <div className="flex-1 space-y-2">
                                <div className="h-3.5 w-3/4 bg-[#E2E8F0] rounded" />
                                <div className="h-2.5 w-1/2 bg-[#F1F5F9] rounded" />
                              </div>
                              <div className="h-5 w-16 bg-[#E2E8F0] rounded-full flex-shrink-0" />
                            </div>
                          ))}
                        </div>
                      ) : posts.length === 0 ? (
                        /* Empty state */
                        <div className="px-6 py-10 text-center">
                          <CalendarDays className="w-8 h-8 text-[#0A0A0A]/25 mx-auto mb-3" />
                          <p className="text-sm font-medium text-[#0A0A0A]/70 mb-1">No calendar posts found</p>
                          <p className="text-xs text-[#0A0A0A]/50 mb-4">Generate your content calendar first</p>
                          <button
                            onClick={() => { setPostDropdownOpen(false); router.push("/dashboard/calendar"); }}
                            className="inline-flex items-center gap-1.5 text-xs font-medium text-[#4F46E5] hover:text-[#4338CA] transition-colors"
                          >
                            Go to Calendar <ArrowRight className="w-3 h-3" />
                          </button>
                        </div>
                      ) : filteredPosts.length === 0 ? (
                        /* No search results */
                        <div className="px-6 py-8 text-center">
                          <p className="text-sm text-[#0A0A0A]/50">No posts match your search</p>
                        </div>
                      ) : shouldGroupByMonth ? (
                        /* Grouped by month */
                        Object.entries(groupedPosts).map(([monthLabel, monthPosts]) => (
                          <div key={monthLabel}>
                            <div className="px-4 py-2 bg-[#F8FAFC]">
                              <span className="text-[10px] font-semibold uppercase tracking-wider text-[#94A3B8]">{monthLabel}</span>
                            </div>
                            {monthPosts.map((post) => {
                              const isSelected = selectedPost?.id === post.id;
                              const typeColor = CONTENT_TYPE_COLORS[post.content_type] || { bg: "#F1F5F9", text: "#64748B" };
                              return (
                                <button
                                  key={post.id}
                                  onClick={() => selectPost(post)}
                                  style={{
                                    height: 64,
                                    padding: "12px 16px",
                                    borderLeft: isSelected ? "3px solid #4F46E5" : "3px solid transparent",
                                    backgroundColor: isSelected ? "#EEF2FF" : "transparent",
                                  }}
                                  className="w-full flex items-center gap-3 text-left transition-colors hover:!bg-[#F5F3FF]"
                                >
                                  <PlatformIcon platform={post.platform} className="w-5 h-5 text-[#0A0A0A]/50 flex-shrink-0" />
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold text-[#0A0A0A] truncate">
                                      {post.topic.length > 45 ? post.topic.slice(0, 45) + "..." : post.topic}
                                    </p>
                                    <p className="text-[11px] text-[#94A3B8] mt-0.5 capitalize">
                                      {formatDate(post.date)} · {post.content_type.replace(/-/g, " ")}
                                    </p>
                                  </div>
                                  <span
                                    className="text-[10px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0 capitalize"
                                    style={{ backgroundColor: typeColor.bg, color: typeColor.text }}
                                  >
                                    {post.content_type.replace(/-/g, " ")}
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                        ))
                      ) : (
                        /* Flat list */
                        filteredPosts.map((post) => {
                          const isSelected = selectedPost?.id === post.id;
                          const typeColor = CONTENT_TYPE_COLORS[post.content_type] || { bg: "#F1F5F9", text: "#64748B" };
                          return (
                            <button
                              key={post.id}
                              onClick={() => selectPost(post)}
                              style={{
                                height: 64,
                                padding: "12px 16px",
                                borderLeft: isSelected ? "3px solid #4F46E5" : "3px solid transparent",
                                backgroundColor: isSelected ? "#EEF2FF" : "transparent",
                              }}
                              className="w-full flex items-center gap-3 text-left transition-colors hover:!bg-[#F5F3FF]"
                            >
                              <PlatformIcon platform={post.platform} className="w-5 h-5 text-[#0A0A0A]/50 flex-shrink-0" />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-[#0A0A0A] truncate">
                                  {post.topic.length > 45 ? post.topic.slice(0, 45) + "..." : post.topic}
                                </p>
                                <p className="text-[11px] text-[#94A3B8] mt-0.5 capitalize">
                                  {formatDate(post.date)} · {post.content_type.replace(/-/g, " ")}
                                </p>
                              </div>
                              <span
                                className="text-[10px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0 capitalize"
                                style={{ backgroundColor: typeColor.bg, color: typeColor.text }}
                              >
                                {post.content_type.replace(/-/g, " ")}
                              </span>
                            </button>
                          );
                        })
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Pipeline Progress */}
      {selectedPost && (
        <motion.div variants={fadeUp}>
          <Card className="border-0 shadow-card rounded-2xl">
            <CardContent className="px-8 py-5">
              <PipelineProgress status={selectedPost.status} />
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Main Content — Two Columns */}
      {selectedPost && (
        <motion.div variants={fadeUp} className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* ==================== LEFT COLUMN — Caption Studio ==================== */}
          <div className="space-y-5">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center shadow-[0_2px_8px_rgba(79,70,229,0.25)]">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <h2 className="font-display text-lg font-semibold text-[#0A0A0A]">Caption Studio</h2>
            </div>

            {/* Post Context Card */}
            <Card className="border-0 shadow-card rounded-2xl overflow-hidden">
              <button
                onClick={() => setContextExpanded(!contextExpanded)}
                className="w-full flex items-center justify-between px-5 py-4 hover:bg-[#FAFAF8] transition-colors"
              >
                <span className="text-xs font-semibold uppercase tracking-wider text-[#0A0A0A]/50">
                  Post Context
                </span>
                {contextExpanded ? (
                  <ChevronUp className="w-4 h-4 text-[#0A0A0A]/25" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-[#0A0A0A]/25" />
                )}
              </button>
              <AnimatePresence>
                {contextExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="px-5 pb-5 grid grid-cols-2 gap-3">
                      <div className="p-3 rounded-xl bg-[#F5F5F3]">
                        <p className="text-[9px] uppercase tracking-wider text-[#0A0A0A]/50 font-semibold mb-1">Platform</p>
                        <p className="text-sm font-medium text-[#0A0A0A] capitalize">{selectedPost.platform}</p>
                      </div>
                      <div className="p-3 rounded-xl bg-[#F5F5F3]">
                        <p className="text-[9px] uppercase tracking-wider text-[#0A0A0A]/50 font-semibold mb-1">Content Type</p>
                        <p className="text-sm font-medium text-[#0A0A0A] capitalize">{selectedPost.content_type}</p>
                      </div>
                      <div className="p-3 rounded-xl bg-[#F5F5F3]">
                        <p className="text-[9px] uppercase tracking-wider text-[#0A0A0A]/50 font-semibold mb-1">Date</p>
                        <p className="text-sm font-medium text-[#0A0A0A]">{formatDate(selectedPost.date)}</p>
                      </div>
                      <div className="p-3 rounded-xl bg-[#F5F5F3]">
                        <p className="text-[9px] uppercase tracking-wider text-[#0A0A0A]/50 font-semibold mb-1">Occasion</p>
                        <p className="text-sm font-medium text-[#0A0A0A]">{selectedPost.occasion || "None"}</p>
                      </div>
                      {selectedPost.caption_direction && (
                        <div className="col-span-2 p-3 rounded-xl bg-[#F5F5F3]">
                          <p className="text-[9px] uppercase tracking-wider text-[#0A0A0A]/50 font-semibold mb-1">Caption Direction</p>
                          <p className="text-sm text-[#0A0A0A]/70">{selectedPost.caption_direction}</p>
                        </div>
                      )}
                      {brandProfile && (
                        <>
                          <div className="p-3 rounded-xl bg-[rgba(79,70,229,0.06)]">
                            <p className="text-[9px] uppercase tracking-wider text-[#4F46E5] font-semibold mb-1">Brand Voice</p>
                            <p className="text-sm text-[#0A0A0A]/70">{String(brandProfile.brand_voice || "Not set")}</p>
                          </div>
                          <div className="p-3 rounded-xl bg-[rgba(79,70,229,0.06)]">
                            <p className="text-[9px] uppercase tracking-wider text-[#4F46E5] font-semibold mb-1">Target Audience</p>
                            <p className="text-sm text-[#0A0A0A]/70">{String(brandProfile.target_audience || "Not set")}</p>
                          </div>
                        </>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </Card>

            {/* Caption Generation */}
            {!editedCaption && !captionLoading && !fusionSessionId ? (
              <Button
                onClick={handleGenerateCaption}
                className="w-full h-12 rounded-xl gradient-primary hover:opacity-90 text-white font-medium shadow-[0_4px_16px_rgba(79,70,229,0.3)]"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Generate Caption
              </Button>
            ) : fusionSessionId ? (
              <FusionTicker
                sessionId={fusionSessionId}
                onComplete={handleFusionComplete}
                onFailed={handleFusionFailed}
              />
            ) : (
              <Card className="border-0 shadow-card rounded-2xl">
                <CardContent className="p-5 space-y-4">
                  {/* Hook Line */}
                  {(captionData?.hook || editedCaption) && (
                    <div className="p-4 rounded-xl bg-gradient-to-r from-[rgba(79,70,229,0.06)] to-[rgba(79,70,229,0.03)]">
                      <p className="text-[9px] uppercase tracking-wider text-[#4F46E5] font-semibold mb-1.5">
                        Opening Hook
                      </p>
                      <p className="text-sm font-semibold text-[#0A0A0A] leading-relaxed">
                        {captionData?.hook || editedCaption.split("\n")[0]}
                      </p>
                    </div>
                  )}

                  {/* Caption Textarea */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <Label className="text-[10px] font-semibold uppercase tracking-wider text-[#0A0A0A]/50">
                        Full Caption
                      </Label>
                      <div className="flex items-center gap-2">
                        {captionData?.estimated_reach && (
                          <ReachBadge reach={captionData.estimated_reach} />
                        )}
                        <span className={`text-[10px] font-medium ${editedCaption.length > charLimit ? "text-red-500" : "text-[#0A0A0A]/25"}`}>
                          {editedCaption.length}/{charLimit}
                        </span>
                      </div>
                    </div>
                    <Textarea
                      ref={captionTextareaRef}
                      value={editedCaption}
                      onChange={(e) => setEditedCaption(e.target.value)}
                      className="rounded-xl border-[rgba(0,0,0,0.06)] focus:ring-[#4F46E5] min-h-[160px] text-sm leading-relaxed resize-none"
                      style={{ overflow: "hidden" }}
                    />
                  </div>

                  {/* Hashtags */}
                  <div>
                    <p className="text-[9px] uppercase tracking-wider text-[#0A0A0A]/50 font-semibold mb-2">
                      Hashtags
                    </p>
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {editedHashtags.map((tag, i) => (
                        <Badge
                          key={i}
                          variant="secondary"
                          className="bg-[#F5F5F3] text-[#0A0A0A]/70 rounded-lg px-2.5 py-1 text-xs cursor-pointer hover:bg-red-50 hover:text-red-600 transition-colors"
                          onClick={() => removeHashtag(i)}
                        >
                          {tag} <X className="w-3 h-3 ml-1" />
                        </Badge>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <Input
                        placeholder="Add hashtag..."
                        value={newHashtag}
                        onChange={(e) => setNewHashtag(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            addHashtag();
                          }
                        }}
                        className="flex-1 h-9 rounded-lg border-dashed border-[rgba(0,0,0,0.08)] text-sm"
                      />
                    </div>
                  </div>

                  {/* CTA */}
                  {(captionData?.cta || editedCta) && (
                    <div>
                      <Label className="text-[9px] font-semibold uppercase tracking-wider text-[#0A0A0A]/50 mb-1.5 block">
                        Call to Action
                      </Label>
                      <Input
                        value={editedCta || captionData?.cta || ""}
                        onChange={(e) => setEditedCta(e.target.value)}
                        className="rounded-xl border-[rgba(0,0,0,0.06)] text-sm"
                      />
                    </div>
                  )}

                  {/* Caption Actions */}
                  <div className="flex gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleGenerateCaption}
                      disabled={captionLoading}
                      className="rounded-xl border-[rgba(0,0,0,0.08)] text-xs"
                    >
                      <RefreshCw className="w-3 h-3 mr-1.5" />
                      Regenerate
                    </Button>
                    <Button
                      size="sm"
                      onClick={async () => {
                        if (!selectedPost) return;
                        await supabase
                          .from("content_calendar")
                          .update({
                            generated_caption: editedCaption,
                            generated_hashtags: editedHashtags,
                          })
                          .eq("id", selectedPost.id);
                        toast.success("Caption saved");
                      }}
                      className="rounded-xl bg-[#4F46E5] hover:bg-[#4338CA] text-xs"
                    >
                      <Save className="w-3 h-3 mr-1.5" />
                      Save Caption
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* ==================== RIGHT COLUMN — Image Studio ==================== */}
          <div className="space-y-5">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-[0_2px_8px_rgba(245,158,11,0.3)]">
                <ImageIcon className="w-4 h-4 text-white" />
              </div>
              <h2 className="font-display text-lg font-semibold text-[#0A0A0A]">Image Studio</h2>
            </div>

            {/* Aspect Ratio Selector */}
            <Card className="border-0 shadow-card rounded-2xl">
              <CardContent className="p-5">
                <p className="text-[9px] uppercase tracking-wider text-[#0A0A0A]/50 font-semibold mb-3">
                  Aspect Ratio
                </p>
                <div className="grid grid-cols-4 gap-3">
                  {ASPECT_RATIOS.map((ar) => (
                    <button
                      key={ar.value}
                      onClick={() => {
                        setAspectRatio(ar.value);
                        if (selectedPost) buildImagePrompt(selectedPost);
                      }}
                      className={`flex flex-col items-center gap-2.5 p-3 rounded-xl transition-all duration-200 ${
                        aspectRatio === ar.value
                          ? "bg-[rgba(79,70,229,0.08)] ring-2 ring-[#4F46E5] shadow-[0_0_0_4px_rgba(79,70,229,0.1)]"
                          : "bg-[#F5F5F3] hover:bg-[#EEEEEE]"
                      }`}
                    >
                      <div
                        className={`rounded-md border-2 transition-colors ${
                          aspectRatio === ar.value
                            ? "border-[#4F46E5] bg-[#4F46E5]/5"
                            : "border-[#C7C4D8] bg-white"
                        }`}
                        style={{ width: ar.width * 0.55, height: ar.height * 0.55 }}
                      />
                      <div className="text-center">
                        <p className={`text-xs font-semibold ${
                          aspectRatio === ar.value ? "text-[#4F46E5]" : "text-[#0A0A0A]/70"
                        }`}>
                          {ar.value}
                        </p>
                        <p className="text-[9px] text-[#0A0A0A]/50 mt-0.5">{ar.label}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Use My Assets Toggle */}
            <Card className="border-0 shadow-card rounded-2xl">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-[#1E293B] mb-0.5">Use My Assets</p>
                    <p className={`text-xs font-medium ${useAssets ? "text-[#4F46E5]" : "text-emerald-600"}`}>
                      {useAssets
                        ? "Using your Post-Ready assets"
                        : "Generating fresh minimalist post"}
                    </p>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={useAssets}
                    onClick={() => setUseAssets(!useAssets)}
                    className="flex-shrink-0"
                    style={{
                      width: 52,
                      height: 28,
                      borderRadius: 999,
                      backgroundColor: useAssets ? "#4F46E5" : "#E2E8F0",
                      border: useAssets ? "none" : "1px solid #CBD5E1",
                      cursor: "pointer",
                      position: "relative",
                      transition: "background-color 0.2s ease",
                      outline: "none",
                    }}
                  >
                    <span
                      style={{
                        position: "absolute",
                        top: 3,
                        left: useAssets ? 26 : 3,
                        width: 22,
                        height: 22,
                        borderRadius: "50%",
                        backgroundColor: "white",
                        boxShadow: "0 1px 4px rgba(0,0,0,0.25)",
                        transition: "left 0.2s ease",
                      }}
                    />
                  </button>
                </div>
              </CardContent>
            </Card>

            {/* AI Prompt Preview */}
            <Card className="border-0 shadow-card rounded-2xl overflow-hidden">
              <button
                onClick={() => setPromptExpanded(!promptExpanded)}
                className="w-full flex items-center justify-between px-5 py-4 hover:bg-[#FAFAF8] transition-colors"
              >
                <span className="text-[10px] font-semibold uppercase tracking-wider text-[#0A0A0A]/50">
                  Generation Prompt (editable)
                </span>
                {promptExpanded ? (
                  <ChevronUp className="w-4 h-4 text-[#0A0A0A]/25" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-[#0A0A0A]/25" />
                )}
              </button>
              <AnimatePresence>
                {promptExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="px-5 pb-5">
                      <Textarea
                        value={imagePrompt}
                        onChange={(e) => setImagePrompt(e.target.value)}
                        className="rounded-xl border-[rgba(0,0,0,0.06)] min-h-[120px] text-xs font-mono leading-relaxed"
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </Card>

            {/* Generate Image Button / Loading / Result */}
            {!selectedPost?.generated_image_url && !imageLoading ? (
              <Button
                onClick={handleGenerateImage}
                className="w-full h-12 rounded-xl gradient-primary hover:opacity-90 text-white font-medium shadow-[0_4px_16px_rgba(79,70,229,0.3)]"
              >
                <ImageIcon className="w-4 h-4 mr-2" />
                Generate Image
              </Button>
            ) : imageLoading ? (
              <Card className="border-0 shadow-card rounded-2xl overflow-hidden">
                <CardContent className="p-0">
                  <div
                    className="relative overflow-hidden"
                    style={{
                      aspectRatio: aspectRatio.replace(":", "/"),
                    }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-[rgba(79,70,229,0.15)] via-[rgba(79,70,229,0.08)] to-[rgba(79,70,229,0.15)] animate-pulse" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center">
                        <Loader2 className="w-8 h-8 animate-spin text-[#4F46E5] mx-auto mb-3" />
                        <p className="text-sm font-medium text-[#4F46E5]">
                          Nano Banana is creating your post...
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : selectedPost?.generated_image_url ? (
              <Card className="border-0 shadow-card rounded-2xl overflow-hidden">
                <CardContent className="p-0">
                  <div
                    className="relative overflow-hidden bg-[#F5F5F3]"
                    style={{ aspectRatio: aspectRatio.replace(":", "/") }}
                  >
                    <img
                      src={selectedPost.generated_image_url}
                      alt="Generated post"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="p-4 flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleGenerateImage}
                      disabled={imageLoading}
                      className="rounded-xl border-[rgba(0,0,0,0.08)] text-xs"
                    >
                      <RefreshCw className="w-3 h-3 mr-1.5" />
                      Regenerate
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleEditInCanva}
                      disabled={canvaLoading || !selectedPost?.generated_image_url}
                      className="rounded-xl text-xs transition-colors"
                      style={{
                        backgroundColor: canvaLoading ? "#F5F3FF" : "white",
                        borderColor: canvaLoading ? "#DDD6FE" : "#E2E8F0",
                        color: "#7C3AED",
                        padding: "8px 16px",
                        fontWeight: 500,
                        fontSize: "13px",
                      }}
                      onMouseEnter={(e) => {
                        if (!canvaLoading) {
                          e.currentTarget.style.backgroundColor = "#F5F3FF";
                          e.currentTarget.style.borderColor = "#DDD6FE";
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!canvaLoading) {
                          e.currentTarget.style.backgroundColor = "white";
                          e.currentTarget.style.borderColor = "#E2E8F0";
                        }
                      }}
                    >
                      {canvaLoading ? (
                        <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                      ) : (
                        <svg
                          className="w-3.5 h-3.5 mr-1.5"
                          viewBox="0 0 24 24"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm0 1.5c4.687 0 8.5 3.813 8.5 8.5s-3.813 8.5-8.5 8.5S3.5 16.687 3.5 12 7.313 3.5 12 3.5z"
                            fill="#7C3AED"
                            fillOpacity="0.2"
                          />
                          <path
                            d="M8.5 10.5c0-1.38 1.12-2.5 2.5-2.5.83 0 1.56.4 2.02 1.03.18.24.49.35.78.25a2.502 2.502 0 013.2 2.4c0 1.05-.65 1.95-1.57 2.32-.23.09-.38.31-.38.56v.44c0 .28-.22.5-.5.5s-.5-.22-.5-.5v-.44c0-.74.46-1.41 1.14-1.67a1.5 1.5 0 00-.94-2.85c-.59.06-1.14-.3-1.3-.87A1.501 1.501 0 0011 9.5c-.83 0-1.5.67-1.5 1.5v1.5c0 .28-.22.5-.5.5s-.5-.22-.5-.5V10.5z"
                            fill="#7C3AED"
                          />
                          <circle cx="12" cy="16" r="1" fill="#7C3AED" />
                        </svg>
                      )}
                      {canvaLoading ? "Opening Canva..." : "Edit in Canva"}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        if (selectedPost?.generated_image_url) {
                          const a = document.createElement("a");
                          a.href = selectedPost.generated_image_url;
                          a.download = `${selectedPost.topic.replace(/\s+/g, "-")}-${Date.now()}.png`;
                          a.target = "_blank";
                          a.click();
                        }
                      }}
                      className="rounded-xl border-[rgba(0,0,0,0.08)] text-xs"
                    >
                      <Download className="w-3 h-3 mr-1.5" />
                      Download
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : null}

            {/* Generation History */}
            {generationHistory.length > 1 && (
              <Card className="border-0 shadow-card rounded-2xl">
                <CardContent className="p-5">
                  <p className="text-[9px] uppercase tracking-wider text-[#0A0A0A]/50 font-semibold mb-3">
                    Previous Generations
                  </p>
                  <div className="flex gap-2 overflow-x-auto pb-1">
                    {generationHistory.map((url, i) => (
                      <button
                        key={i}
                        onClick={() => restoreFromHistory(url)}
                        className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all hover:scale-105 ${
                          url === selectedPost?.generated_image_url
                            ? "border-[#4F46E5] shadow-[0_0_0_3px_rgba(79,70,229,0.15)]"
                            : "border-transparent hover:border-[#C7C4D8]"
                        }`}
                      >
                        <img src={url} alt={`Generation ${i + 1}`} className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </motion.div>
      )}

      {/* Empty State — only show when posts exist but none selected */}
      {!selectedPost && !loading && posts.length > 0 && (
        <motion.div variants={fadeUp}>
          <Card className="border-0 shadow-card rounded-2xl">
            <CardContent className="p-16 text-center">
              <div className="w-14 h-14 rounded-2xl bg-[#0A0A0A]/[0.06] flex items-center justify-center mx-auto mb-4">
                <Sparkles className="w-6 h-6 text-[#4F46E5]" />
              </div>
              <h3 className="font-display text-lg font-semibold text-[#0A0A0A] mb-1">
                Select a post to begin
              </h3>
              <p className="text-sm text-[#0A0A0A]/50 max-w-md mx-auto">
                Choose a scheduled post from the dropdown above to start crafting your caption and generating visuals
              </p>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* ==================== BOTTOM ACTION BAR ==================== */}
      {selectedPost && (
        <div className="fixed bottom-0 left-0 lg:left-[240px] right-0 z-30 bg-white/90 backdrop-blur-xl border-t border-[rgba(199,196,216,0.12)] shadow-[0_-4px_20px_rgba(26,28,28,0.06)]">
          <div className="flex items-center justify-between px-6 lg:px-8 py-3.5 max-w-[1400px]">
            {/* Left — Post Info */}
            <div className="flex items-center gap-2.5">
              <PlatformIcon platform={selectedPost.platform} className="w-4 h-4 text-[#0A0A0A]/50" />
              <span className="text-sm font-medium text-[#0A0A0A]/70 truncate max-w-[200px] lg:max-w-[300px]">
                {selectedPost.topic}
              </span>
              <span className="text-xs text-[#0A0A0A]/25">—</span>
              <span className="text-xs text-[#0A0A0A]/50">{formatDate(selectedPost.date)}</span>
            </div>

            {/* Right — Actions */}
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={handleSaveAll}
                disabled={saving}
                className="rounded-xl border-[rgba(0,0,0,0.08)] text-xs"
              >
                {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> : <Save className="w-3.5 h-3.5 mr-1.5" />}
                Save All
              </Button>
              <Button
                onClick={() => setConfirmDialogOpen(true)}
                disabled={!canSendForApproval}
                className="rounded-xl gradient-primary hover:opacity-90 text-xs shadow-[0_2px_12px_rgba(79,70,229,0.25)] disabled:opacity-40 disabled:shadow-none"
              >
                <Send className="w-3.5 h-3.5 mr-1.5" />
                Send for Approval →
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Dialog */}
      <Dialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <DialogContent className="rounded-2xl sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display">Send this post to Approval Queue?</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <p className="text-sm text-[#0A0A0A]/50">
              This will submit the caption and image to the Approval Queue for review. You can still edit it from the queue.
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setConfirmDialogOpen(false)}
                className="flex-1 rounded-xl"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSendForApproval}
                className="flex-1 rounded-xl gradient-primary hover:opacity-90"
              >
                Confirm & Send
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}

// --- Page Export with Suspense boundary for useSearchParams ---
export default function CaptionImagePage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-6 max-w-[1400px]">
          <Skeleton className="h-8 w-72 rounded-xl" />
          <Skeleton className="h-12 w-full rounded-xl" />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Skeleton className="h-[500px] rounded-2xl" />
            <Skeleton className="h-[500px] rounded-2xl" />
          </div>
        </div>
      }
    >
      <CaptionImageStudioContent />
    </Suspense>
  );
}
