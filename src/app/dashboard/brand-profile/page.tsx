"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
  MessageSquare,
  Palette,
  Users,
  Layers,
  Package,
  Zap,
  Hash,
  Sparkles,
  RefreshCw,
  Copy,
  Check,
  Loader2,
} from "lucide-react";

interface BrandProfile {
  brand_voice: string;
  tone_of_voice: string;
  primary_colors: string[];
  target_audience: string;
  audience_age_range: string;
  content_themes: string[];
  posting_style: string;
  key_products_services: string[];
  unique_selling_points: string[];
  content_pillars: string[];
  suggested_hashtags: string[];
  competitor_keywords: string[];
  brand_personality: string[];
  industry: string;
  summary: string;
}

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.06 },
  },
};

const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, type: "tween" as const } },
};

export default function BrandProfilePage() {
  const [profile, setProfile] = useState<BrandProfile | null>(null);
  const [orgId, setOrgId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [reanalyzing, setReanalyzing] = useState(false);
  const [copiedHashtag, setCopiedHashtag] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    async function fetchProfile() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const { data: org } = await supabase
          .from("organizations")
          .select("id")
          .eq("user_id", user.id)
          .single();

        if (org) {
          setOrgId(org.id);

          const { data: profileData } = await supabase
            .from("brand_profiles")
            .select("*")
            .eq("org_id", org.id)
            .single();

          if (profileData) {
            setProfile(profileData);
          }
        }
      }

      setLoading(false);
    }

    fetchProfile();
  }, [supabase]);

  const handleReanalyze = async () => {
    if (!orgId) return;
    setReanalyzing(true);

    try {
      const res = await fetch("/api/analyze-brand", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orgId }),
      });

      if (!res.ok) throw new Error("Analysis failed");

      const data = await res.json();
      if (data.profile) {
        setProfile(data.profile);
      }

      toast.success("Brand profile re-analyzed successfully!");
    } catch {
      toast.error("Failed to re-analyze brand. Please try again.");
    } finally {
      setReanalyzing(false);
    }
  };

  const copyHashtag = (tag: string) => {
    navigator.clipboard.writeText(tag);
    setCopiedHashtag(tag);
    toast.success(`Copied ${tag}`);
    setTimeout(() => setCopiedHashtag(null), 2000);
  };

  if (loading) {
    return (
      <div className="space-y-6 max-w-[1000px]">
        <Skeleton className="h-12 w-64 rounded-xl" />
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-40 rounded-2xl" />
        ))}
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center">
          <div className="w-16 h-16 rounded-2xl bg-[#0A0A0A]/[0.06] flex items-center justify-center mx-auto mb-4">
            <Sparkles className="w-8 h-8 text-[#4F46E5]" />
          </div>
          <h2 className="font-display text-xl font-bold text-[#0A0A0A] mb-2">
            No Brand Profile Yet
          </h2>
          <p className="text-[#0A0A0A]/50 mb-6 max-w-sm">
            Complete your organization setup to generate an AI-powered brand
            profile.
          </p>
          <Button
            onClick={handleReanalyze}
            disabled={reanalyzing || !orgId}
            className="gradient-primary text-white rounded-xl"
          >
            {reanalyzing ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <Sparkles className="w-4 h-4 mr-2" />
            )}
            Analyze My Brand
          </Button>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-6 max-w-[1000px]"
    >
      {/* Page Header */}
      <motion.div
        variants={item}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="font-display text-2xl font-bold text-[#0A0A0A] tracking-tight">
            Brand Profile
          </h1>
          <p className="text-[#0A0A0A]/50 mt-1 text-sm">
            AI-generated insights about your brand
          </p>
        </div>
        <Button
          onClick={handleReanalyze}
          disabled={reanalyzing}
          variant="outline"
          className="rounded-xl border-[rgba(0,0,0,0.06)] hover:bg-[rgba(79,70,229,0.08)] hover:text-[#4F46E5] hover:border-[#4F46E5]/20 transition-all"
        >
          {reanalyzing ? (
            <Loader2 className="w-4 h-4 animate-spin mr-2" />
          ) : (
            <RefreshCw className="w-4 h-4 mr-2" />
          )}
          Re-analyze Brand
        </Button>
      </motion.div>

      {/* Brand Summary */}
      <motion.div variants={item}>
        <Card className="border-0 shadow-card rounded-2xl overflow-hidden">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-[#0A0A0A]/[0.02] to-[#0A0A0A]/[0.01]" />
            <CardContent className="p-6 lg:p-8 relative">
              <h3 className="font-display text-lg font-semibold text-[#0A0A0A] mb-3">
                Brand Summary
              </h3>
              <p className="text-[#0A0A0A]/70 leading-relaxed text-[0.9375rem]">
                {profile.summary}
              </p>
            </CardContent>
          </div>
        </Card>
      </motion.div>

      {/* Brand Voice & Tone */}
      <motion.div variants={item}>
        <Card className="border-0 shadow-card rounded-2xl">
          <CardContent className="p-6 lg:p-8">
            <div className="flex items-center gap-2 mb-4">
              <MessageSquare className="w-5 h-5 text-[#4F46E5]" />
              <h3 className="font-display text-lg font-semibold text-[#0A0A0A]">
                Brand Voice & Tone
              </h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-[#0A0A0A]/50 mb-2">
                  Voice
                </p>
                <Badge className="bg-[rgba(0,0,0,0.05)] text-[#0A0A0A] hover:bg-[rgba(0,0,0,0.05)] font-medium px-4 py-1.5 rounded-lg text-sm border border-[rgba(0,0,0,0.08)]">
                  {profile.brand_voice}
                </Badge>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-[#0A0A0A]/50 mb-2">
                  Tone Description
                </p>
                <p className="text-sm text-[#0A0A0A]/70 leading-relaxed">
                  {profile.tone_of_voice}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Color Palette */}
      {profile.primary_colors && profile.primary_colors.length > 0 && (
        <motion.div variants={item}>
          <Card className="border-0 shadow-card rounded-2xl">
            <CardContent className="p-6 lg:p-8">
              <div className="flex items-center gap-2 mb-4">
                <Palette className="w-5 h-5 text-[#4F46E5]" />
                <h3 className="font-display text-lg font-semibold text-[#0A0A0A]">
                  Color Palette
                </h3>
              </div>
              <div className="flex flex-wrap gap-4">
                {profile.primary_colors.map((color, i) => (
                  <div key={i} className="flex flex-col items-center gap-2">
                    <div
                      className="w-14 h-14 rounded-xl shadow-card"
                      style={{ backgroundColor: color }}
                    />
                    <span className="text-xs font-mono text-[#0A0A0A]/50">
                      {color}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Target Audience */}
      <motion.div variants={item}>
        <Card className="border-0 shadow-card rounded-2xl">
          <CardContent className="p-6 lg:p-8">
            <div className="flex items-center gap-2 mb-4">
              <Users className="w-5 h-5 text-[#4F46E5]" />
              <h3 className="font-display text-lg font-semibold text-[#0A0A0A]">
                Target Audience
              </h3>
            </div>
            <p className="text-[#0A0A0A]/70 leading-relaxed text-[0.9375rem] mb-3">
              {profile.target_audience}
            </p>
            {profile.audience_age_range && (
              <Badge
                variant="secondary"
                className="bg-[#F5F5F3] text-[#0A0A0A]/70 rounded-lg"
              >
                Age Range: {profile.audience_age_range}
              </Badge>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Content Pillars */}
      {profile.content_pillars && profile.content_pillars.length > 0 && (
        <motion.div variants={item}>
          <Card className="border-0 shadow-card rounded-2xl">
            <CardContent className="p-6 lg:p-8">
              <div className="flex items-center gap-2 mb-4">
                <Layers className="w-5 h-5 text-[#4F46E5]" />
                <h3 className="font-display text-lg font-semibold text-[#0A0A0A]">
                  Content Pillars
                </h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {profile.content_pillars.map((pillar, i) => (
                  <div
                    key={i}
                    className="p-4 rounded-xl bg-[#FAFAFA] hover:bg-[rgba(79,70,229,0.06)] transition-colors"
                  >
                    <div className="w-8 h-8 rounded-lg bg-[#0A0A0A]/[0.06] flex items-center justify-center mb-2">
                      <span className="text-xs font-bold text-[#4F46E5]">
                        {i + 1}
                      </span>
                    </div>
                    <p className="text-sm font-medium text-[#0A0A0A]">
                      {pillar}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Key Products/Services & USPs */}
      <motion.div variants={item}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Products/Services */}
          <Card className="border-0 shadow-card rounded-2xl">
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <Package className="w-5 h-5 text-[#4F46E5]" />
                <h3 className="font-display text-base font-semibold text-[#0A0A0A]">
                  Key Products & Services
                </h3>
              </div>
              <div className="space-y-2">
                {(profile.key_products_services || []).map((item, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-2 text-sm text-[#0A0A0A]/70"
                  >
                    <div className="w-1.5 h-1.5 rounded-full bg-[#4F46E5]" />
                    {item}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* USPs */}
          <Card className="border-0 shadow-card rounded-2xl">
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <Zap className="w-5 h-5 text-[#4F46E5]" />
                <h3 className="font-display text-base font-semibold text-[#0A0A0A]">
                  Unique Selling Points
                </h3>
              </div>
              <div className="space-y-2">
                {(profile.unique_selling_points || []).map((usp, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-2 text-sm text-[#0A0A0A]/70"
                  >
                    <div className="w-1.5 h-1.5 rounded-full bg-[rgba(0,0,0,0.2)]" />
                    {usp}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </motion.div>

      {/* Suggested Hashtags */}
      {profile.suggested_hashtags && profile.suggested_hashtags.length > 0 && (
        <motion.div variants={item}>
          <Card className="border-0 shadow-card rounded-2xl">
            <CardContent className="p-6 lg:p-8">
              <div className="flex items-center gap-2 mb-4">
                <Hash className="w-5 h-5 text-[#4F46E5]" />
                <h3 className="font-display text-lg font-semibold text-[#0A0A0A]">
                  Suggested Hashtags
                </h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {profile.suggested_hashtags.map((tag, i) => (
                  <button
                    key={i}
                    onClick={() => copyHashtag(tag)}
                    className="group inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[rgba(79,70,229,0.08)] text-[#4F46E5] text-sm font-medium hover:bg-[rgba(79,70,229,0.15)] transition-colors cursor-pointer"
                  >
                    {tag}
                    {copiedHashtag === tag ? (
                      <Check className="w-3 h-3" />
                    ) : (
                      <Copy className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                    )}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Brand Personality */}
      {profile.brand_personality && profile.brand_personality.length > 0 && (
        <motion.div variants={item}>
          <Card className="border-0 shadow-card rounded-2xl">
            <CardContent className="p-6 lg:p-8">
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="w-5 h-5 text-[#4F46E5]" />
                <h3 className="font-display text-lg font-semibold text-[#0A0A0A]">
                  Brand Personality
                </h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {profile.brand_personality.map((trait, i) => (
                  <Badge
                    key={i}
                    className="bg-[rgba(79,70,229,0.08)] text-[#4F46E5] hover:bg-[rgba(79,70,229,0.15)] border-0 rounded-lg px-4 py-1.5 text-sm font-medium"
                  >
                    {trait}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </motion.div>
  );
}
