import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Aspect ratio descriptions for the prompt
const ASPECT_RATIO_DESC: Record<string, string> = {
  "1:1": "square 1:1 aspect ratio",
  "9:16": "vertical 9:16 aspect ratio portrait",
  "16:9": "horizontal 16:9 aspect ratio landscape",
  "4:5": "vertical 4:5 aspect ratio portrait",
};

function buildMinimalistPrompt(
  brandProfile: Record<string, unknown>,
  calendarItem: Record<string, unknown>,
  aspectRatio: string
): string {
  const colors = Array.isArray(brandProfile.primary_colors)
    ? brandProfile.primary_colors.join(", ")
    : "professional blue and white";
  const personality = Array.isArray(brandProfile.brand_personality)
    ? brandProfile.brand_personality.join(", ")
    : "professional, modern";

  return `Create a social media marketing image for ${calendarItem.platform}.
Aspect ratio: ${ASPECT_RATIO_DESC[aspectRatio] || "square"}.

Topic: ${calendarItem.topic}
Visual Direction: ${calendarItem.visual_direction || calendarItem.topic}
Content Type: ${calendarItem.content_type}

Brand Style:
- Brand colors: ${colors}
- Brand personality: ${personality}
- Industry: ${brandProfile.industry || "general"}

Design Requirements:
- Clean, minimal composition with generous negative space
- Single focal point, uncluttered background
- Typography-forward design if text is needed
- No busy patterns, no collages, no image overload
- Professional, editorial aesthetic
- Flat or very subtle gradient background
- High quality, ready for social media posting

Generate a high quality marketing image now.`;
}

