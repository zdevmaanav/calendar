import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const orgId = formData.get("org_id") as string;
    const category = formData.get("category") as string; // 'brand' or 'post_ready'

    if (!file || !orgId || !category) {
      return NextResponse.json({ error: "file, org_id, and category required" }, { status: 400 });
    }

    // Validate file type
    const validImageTypes = ["image/jpeg", "image/png", "image/webp"];
    const validVideoTypes = ["video/mp4", "video/quicktime"];
    const isImage = validImageTypes.includes(file.type);
    const isVideo = validVideoTypes.includes(file.type);

    if (!isImage && !isVideo) {
      return NextResponse.json({ error: "Unsupported file type. Use JPG, PNG, WebP, MP4, or MOV." }, { status: 400 });
    }

    // Upload to Supabase Storage
    const fileName = `${category}/${orgId}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`;
    const buffer = Buffer.from(await file.arrayBuffer());

    // Ensure bucket exists
    try {
      await supabase.storage.createBucket("brand-assets", { public: true });
    } catch {
      // Bucket may already exist
    }

    const { error: uploadError } = await supabase.storage
      .from("brand-assets")
      .upload(fileName, buffer, {
        contentType: file.type,
        upsert: true,
      });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      return NextResponse.json({ error: "Failed to upload file" }, { status: 500 });
    }

    // Get public URL
    const { data: publicUrlData } = supabase.storage
      .from("brand-assets")
      .getPublicUrl(fileName);

    // Save metadata
    const { data, error: insertError } = await supabase
      .from("assets")
      .insert({
        org_id: orgId,
        category,
        file_url: publicUrlData.publicUrl,
        thumbnail_url: isImage ? publicUrlData.publicUrl : null,
        file_type: isImage ? "image" : "video",
        filename: file.name,
        file_size: file.size,
        is_active_for_generation: false,
      })
      .select()
      .single();

    if (insertError) {
      console.error("Insert error:", insertError);
      return NextResponse.json({ error: "Failed to save asset metadata" }, { status: 500 });
    }

    return NextResponse.json({ asset: data });
  } catch (error) {
    console.error("Upload asset error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
