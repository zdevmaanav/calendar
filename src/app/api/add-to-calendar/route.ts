import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const { suggestion_id, org_id } = await request.json();

    if (!suggestion_id || !org_id) {
      return NextResponse.json({ error: "suggestion_id and org_id required" }, { status: 400 });
    }

    // Fetch suggestion
    const { data: suggestion } = await supabase
      .from("ai_suggestions")
      .select("*")
      .eq("id", suggestion_id)
      .eq("org_id", org_id)
      .single();

    if (!suggestion) {
      return NextResponse.json({ error: "Suggestion not found" }, { status: 404 });
    }

    // Create calendar entry
    const { data: calendarItem, error: insertError } = await supabase
      .from("content_calendar")
      .insert({
        org_id,
        date: suggestion.suggested_date || new Date().toISOString().split("T")[0],
        platform: suggestion.platform || "all",
        content_type: suggestion.content_type || "educational",
        topic: suggestion.topic,
        caption_direction: suggestion.hook_idea || "",
        visual_direction: suggestion.visual_idea || "",
        occasion: null,
        priority: "medium",
        status: "scheduled",
        is_edited_by_user: false,
        use_assets: false,
      })
      .select()
      .single();

    if (insertError) {
      console.error("Insert calendar error:", insertError);
      return NextResponse.json({ error: "Failed to add to calendar" }, { status: 500 });
    }

    // Update suggestion status
    await supabase
      .from("ai_suggestions")
      .update({ status: "added_to_calendar" })
      .eq("id", suggestion_id);

    return NextResponse.json({ calendar_item: calendarItem });
  } catch (error) {
    console.error("Add to calendar error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
