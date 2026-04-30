import { eq } from "drizzle-orm"
import { db } from "@/lib/db/client"
import { contentClassifications } from "@/lib/db/schema"

export type ContentCategory =
  | "technology" | "finance" | "sports" | "entertainment" | "politics"
  | "health" | "lifestyle" | "education" | "business" | "travel"

const ALL_CATEGORIES: ContentCategory[] = [
  "technology", "finance", "sports", "entertainment", "politics",
  "health", "lifestyle", "education", "business", "travel",
]

// Keyword dictionaries per category. Longer, more specific keywords get more
// weight because a URL path segment like "machine-learning" is more signal than "data".
const KEYWORDS: Record<ContentCategory, string[]> = {
  technology: [
    "tech", "technology", "software", "ai", "artificial-intelligence", "machine-learning",
    "app", "apps", "coding", "code", "startup", "gadget", "gadgets", "mobile", "cloud",
    "data", "digital", "cybersecurity", "cyber", "web", "programming", "developer",
    "blockchain", "crypto", "cryptocurrency", "hardware", "device", "computer", "internet",
    "api", "saas", "platform", "algorithm", "robotics", "iot", "5g", "metaverse",
  ],
  finance: [
    "finance", "financial", "money", "stock", "stocks", "invest", "investment", "investing",
    "bank", "banking", "fund", "funds", "market", "markets", "trading", "economy", "economic",
    "budget", "tax", "taxes", "debt", "credit", "wealth", "bitcoin", "forex", "share",
    "shares", "equity", "mutual-fund", "portfolio", "insurance", "loan", "mortgage", "ipo",
    "sensex", "nifty", "nasdaq", "dow-jones", "rbi", "sebi",
  ],
  sports: [
    "sport", "sports", "football", "cricket", "tennis", "basketball", "soccer", "athlete",
    "match", "game", "score", "team", "league", "tournament", "olympic", "olympics", "ipl",
    "nfl", "nba", "fifa", "f1", "formula-1", "racing", "swimming", "golf", "boxing",
    "wrestling", "kabaddi", "badminton", "hockey", "rugby", "athletics", "championship",
  ],
  entertainment: [
    "entertainment", "movie", "movies", "music", "film", "films", "celebrity", "celebrities",
    "actor", "actress", "show", "shows", "tv", "television", "streaming", "concert", "album",
    "theater", "theatre", "drama", "comedy", "web-series", "bollywood", "hollywood",
    "netflix", "ott", "anime", "review", "trailer", "oscars", "grammy", "awards",
  ],
  politics: [
    "politics", "political", "government", "election", "elections", "vote", "voting",
    "parliament", "senate", "policy", "minister", "president", "democracy", "law",
    "constitution", "party", "congress", "cabinet", "governor", "legislation", "bill",
    "rajya-sabha", "lok-sabha", "bjp", "congress-party", "campaign", "diplomat", "treaty",
  ],
  health: [
    "health", "medical", "doctor", "hospital", "medicine", "fitness", "diet", "nutrition",
    "mental-health", "wellness", "disease", "treatment", "exercise", "workout", "yoga",
    "patient", "clinic", "surgery", "covid", "vaccine", "therapy", "pharma", "pharmaceutical",
    "cancer", "diabetes", "weight-loss", "ayurveda", "meditation", "sleep",
  ],
  lifestyle: [
    "lifestyle", "fashion", "food", "recipe", "recipes", "home", "design", "beauty",
    "wedding", "parenting", "relationship", "relationships", "interior", "decor", "cooking",
    "garden", "gardening", "pet", "pets", "dating", "horoscope", "astrology", "diy",
    "skincare", "haircare", "fitness", "travel-lifestyle", "minimalism",
  ],
  education: [
    "education", "school", "college", "university", "course", "courses", "learning",
    "student", "students", "teacher", "degree", "exam", "exams", "scholarship", "research",
    "study", "lecture", "curriculum", "academic", "institute", "admission", "upsc", "jee",
    "neet", "mba", "engineering", "science", "mathematics", "history", "geography",
  ],
  business: [
    "business", "company", "entrepreneur", "entrepreneurship", "ceo", "market", "revenue",
    "profit", "acquisition", "merger", "brand", "strategy", "corporate", "enterprise",
    "management", "leadership", "industry", "commerce", "retail", "supply-chain", "startup",
    "funding", "vc", "venture-capital", "valuation", "b2b", "b2c", "ecommerce",
  ],
  travel: [
    "travel", "destination", "destinations", "hotel", "hotels", "flight", "flights",
    "tourism", "trip", "trips", "vacation", "tour", "tours", "itinerary", "backpacking",
    "cruise", "resort", "airline", "passport", "visa", "beach", "mountain", "adventure",
    "trekking", "road-trip", "airbnb", "booking", "places", "explore",
  ],
}

