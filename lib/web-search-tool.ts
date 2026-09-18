/**
 * Trusted research search for TeachBack AI.
 * Every result is allowlisted, health-checked and scored before use.
 */
export type TrustedVenue = "NeurIPS" | "ICML" | "ICLR" | "ACL" | "IEEE";

export interface WebSearchResultItem {
  title: string;
  url: string;
  snippet: string;
  relevanceScore?: number;
  venue: TrustedVenue;
  rank: "A*" | "A";
  credibilityScore: number;
  credibilityReasons: string[];
  isReachable: boolean;
  statusCode: number | null;
  checkedAt: string;
}

export interface WebSearchToolResult {
  query: string;
  found: boolean;
  source: "tavily" | "duckduckgo" | "none";
  summary: string;
  items: WebSearchResultItem[];
  cached?: boolean;
}

type CachedSearch = { expiresAt: number; result: WebSearchToolResult };
const SEARCH_CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const EMPTY_SEARCH_CACHE_TTL_MS = 5 * 60 * 1000;
const researchCache = new Map<string, CachedSearch>();

type RawSearchItem = {
  title: string;
  url: string;
  snippet: string;
  relevanceScore?: number;
};

type VenueRule = {
  venue: TrustedVenue;
  hosts: string[];
  sharedHostRequires?: RegExp;
  score: number;
  rank: "A*" | "A";
  reason: string;
};

const VENUE_RULES: VenueRule[] = [
  { venue: "NeurIPS", hosts: ["proceedings.neurips.cc", "papers.nips.cc", "neurips.cc"], rank: "A*", score: 99, reason: "Nguồn chính thức của hội nghị NeurIPS (hạng A*)." },
  { venue: "ICML", hosts: ["icml.cc"], rank: "A*", score: 98, reason: "Nguồn chính thức của hội nghị ICML (hạng A*)." },
  { venue: "ICML", hosts: ["proceedings.mlr.press"], sharedHostRequires: /\bicml\b|international conference on machine learning/i, rank: "A*", score: 97, reason: "Kỷ yếu ICML hạng A* trên Proceedings of Machine Learning Research." },
  { venue: "ICLR", hosts: ["iclr.cc"], rank: "A*", score: 98, reason: "Nguồn chính thức của hội nghị ICLR (hạng A*)." },
  { venue: "ICLR", hosts: ["openreview.net"], sharedHostRequires: /\biclr\b|international conference on learning representations/i, rank: "A*", score: 96, reason: "Bài ICLR hạng A* trên nền tảng phản biện chính thức OpenReview." },
  { venue: "ACL", hosts: ["aclanthology.org", "aclweb.org"], rank: "A*", score: 98, reason: "Nguồn chính thức của ACL Anthology/ACL (hạng A*)." },
  { venue: "IEEE", hosts: ["ieeexplore.ieee.org", "computer.org", "ieee.org"], rank: "A", score: 97, reason: "Nguồn xuất bản hoặc thư viện số chính thức của IEEE (tối thiểu hạng A trong lát cắt này)." },
];

const TRUSTED_SEARCH_DOMAINS = [...new Set(VENUE_RULES.flatMap((rule) => rule.hosts))];

function matchesHost(hostname: string, allowedHost: string): boolean {
  return hostname === allowedHost || hostname.endsWith(`.${allowedHost}`);
}

function classifyTrustedVenue(item: RawSearchItem): VenueRule | null {
  let parsed: URL;
  try {
    parsed = new URL(item.url);
  } catch {
    return null;
  }
  if (parsed.protocol !== "https:") return null;
  const evidence = `${item.title} ${item.snippet} ${parsed.pathname}`;
  return VENUE_RULES.find(
    (rule) =>
      rule.hosts.some((host) => matchesHost(parsed.hostname.toLowerCase(), host)) &&
      (!rule.sharedHostRequires || rule.sharedHostRequires.test(evidence))
  ) ?? null;
}

function isTrustedRedirectTarget(url: string, rule: VenueRule): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:" && rule.hosts.some((host) => matchesHost(parsed.hostname.toLowerCase(), host));
  } catch {
    return false;
  }
}

async function checkUrlHealth(url: string, rule: VenueRule): Promise<{ reachable: boolean; statusCode: number | null; finalUrl: string }> {
  const request = async (method: "HEAD" | "GET") => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    try {
      return await fetch(url, {
        method,
        redirect: "follow",
        headers: method === "GET"
          ? { Range: "bytes=0-1024", "User-Agent": "TeachBackAI-SourceVerifier/1.0" }
          : { "User-Agent": "TeachBackAI-SourceVerifier/1.0" },
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeoutId);
    }
  };

  try {
    let response = await request("HEAD");
    if ([403, 405, 501].includes(response.status)) response = await request("GET");
    const finalUrl = response.url || url;
    return {
      reachable: response.ok && isTrustedRedirectTarget(finalUrl, rule),
      statusCode: response.status,
      finalUrl,
    };
  } catch {
    return { reachable: false, statusCode: null, finalUrl: url };
  }
}

