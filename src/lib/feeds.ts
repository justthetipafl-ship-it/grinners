import type { SupabaseClient } from "@supabase/supabase-js";
import { normaliseFeedInput, parseFeed, youtubeFeedFromPage } from "./feed-parse";

export type FeedSummary = { checked: number; updated: number; failed: { name: string; reason: string }[] };

/** Only public web addresses are fetched: no local network names or raw IP addresses. */
function isPublicAddress(address: string) {
  try {
    const { protocol, hostname } = new URL(address);
    if (protocol !== "https:" && protocol !== "http:") return false;
    if (hostname === "localhost" || hostname.endsWith(".local") || hostname.endsWith(".internal")) return false;
    if (/^[\d.]+$/.test(hostname) || hostname.includes(":")) return false;
    return hostname.includes(".");
  } catch {
    return false;
  }
}

async function fetchText(address: string) {
  if (!isPublicAddress(address)) throw new Error("That address can't be fetched.");
  const response = await fetch(address, {
    signal: AbortSignal.timeout(8000),
    headers: { "User-Agent": "GrinnersFeedReader/1.0", Accept: "application/rss+xml, application/atom+xml, application/xml, text/xml, text/html" },
    cache: "no-store",
  });
  if (!response.ok) throw new Error(`The feed answered with error ${response.status}.`);
  return (await response.text()).slice(0, 3_000_000);
}

const YOUTUBE_CHANNEL_FEED = /^https:\/\/www\.youtube\.com\/feeds\/videos\.xml\?channel_id=UC([\w-]+)$/;

/**
 * YouTube's channel feeds go through spells of answering "not found" for every channel.
 * The channel's uploads playlist feed carries the same videos and is often still up, so try that before giving up.
 */
async function fetchFeed(feedUrl: string) {
  try {
    return await fetchText(feedUrl);
  } catch (problem) {
    const channel = feedUrl.match(YOUTUBE_CHANNEL_FEED);
    if (!channel) throw problem;
    try {
      return await fetchText(`https://www.youtube.com/feeds/videos.xml?playlist_id=UU${channel[1]}`);
    } catch {
      throw new Error("YouTube's feed service isn't answering right now. This happens to every channel at once and usually clears within a few hours. Videos already saved stay on the site.");
    }
  }
}

/** Turns whatever was typed into the feed field into a working feed address. */
export async function resolveFeedUrl(input: string) {
  const { feedUrl, pageUrl } = normaliseFeedInput(input);
  if (feedUrl) return feedUrl;
  if (pageUrl) {
    const found = youtubeFeedFromPage(await fetchText(pageUrl));
    if (found) return found;
    throw new Error("Couldn't find the channel's feed on that page. Paste the channel ID (starts with UC) instead.");
  }
  throw new Error("That isn't a feed address, a YouTube channel address or a channel ID.");
}

/**
 * Pulls the latest videos and episodes for every listing that has a feed set.
 * Works with either an admin's signed-in client or the server's secret-key client.
 */
export async function refreshFeeds(supabase: SupabaseClient): Promise<FeedSummary> {
  const { data: listings, error } = await supabase.from("listings").select("id, name, attributes").not("attributes->>feed_url", "is", null).neq("status", "archived");
  if (error) return { checked: 0, updated: 0, failed: [{ name: "All feeds", reason: error.message }] };

  const summary: FeedSummary = { checked: listings?.length ?? 0, updated: 0, failed: [] };
  await Promise.all(
    (listings ?? []).map(async (listing) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const attributes = (listing.attributes ?? {}) as Record<string, any>;
      try {
        const feedUrl = attributes.feed_resolved ?? (await resolveFeedUrl(String(attributes.feed_url)));
        const feed = parseFeed(await fetchFeed(feedUrl));
        if (!feed.items.length) throw new Error("The feed has no items we could read.");
        const saved = await supabase.from("content_items").upsert(
          feed.items.map((item) => ({
            listing_id: listing.id,
            kind: feed.kind,
            title: item.title.slice(0, 300),
            url: item.url,
            thumbnail_url: item.thumbnailUrl ?? null,
            external_id: item.externalId,
            published_at: item.publishedAt,
          })),
          { onConflict: "listing_id,external_id" },
        );
        if (saved.error) throw new Error(saved.error.message);
        await supabase
          .from("listings")
          .update({ attributes: { ...attributes, feed_resolved: feedUrl, feed_image: feed.image ?? attributes.feed_image ?? null, feed_checked_at: new Date().toISOString(), feed_error: null } })
          .eq("id", listing.id);
        summary.updated += 1;
      } catch (problem) {
        const reason = problem instanceof Error ? (problem.name === "TimeoutError" ? "The feed took too long to answer." : problem.message) : "Unknown problem.";
        summary.failed.push({ name: listing.name, reason });
        await supabase.from("listings").update({ attributes: { ...attributes, feed_error: reason, feed_checked_at: new Date().toISOString() } }).eq("id", listing.id);
      }
    }),
  );
  return summary;
}
