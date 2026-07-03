import * as cheerio from "cheerio";

export interface ScrapedWebsiteData {
  url: string;
  title: string;
  metaDescription: string;
  headings: { level: string; text: string }[];
  bodyText: string;
  colors: string[];
  fonts: string[];
  navLinks: string[];
  footerText: string;
}

/**
 * Scrape a website URL using fetch + Cheerio (no browser needed).
 * For Phase 1 this avoids the Playwright browser dependency.
 */
export async function scrapeWebsite(url: string): Promise<ScrapedWebsiteData> {
  try {
    // Ensure URL has protocol
    let fullUrl = url;
    if (!fullUrl.startsWith("http")) {
      fullUrl = `https://${fullUrl}`;
    }

    const response = await fetch(fullUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
      signal: AbortSignal.timeout(15000),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch website: ${response.status}`);
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    // Extract title
    const title = $("title").text().trim() || "";

    // Extract meta description
    const metaDescription =
      $('meta[name="description"]').attr("content") ||
      $('meta[property="og:description"]').attr("content") ||
      "";

    // Extract headings
    const headings: { level: string; text: string }[] = [];
    $("h1, h2, h3, h4").each((_, el) => {
      const text = $(el).text().trim();
      if (text) {
        headings.push({ level: el.tagName, text });
      }
    });

    // Extract body text (limit to first 5000 chars)
    $("script, style, nav, footer, header").remove();
    const bodyText = $("body").text().replace(/\s+/g, " ").trim().slice(0, 5000);

    // Extract colors from inline styles and stylesheet links
    const colors: string[] = [];
    const htmlStr = html;
    const hexColorRegex = /#[0-9A-Fa-f]{3,8}/g;
    const foundColors = htmlStr.match(hexColorRegex) || [];
    const uniqueColors = Array.from(new Set(foundColors)).slice(0, 10);
    colors.push(...uniqueColors);

    // Extract fonts
    const fonts: string[] = [];
    const fontRegex = /font-family:\s*([^;}"]+)/gi;
    let fontMatch;
    while ((fontMatch = fontRegex.exec(htmlStr)) !== null) {
      const font = fontMatch[1].trim().replace(/['"]/g, "").split(",")[0].trim();
      if (font && !fonts.includes(font)) {
        fonts.push(font);
      }
    }

    // Extract nav links
    const navLinks: string[] = [];
    $("nav a, header a").each((_, el) => {
      const text = $(el).text().trim();
      if (text && text.length < 50) {
        navLinks.push(text);
      }
    });

    // Extract footer text
    const footerText = $("footer").text().replace(/\s+/g, " ").trim().slice(0, 1000);

    return {
      url: fullUrl,
      title,
      metaDescription,
      headings: headings.slice(0, 20),
      bodyText,
      colors: uniqueColors,
      fonts: fonts.slice(0, 5),
      navLinks: Array.from(new Set(navLinks)).slice(0, 15),
      footerText,
    };
  } catch (error) {
    console.error("Scraping error:", error);
    return {
      url,
      title: "",
      metaDescription: "",
      headings: [],
      bodyText: "",
      colors: [],
      fonts: [],
      navLinks: [],
      footerText: "",
    };
  }
}