function buildAssetBasedPrompt(
  brandProfile: Record<string, unknown>,
  calendarItem: Record<string, unknown>,
  assets: Record<string, unknown>[],
  aspectRatio: string
): string {
  const assetDescriptions = assets
    .map((a) => `Reference asset: ${a.filename}`)
    .join("\n");
  const colors = Array.isArray(brandProfile.primary_colors)
    ? brandProfile.primary_colors.join(", ")
    : "professional blue and white";

  return `Create a social media marketing image for ${calendarItem.platform}.
Aspect ratio: ${ASPECT_RATIO_DESC[aspectRatio] || "square"}.

Topic: ${calendarItem.topic}
Visual Direction: ${calendarItem.visual_direction || calendarItem.topic}
Content Type: ${calendarItem.content_type}

Brand assets to incorporate: ${assetDescriptions}
Brand colors: ${colors}.
Professional quality, cohesive brand look.

Generate a high quality marketing image now.`;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { calendar_item_id, org_id, aspect_ratio, use_assets } = body;
    console.log("[generate-image] Request received:", { calendar_item_id, org_id, aspect_ratio, use_assets });

    if (!calendar_item_id || !org_id) {
      return NextResponse.json(
        { error: "Missing calendar_item_id or org_id" },
        { status: 400 }
      );
    }

    // Check API key
    const apiKey = process.env.GEMINI_API_KEY;
    console.log("[generate-image] API Key exists:", !!apiKey);
    if (!apiKey) {
      return NextResponse.json(
        { error: "GEMINI_API_KEY not set in environment variables" },
        { status: 500 }
      );
    }

    // Fetch brand profile
    const { data: brandProfile, error: bpError } = await supabase
      .from("brand_profiles")
      .select("*")
      .eq("org_id", org_id)
      .single();

    if (bpError) console.error("[generate-image] Brand profile fetch error:", bpError);
    if (!brandProfile) {
      return NextResponse.json(
        { error: "Brand profile not found. Complete your Brand Profile setup first." },
        { status: 404 }
      );
    }
    console.log("[generate-image] Brand profile loaded:", brandProfile.id);

    // Fetch calendar item
    const { data: calendarItem, error: ciError } = await supabase
      .from("content_calendar")
      .select("*")
      .eq("id", calendar_item_id)
      .single();

    if (ciError) console.error("[generate-image] Calendar item fetch error:", ciError);
    if (!calendarItem) {
      return NextResponse.json(
        { error: "Calendar item not found" },
        { status: 404 }
      );
    }
    console.log("[generate-image] Calendar item loaded:", calendarItem.topic);

    // Build prompt
    const selectedAspectRatio = aspect_ratio || "1:1";
    let imagePrompt: string;

    if (use_assets) {
      const { data: postReadyAssets } = await supabase
        .from("assets")
        .select("*")
        .eq("org_id", org_id)
        .eq("category", "post_ready")
        .eq("is_active_for_generation", true);

      imagePrompt = buildAssetBasedPrompt(
        brandProfile,
        calendarItem,
        postReadyAssets || [],
        selectedAspectRatio
      );
    } else {
      imagePrompt = buildMinimalistPrompt(brandProfile, calendarItem, selectedAspectRatio);
    }

    console.log("[generate-image] Prompt built, length:", imagePrompt.length);

    // ─── Call Gemini Image Generation API (Nano Banana 2) ───
    const aspectRatioMap: Record<string, string> = {
      "1:1": "1:1",
      "9:16": "9:16",
      "16:9": "16:9",
      "4:5": "4:5",
    };

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-image-preview:generateContent?key=${apiKey}`;
    console.log("[generate-image] Calling Gemini API: gemini-3.1-flash-image-preview");

    const payload = {
      contents: [
        {
          parts: [
            {
              text: imagePrompt,
            },
          ],
        },
      ],
      generationConfig: {
        responseModalities: ["TEXT", "IMAGE"],
        imageConfig: {
          image_size: "1K",
          aspect_ratio: aspectRatioMap[selectedAspectRatio] || "1:1",
        },
      },
    };

    const geminiResponse = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const responseData = await geminiResponse.json();

    if (!geminiResponse.ok) {
      console.error("[generate-image] Gemini API error:", JSON.stringify(responseData, null, 2));
      return NextResponse.json(
        {
          error: responseData.error?.message || "Image generation failed",
          code: responseData.error?.code,
        },
        { status: 500 }
      );
    }

    console.log("[generate-image] Gemini response status:", geminiResponse.status);

    // ─── Extract image from response ───
    const parts = responseData.candidates?.[0]?.content?.parts;
    if (!parts) {
      console.error("[generate-image] No content parts in response:", JSON.stringify(responseData, null, 2));
      return NextResponse.json(
        { error: "No content returned from Gemini" },
        { status: 500 }
      );
    }

    const imagePart = parts.find(
      (p: Record<string, unknown>) => p.inlineData && typeof p.inlineData === "object"
    );

    if (!imagePart?.inlineData?.data) {
      const textPart = parts.find((p: Record<string, unknown>) => p.text);
      console.error("[generate-image] No image data in response. Text:", textPart?.text || "none");
      return NextResponse.json(
        { error: "No image data in Gemini response" },
        { status: 500 }
      );
    }

    const base64Image = imagePart.inlineData.data as string;
    const mimeType = (imagePart.inlineData.mimeType as string) || "image/png";
    console.log("[generate-image] Image received. MIME:", mimeType, "Size:", base64Image.length, "chars");

    // ─── Upload to Supabase Storage ───
    const imageBuffer = Buffer.from(base64Image, "base64");
    const filename = `post-${calendar_item_id}-${Date.now()}.png`;
    const filePath = `generated-images/${org_id}/${filename}`;
    console.log("[generate-image] Uploading to storage:", filePath, "Buffer size:", imageBuffer.length);

    const { error: uploadError } = await supabase.storage
      .from("assets")
      .upload(filePath, imageBuffer, {
        contentType: mimeType,
        upsert: false,
      });

    if (uploadError) {
      console.error("[generate-image] Supabase upload error:", uploadError);

      // Try creating the bucket and retry
      console.log("[generate-image] Attempting to create 'assets' bucket...");
      await supabase.storage.createBucket("assets", { public: true });

      const { error: retryError } = await supabase.storage
        .from("assets")
        .upload(filePath, imageBuffer, {
          contentType: mimeType,
          upsert: false,
        });

      if (retryError) {
        console.error("[generate-image] Retry upload failed:", retryError);
        return NextResponse.json(
          { error: "Failed to save image to storage" },
          { status: 500 }
        );
      }
    }

    // Get public URL
    const { data: publicUrlData } = supabase.storage
      .from("assets")
      .getPublicUrl(filePath);

    const publicUrl = publicUrlData.publicUrl;
    console.log("[generate-image] Public URL:", publicUrl);

    // Save image URL to content_calendar
    const { error: updateError } = await supabase
      .from("content_calendar")
      .update({
        generated_image_url: publicUrl,
        status: "image_generated",
        use_assets: !!use_assets,
      })
      .eq("id", calendar_item_id);

    if (updateError) {
      console.error("[generate-image] Calendar update error:", updateError);
    }

    console.log("[generate-image] ✓ Image generation complete");

    return NextResponse.json({
      success: true,
      image_url: publicUrl,
      prompt_used: imagePrompt,
      aspect_ratio: selectedAspectRatio,
    });
  } catch (error) {
    console.error("[generate-image] Unexpected error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Internal server error",
        details: String(error),
      },
      { status: 500 }
    );
  }
}
