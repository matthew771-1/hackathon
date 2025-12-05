import { NextRequest, NextResponse } from "next/server";

/**
 * Fetch proposal metadata from Irys/Arweave gateway
 * This runs server-side to avoid CORS issues
 */
export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get("url");
  
  if (!url) {
    return NextResponse.json({ error: "Missing url parameter" }, { status: 400 });
  }
  
  // Validate URL is from allowed domains
  const allowedDomains = [
    "gateway.irys.xyz",
    "arweave.net",
    "ar-io.net",
    "gist.github.com",
    "raw.githubusercontent.com",
    "github.com",
    "docs.google.com",
    "ipfs.io",
    "cloudflare-ipfs.com",
  ];
  
  try {
    const urlObj = new URL(url);
    if (!allowedDomains.some(domain => urlObj.hostname.includes(domain))) {
      return NextResponse.json({ error: "URL not from allowed gateway" }, { status: 400 });
    }
  } catch {
    return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
  }
  
  try {
    const response = await fetch(url, {
      headers: {
        "Accept": "application/json, text/plain, text/html, */*",
        "User-Agent": "Mozilla/5.0 (compatible; DAOAgent/1.0)",
      },
      signal: AbortSignal.timeout(8000), // 8 second timeout
    });
    
    if (!response.ok) {
      return NextResponse.json(
        { error: `Failed to fetch: ${response.status}` },
        { status: response.status }
      );
    }
    
    const contentType = response.headers.get("content-type") || "";
    
    // Get raw text first to handle both JSON and plain text
    const rawText = await response.text();
    
    // Handle HTML responses (like from gist.github.com)
    if (contentType.includes("text/html") || rawText.trim().startsWith("<!DOCTYPE") || rawText.trim().startsWith("<html")) {
      // Try to extract text content from HTML
      // Look for common patterns in proposal descriptions
      let extractedText = "";
      
      // For GitHub Gists, the content is often in a specific div
      const gistMatch = rawText.match(/<article[^>]*class="[^"]*markdown-body[^"]*"[^>]*>([\s\S]*?)<\/article>/i);
      if (gistMatch) {
        // Strip HTML tags from the matched content
        extractedText = gistMatch[1].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
      }
      
      // Try to get raw content from gist
      if (!extractedText && url.includes("gist.github.com")) {
        // Try to fetch the raw version
        const rawUrl = url.replace("gist.github.com", "gist.githubusercontent.com") + "/raw";
        try {
          const rawResponse = await fetch(rawUrl, {
            signal: AbortSignal.timeout(5000),
          });
          if (rawResponse.ok) {
            extractedText = await rawResponse.text();
          }
        } catch {
          // Ignore raw fetch errors
        }
      }
      
      // Generic HTML text extraction as fallback
      if (!extractedText) {
        // Remove script and style tags first
        let cleanHtml = rawText.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
        cleanHtml = cleanHtml.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');
        // Get text from body
        const bodyMatch = cleanHtml.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
        if (bodyMatch) {
          extractedText = bodyMatch[1].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
        }
      }
      
      if (extractedText && extractedText.length > 20) {
        // Truncate if too long
        if (extractedText.length > 2000) {
          extractedText = extractedText.substring(0, 2000) + "...";
        }
        return NextResponse.json({
          description: extractedText,
          title: "",
          raw: rawText.substring(0, 500),
        });
      }
      
      // If we couldn't extract text, return empty
      return NextResponse.json({
        description: "",
        title: "",
        error: "Could not extract text from HTML",
      });
    }
    
    // Check if it's JSON
    let data: any = null;
    try {
      data = JSON.parse(rawText);
      
      // Handle case where JSON is just a string (common in Realms - description stored as JSON string)
      if (typeof data === "string") {
        console.log("[proposal-metadata] Data is a JSON string, extracting text...");
        let textContent = data;
        
        // If it's HTML, strip the tags
        if (textContent.includes("<") && textContent.includes(">")) {
          // Remove HTML tags but keep text
          textContent = textContent
            .replace(/<br\s*\/?>/gi, '\n')  // Convert <br> to newlines
            .replace(/<\/p>/gi, '\n\n')     // Add newlines after paragraphs
            .replace(/<[^>]+>/g, '')        // Remove all other HTML tags
            .replace(/&gt;/g, '>')          // Decode HTML entities
            .replace(/&lt;/g, '<')
            .replace(/&amp;/g, '&')
            .replace(/&quot;/g, '"')
            .replace(/&#39;/g, "'")
            .replace(/\n{3,}/g, '\n\n')     // Collapse multiple newlines
            .trim();
        }
        
        // Truncate if too long
        if (textContent.length > 1500) {
          textContent = textContent.substring(0, 1500) + "...";
        }
        
        return NextResponse.json({
          description: textContent,
          title: "",
          raw: data,
        });
      }
    } catch {
      // Not JSON - might be plain text description
      if (rawText && rawText.length > 0 && !rawText.startsWith("http") && !rawText.startsWith("<")) {
        // Clean up the text
        const cleanText = rawText.trim().substring(0, 2000);
        return NextResponse.json({
          description: cleanText,
          title: "",
          raw: rawText,
        });
      }
      
      // If it's raw HTML (not JSON-wrapped)
      if (rawText && (rawText.trim().startsWith("<") || rawText.includes("<p>") || rawText.includes("<div>"))) {
        let textContent = rawText
          .replace(/<br\s*\/?>/gi, '\n')
          .replace(/<\/p>/gi, '\n\n')
          .replace(/<[^>]+>/g, '')
          .replace(/&gt;/g, '>')
          .replace(/&lt;/g, '<')
          .replace(/&amp;/g, '&')
          .replace(/&quot;/g, '"')
          .replace(/&#39;/g, "'")
          .replace(/\n{3,}/g, '\n\n')
          .trim();
        
        if (textContent.length > 1500) {
          textContent = textContent.substring(0, 1500) + "...";
        }
        
        return NextResponse.json({
          description: textContent,
          title: "",
          raw: rawText.substring(0, 500),
        });
      }
    }
    
    if (!data) {
      return NextResponse.json({ 
        error: "No valid data found",
        description: "",
        title: "",
      });
    }
    
    // Helper to check if a string looks like a URL (not actual content)
    const isUrl = (str: string) => {
      if (!str || typeof str !== "string") return false;
      const trimmed = str.trim();
      return trimmed.startsWith("http://") || 
             trimmed.startsWith("https://") || 
             trimmed.startsWith("ipfs://") ||
             /^[a-zA-Z0-9_-]{40,}$/.test(trimmed); // Looks like a hash
    };
    
    // Extract description - prefer actual content over URLs
    // Check multiple possible field names in order of preference
    const fieldsToCheck = [
      "description",
      "body", 
      "content",
      "text",
      "details",
      "summary",
      "proposalDescription",
      "proposal_description",
    ];
    
    let description = "";
    for (const field of fieldsToCheck) {
      const value = data[field];
      if (value && typeof value === "string" && value.trim() && !isUrl(value)) {
        description = value.trim();
        break;
      }
    }
    
    // If we still don't have a description, check nested objects
    if (!description) {
      // Check for nested proposal object
      if (data.proposal && typeof data.proposal === "object") {
        for (const field of fieldsToCheck) {
          const value = data.proposal[field];
          if (value && typeof value === "string" && value.trim() && !isUrl(value)) {
            description = value.trim();
            break;
          }
        }
      }
      // Check for metadata object
      if (!description && data.metadata && typeof data.metadata === "object") {
        for (const field of fieldsToCheck) {
          const value = data.metadata[field];
          if (value && typeof value === "string" && value.trim() && !isUrl(value)) {
            description = value.trim();
            break;
          }
        }
      }
    }
    
    // Get title
    let title = data.title || data.name || "";
    if (data.proposal && typeof data.proposal === "object") {
      title = title || data.proposal.title || data.proposal.name || "";
    }
    
    console.log(`[proposal-metadata] URL: ${url}`);
    console.log(`[proposal-metadata] Found description: ${description ? description.substring(0, 100) + "..." : "(empty)"}`);
    console.log(`[proposal-metadata] Data keys: ${Object.keys(data).join(", ")}`);
    
    return NextResponse.json({
      description: description,
      title: typeof title === "string" ? title : "",
      raw: data,
    });
  } catch (error: any) {
    console.error("Error fetching proposal metadata:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch metadata", description: "", title: "" },
      { status: 500 }
    );
  }
}

