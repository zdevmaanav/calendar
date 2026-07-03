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
    const category = searchParams.get("category");

    if (!orgId) {
      return NextResponse.json({ error: "org_id required" }, { status: 400 });
    }

    let query = supabase
      .from("assets")
      .select("*")
      .eq("org_id", orgId)
      .order("created_at", { ascending: false });

    if (category) {
      query = query.eq("category", category);
    }

    const { data, error: queryError } = await query;

    if (queryError) {
      return NextResponse.json({ error: "Failed to fetch assets" }, { status: 500 });
    }

    return NextResponse.json({ assets: data || [] });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { id, org_id } = await request.json();

    if (!id || !org_id) {
      return NextResponse.json({ error: "id and org_id required" }, { status: 400 });
    }

    // Get asset info first for storage cleanup
    const { data: asset } = await supabase
      .from("assets")
      .select("file_url")
      .eq("id", id)
      .eq("org_id", org_id)
      .single();

    // Delete from database
    const { error: deleteError } = await supabase
      .from("assets")
      .delete()
      .eq("id", id)
      .eq("org_id", org_id);

    if (deleteError) {
      return NextResponse.json({ error: "Failed to delete asset" }, { status: 500 });
    }

    // Attempt to clean up storage file
    if (asset?.file_url) {
      try {
        const urlPath = new URL(asset.file_url).pathname;
        const storagePath = urlPath.split("/object/public/brand-assets/")[1];
        if (storagePath) {
          await supabase.storage.from("brand-assets").remove([storagePath]);
        }
      } catch {
        // Storage cleanup is best-effort
      }
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { id, org_id, is_active_for_generation } = await request.json();

    if (!id || !org_id) {
      return NextResponse.json({ error: "id and org_id required" }, { status: 400 });
    }

    const { data, error: updateError } = await supabase
      .from("assets")
      .update({ is_active_for_generation })
      .eq("id", id)
      .eq("org_id", org_id)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json({ error: "Failed to update asset" }, { status: 500 });
    }

    return NextResponse.json({ asset: data });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
