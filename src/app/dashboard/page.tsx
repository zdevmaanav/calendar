"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import {
  Globe,
  CheckCircle2,
  XCircle,

  Calendar,
  TrendingUp,

  Sparkles,
  ArrowRight,
  Bot,
  FolderOpen,
} from "lucide-react";
import {
  IconInstagram as Instagram,
  IconFacebook as Facebook,
  IconYoutube as Youtube,
} from "@/components/icons";

interface BrandProfile {
  brand_voice: string;
  target_audience: string;
  content_pillars: string[];
  brand_personality: string[];
}

interface Organization {
  id: string;
  name: string;
  website_url: string;
  instagram_handle: string | null;
  facebook_url: string | null;
  youtube_url: string | null;
}

interface UpcomingPost {
  id: string;
  date: string;
  topic: string;
  platform: string;
  status: string;
  content_type: string;
}

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, type: "tween" as const } },
};

export default function DashboardPage() {
  const [userName, setUserName] = useState("");
  const [org, setOrg] = useState<Organization | null>(null);
  const [profile, setProfile] = useState<BrandProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [upcomingPosts, setUpcomingPosts] = useState<UpcomingPost[]>([]);
  const [postStats, setPostStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    posted: 0,
  });
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    async function fetchData() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const fullName =
          user.user_metadata?.full_name || user.email?.split("@")[0] || "User";
        setUserName(fullName);

        const { data: orgData } = await supabase
          .from("organizations")
          .select("*")
          .eq("user_id", user.id)
          .single();

        if (orgData) {
          setOrg(orgData);

          const { data: profileData } = await supabase
            .from("brand_profiles")
            .select("brand_voice, target_audience, content_pillars, brand_personality")
            .eq("org_id", orgData.id)
            .single();

          if (profileData) {
            setProfile(profileData);
          }

          // Fetch upcoming posts
          const today = new Date().toISOString().split("T")[0];
          const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
            .toISOString()
            .split("T")[0];

          const { data: upcoming } = await supabase
            .from("content_calendar")
            .select("id, date, topic, platform, status, content_type")
            .eq("org_id", orgData.id)
            .gte("date", today)
            .lte("date", nextWeek)
            .order("date", { ascending: true })
            .limit(5);

          setUpcomingPosts(upcoming || []);

          // Post stats
          const { count: total } = await supabase
            .from("content_calendar")
            .select("id", { count: "exact", head: true })
            .eq("org_id", orgData.id);

          const { count: pending } = await supabase
            .from("content_calendar")
            .select("id", { count: "exact", head: true })
            .eq("org_id", orgData.id)
            .eq("status", "pending_approval");

          const { count: approved } = await supabase
            .from("content_calendar")
            .select("id", { count: "exact", head: true })
            .eq("org_id", orgData.id)
            .eq("status", "approved");

          const { count: posted } = await supabase
            .from("content_calendar")
            .select("id", { count: "exact", head: true })
            .eq("org_id", orgData.id)
            .eq("status", "posted");

          setPostStats({
            total: total || 0,
            pending: pending || 0,
            approved: approved || 0,
            posted: posted || 0,
          });
        }
      }

      setLoading(false);
    }

    fetchData();
  }, [supabase]);

  const quickActions = [
    {
      title: "Content Calendar",
      description: "Plan & generate AI content",
      icon: <Calendar className="w-5 h-5" />,
      href: "/dashboard/calendar",
      color: "bg-[#0A0A0A]/[0.06] text-[#0A0A0A]",
    },
    {
      title: "Asset Library",
      description: "Upload brand assets",
      icon: <FolderOpen className="w-5 h-5" />,
      href: "/dashboard/assets",
      color: "bg-amber-50 text-amber-600",
    },
    {
      title: "View Analytics",
      description: "Track performance metrics",
      icon: <TrendingUp className="w-5 h-5" />,
      href: "/dashboard/analytics",
      color: "bg-emerald-50 text-emerald-600",
    },
    {
      title: "AI Suggestions",
      description: "Get AI content ideas",
      icon: <Bot className="w-5 h-5" />,
      href: "/dashboard/suggestions",
      color: "bg-[#0A0A0A]/[0.06] text-[#0A0A0A]",
    },
  ];

  const connections = [
    {
      name: "Website",
      icon: <Globe className="w-4 h-4" />,
      connected: !!org?.website_url,
    },
    {
      name: "Instagram",
      icon: <Instagram className="w-4 h-4" />,
      connected: !!org?.instagram_handle,
    },
    {
      name: "Facebook",
      icon: <Facebook className="w-4 h-4" />,
      connected: !!org?.facebook_url,
    },
    {
      name: "YouTube",
      icon: <Youtube className="w-4 h-4" />,
      connected: !!org?.youtube_url,
    },
  ];

  const chartData = [
    { name: "Scheduled", value: postStats.total - postStats.pending - postStats.approved - postStats.posted, fill: "rgba(79,70,229,0.3)" },
    { name: "Pending", value: postStats.pending, fill: "#F59E0B" },
    { name: "Approved", value: postStats.approved, fill: "#4F46E5" },
    { name: "Posted", value: postStats.posted, fill: "#10B981" },
  ].filter((d) => d.value > 0);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-32 rounded-2xl" />
        <Skeleton className="h-48 rounded-2xl" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-20 rounded-xl" />
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
      {/* Welcome Card */}
      <motion.div variants={item}>
        <Card className="border-0 shadow-card rounded-2xl overflow-hidden">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-[#0A0A0A]/[0.02] to-[#0A0A0A]/[0.01]" />
            <CardContent className="p-6 lg:p-8 relative">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="w-5 h-5 text-[#0A0A0A]" />
                    <span className="text-sm font-medium text-[#0A0A0A]">
                      Welcome back
                    </span>
                  </div>
                  <h1 className="font-display text-2xl lg:text-3xl font-bold text-[#0A0A0A] tracking-tight">
                    Welcome back, {userName}!
                  </h1>
                  <p className="text-[#0A0A0A]/50 mt-1.5 text-[0.9375rem]">
                    {profile
                      ? "Your brand profile is ready. Here's your overview."
                      : "Set up your organization to get AI-powered insights."}
                  </p>
                </div>
                {/* Quick Stats */}
                <div className="hidden md:flex items-center gap-6">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-[#0A0A0A]">{postStats.total}</p>
                    <p className="text-[10px] text-[#0A0A0A]/50 uppercase tracking-wider">Total Posts</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-amber-500">{postStats.pending}</p>
                    <p className="text-[10px] text-[#0A0A0A]/50 uppercase tracking-wider">Pending</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-emerald-500">{postStats.posted}</p>
                    <p className="text-[10px] text-[#0A0A0A]/50 uppercase tracking-wider">Posted</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </div>
        </Card>
      </motion.div>

      {/* Brand Profile Summary */}
      {profile && (
        <motion.div variants={item}>
          <Card className="border-0 shadow-card rounded-2xl">
            <CardContent className="p-6 lg:p-8">
              <h3 className="font-display text-lg font-semibold text-[#0A0A0A] mb-5">
                Brand Profile Summary
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-[#0A0A0A]/50 mb-2">
                    Brand Voice
                  </p>
                  <Badge className="bg-[rgba(0,0,0,0.05)] text-[#0A0A0A] hover:bg-[rgba(0,0,0,0.05)] font-medium px-3 py-1 rounded-lg border border-[rgba(0,0,0,0.08)]">
                    {profile.brand_voice}
                  </Badge>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-[#0A0A0A]/50 mb-2">
                    Target Audience
                  </p>
                  <p className="text-sm text-[#0A0A0A]/70 leading-relaxed line-clamp-2">
                    {profile.target_audience}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-[#0A0A0A]/50 mb-2">
                    Content Pillars
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {(profile.content_pillars || []).slice(0, 3).map((pillar, i) => (
                      <Badge
                        key={i}
                        variant="secondary"
                        className="bg-[#F5F5F3] text-[#0A0A0A]/70 hover:bg-[#F5F5F3] rounded-lg px-2.5 py-0.5 text-xs"
                      >
                        {pillar}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-[#0A0A0A]/50 mb-2">
                    Brand Personality
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {(profile.brand_personality || []).map((trait, i) => (
                      <Badge
                        key={i}
                        variant="outline"
                        className="border-[rgba(0,0,0,0.06)] text-[#0A0A0A]/70 rounded-lg px-2.5 py-0.5 text-xs"
                      >
                        {trait}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Connection Stats */}
      <motion.div variants={item}>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {connections.map((conn) => (
            <Card
              key={conn.name}
              className="border-0 shadow-card rounded-xl"
            >
              <CardContent className="p-4 flex items-center gap-3">
                <div
                  className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                    conn.connected
                      ? "bg-[#0A0A0A]/[0.06] text-[#0A0A0A]"
                      : "bg-[#F5F5F3] text-[#0A0A0A]/25"
                  }`}
                >
                  {conn.icon}
                </div>
                <div>
                  <p className="text-sm font-medium text-[#0A0A0A]">
                    {conn.name}
                  </p>
                  <div className="flex items-center gap-1 mt-0.5">
                    {conn.connected ? (
                      <>
                        <CheckCircle2 className="w-3 h-3 text-green-500" />
                        <span className="text-xs text-green-600">
                          Connected
                        </span>
                      </>
                    ) : (
                      <>
                        <XCircle className="w-3 h-3 text-[#0A0A0A]/25" />
                        <span className="text-xs text-[#0A0A0A]/25">
                          Not Connected
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </motion.div>

      {/* Content Pipeline Chart */}
      <motion.div variants={item}>
        <Card className="border-0 shadow-card rounded-2xl">
          <CardContent className="p-6 lg:p-8">
            <h3 className="font-display text-lg font-semibold text-[#0A0A0A] mb-4">
              Content Pipeline
            </h3>
            <div className="h-[240px]">
              {mounted && chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" />
                    <XAxis
                      dataKey="name"
                      tick={{ fontSize: 12, fill: "rgba(0,0,0,0.5)" }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 12, fill: "rgba(0,0,0,0.5)" }}
                      axisLine={false}
                      tickLine={false}
                      allowDecimals={false}
                    />
                    <Tooltip
                      contentStyle={{
                        borderRadius: 12,
                        border: "none",
                        boxShadow: "0 4px 24px rgba(26,28,28,0.08)",
                      }}
                    />
                    <Bar
                      dataKey="value"
                      radius={[6, 6, 0, 0]}
                    >
                      {chartData.map((entry, index) => (
                        <Bar key={index} dataKey="value" fill={entry.fill} radius={[6, 6, 0, 0]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center">
                  <div className="text-center">
                    <Calendar className="w-8 h-8 text-[#0A0A0A]/25 mx-auto mb-2" />
                    <p className="text-sm text-[#0A0A0A]/50">No content created yet</p>
                    <p className="text-xs text-[#0A0A0A]/25 mt-1">
                      Generate a calendar to see your pipeline
                    </p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Upcoming Posts */}
      {upcomingPosts.length > 0 && (
        <motion.div variants={item}>
          <Card className="border-0 shadow-card rounded-2xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-display text-lg font-semibold text-[#0A0A0A]">
                  Upcoming Posts
                </h3>
                <button
                  onClick={() => router.push("/dashboard/calendar")}
                  className="text-xs text-[#0A0A0A] font-medium flex items-center gap-1 hover:underline"
                >
                  View Calendar <ArrowRight className="w-3 h-3" />
                </button>
              </div>
              <div className="space-y-2">
                {upcomingPosts.map((post) => (
                  <div
                    key={post.id}
                    className="flex items-center gap-3 p-3 rounded-xl hover:bg-[#FAFAF8] transition-colors cursor-pointer"
                    onClick={() => router.push("/dashboard/calendar")}
                  >
                    <div className="text-center min-w-[40px]">
                      <p className="text-lg font-bold text-[#0A0A0A]">
                        {new Date(post.date).getDate()}
                      </p>
                      <p className="text-[10px] text-[#0A0A0A]/50 uppercase">
                        {new Date(post.date).toLocaleDateString("en-US", { month: "short" })}
                      </p>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[#0A0A0A] truncate">{post.topic}</p>
                      <p className="text-[10px] text-[#0A0A0A]/50 capitalize">{post.platform} · {post.content_type}</p>
                    </div>
                    <Badge className="bg-[#F5F5F3] text-[#0A0A0A]/70 text-[10px] capitalize">
                      {post.status.replace("_", " ")}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Quick Actions */}
      <motion.div variants={item}>
        <h3 className="font-display text-lg font-semibold text-[#0A0A0A] mb-4">
          Quick Actions
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {quickActions.map((action) => (
            <Card
              key={action.title}
              className="border-0 shadow-card rounded-xl cursor-pointer card-interactive"
              onClick={() => router.push(action.href)}
            >
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className={`w-10 h-10 rounded-xl ${action.color} flex items-center justify-center`}>
                    {action.icon}
                  </div>
                  <ArrowRight className="w-4 h-4 text-[#0A0A0A]/25" />
                </div>
                <h4 className="text-sm font-semibold text-[#0A0A0A] mb-0.5">
                  {action.title}
                </h4>
                <p className="text-xs text-[#0A0A0A]/50">{action.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}
