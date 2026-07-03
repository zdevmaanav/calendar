import { NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { image_url, topic } = body;

    const canvaToken = process.env.CANVA_ACCESS_TOKEN;

    if (!canvaToken) {
      return Response.json(
        { error: "CANVA_ACCESS_TOKEN not set in environment variables" },
        { status: 500 }
      );
    }

    if (!image_url) {
      return Response.json(
        { error: "No image URL provided" },
        { status: 400 }
      );
    }

    console.log("[Edit in Canva] Starting URL import for:", image_url);

    // STEP 1 — Create URL import job
    // CORRECT endpoint: /rest/v1/url-imports (NOT /v1/imports)
    const importResponse = await fetch(
      "https://api.canva.com/rest/v1/url-imports",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${canvaToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: topic || "Marketing Post",
          url: image_url,
          mime_type: "image/png",
        }),
      }
    );

    const importData = await importResponse.json();
    console.log(
      "[Edit in Canva] Import response:",
      JSON.stringify(importData, null, 2)
    );

    if (!importResponse.ok) {
      console.error("[Edit in Canva] Import error:", importData);
      return Response.json(
        {
          error:
            importData.message || importData.error || "Canva import failed",
          details: importData,
        },
        { status: importResponse.status }
      );
    }

    const jobId = importData.job?.id;
    if (!jobId) {
      return Response.json(
        { error: "No job ID returned from Canva" },
        { status: 500 }
      );
    }

    console.log("[Edit in Canva] Job ID:", jobId);

    // STEP 2 — Poll for job completion (max 15 attempts)
    // CORRECT endpoint: /rest/v1/url-imports/{jobId} (NOT /v1/imports/{jobId})
    let editUrl: string | null = null;
    let attempts = 0;
    const maxAttempts = 15;

    while (attempts < maxAttempts) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      attempts++;

      const statusResponse = await fetch(
        `https://api.canva.com/rest/v1/url-imports/${jobId}`,
        {
          headers: {
            Authorization: `Bearer ${canvaToken}`,
          },
        }
      );

      const statusData = await statusResponse.json();
      console.log(
        `[Edit in Canva] Poll attempt ${attempts}:`,
        statusData.job?.status
      );

      if (statusData.job?.status === "success") {
        const designs = statusData.job?.result?.designs;
        if (designs && designs.length > 0) {
          editUrl = designs[0].urls?.edit_url;
          console.log("[Edit in Canva] Got edit URL:", editUrl);
          break;
        }
      }

      if (statusData.job?.status === "failed") {
        return Response.json(
          {
            error: "Canva import job failed",
            details: statusData.job,
          },
          { status: 500 }
        );
      }
    }

    if (!editUrl) {
      return Response.json(
        { error: "Timed out waiting for Canva import" },
        { status: 504 }
      );
    }

    return Response.json({
      success: true,
      edit_url: editUrl,
    });
  } catch (error) {
    console.error("[Edit in Canva] Unexpected error:", error);
    const message =
      error instanceof Error ? error.message : "Unknown error occurred";
    return Response.json(
      {
        error: message,
      },
      { status: 500 }
    );
  }
}
