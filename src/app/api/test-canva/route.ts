export async function GET() {
  const token = process.env.CANVA_ACCESS_TOKEN;

  if (!token) {
    return Response.json({ error: "No CANVA_ACCESS_TOKEN in env" });
  }

  try {
    // Test by fetching user profile
    const res = await fetch("https://api.canva.com/rest/v1/users/me", {
      headers: { Authorization: `Bearer ${token}` },
    });

    const data = await res.json();
    return Response.json({
      status: res.status,
      ok: res.ok,
      user: data,
      tokenFirstChars: token.substring(0, 10) + "...",
    });
  } catch (error) {
    return Response.json({
      error: "Failed to connect to Canva API",
      details: error instanceof Error ? error.message : String(error),
    });
  }
}
