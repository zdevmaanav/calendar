"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

import { Skeleton } from "@/components/ui/skeleton";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,

} from "recharts";
import {
  TrendingUp,
  Eye,
  Users,
  Heart,
  RefreshCw,
  BarChart3,
  Image as ImageIcon,
} from "lucide-react";

interface AnalyticsData {
  overview: {
    totalPosts: number;
    totalReach: number;
    totalImpressions: number;
    avgEngagement: number;
  };
  contentTypeStats: Record<string, number>;
  posts: Array<{
    id: string;
    date: string;
    platform: string;
    content_type: string;
    topic: string;
    generated_image_url: string | null;
  }>;
  topPost: {
    reach: number;
    impressions: number;
    engagement_rate: number;
    calendar_item_id: string;
  } | null;
}

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
};

const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

const PIE_COLORS = ["#4F46E5", "#E1306C", "#1877F2", "#FF6D00", "#10B981", "#F59E0B", "#8B5CF6"];



export default function AnalyticsPage() {
  const supabase = createClient();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const fetchData = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: org } = await supabase
      .from("organizations")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (!org) return;

    const res = await fetch(`/api/analytics?org_id=${org.id}`);
    const analytics = await res.json();
    setData(analytics);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  // Build chart data
  const pieData = data
    ? Object.entries(data.contentTypeStats).map(([name, value]) => ({
        name: name.charAt(0).toUpperCase() + name.slice(1).replace("-", " "),
        value,
      }))
    : [];

  const barData = data
    ? Object.entries(data.contentTypeStats).map(([type, count]) => ({
        type: type.charAt(0).toUpperCase() + type.slice(1).replace("-", " "),
        posts: count,
      }))
    : [];

  // Build timeline data from posts
  const timelineData = data
    ? (() => {
        const byDate: Record<string, number> = {};
        data.posts.forEach((p) => {
          const d = new Date(p.date).toLocaleDateString("en-US", { month: "short", day: "numeric" });
          byDate[d] = (byDate[d] || 0) + 1;
        });
        return Object.entries(byDate).map(([date, count]) => ({ date, posts: count }));
      })()
    : [];

  const statCards = data
    ? [
        {
          label: "Total Posts",
          value: data.overview.totalPosts,
          icon: <BarChart3 className="w-5 h-5" />,
          color: "text-[#4F46E5]",
          bg: "bg-[#0A0A0A]/[0.06]",
        },
        {
          label: "Total Reach",
          value: data.overview.totalReach.toLocaleString(),
          icon: <Users className="w-5 h-5" />,
          color: "text-emerald-600",
          bg: "bg-emerald-50",
        },
        {
          label: "Total Impressions",
          value: data.overview.totalImpressions.toLocaleString(),
          icon: <Eye className="w-5 h-5" />,
          color: "text-blue-600",
          bg: "bg-blue-50",
        },
        {
          label: "Avg Engagement",
          value: `${data.overview.avgEngagement}%`,
          icon: <Heart className="w-5 h-5" />,
          color: "text-rose-600",
          bg: "bg-rose-50",
        },
      ]
    : [];

  if (loading) {
    return (
      <div className="space-y-6 max-w-[1200px]">
        <Skeleton className="h-8 w-48 rounded-xl" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-24 rounded-2xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Skeleton className="h-80 rounded-2xl" />
          <Skeleton className="h-80 rounded-2xl" />
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
      <motion.div variants={item} className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-[#0A0A0A] tracking-tight">
            Analytics
          </h1>
          <p className="text-sm text-[#0A0A0A]/50 mt-0.5">
            Track your content performance across platforms
          </p>
        </div>
        <Button
          variant="outline"
          onClick={handleRefresh}
          disabled={refreshing}
          className="rounded-xl border-[rgba(0,0,0,0.08)]"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </motion.div>

      {/* Stats Row */}
      <motion.div variants={item} className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat) => (
          <Card key={stat.label} className="border-0 shadow-card rounded-2xl">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <div className={`w-10 h-10 rounded-xl ${stat.bg} flex items-center justify-center ${stat.color}`}>
                  {stat.icon}
                </div>
              </div>
              <p className="text-2xl font-bold text-[#0A0A0A]">{stat.value}</p>
              <p className="text-xs text-[#0A0A0A]/50 mt-0.5">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </motion.div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Content Type Bar Chart */}
        <motion.div variants={item}>
          <Card className="border-0 shadow-card rounded-2xl">
            <CardContent className="p-6">
              <h3 className="font-display text-lg font-semibold text-[#0A0A0A] mb-4">
                Posts by Content Type
              </h3>
              <div className="h-[260px]">
                {mounted && barData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={barData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
                      <XAxis dataKey="type" tick={{ fontSize: 10, fill: "#0A0A0A" }} axisLine={false} tickLine={false} angle={-20} textAnchor="end" height={60} />
                      <YAxis tick={{ fontSize: 12, fill: "#0A0A0A" }} axisLine={false} tickLine={false} allowDecimals={false} />
                      <Tooltip contentStyle={{ borderRadius: 12, border: "none", boxShadow: "0 4px 24px rgba(26,28,28,0.08)" }} />
                      <Bar dataKey="posts" fill="#4F46E5" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center">
                    <p className="text-sm text-[#0A0A0A]/50">No data yet — start posting!</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Content Type Pie Chart */}
        <motion.div variants={item}>
          <Card className="border-0 shadow-card rounded-2xl">
            <CardContent className="p-6">
              <h3 className="font-display text-lg font-semibold text-[#0A0A0A] mb-4">
                Content Distribution
              </h3>
              <div className="h-[260px]">
                {mounted && pieData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                        labelLine={false}
                      >
                        {pieData.map((_, index) => (
                          <Cell key={index} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ borderRadius: 12, border: "none", boxShadow: "0 4px 24px rgba(26,28,28,0.08)" }} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center">
                    <p className="text-sm text-[#0A0A0A]/50">No data yet</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Posting Timeline */}
      <motion.div variants={item}>
        <Card className="border-0 shadow-card rounded-2xl">
          <CardContent className="p-6">
            <h3 className="font-display text-lg font-semibold text-[#0A0A0A] mb-4">
              Posting Timeline
            </h3>
            <div className="h-[240px]">
              {mounted && timelineData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={timelineData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
                    <XAxis dataKey="date" tick={{ fontSize: 12, fill: "#0A0A0A" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 12, fill: "#0A0A0A" }} axisLine={false} tickLine={false} allowDecimals={false} />
                    <Tooltip contentStyle={{ borderRadius: 12, border: "none", boxShadow: "0 4px 24px rgba(26,28,28,0.08)" }} />
                    <Line type="monotone" dataKey="posts" stroke="#4F46E5" strokeWidth={2} dot={{ fill: "#4F46E5", r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center">
                  <p className="text-sm text-[#0A0A0A]/50">No posting data yet</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Top/Worst Performing Post */}
      {data?.topPost && (
        <motion.div variants={item} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="border-0 shadow-card rounded-2xl">
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="w-5 h-5 text-emerald-600" />
                <h3 className="text-sm font-semibold text-[#0A0A0A]">Top Performing Post</h3>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-xl bg-[#F5F5F3] flex items-center justify-center">
                  <ImageIcon className="w-6 h-6 text-[#0A0A0A]/25" />
                </div>
                <div>
                  <p className="text-xs text-[#0A0A0A]/50">Engagement Rate</p>
                  <p className="text-xl font-bold text-emerald-600">{data.topPost.engagement_rate}%</p>
                  <p className="text-[10px] text-[#0A0A0A]/50">
                    {data.topPost.reach} reach · {data.topPost.impressions} impressions
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </motion.div>
  );
}
