import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function PATCH(request: NextRequest) {
  try {
    const { calendar_item_id, org_id, action, rejection_reason, scheduled_post_time } =
      await request.json();

    if (!calendar_item_id || !org_id || !action) {
      return NextResponse.json(
        { error: "calendar_item_id, org_id, and action required" },
        { status: 400 }
      );
    }

    if (action === "approve") {
      const { error } = await supabase
        .from("content_calendar")
        .update({
          status: "approved",
          approved_at: new Date().toISOString(),
          scheduled_post_time: scheduled_post_time || null,
        })
        .eq("id", calendar_item_id)
        .eq("org_id", org_id);

      if (error) {
        return NextResponse.json({ error: "Failed to approve post" }, { status: 500 });
      }

      // TODO: Add to BullMQ posting queue when Redis is configured
      // if (process.env.REDIS_URL) {
      //   const { postingQueue } = await import("@/lib/queue");
      //   await postingQueue.add("post", { calendar_item_id, org_id }, {
      //     delay: scheduled_post_time ? new Date(scheduled_post_time).getTime() - Date.now() : 0,
      //   });
      // }

      return NextResponse.json({ status: "approved" });
    }

    if (action === "reject") {
      const { error } = await supabase
        .from("content_calendar")
        .update({
          status: "rejected",
          rejection_reason: rejection_reason || null,
        })
        .eq("id", calendar_item_id)
        .eq("org_id", org_id);

      if (error) {
        return NextResponse.json({ error: "Failed to reject post" }, { status: 500 });
      }

      return NextResponse.json({ status: "rejected" });
    }

    if (action === "send_back") {
      const { error } = await supabase
        .from("content_calendar")
        .update({
          status: "scheduled",
          rejection_reason: null,
          generated_caption: null,
          generated_image_url: null,
          generated_hashtags: [],
        })
        .eq("id", calendar_item_id)
        .eq("org_id", org_id);

      if (error) {
        return NextResponse.json({ error: "Failed to send back" }, { status: 500 });
      }

      return NextResponse.json({ status: "scheduled" });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Approve post error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
