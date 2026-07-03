"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
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
  Legend,
} from "recharts";
import {
  Globe,
  CheckCircle2,
  XCircle,
  Calendar,

  Eye,
} from "lucide-react";
import {
  IconInstagram,
  IconFacebook,
  IconYoutube,
} from "@/components/icons";

interface Organization {
  instagram_handle: string | null;
  facebook_url: string | null;
  youtube_url: string | null;
}

interface CalendarItem {
  id: string;
  date: string;
  platform: string;
  topic: string;
  status: string;
  generated_image_url: string | null;
}

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
};

const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};



export default function SocialDashboardPage() {
  const supabase = createClient();
  const [org, setOrg] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [upcomingPosts, setUpcomingPosts] = useState<CalendarItem[]>([]);
  const [recentPosts, setRecentPosts] = useState<CalendarItem[]>([]);
  const [postingData, setPostingData] = useState<Record<string, unknown>[]>([]);

  useEffect(() => {
    setMounted(true);
  }, []);

  const fetchData = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: orgData } = await supabase
      .from("organizations")
      .select("id, instagram_handle, facebook_url, youtube_url")
      .eq("user_id", user.id)
      .single();

    if (!orgData) return;
    setOrg(orgData);

    const today = new Date().toISOString().split("T")[0];
    const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

    // Upcoming posts
    const { data: upcoming } = await supabase
      .from("content_calendar")
      .select("id, date, platform, topic, status, generated_image_url")
      .eq("org_id", orgData.id)
      .gte("date", today)
      .lte("date", nextWeek)
      .in("status", ["approved", "scheduled", "caption_generated", "image_generated", "pending_approval"])
      .order("date", { ascending: true })
      .limit(7);

    setUpcomingPosts(upcoming || []);

    // Recent posts
    const { data: recent } = await supabase
      .from("content_calendar")
      .select("id, date, platform, topic, status, generated_image_url")
      .eq("org_id", orgData.id)
      .eq("status", "posted")
      .order("posted_at", { ascending: false })
      .limit(10);

    setRecentPosts(recent || []);

    // Build posting frequency data
    const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    const { data: allPosts } = await supabase
      .from("content_calendar")
      .select("date, platform")
      .eq("org_id", orgData.id)
      .in("status", ["posted", "approved"]);

    const freq = days.map((day, i) => {
      const dayPosts = (allPosts || []).filter((p) => {
        const d = new Date(p.date).getDay();
        return d === (i + 1) % 7;
      });
      return {
        day,
        Instagram: dayPosts.filter((p) => p.platform === "instagram" || p.platform === "all").length,
        Facebook: dayPosts.filter((p) => p.platform === "facebook" || p.platform === "all").length,
        YouTube: dayPosts.filter((p) => p.platform === "youtube" || p.platform === "all").length,
      };
    });
    setPostingData(freq);

    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const platforms = [
    {
      name: "Instagram",
      icon: <IconInstagram className="w-5 h-5" />,
      connected: !!org?.instagram_handle,
      color: "from-[#E1306C]/10 to-[#F77737]/10",
      accentColor: "#E1306C",
    },
    {
      name: "Facebook",
      icon: <IconFacebook className="w-5 h-5" />,
      connected: !!org?.facebook_url,
      color: "from-[#1877F2]/10 to-[#42B72A]/10",
      accentColor: "#1877F2",
    },
    {
      name: "YouTube",
      icon: <IconYoutube className="w-5 h-5" />,
      connected: !!org?.youtube_url,
      color: "from-[#FF0000]/10 to-[#FF6D00]/10",
      accentColor: "#FF0000",
    },
  ];

  const STATUS_BADGE: Record<string, { text: string; color: string }> = {
    approved: { text: "Approved", color: "bg-emerald-100 text-emerald-700" },
    scheduled: { text: "Scheduled", color: "bg-gray-100 text-gray-600" },
    caption_generated: { text: "Caption Ready", color: "bg-blue-100 text-blue-700" },
    image_generated: { text: "Image Ready", color: "bg-[rgba(79,70,229,0.08)] text-[#4F46E5]" },
    pending_approval: { text: "Pending", color: "bg-amber-100 text-amber-700" },
    posted: { text: "Posted", color: "bg-green-100 text-green-700" },
  };

  if (loading) {
    return (
      <div className="space-y-6 max-w-[1200px]">
        <Skeleton className="h-8 w-48 rounded-xl" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32 rounded-2xl" />
          ))}
        </div>
        <Skeleton className="h-64 rounded-2xl" />
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
      <motion.div variants={item}>
        <h1 className="font-display text-2xl font-bold text-[#0A0A0A] tracking-tight">
          Social Dashboard
        </h1>
        <p className="text-sm text-[#0A0A0A]/50 mt-0.5">
          Overview of your connected platforms and posting activity
        </p>
      </motion.div>

      {/* Platform Cards */}
      <motion.div variants={item} className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {platforms.map((platform) => (
          <Card key={platform.name} className="border-0 shadow-card rounded-2xl overflow-hidden">
            <CardContent className="p-0">
              <div className={`p-5 bg-gradient-to-br ${platform.color}`}>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-10 rounded-xl bg-white/80 flex items-center justify-center" style={{ color: platform.accentColor }}>
                    {platform.icon}
                  </div>
                  {platform.connected ? (
                    <Badge className="bg-emerald-100 text-emerald-700 text-[10px]">
                      <CheckCircle2 className="w-3 h-3 mr-1" />
                      Connected
                    </Badge>
                  ) : (
                    <Badge className="bg-gray-100 text-gray-500 text-[10px]">
                      <XCircle className="w-3 h-3 mr-1" />
                      Disconnected
                    </Badge>
                  )}
                </div>
                <h3 className="text-lg font-semibold text-[#0A0A0A]">{platform.name}</h3>
                <div className="flex items-center gap-4 mt-2">
                  <div>
                    <p className="text-[10px] text-[#0A0A0A]/50 uppercase tracking-wider">Posts this month</p>
                    <p className="text-lg font-bold text-[#0A0A0A]">
                      {recentPosts.filter(
                        (p) => p.platform === platform.name.toLowerCase() || p.platform === "all"
                      ).length}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </motion.div>

      {/* Posting Frequency Chart */}
      <motion.div variants={item}>
        <Card className="border-0 shadow-card rounded-2xl">
          <CardContent className="p-6">
            <h3 className="font-display text-lg font-semibold text-[#0A0A0A] mb-4">
              Posting Frequency
            </h3>
            <div className="h-[280px]">
              {mounted && (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={postingData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
                    <XAxis dataKey="day" tick={{ fontSize: 12, fill: "#0A0A0A" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 12, fill: "#0A0A0A" }} axisLine={false} tickLine={false} allowDecimals={false} />
                    <Tooltip
                      contentStyle={{
                        borderRadius: 12,
                        border: "none",
                        boxShadow: "0 4px 24px rgba(26,28,28,0.08)",
                      }}
                    />
                    <Legend />
                    <Bar dataKey="Instagram" fill="#E1306C" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Facebook" fill="#1877F2" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="YouTube" fill="#FF0000" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Upcoming Posts Timeline */}
      <motion.div variants={item}>
        <Card className="border-0 shadow-card rounded-2xl">
          <CardContent className="p-6">
            <h3 className="font-display text-lg font-semibold text-[#0A0A0A] mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-[#4F46E5]" />
              Upcoming Posts (Next 7 Days)
            </h3>
            {upcomingPosts.length === 0 ? (
              <div className="py-8 text-center">
                <Calendar className="w-8 h-8 text-[#0A0A0A]/25 mx-auto mb-2" />
                <p className="text-sm text-[#0A0A0A]/50">No upcoming posts scheduled</p>
              </div>
            ) : (
              <div className="space-y-2">
                {upcomingPosts.map((post) => {
                  const s = STATUS_BADGE[post.status] || STATUS_BADGE.scheduled;
                  return (
                    <div
                      key={post.id}
                      className="flex items-center gap-4 p-3 rounded-xl hover:bg-[#FAFAF8] transition-colors"
                    >
                      <div className="text-center min-w-[48px]">
                        <p className="text-[10px] text-[#0A0A0A]/50 uppercase">
                          {new Date(post.date).toLocaleDateString("en-US", { weekday: "short" })}
                        </p>
                        <p className="text-lg font-bold text-[#0A0A0A]">
                          {new Date(post.date).getDate()}
                        </p>
                      </div>
                      <div className="w-8 h-8 rounded-lg bg-[#F5F5F3] flex items-center justify-center text-[#0A0A0A]/50">
                        {post.platform === "instagram" && <IconInstagram className="w-4 h-4" />}
                        {post.platform === "facebook" && <IconFacebook className="w-4 h-4" />}
                        {post.platform === "youtube" && <IconYoutube className="w-4 h-4" />}
                        {post.platform === "all" && <Globe className="w-4 h-4" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[#0A0A0A] truncate">{post.topic}</p>
                        <p className="text-[10px] text-[#0A0A0A]/50 capitalize">{post.platform}</p>
                      </div>
                      <Badge className={`${s.color} text-[10px]`}>{s.text}</Badge>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Recent Posts Grid */}
      {recentPosts.length > 0 && (
        <motion.div variants={item}>
          <Card className="border-0 shadow-card rounded-2xl">
            <CardContent className="p-6">
              <h3 className="font-display text-lg font-semibold text-[#0A0A0A] mb-4">
                Recent Posts
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                {recentPosts.map((post) => (
                  <div key={post.id} className="group">
                    <div className="aspect-square rounded-xl overflow-hidden bg-[#F5F5F3] relative">
                      {post.generated_image_url ? (
                        <img
                          src={post.generated_image_url}
                          alt={post.topic}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Eye className="w-6 h-6 text-[#0A0A0A]/25" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <p className="text-white text-xs font-medium text-center px-2">{post.topic}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 mt-1.5">
                      <span className="text-[10px] text-[#0A0A0A]/50">
                        {new Date(post.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </motion.div>
  );
}
