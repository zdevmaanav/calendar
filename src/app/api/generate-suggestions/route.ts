import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const { org_id } = await request.json();

    if (!org_id) {
      return NextResponse.json({ error: "org_id required" }, { status: 400 });
    }

    // --- Current date context ---
    const today = new Date();
    const currentMonth = today.toLocaleString("en-US", { month: "long" });
    const currentYear = today.getFullYear();
    const currentMonthNumber = today.getMonth() + 1;
    const todayStr = today.toISOString().split("T")[0];

    // Get remaining days in current month
    const daysInMonth = new Date(currentYear, currentMonthNumber, 0).getDate();
    const remainingDays: string[] = [];

    for (let day = today.getDate(); day <= daysInMonth; day++) {
      const date = new Date(currentYear, currentMonthNumber - 1, day);
      const dateStr = date.toISOString().split("T")[0];
      remainingDays.push(dateStr);
    }

    const lastDayStr = remainingDays[remainingDays.length - 1];

    console.log("Current month:", currentMonth, currentYear);
    console.log("Remaining days this month:", remainingDays.length);

    // Fetch brand profile
    const { data: brandProfile } = await supabase
      .from("brand_profiles")
      .select("*")
      .eq("org_id", org_id)
      .single();

    if (!brandProfile) {
      return NextResponse.json({ error: "Brand profile not found" }, { status: 404 });
    }

    // Fetch recent analytics
    const { data: analytics } = await supabase
      .from("post_analytics")
      .select("platform, content_type, engagement_rate, reach")
      .eq("org_id", org_id)
      .order("created_at", { ascending: false })
      .limit(30);

    // Fetch upcoming calendar items for current month
    const { data: upcoming } = await supabase
      .from("content_calendar")
      .select("date, topic, content_type, platform")
      .eq("org_id", org_id)
      .gte("date", todayStr)
      .lte("date", lastDayStr);

    // Fetch posted content for content type analysis
    const { data: posted } = await supabase
      .from("content_calendar")
      .select("content_type, status")
      .eq("org_id", org_id)
      .eq("status", "posted");

    const contentTypePerformance: Record<string, number> = {};
    (posted || []).forEach((p) => {
      contentTypePerformance[p.content_type] = (contentTypePerformance[p.content_type] || 0) + 1;
    });

    const bestPerforming = Object.entries(contentTypePerformance)
      .sort(([, a], [, b]) => b - a)
      .map(([type]) => type);

    const scheduledTopics = (upcoming || []).map((u) => u.topic);

    const prompt = `You are a social media content strategist.
Today's date is: ${todayStr}
Current month: ${currentMonth} ${currentYear}

Generate 10 fresh content ideas for the REMAINING days of ${currentMonth} ${currentYear} only.
All suggested_date values MUST be between today (${todayStr}) and the last day of ${currentMonth} ${currentYear} (${lastDayStr}).

DO NOT suggest dates in future months like ${new Date(currentYear, currentMonthNumber, 1).toLocaleString("en-US", { month: "long" })}, ${new Date(currentYear, currentMonthNumber + 1, 1).toLocaleString("en-US", { month: "long" })} etc.
ONLY suggest dates within ${currentMonth} ${currentYear}.
Available dates to choose from: ${remainingDays.join(", ")}

Brand Profile:
${JSON.stringify({
  brand_voice: brandProfile.brand_voice,
  industry: brandProfile.industry,
  content_pillars: brandProfile.content_pillars,
  target_audience: brandProfile.target_audience,
  brand_personality: brandProfile.brand_personality,
}, null, 2)}

Performance insights:
- Total posts analyzed: ${(analytics || []).length}
- Best performing content types: ${bestPerforming.slice(0, 3).join(", ") || "Not enough data yet"}
- Already scheduled topics: ${scheduledTopics.join(", ") || "None"}

For each suggestion return a JSON object with:
{
  "topic": "specific post topic",
  "content_type": "educational|promotional|motivational|behind-the-scenes|festive|trending|product",
  "platform": "instagram|facebook|youtube|all",
  "reason": "why this will perform well based on their data",
  "suggested_date": "YYYY-MM-DD (must be in ${currentMonth} ${currentYear}, between ${todayStr} and ${lastDayStr})",
  "hook_idea": "opening hook for the caption",
  "visual_idea": "minimalist visual concept"
}

Return a JSON array of 10 suggestions.
Prioritize content types that performed best.
Avoid topics already scheduled.
Include at least 2 trending topic hooks relevant to their industry.

Return ONLY valid JSON array, no markdown.`;

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "GEMINI_API_KEY not configured" }, { status: 500 });
    }

    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.9, maxOutputTokens: 8192 },
        }),
      }
    );

    if (!geminiResponse.ok) {
      return NextResponse.json({ error: "AI generation failed" }, { status: 500 });
    }

    const geminiData = await geminiResponse.json();
    let text = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) {
      return NextResponse.json({ error: "AI returned empty response" }, { status: 500 });
    }

    text = text.trim();
    if (text.startsWith("```json")) text = text.slice(7);
    if (text.startsWith("```")) text = text.slice(3);
    if (text.endsWith("```")) text = text.slice(0, -3);
    text = text.trim();

    const parsedSuggestions = JSON.parse(text);

    // --- Validate and fix dates ---
    const currentMonthIndex = today.getMonth();
    const validatedSuggestions = parsedSuggestions.map(
      (suggestion: Record<string, unknown>, index: number) => {
        const suggestedDate = new Date(suggestion.suggested_date as string);

        // If date is not in current month or is in the past, fix it
        if (
          isNaN(suggestedDate.getTime()) ||
          suggestedDate.getMonth() !== currentMonthIndex ||
          suggestedDate.getFullYear() !== currentYear ||
          suggestedDate < new Date(todayStr + "T00:00:00")
        ) {
          // Assign a valid date from remaining days
          const dayIndex = index % remainingDays.length;
          suggestion.suggested_date = remainingDays[dayIndex];
          console.log(
            `Fixed date for suggestion ${index}: was ${suggestedDate.toISOString().split("T")[0]}, now ${suggestion.suggested_date}`
          );
        }

        return suggestion;
      }
    );

    // Clear old pending suggestions
    await supabase
      .from("ai_suggestions")
      .delete()
      .eq("org_id", org_id)
      .eq("status", "pending");

    // Save new suggestions
    const rows = validatedSuggestions.map((s: Record<string, unknown>) => ({
      org_id,
      topic: s.topic,
      content_type: s.content_type || "educational",
      platform: s.platform || "all",
      reason: s.reason || "",
      suggested_date: s.suggested_date || null,
      hook_idea: s.hook_idea || "",
      visual_idea: s.visual_idea || "",
      status: "pending",
    }));

    const { data, error } = await supabase
      .from("ai_suggestions")
      .insert(rows)
      .select();

    if (error) {
      console.error("Insert suggestions error:", error);
      return NextResponse.json({ error: "Failed to save suggestions" }, { status: 500 });
    }

    return NextResponse.json({ suggestions: data, count: data.length });
  } catch (error) {
    console.error("Generate suggestions error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