async function verifyTrustedItems(rawItems: RawSearchItem[], maxResults: number): Promise<WebSearchResultItem[]> {
  const candidates = rawItems
    .map((item) => ({ item, rule: classifyTrustedVenue(item) }))
    .filter((candidate): candidate is { item: RawSearchItem; rule: VenueRule } => Boolean(candidate.rule))
    .slice(0, Math.max(maxResults * 2, maxResults));

  const checked = await Promise.all(candidates.map(async ({ item, rule }) => {
    const health = await checkUrlHealth(item.url, rule);
    if (!health.reachable) return null;
    return {
      title: item.title,
      url: health.finalUrl,
      snippet: item.snippet.slice(0, 700),
      relevanceScore: item.relevanceScore,
      venue: rule.venue,
      rank: rule.rank,
      credibilityScore: rule.score,
      credibilityReasons: [rule.reason, "URL đã được kiểm tra và còn truy cập được."],
      isReachable: true,
      statusCode: health.statusCode,
      checkedAt: new Date().toISOString(),
    } satisfies WebSearchResultItem;
  }));

  return checked
    .filter((item): item is WebSearchResultItem => item !== null)
    .sort((a, b) => b.credibilityScore - a.credibilityScore || (b.relevanceScore ?? 0) - (a.relevanceScore ?? 0))
    .slice(0, maxResults);
}

function buildVerifiedSummary(items: WebSearchResultItem[]): string {
  return items.map((item) =>
    `[${item.venue} · hạng ${item.rank} · uy tín ${item.credibilityScore}/100] ${item.title}\n${item.snippet}\nURL: ${item.url}`
  ).join("\n\n").slice(0, 5000);
}

async function searchWithTavily(query: string, apiKey: string, maxResults: number): Promise<WebSearchToolResult | null> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000);
  try {
    const response = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: apiKey,
        query: `${query} (NeurIPS OR ICML OR ICLR OR ACL OR IEEE)`,
        search_depth: "advanced",
        include_answer: false,
        include_domains: TRUSTED_SEARCH_DOMAINS,
        max_results: Math.max(maxResults * 3, 6),
      }),
      signal: controller.signal,
    });
    if (!response.ok) return null;
    const data = await response.json();
    const rawItems: RawSearchItem[] = (data.results || []).map(
      (result: { title?: string; url?: string; content?: string; score?: number }) => ({
        title: result.title || "Research paper",
        url: result.url || "",
        snippet: result.content || "",
        relevanceScore: result.score,
      })
    );
    const items = await verifyTrustedItems(rawItems, maxResults);
    if (items.length === 0) return null;
    return { query, found: true, source: "tavily", summary: buildVerifiedSummary(items), items };
  } catch (error) {
    console.warn("[TrustedWebSearch] Tavily unavailable:", error);
    return null;
  } finally {
    clearTimeout(timeoutId);
  }
}

async function searchWithDuckDuckGo(query: string, maxResults: number): Promise<WebSearchToolResult | null> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 6000);
  try {
    const scopedQuery = `${query} (site:proceedings.neurips.cc OR site:icml.cc OR site:openreview.net OR site:aclanthology.org OR site:ieeexplore.ieee.org)`;
    const response = await fetch(`https://api.duckduckgo.com/?q=${encodeURIComponent(scopedQuery)}&format=json&no_html=1&skip_disambig=1`, {
      headers: { "User-Agent": "TeachBackAI-TrustedSearch/1.0" },
      signal: controller.signal,
    });
    if (!response.ok) return null;
    const data = await response.json();
    const rawItems: RawSearchItem[] = [];
    if (data.AbstractText && data.AbstractURL) {
      rawItems.push({ title: data.Heading || query, url: data.AbstractURL, snippet: data.AbstractText });
    }
    for (const topic of Array.isArray(data.RelatedTopics) ? data.RelatedTopics : []) {
      if (topic && typeof topic.Text === "string" && typeof topic.FirstURL === "string") {
        rawItems.push({ title: topic.Text.slice(0, 100), url: topic.FirstURL, snippet: topic.Text });
      }
    }
    const items = await verifyTrustedItems(rawItems, maxResults);
    if (items.length === 0) return null;
    return { query, found: true, source: "duckduckgo", summary: buildVerifiedSummary(items), items };
  } catch (error) {
    console.warn("[TrustedWebSearch] DuckDuckGo unavailable:", error);
    return null;
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function searchWebKnowledge(query: string, options: { maxResults?: number } = {}): Promise<WebSearchToolResult> {
  const cleanQuery = query.trim();
  const maxResults = Math.min(Math.max(options.maxResults ?? 3, 1), 5);
  if (!cleanQuery) return { query: "", found: false, source: "none", summary: "", items: [] };

  const cacheKey = `${cleanQuery.toLocaleLowerCase()}::${maxResults}`;
  const cached = researchCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return { ...cached.result, cached: true };
  }

  const tavilyKey = process.env.TAVILY_API_KEY;
  if (tavilyKey && tavilyKey !== "your_tavily_api_key_here") {
    const tavilyResult = await searchWithTavily(cleanQuery, tavilyKey, maxResults);
    if (tavilyResult) {
      researchCache.set(cacheKey, { expiresAt: Date.now() + SEARCH_CACHE_TTL_MS, result: tavilyResult });
      return tavilyResult;
    }
  }
  const duckDuckGoResult = await searchWithDuckDuckGo(cleanQuery, maxResults);
  if (duckDuckGoResult) {
    researchCache.set(cacheKey, { expiresAt: Date.now() + SEARCH_CACHE_TTL_MS, result: duckDuckGoResult });
    return duckDuckGoResult;
  }

  const emptyResult: WebSearchToolResult = {
    query: cleanQuery,
    found: false,
    source: "none",
    summary: "Không tìm thấy nguồn còn hoạt động từ NeurIPS, ICML, ICLR, ACL hoặc IEEE.",
    items: [],
  };
  researchCache.set(cacheKey, {
    expiresAt: Date.now() + EMPTY_SEARCH_CACHE_TTL_MS,
    result: emptyResult,
  });
  return emptyResult;
}
