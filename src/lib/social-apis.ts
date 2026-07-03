/**
 * Social API wrappers — Phase 1 stubs.
 * These fetch basic data if API keys are configured.
 * Full implementation comes in Phase 2.
 */

export interface SocialMediaData {
  facebook?: {
    pageName?: string;
    followers?: number;
    recentPosts?: { message: string; likes: number; comments: number }[];
  };
  youtube?: {
    channelName?: string;
    subscribers?: number;
    recentVideos?: { title: string; description: string }[];
  };
  instagram?: {
    username?: string;
    followers?: number;
    mediaCount?: number;
  };
}

export async function fetchFacebookData(
  pageUrl: string
): Promise<SocialMediaData["facebook"]> {
  const appId = process.env.META_APP_ID;
  const appSecret = process.env.META_APP_SECRET;

  if (!appId || !appSecret || !pageUrl) return undefined;

  try {
    // Extract page ID from URL
    const pageId = pageUrl.split("/").filter(Boolean).pop() || "";
    const accessToken = `${appId}|${appSecret}`;

    const response = await fetch(
      `https://graph.facebook.com/v18.0/${pageId}?fields=name,fan_count,posts.limit(10){message,likes.summary(true),comments.summary(true)}&access_token=${accessToken}`
    );

    if (!response.ok) return undefined;

    const data = await response.json();
    return {
      pageName: data.name,
      followers: data.fan_count,
      recentPosts:
        data.posts?.data?.map(
          (post: {
            message?: string;
            likes?: { summary?: { total_count?: number } };
            comments?: { summary?: { total_count?: number } };
          }) => ({
            message: post.message || "",
            likes: post.likes?.summary?.total_count || 0,
            comments: post.comments?.summary?.total_count || 0,
          })
        ) || [],
    };
  } catch (error) {
    console.error("Facebook API error:", error);
    return undefined;
  }
}

export async function fetchYouTubeData(
  channelUrl: string
): Promise<SocialMediaData["youtube"]> {
  const apiKey = process.env.YOUTUBE_API_KEY;

  if (!apiKey || !channelUrl) return undefined;

  try {
    // Try to extract channel handle or ID
    const urlPath = channelUrl.split("/").filter(Boolean);
    const lastPart = urlPath[urlPath.length - 1] || "";
    const handle = lastPart.startsWith("@") ? lastPart : `@${lastPart}`;

    // Search for channel
    const searchResponse = await fetch(
      `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(handle)}&type=channel&key=${apiKey}`
    );

    if (!searchResponse.ok) return undefined;

    const searchData = await searchResponse.json();
    const channelId = searchData.items?.[0]?.snippet?.channelId;

    if (!channelId) return undefined;

    // Get channel details
    const channelResponse = await fetch(
      `https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&id=${channelId}&key=${apiKey}`
    );

    const channelData = await channelResponse.json();
    const channel = channelData.items?.[0];

    // Get recent videos
    const videosResponse = await fetch(
      `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${channelId}&order=date&maxResults=5&type=video&key=${apiKey}`
    );

    const videosData = await videosResponse.json();

    return {
      channelName: channel?.snippet?.title,
      subscribers: parseInt(channel?.statistics?.subscriberCount || "0"),
      recentVideos:
        videosData.items?.map(
          (video: { snippet?: { title?: string; description?: string } }) => ({
            title: video.snippet?.title || "",
            description: (video.snippet?.description || "").slice(0, 200),
          })
        ) || [],
    };
  } catch (error) {
    console.error("YouTube API error:", error);
    return undefined;
  }
}

export async function fetchInstagramData(
  handle: string
): Promise<SocialMediaData["instagram"]> {
  // Instagram requires a Meta Business account and app approval
  // For Phase 1, we return the handle as-is
  if (!handle) return undefined;

  return {
    username: handle.replace("@", ""),
    followers: undefined,
    mediaCount: undefined,
  };
}

export async function fetchAllSocialData(params: {
  facebookUrl?: string;
  youtubeUrl?: string;
  instagramHandle?: string;
}): Promise<SocialMediaData> {
  const [facebook, youtube, instagram] = await Promise.allSettled([
    fetchFacebookData(params.facebookUrl || ""),
    fetchYouTubeData(params.youtubeUrl || ""),
    fetchInstagramData(params.instagramHandle || ""),
  ]);

  return {
    facebook: facebook.status === "fulfilled" ? facebook.value : undefined,
    youtube: youtube.status === "fulfilled" ? youtube.value : undefined,
    instagram: instagram.status === "fulfilled" ? instagram.value : undefined,
  };
}
