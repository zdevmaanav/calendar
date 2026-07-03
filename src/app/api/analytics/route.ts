import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const orgId = searchParams.get("org_id");

    if (!orgId) {
      return NextResponse.json({ error: "org_id required" }, { status: 400 });
    }

    // Get posted content this month
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const { data: calendarPosts } = await supabase
      .from("content_calendar")
      .select("id, date, platform, content_type, status, topic, generated_image_url, posted_at")
      .eq("org_id", orgId)
      .eq("status", "posted")
      .gte("posted_at", startOfMonth.toISOString());

    // Get analytics data
    const { data: analytics } = await supabase
      .from("post_analytics")
      .select("*")
      .eq("org_id", orgId)
      .order("created_at", { ascending: false });

    // Calculate overall stats
    const totalPosts = calendarPosts?.length || 0;
    const totalReach = (analytics || []).reduce((sum, a) => sum + (a.reach || 0), 0);
    const totalImpressions = (analytics || []).reduce((sum, a) => sum + (a.impressions || 0), 0);
    const avgEngagement =
      analytics && analytics.length > 0
        ? (analytics.reduce((sum, a) => sum + (a.engagement_rate || 0), 0) / analytics.length).toFixed(2)
        : "0";

    // Content type breakdown
    const contentTypeStats: Record<string, number> = {};
    (calendarPosts || []).forEach((post) => {
      contentTypeStats[post.content_type] = (contentTypeStats[post.content_type] || 0) + 1;
    });

    // Top performing post
    const topPost = (analytics || []).sort((a, b) => (b.engagement_rate || 0) - (a.engagement_rate || 0))[0];
    const worstPost = (analytics || []).sort((a, b) => (a.engagement_rate || 0) - (b.engagement_rate || 0))[0];

    return NextResponse.json({
      overview: {
        totalPosts,
        totalReach,
        totalImpressions,
        avgEngagement: parseFloat(avgEngagement as string),
      },
      contentTypeStats,
      analytics: analytics || [],
      posts: calendarPosts || [],
      topPost: topPost || null,
      worstPost: worstPost || null,
    });
  } catch (error) {
    console.error("Analytics error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
