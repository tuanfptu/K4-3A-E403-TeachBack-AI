/**
 * Web Search Tool cho TeachBack AI Agent
 * Hỗ trợ tra cứu tài liệu từ internet khi RAG nội bộ (slide/transcript) không tìm thấy
 * hoặc học viên đề cập đến khái niệm/công nghệ mới nằm ngoài giáo trình.
 */

export interface WebSearchResultItem {
  title: string;
  url: string;
  snippet: string;
  score?: number;
}

export interface WebSearchToolResult {
  query: string;
  found: boolean;
  source: "tavily" | "duckduckgo" | "none";
  summary: string;
  items: WebSearchResultItem[];
}

/**
 * Thực hiện tìm kiếm qua Tavily Search API (nếu có API Key)
 */
async function searchWithTavily(
  query: string,
  apiKey: string,
  maxResults = 3
): Promise<WebSearchToolResult | null> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    const response = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        api_key: apiKey,
        query,
        search_depth: "basic",
        include_answer: true,
        max_results: maxResults,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      console.warn(`[WebSearch] Tavily HTTP error: ${response.status}`);
      return null;
    }

    const data = await response.json();
    const items: WebSearchResultItem[] = (data.results || []).map(
      (r: { title?: string; url?: string; content?: string; score?: number }) => ({
        title: r.title || "Tài liệu mở rộng",
        url: r.url || "",
        snippet: (r.content || "").slice(0, 500),
        score: r.score,
      })
    );

    const summary =
      data.answer ||
      items.map((i) => `• ${i.title}: ${i.snippet}`).join("\n\n");

    return {
      query,
      found: items.length > 0,
      source: "tavily",
      summary: summary.slice(0, 3000),
      items,
    };
  } catch (error) {
    console.warn("[WebSearch] Lỗi gọi Tavily API:", error);
    return null;
  }
}

/**
 * Thực hiện tìm kiếm miễn phí qua DuckDuckGo Instant Answer API (không cần API key)
 */
async function searchWithDuckDuckGo(
  query: string
): Promise<WebSearchToolResult | null> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const targetUrl = `https://api.duckduckgo.com/?q=${encodeURIComponent(
      query
    )}&format=json&no_html=1&skip_disambig=1`;

    const response = await fetch(targetUrl, {
      headers: {
        "User-Agent": "TeachBackAI-WebSearch/1.0",
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) return null;

    const data = await response.json();
    const items: WebSearchResultItem[] = [];

    if (data.AbstractText) {
      items.push({
        title: data.Heading || query,
        url: data.AbstractURL || "https://duckduckgo.com",
        snippet: data.AbstractText,
      });
    }

    if (Array.isArray(data.RelatedTopics)) {
      for (const topic of data.RelatedTopics.slice(0, 3)) {
        if (topic && typeof topic.Text === "string") {
          items.push({
            title: topic.Text.slice(0, 60),
            url: topic.FirstURL || "",
            snippet: topic.Text,
          });
        }
      }
    }

    if (items.length === 0) return null;

    const summary = items.map((i) => `• ${i.title}: ${i.snippet}`).join("\n\n");

    return {
      query,
      found: true,
      source: "duckduckgo",
      summary: summary.slice(0, 3000),
      items,
    };
  } catch (error) {
    console.warn("[WebSearch] Lỗi gọi DuckDuckGo API:", error);
    return null;
  }
}

/**
 * Hàm tìm kiếm Web chính - Tự động fallback linh hoạt
 * 1. Thử Tavily API (nếu có TAVILY_API_KEY)
 * 2. Fallback sang DuckDuckGo API (miễn phí)
 * 3. Trả về đối tượng an toàn nếu không tìm thấy gì (không làm crash hệ thống)
 */
export async function searchWebKnowledge(
  query: string,
  options: { maxResults?: number } = {}
): Promise<WebSearchToolResult> {
  const cleanQuery = query.trim();
  if (!cleanQuery) {
    return {
      query: "",
      found: false,
      source: "none",
      summary: "",
      items: [],
    };
  }

  const tavilyKey = process.env.TAVILY_API_KEY;

  // 1. Thử qua Tavily nếu có cấu hình key
  if (tavilyKey && tavilyKey !== "your_tavily_api_key_here") {
    const tavilyResult = await searchWithTavily(
      cleanQuery,
      tavilyKey,
      options.maxResults || 3
    );
    if (tavilyResult && tavilyResult.found) {
      return tavilyResult;
    }
  }

  // 2. Fallback sang DuckDuckGo
  const ddgResult = await searchWithDuckDuckGo(cleanQuery);
  if (ddgResult && ddgResult.found) {
    return ddgResult;
  }

  // 3. Fallback an toàn
  return {
    query: cleanQuery,
    found: false,
    source: "none",
    summary: `Không tìm thấy tài liệu tra cứu trực tuyến cho "${cleanQuery}". Dùng tri thức nền của mô hình để kiểm chứng.`,
    items: [],
  };
}
