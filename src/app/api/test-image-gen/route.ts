import { NextResponse } from "next/server";

export async function GET() {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return NextResponse.json({
      success: false,
      error: "GEMINI_API_KEY not set in .env.local",
    });
  }

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-image-preview:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { text: "Generate a simple blue circle on a white background" },
              ],
            },
          ],
          generationConfig: {
            responseModalities: ["TEXT", "IMAGE"],
            imageConfig: {
              image_size: "512",
              aspect_ratio: "1:1",
            },
          },
        }),
      }
    );

    const data = await response.json();
    const parts = data.candidates?.[0]?.content?.parts || [];
    const hasImage = parts.some(
      (p: Record<string, unknown>) =>
        p.inlineData && typeof p.inlineData === "object"
    );
    const textPart = parts.find((p: Record<string, unknown>) => p.text);

    return NextResponse.json({
      success: response.ok && hasImage,
      model: "gemini-3.1-flash-image-preview",
      apiStatus: response.status,
      hasImage,
      textResponse: textPart?.text || null,
      error: data.error || null,
      partsCount: parts.length,
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}
