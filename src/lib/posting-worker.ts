/**
 * Posting Worker — Background job processor
 * Handles publishing approved posts to social platforms
 * Requires REDIS_URL to be configured
 */

import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface PostingJob {
  calendar_item_id: string;
  org_id: string;
}

async function publishToMeta(
  calendarItem: Record<string, unknown>,
  accessToken: string,
  pageId: string
) {
  const imageUrl = calendarItem.generated_image_url as string;
  const caption = calendarItem.generated_caption as string;
  const hashtags = (calendarItem.generated_hashtags as string[]) || [];
  const fullCaption = `${caption}\n\n${hashtags.join(" ")}`;

  // Photo post
  const response = await fetch(
    `https://graph.facebook.com/v18.0/${pageId}/photos`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        url: imageUrl,
        message: fullCaption,
        access_token: accessToken,
      }),
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Meta API error: ${JSON.stringify(error)}`);
  }

  const data = await response.json();
  return data.id || data.post_id;
}

async function publishToYouTube(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _calendarItem: Record<string, unknown>,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _accessToken: string
) {
  // YouTube requires video content — for image posts, skip
  console.warn("YouTube posting requires video content — skipping image-only post");
  return null;
}

export async function processPostingJob(job: PostingJob) {
  const { calendar_item_id, org_id } = job;

  // Fetch calendar item
  const { data: calendarItem, error: fetchError } = await supabase
    .from("content_calendar")
    .select("*")
    .eq("id", calendar_item_id)
    .single();

  if (fetchError || !calendarItem) {
    throw new Error(`Calendar item not found: ${calendar_item_id}`);
  }

  if (calendarItem.status !== "approved") {
    console.warn(`Skipping post ${calendar_item_id} — status is ${calendarItem.status}`);
    return;
  }

  const platform = calendarItem.platform;
  let postPlatformId: string | null = null;

  try {
    // Post to Meta (Instagram/Facebook)
    if (
      (platform === "instagram" || platform === "facebook" || platform === "all") &&
      process.env.META_ACCESS_TOKEN &&
      process.env.META_PAGE_ID
    ) {
      postPlatformId = await publishToMeta(
        calendarItem,
        process.env.META_ACCESS_TOKEN,
        process.env.META_PAGE_ID
      );
    }

    // Post to YouTube
    if (
      (platform === "youtube" || platform === "all") &&
      process.env.YOUTUBE_ACCESS_TOKEN
    ) {
      const ytId = await publishToYouTube(calendarItem, process.env.YOUTUBE_ACCESS_TOKEN);
      if (ytId) postPlatformId = ytId;
    }

    // Update status
    await supabase
      .from("content_calendar")
      .update({
        status: "posted",
        posted_at: new Date().toISOString(),
        post_platform_id: postPlatformId,
      })
      .eq("id", calendar_item_id);

    console.log(`Successfully posted: ${calendar_item_id}`);
  } catch (error) {
    console.error(`Failed to post ${calendar_item_id}:`, error);

    await supabase
      .from("content_calendar")
      .update({ status: "post_failed" })
      .eq("id", calendar_item_id);

    // Send failure notification email if Resend is configured
    if (process.env.RESEND_API_KEY) {
      try {
        const { Resend } = await import("resend");
        const resend = new Resend(process.env.RESEND_API_KEY);

        const { data: orgSettings } = await supabase
          .from("org_settings")
          .select("notification_email")
          .eq("org_id", org_id)
          .single();

        if (orgSettings?.notification_email) {
          await resend.emails.send({
            from: "Apex Marketing <onboarding@resend.dev>",
            to: orgSettings.notification_email,
            subject: `Post Failed: ${calendarItem.topic}`,
            html: `<p>Your scheduled post "${calendarItem.topic}" failed to publish after 3 attempts.</p>
                   <p>Please check your API connections and try again.</p>`,
          });
        }
      } catch (emailError) {
        console.error("Failed to send failure notification:", emailError);
      }
    }

    throw error; // Re-throw for BullMQ retry logic
  }
}
