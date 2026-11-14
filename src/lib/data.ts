/**
 * Data access layer. Pages only ever call these functions.
 * With Supabase connected they read the database; without it they read sample content.
 */
import * as sample from "@/data/sample";
import { isConfigured, publicClient } from "./supabase";
import type { Article, ContentItem, Listing, ListingType, PricingModel, Spotlight, Sport, Tip } from "./types";

export type ListingFilter = {
  type?: ListingType;
  sport?: string;
  pricing?: PricingModel;
  q?: string;
  featured?: boolean;
  /** Category name turned into a web-safe slug, e.g. "player-prop-research". */
  category?: string;
};

export const categorySlug = (name: string) =>
  name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

export const initialsOf = (name: string) =>
  name
    .replace(/[^A-Za-z0-9 ]/g, "")
    .split(/\s+/)
    .filter((w) => w && !["the", "and", "of"].includes(w.toLowerCase()))
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join("") || "G";

function warn(what: string, error: { message: string } | null) {
  if (error) console.error(`[data] ${what}: ${error.message}`);
}

/* eslint-disable @typescript-eslint/no-explicit-any -- rows arrive from the database untyped */
function toListing(row: any): Listing {
  const link = (row.affiliate_links ?? []).find((a: any) => a.is_active);
  return {
    slug: row.slug,
    name: row.name,
    types: row.types,
    tagline: row.tagline,
    bio: row.bio,
    initials: initialsOf(row.name),
    logoUrl: row.logo_url ?? undefined,
    // An uploaded preview image wins; otherwise fall back to artwork found in the feed.
    coverUrl: row.cover_url ?? row.attributes?.feed_image ?? undefined,
    sports: row.sports ?? [],
    markets: row.markets?.length ? row.markets : undefined,
    // Several categories live in the listing's extra attributes; older rows have just the one column.
    categories: Array.isArray(row.attributes?.categories) && row.attributes.categories.length
      ? row.attributes.categories.map(String)
      : row.category
        ? [row.category]
        : undefined,
    pricing: row.pricing,
    pricingNote: row.pricing_note ?? undefined,
    links: [...(row.listing_links ?? [])]
      .sort((a: any, b: any) => a.sort_order - b.sort_order)
      .map((l: any) => ({ platform: l.platform, url: l.url })),
    cta: link ? { label: link.label, url: `/go/${link.slug}`, affiliate: link.is_affiliate } : undefined,
    isFeatured: row.is_featured,
    featuredOrder: typeof row.attributes?.featured_order === "number" ? row.attributes.featured_order : undefined,
    isSponsored: row.is_sponsored,
    ownershipDisclosure: row.ownership_disclosure ?? undefined,
    features: row.features?.length ? row.features : undefined,
  };
}

function toTip(row: any): Tip {
  return {
    id: row.id,
    listingSlug: row.listings?.slug ?? "",
    sport: row.sports?.slug ?? "",
    competition: row.competitions?.name ?? row.sports?.name ?? "",
    event: row.event_name,
    eventStart: row.event_start,
    market: row.markets?.name ?? row.market_label ?? "",
    selection: row.selection,
    odds: Number(row.odds),
    bookmaker: row.bookmaker ?? undefined,
    analysis: row.analysis,
    result: row.result,
  };
}
/* eslint-enable @typescript-eslint/no-explicit-any */

const LISTING_COLUMNS = "*, listing_links(platform, url, sort_order), affiliate_links(slug, label, is_affiliate, is_active)";

export async function getSports(): Promise<Sport[]> {
  if (!isConfigured) return sample.sports;
  const { data, error } = await publicClient().from("sports").select("slug, name").order("sort_order");
  warn("sports", error);
  return data ?? [];
}

