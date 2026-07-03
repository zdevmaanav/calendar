import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const CALENDAR_PROMPT = `You are a social media content strategist. Based on the following brand profile, generate a 30-day content calendar as a JSON array. For each day that should have a post (not every day needs one — aim for 4-5 posts per week), return an object with:
{
  date: 'YYYY-MM-DD',
  platform: 'instagram' | 'facebook' | 'youtube' | 'all',
  content_type: 'educational' | 'promotional' | 'motivational' | 'behind-the-scenes' | 'festive' | 'trending' | 'product',
  topic: string (specific post topic),
  caption_direction: string (brief direction for caption writer),
  visual_direction: string (brief direction for image generator),
  occasion: string | null (festival, event, awareness day if applicable),
  priority: 'high' | 'medium' | 'low'
}

Consider:
- National and international holidays and festivals for the month
- Industry-specific awareness days relevant to this brand
- Weekly content themes (educational Mondays, motivational Fridays, etc.)
- The brand's content pillars from their profile
- Optimal posting frequency for their industry
- Variety in content types — no two same types back to back

Return ONLY valid JSON array, no markdown formatting or code blocks.`;

export async function POST(request: NextRequest) {
  try {
    const { org_id, year, month } = await request.json();

    if (!org_id) {
      return NextResponse.json({ error: "org_id is required" }, { status: 400 });
    }

    // Fetch brand profile
    const { data: brandProfile, error: profileError } = await supabase
      .from("brand_profiles")
      .select("*")
      .eq("org_id", org_id)
      .single();

    if (profileError || !brandProfile) {
      return NextResponse.json(
        { error: "Brand profile not found. Please complete brand analysis first." },
        { status: 404 }
      );
    }

    // Build date range
    const targetYear = year || new Date().getFullYear();
    const targetMonth = month || new Date().getMonth() + 1;
    const startDate = new Date(targetYear, targetMonth - 1, 1);
    const endDate = new Date(targetYear, targetMonth, 0);

    const monthName = startDate.toLocaleString("default", { month: "long" });

    const prompt = `${CALENDAR_PROMPT}

Brand Profile:
${JSON.stringify(brandProfile, null, 2)}

Generate calendar for: ${monthName} ${targetYear}
Date range: ${startDate.toISOString().split("T")[0]} to ${endDate.toISOString().split("T")[0]}`;

    // Call Gemini API
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
          generationConfig: {
            temperature: 0.8,
            maxOutputTokens: 8192,
          },
        }),
      }
    );

    if (!geminiResponse.ok) {
      const errorData = await geminiResponse.json().catch(() => ({}));
      console.error("Gemini API error:", errorData);
      return NextResponse.json({ error: "AI generation failed" }, { status: 500 });
    }

    const geminiData = await geminiResponse.json();
    let text = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) {
      return NextResponse.json({ error: "AI returned empty response" }, { status: 500 });
    }

    // Clean response
    text = text.trim();
    if (text.startsWith("```json")) text = text.slice(7);
    if (text.startsWith("```")) text = text.slice(3);
    if (text.endsWith("```")) text = text.slice(0, -3);
    text = text.trim();

    const calendarItems = JSON.parse(text);

    if (!Array.isArray(calendarItems)) {
      return NextResponse.json({ error: "AI returned invalid format" }, { status: 500 });
    }

    // Delete existing calendar for this month
    await supabase
      .from("content_calendar")
      .delete()
      .eq("org_id", org_id)
      .gte("date", startDate.toISOString().split("T")[0])
      .lte("date", endDate.toISOString().split("T")[0]);

    // Insert new calendar items
    const rows = calendarItems.map((item: Record<string, unknown>) => ({
      org_id,
      date: item.date,
      platform: item.platform || "all",
      content_type: item.content_type || "educational",
      topic: item.topic || "Untitled Post",
      caption_direction: item.caption_direction || "",
      visual_direction: item.visual_direction || "",
      occasion: item.occasion || null,
      priority: item.priority || "medium",
      status: "scheduled",
      is_edited_by_user: false,
      use_assets: false,
    }));

    const { data, error: insertError } = await supabase
      .from("content_calendar")
      .insert(rows)
      .select();

    if (insertError) {
      console.error("Supabase insert error:", insertError);
      return NextResponse.json({ error: "Failed to save calendar" }, { status: 500 });
    }

    return NextResponse.json({ calendar: data, count: data.length });
  } catch (error) {
    console.error("Generate calendar error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
