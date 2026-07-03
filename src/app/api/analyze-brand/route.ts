import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { scrapeWebsite } from "@/lib/scraper";
import { fetchAllSocialData } from "@/lib/social-apis";
import { analyzeBrandWithGemini } from "@/lib/gemini";

// Use service role client for server-side operations
function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { orgId } = body;

    if (!orgId) {
      return NextResponse.json(
        { error: "Organization ID is required" },
        { status: 400 }
      );
    }

    const supabase = getServiceClient();

    // Fetch organization data
    const { data: org, error: orgError } = await supabase
      .from("organizations")
      .select("*")
      .eq("id", orgId)
      .single();

    if (orgError || !org) {
      return NextResponse.json(
        { error: "Organization not found" },
        { status: 404 }
      );
    }

    // STEP 1 — Scrape Website
    const scrapedData = await scrapeWebsite(org.website_url);

    // STEP 2 — Fetch Social Media Data
    const socialData = await fetchAllSocialData({
      facebookUrl: org.facebook_url || undefined,
      youtubeUrl: org.youtube_url || undefined,
      instagramHandle: org.instagram_handle || undefined,
    });

    // Combine all data
    const allData = {
      website: scrapedData,
      social: socialData,
      organizationInfo: {
        name: org.name,
        industry: org.industry,
        targetAudience: org.target_audience_description,
      },
    };

    // STEP 3 — Analyze with Gemini AI
    const brandProfile = await analyzeBrandWithGemini(allData);

    // STEP 4 — Save Brand Profile
    const { error: saveError } = await supabase
      .from("brand_profiles")
      .upsert(
        {
          org_id: orgId,
          brand_voice: brandProfile.brand_voice,
          tone_of_voice: brandProfile.tone_of_voice,
          primary_colors: brandProfile.primary_colors,
          target_audience: brandProfile.target_audience,
          audience_age_range: brandProfile.audience_age_range,
          content_themes: brandProfile.content_themes,
          posting_style: brandProfile.posting_style,
          key_products_services: brandProfile.key_products_services,
          unique_selling_points: brandProfile.unique_selling_points,
          content_pillars: brandProfile.content_pillars,
          suggested_hashtags: brandProfile.suggested_hashtags,
          competitor_keywords: brandProfile.competitor_keywords,
          brand_personality: brandProfile.brand_personality,
          industry: brandProfile.industry,
          summary: brandProfile.summary,
          raw_scraped_data: allData,
          last_analyzed_at: new Date().toISOString(),
        },
        { onConflict: "org_id" }
      );

    if (saveError) {
      console.error("Failed to save brand profile:", saveError);
      return NextResponse.json(
        { error: "Failed to save brand profile" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Brand profile created successfully",
      profile: brandProfile,
    });
  } catch (error) {
    console.error("Brand analysis error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Brand analysis failed",
      },
      { status: 500 }
    );
  }
}
