export interface BrandProfile {
  brand_voice: string;
  tone_of_voice: string;
  primary_colors: string[];
  target_audience: string;
  audience_age_range: string;
  content_themes: string[];
  posting_style: string;
  key_products_services: string[];
  unique_selling_points: string[];
  content_pillars: string[];
  suggested_hashtags: string[];
  competitor_keywords: string[];
  brand_personality: string[];
  industry: string;
  summary: string;
}

const BRAND_ANALYSIS_PROMPT = `You are a brand intelligence analyst. Based on the following scraped data from an organization's website and social media, extract and return a comprehensive brand profile as JSON with these fields:
{
  brand_voice: string (e.g. professional, playful, inspirational, educational),
  tone_of_voice: string (detailed description),
  primary_colors: array of hex color codes detected,
  target_audience: string (detailed description),
  audience_age_range: string,
  content_themes: array of strings (main topics they post about),
  posting_style: string (description of how they write captions),
  key_products_services: array of strings,
  unique_selling_points: array of strings,
  content_pillars: array of strings (4-6 main content categories),
  suggested_hashtags: array of 15 relevant hashtags,
  competitor_keywords: array of strings,
  brand_personality: array of 5 adjectives,
  industry: string,
  summary: string (2-3 sentence brand overview)
}

Return ONLY valid JSON, no markdown formatting or code blocks.`;

export async function analyzeBrandWithGemini(
  scrapedData: Record<string, unknown>
): Promise<BrandProfile> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not set");
  }

  const prompt = `${BRAND_ANALYSIS_PROMPT}\n\nHere is the scraped data:\n${JSON.stringify(scrapedData, null, 2)}`;

  // Use gemini-2.5-flash which is confirmed available
  const models = [
    "gemini-2.5-flash",
  ];

  let lastError: Error | null = null;

  for (const model of models) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 4096,
          },
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.warn(`Model ${model} failed:`, response.status, errorData);
        lastError = new Error(`Model ${model}: ${response.status} ${response.statusText}`);
        continue;
      }

      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!text) {
        console.warn(`Model ${model} returned empty response`);
        lastError = new Error(`Model ${model} returned empty response`);
        continue;
      }

      // Clean the response — remove any markdown formatting
      let cleanText = text.trim();
      if (cleanText.startsWith("```json")) {
        cleanText = cleanText.slice(7);
      }
      if (cleanText.startsWith("```")) {
        cleanText = cleanText.slice(3);
      }
      if (cleanText.endsWith("```")) {
        cleanText = cleanText.slice(0, -3);
      }
      cleanText = cleanText.trim();

      const parsed = JSON.parse(cleanText) as BrandProfile;

      // Validate required fields
      if (!parsed.brand_voice || !parsed.summary) {
        throw new Error("Missing required fields in brand profile");
      }

      // Ensure arrays are arrays
      const arrayFields: (keyof BrandProfile)[] = [
        "primary_colors",
        "content_themes",
        "key_products_services",
        "unique_selling_points",
        "content_pillars",
        "suggested_hashtags",
        "competitor_keywords",
        "brand_personality",
      ];

      for (const field of arrayFields) {
        if (!Array.isArray(parsed[field])) {
          (parsed as unknown as Record<string, unknown>)[field] = [];
        }
      }

      console.log(`Brand analysis succeeded with model: ${model}`);
      return parsed;
    } catch (error) {
      console.warn(`Model ${model} error:`, error);
      lastError = error instanceof Error ? error : new Error(String(error));
      continue;
    }
  }

  throw lastError || new Error("All Gemini models failed");
}