// How long a classification stays fresh before re-checking
const STALE_DAYS = 30

function tokenize(url: string): string[] {
  try {
    const { pathname, hostname } = new URL(url)
    // Use path segments; ignore generic segments like "www", "com", "in", "article", "post"
    const SKIP = new Set(["www", "com", "in", "org", "net", "article", "articles", "post", "posts", "page", "tag", "category", "news", "blog", "the", "and", "for", "with", "from"])
    const tokens = pathname
      .toLowerCase()
      .split(/[\/\-_\.]+/)
      .filter(t => t.length > 2 && !SKIP.has(t))

    // Also check hostname TLD-stripped (e.g. "techcrunch" from techcrunch.com)
    const hostParts = hostname.replace(/^www\./, "").split(".")
    if (hostParts[0] && hostParts[0].length > 3) tokens.push(hostParts[0])

    return tokens
  } catch {
    return url
      .toLowerCase()
      .split(/[\/\-_\.\s]+/)
      .filter(t => t.length > 2)
  }
}

function scoreCategories(tokens: string[]): Array<{ category: ContentCategory; score: number }> {
  const scores: Partial<Record<ContentCategory, number>> = {}

  for (const category of ALL_CATEGORIES) {
    const keywords = KEYWORDS[category]
    let hits = 0
    for (const kw of keywords) {
      // Exact match scores 1; substring match (both ways for compound words) scores 0.5
      if (tokens.includes(kw)) {
        hits += 1
      } else if (tokens.some(t => (t.includes(kw) || kw.includes(t)) && Math.min(t.length, kw.length) >= 5)) {
        hits += 0.5
      }
    }
    if (hits > 0) {
      // Scale: 3+ keyword hits → confidence ≥ 0.6; max 0.95
      scores[category] = Math.min((hits / 3) * 0.6 + 0.1, 0.95)
    }
  }

  return (Object.entries(scores) as [ContentCategory, number][])
    .sort((a, b) => b[1] - a[1])
    .map(([category, score]) => ({ category, score }))
}

export type ClassificationResult = {
  categories: ContentCategory[]
  confidence: number
}

// Returns the cached or freshly computed classification for a URL.
// Writes the result to content_classifications for future lookups.
// Safe to call from a background/async context — will not throw.
export async function classifyContent(url: string): Promise<ClassificationResult> {
  try {
    const [cached] = await db
      .select({ categories: contentClassifications.categories, confidence: contentClassifications.confidence, classifiedAt: contentClassifications.classifiedAt })
      .from(contentClassifications)
      .where(eq(contentClassifications.url, url))
      .limit(1)

    const staleThreshold = new Date(Date.now() - STALE_DAYS * 24 * 60 * 60 * 1000)
    if (cached && cached.confidence >= 0.5 && cached.classifiedAt > staleThreshold) {
      return { categories: cached.categories as ContentCategory[], confidence: cached.confidence }
    }

    const tokens = tokenize(url)
    const scored = scoreCategories(tokens)
    const topCategories = scored.slice(0, 3).map(s => s.category)
    const confidence = scored.length > 0 ? scored[0].score : 0

    if (topCategories.length > 0) {
      await db
        .insert(contentClassifications)
        .values({ url, categories: topCategories, confidence, classifiedAt: new Date() })
        .onConflictDoUpdate({
          target: contentClassifications.url,
          set: { categories: topCategories, confidence, classifiedAt: new Date() },
        })
    }

    return { categories: topCategories, confidence }
  } catch {
    return { categories: [], confidence: 0 }
  }
}

// Batch-classify a list of URLs, returning a map of url → categories.
// Fetches all cached entries in one query, then classifies misses individually.
export async function classifyContentBatch(urls: string[]): Promise<Map<string, ContentCategory[]>> {
  const result = new Map<string, ContentCategory[]>()
  if (urls.length === 0) return result

  const unique = [...new Set(urls)]
  const staleThreshold = new Date(Date.now() - STALE_DAYS * 24 * 60 * 60 * 1000)

  const cached = await db
    .select({ url: contentClassifications.url, categories: contentClassifications.categories, confidence: contentClassifications.confidence, classifiedAt: contentClassifications.classifiedAt })
    .from(contentClassifications)
    .where(
      unique.length === 1
        ? eq(contentClassifications.url, unique[0])
        : (await import("drizzle-orm")).inArray(contentClassifications.url, unique),
    )

  const cachedMap = new Map(cached
    .filter(r => r.confidence >= 0.5 && r.classifiedAt > staleThreshold)
    .map(r => [r.url, r.categories as ContentCategory[]])
  )

  for (const url of unique) {
    if (cachedMap.has(url)) {
      result.set(url, cachedMap.get(url)!)
      continue
    }
    // Classify inline for cache misses (background context, no perf concern)
    const { categories } = await classifyContent(url)
    result.set(url, categories)
  }

  return result
}
