import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function DELETE(req: NextRequest) {
  try {
    const { post_id, org_id } = await req.json();

    if (!post_id || !org_id) {
      return NextResponse.json(
        { error: "post_id and org_id are required" },
        { status: 400 }
      );
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // First, fetch the post to get the image URL before deleting
    const { data: post } = await supabase
      .from("content_calendar")
      .select("generated_image_url")
      .eq("id", post_id)
      .eq("org_id", org_id)
      .single();

    // Delete the post from content_calendar
    const { error } = await supabase
      .from("content_calendar")
      .delete()
      .eq("id", post_id)
      .eq("org_id", org_id);

    if (error) {
      console.error("[Delete Post] Database error:", error);
      return NextResponse.json(
        { error: "Failed to delete post" },
        { status: 500 }
      );
    }

    // Also delete the image from storage if it exists
    if (post?.generated_image_url) {
      try {
        // Try extracting path from post-assets bucket
        const postAssetsMatch = post.generated_image_url.match(
          /post-assets\/(.+)/
        );
        if (postAssetsMatch) {
          await supabase.storage
            .from("post-assets")
            .remove([postAssetsMatch[1]]);
        }

        // Also try assets bucket
        const assetsMatch = post.generated_image_url.match(/assets\/(.+)/);
        if (assetsMatch && !postAssetsMatch) {
          await supabase.storage.from("assets").remove([assetsMatch[1]]);
        }
      } catch (storageErr) {
        // Don't fail the request if image cleanup fails
        console.error("[Delete Post] Storage cleanup error:", storageErr);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Delete Post] Unexpected error:", error);
    return NextResponse.json(
      { error: "Failed to delete post" },
      { status: 500 }
    );
  }
}