export async function getListings(filter: ListingFilter = {}): Promise<Listing[]> {
  const q = filter.q?.trim().toLowerCase();

  if (!isConfigured) {
    return sample.listings.filter((l) => {
      if (filter.type && !l.types.includes(filter.type)) return false;
      if (filter.sport && !l.sports.includes(filter.sport)) return false;
      if (filter.pricing && l.pricing !== filter.pricing) return false;
      if (filter.featured && !l.isFeatured) return false;
      if (filter.category && !(l.categories ?? []).some((c) => categorySlug(c) === filter.category)) return false;
      if (q) {
        const haystack = [l.name, l.tagline, l.bio, ...(l.categories ?? []), ...l.sports, ...(l.markets ?? [])].join(" ").toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }

  let query = publicClient().from("listings").select(LISTING_COLUMNS).eq("status", "published");
  if (filter.type) query = query.contains("types", [filter.type]);
  if (filter.sport) query = query.contains("sports", [filter.sport]);
  if (filter.pricing) query = query.eq("pricing", filter.pricing);
  if (filter.featured) query = query.eq("is_featured", true);
  if (q) {
    // Strip characters that have special meaning in the filter syntax.
    const safe = q.replace(/[^a-z0-9 &'-]/g, " ").trim();
    if (!safe) return [];
    const slugLike = safe.replace(/\s+/g, "-");
    query = query.or(`name.ilike.%${safe}%,tagline.ilike.%${safe}%,bio.ilike.%${safe}%,category.ilike.%${safe}%,attributes->>categories.ilike.%${safe}%,sports.cs.{${slugLike}}`);
  }
  const { data, error } = filter.featured
    ? await query.order("updated_at", { ascending: false })
    : await query.order("is_featured", { ascending: false }).order("name");
  warn("listings", error);
  // Featured listings lead, in the order set under Admin > Featured order. Everything else keeps the query's order.
  const place = (l: Listing) => (l.isFeatured ? (l.featuredOrder ?? Number.MAX_SAFE_INTEGER - 1) : Number.MAX_SAFE_INTEGER);
  const listings = (data ?? []).map(toListing).sort((a, b) => place(a) - place(b));
  return filter.category ? listings.filter((l) => (l.categories ?? []).some((c) => categorySlug(c) === filter.category)) : listings;
}

/**
 * Listings of one type ranked by outbound clicks over the last 30 days.
 * Returns null when there isn't enough click data yet (or the ranking function hasn't been
 * added to the database), so the caller can fall back to featured listings and label it honestly.
 */
export async function getPopularListings(type: ListingType, limit = 3): Promise<Listing[] | null> {
  if (!isConfigured) return null;
  const supabase = publicClient();
  const ranked = await supabase.rpc("popular_listing_ids", { p_type: type, p_days: 30, p_limit: limit });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ids: string[] = ranked.error ? [] : (ranked.data ?? []).map((r: any) => r.listing_id);
  if (ids.length < limit) return null;
  const { data, error } = await supabase.from("listings").select(LISTING_COLUMNS).eq("status", "published").in("id", ids);
  warn("popular listings", error);
  if (!data || data.length < limit) return null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const byId = new Map(data.map((row: any) => [row.id, row]));
  return ids.flatMap((id) => (byId.has(id) ? [toListing(byId.get(id))] : []));
}

export async function getListing(slug: string): Promise<Listing | undefined> {
  if (!isConfigured) return sample.listings.find((l) => l.slug === slug);
  const { data, error } = await publicClient().from("listings").select(LISTING_COLUMNS).eq("status", "published").eq("slug", slug).maybeSingle();
  warn("listing", error);
  return data ? toListing(data) : undefined;
}

export async function getTips(filter: { sport?: string; listingSlug?: string } = {}): Promise<Tip[]> {
  if (!isConfigured) {
    return sample.tips
      .filter((t) => (!filter.sport || t.sport === filter.sport) && (!filter.listingSlug || t.listingSlug === filter.listingSlug))
      .sort((a, b) => b.eventStart.localeCompare(a.eventStart));
  }
  let query = publicClient()
    .from("tips")
    .select("*, listings!inner(slug), sports!inner(slug, name), competitions(name), markets(name)")
    .eq("status", "published");
  if (filter.sport) query = query.eq("sports.slug", filter.sport);
  if (filter.listingSlug) query = query.eq("listings.slug", filter.listingSlug);
  const { data, error } = await query.order("event_start", { ascending: false }).limit(60);
  warn("tips", error);
  return (data ?? []).map(toTip);
}

export async function getArticles(): Promise<Article[]> {
  if (!isConfigured) return sample.articles;
  const { data, error } = await publicClient()
    .from("articles")
    .select("slug, title, excerpt, author_name, published_at, is_sponsored, categories(name)")
    .eq("status", "published")
    .order("published_at", { ascending: false })
    .limit(30);
  warn("articles", error);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data ?? []).map((a: any) => ({
    slug: a.slug,
    title: a.title,
    excerpt: a.excerpt,
    category: a.categories?.name ?? "Article",
    author: a.author_name,
    publishedAt: a.published_at,
    isSponsored: a.is_sponsored,
  }));
}

export async function getArticle(slug: string): Promise<Article | undefined> {
  if (!isConfigured) return sample.articles.find((a) => a.slug === slug);
  const { data, error } = await publicClient()
    .from("articles")
    .select("slug, title, excerpt, body, author_name, published_at, is_sponsored, sponsor_name, categories(name)")
    .eq("status", "published")
    .eq("slug", slug)
    .maybeSingle();
  warn("article", error);
  if (!data) return undefined;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const a = data as any;
  return {
    slug: a.slug,
    title: a.title,
    excerpt: a.excerpt,
    body: a.body || undefined,
    category: a.categories?.name ?? "Article",
    author: a.author_name,
    publishedAt: a.published_at,
    isSponsored: a.is_sponsored,
    sponsorName: a.sponsor_name ?? undefined,
  };
}

/** Today's date in Brisbane, as YYYY-MM-DD. */
const brisbaneToday = () => new Date(Date.now() + 10 * 3_600_000).toISOString().slice(0, 10);

/** Spotlights that have started, newest first. Includes finished ones for the archive page. */
export async function getSpotlights(): Promise<Spotlight[]> {
  if (!isConfigured) return [sample.spotlight];
  const { data, error } = await publicClient()
    .from("spotlights")
    .select("kind, headline, body, is_sponsored, starts_on, listings!inner(slug)")
    .lte("starts_on", brisbaneToday())
    .order("starts_on", { ascending: false })
    .limit(60);
  warn("spotlights", error);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data ?? []).map((row: any) => ({
    kind: row.kind,
    listingSlug: row.listings.slug,
    headline: row.headline,
    body: row.body,
    isSponsored: row.is_sponsored,
    startsOn: row.starts_on,
  }));
}

/** The spotlight running today, if any. */
export async function getSpotlight(): Promise<Spotlight | undefined> {
  if (!isConfigured) return sample.spotlight;
  const today = brisbaneToday();
  const { data, error } = await publicClient()
    .from("spotlights")
    .select("kind, headline, body, is_sponsored, starts_on, listings!inner(slug)")
    .lte("starts_on", today)
    .gte("ends_on", today)
    .order("starts_on", { ascending: false })
    .limit(1)
    .maybeSingle();
  warn("spotlight", error);
  if (!data) return undefined;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const row = data as any;
  return { kind: row.kind, listingSlug: row.listings.slug, headline: row.headline, body: row.body, isSponsored: row.is_sponsored, startsOn: row.starts_on };
}

export async function getTip(id: string): Promise<Tip | undefined> {
  if (!isConfigured) return sample.tips.find((t) => t.id === id);
  if (!/^[0-9a-f-]{36}$/i.test(id)) return undefined;
  const { data, error } = await publicClient()
    .from("tips")
    .select("*, listings!inner(slug), sports!inner(slug, name), competitions(name), markets(name)")
    .eq("status", "published")
    .eq("id", id)
    .maybeSingle();
  warn("tip", error);
  return data ? toTip(data) : undefined;
}

/**
 * Latest videos and episodes pulled from listings' feeds.
 * With `onePerListing`, each show or channel appears once (its newest item), featured listings first,
 * so one busy channel can't fill a whole row.
 */
export async function getContent(
  filter: { listingSlug?: string; kind?: "episode" | "video"; limit?: number; onePerListing?: boolean } = {},
): Promise<ContentItem[]> {
  if (!isConfigured) return [];
  const limit = filter.limit ?? 6;
  let query = publicClient().from("content_items").select("kind, title, url, thumbnail_url, published_at, listings!inner(name, slug, is_featured, attributes)");
  if (filter.listingSlug) query = query.eq("listings.slug", filter.listingSlug);
  if (filter.kind) query = query.eq("kind", filter.kind);
  const { data, error } = await query.order("published_at", { ascending: false }).limit(filter.onePerListing ? 120 : limit);
  warn("content", error);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let rows = (data ?? []) as any[];
  if (filter.onePerListing) {
    const seen = new Set<string>();
    rows = rows.filter((row) => !seen.has(row.listings?.slug) && seen.add(row.listings?.slug));
    // Featured listings first; within each group the newest stays first.
    const order = (r: any) => r.listings?.attributes?.featured_order ?? Number.MAX_SAFE_INTEGER; // eslint-disable-line @typescript-eslint/no-explicit-any
    const featuredRows = rows.filter((r) => r.listings?.is_featured).sort((a, b) => order(a) - order(b));
    rows = [...featuredRows, ...rows.filter((r) => !r.listings?.is_featured)].slice(0, limit);
  }
  return rows.map((c) => ({
    kind: c.kind,
    title: c.title,
    url: c.url,
    thumbnailUrl: c.thumbnail_url ?? undefined,
    publishedAt: c.published_at,
    listingName: c.listings?.name,
    listingSlug: c.listings?.slug,
  }));
}

/** Record from tips graded on Grinners only. Never mixes in a creator's own claims. */
export function gradedRecord(tips: Tip[]) {
  const graded = tips.filter((t) => t.result === "won" || t.result === "lost");
  const won = graded.filter((t) => t.result === "won").length;
  return { won, lost: graded.length - won, graded: graded.length };
}
