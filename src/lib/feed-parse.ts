/**
 * Reads the two feed formats Grinners cares about, with no outside libraries:
 * YouTube channel feeds (Atom) and podcast feeds (RSS).
 */
export type FeedItem = {
  externalId: string;
  title: string;
  url: string;
  thumbnailUrl?: string;
  publishedAt: string;
};

export type ParsedFeed = { kind: "video" | "episode"; image?: string; items: FeedItem[] };

const ENTITIES: Record<string, string> = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", "#39": "'" };

function decode(value: string) {
  return value
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&(#x?[0-9a-f]+|\w+);/gi, (whole, code: string) => {
      if (code[0] === "#") {
        const point = code[1].toLowerCase() === "x" ? parseInt(code.slice(2), 16) : parseInt(code.slice(1), 10);
        return Number.isFinite(point) && point > 0 && point < 0x110000 ? String.fromCodePoint(point) : whole;
      }
      return ENTITIES[code.toLowerCase()] ?? whole;
    })
    .trim();
}

const esc = (name: string) => name.replace(/[:.]/g, "\\$&");
const inner = (xml: string, tag: string) => {
  const match = xml.match(new RegExp(`<${esc(tag)}(?:\\s[^>]*)?>([\\s\\S]*?)</${esc(tag)}>`, "i"));
  return match ? decode(match[1]) : undefined;
};
const attr = (xml: string, tag: string, name: string) => {
  const match = xml.match(new RegExp(`<${esc(tag)}\\s[^>]*?\\b${name}\\s*=\\s*["']([^"']+)["']`, "i"));
  return match ? decode(match[1]) : undefined;
};
const blocks = (xml: string, tag: string) => xml.match(new RegExp(`<${tag}[\\s>][\\s\\S]*?</${tag}>`, "gi")) ?? [];
const httpUrl = (value: string | undefined) => (value && /^https?:\/\//i.test(value) ? value : undefined);
const isoDate = (value: string | undefined) => {
  const time = value ? Date.parse(value) : NaN;
  return Number.isFinite(time) ? new Date(time).toISOString() : undefined;
};

export function parseFeed(xml: string, limit = 5): ParsedFeed {
  const entries = blocks(xml, "entry");
  if (entries.length) {
    // YouTube (Atom)
    const items = entries.flatMap((entry): FeedItem[] => {
      const videoId = inner(entry, "yt:videoId");
      const url = httpUrl(attr(entry, "link", "href")) ?? (videoId ? `https://www.youtube.com/watch?v=${videoId}` : undefined);
      const title = inner(entry, "title");
      const publishedAt = isoDate(inner(entry, "published") ?? inner(entry, "updated"));
      if (!url || !title || !publishedAt) return [];
      return [
        {
          externalId: videoId ?? inner(entry, "id") ?? url,
          title,
          url,
          thumbnailUrl: httpUrl(attr(entry, "media:thumbnail", "url")) ?? (videoId ? `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg` : undefined),
          publishedAt,
        },
      ];
    });
    return { kind: "video", image: items[0]?.thumbnailUrl, items: items.slice(0, limit) };
  }

  // Podcast (RSS)
  const head = xml.split(/<item[\s>]/i)[0] ?? "";
  const image = httpUrl(attr(head, "itunes:image", "href")) ?? httpUrl(inner(inner(head, "image") ? head.match(/<image[\s>][\s\S]*?<\/image>/i)?.[0] ?? "" : "", "url"));
  const items = blocks(xml, "item").flatMap((item): FeedItem[] => {
    const title = inner(item, "title");
    const url = httpUrl(inner(item, "link")) ?? httpUrl(attr(item, "enclosure", "url"));
    const publishedAt = isoDate(inner(item, "pubDate"));
    if (!url || !title || !publishedAt) return [];
    return [
      {
        externalId: (inner(item, "guid") ?? url).slice(0, 300),
        title,
        url,
        thumbnailUrl: httpUrl(attr(item, "itunes:image", "href")) ?? image,
        publishedAt,
      },
    ];
  });
  items.sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
  return { kind: "episode", image, items: items.slice(0, limit) };
}

/** Finds a channel's feed address inside a YouTube channel page. */
export function youtubeFeedFromPage(html: string) {
  const id = html.match(/feeds\/videos\.xml\?channel_id=(UC[\w-]{22})/)?.[1] ?? html.match(/"(?:channelId|externalId)":"(UC[\w-]{22})"/)?.[1];
  return id ? `https://www.youtube.com/feeds/videos.xml?channel_id=${id}` : undefined;
}

/** Accepts a feed address, a bare YouTube channel ID, or a YouTube channel page address. */
export function normaliseFeedInput(input: string): { feedUrl?: string; pageUrl?: string } {
  const value = input.trim();
  if (/^UC[\w-]{22}$/.test(value)) return { feedUrl: `https://www.youtube.com/feeds/videos.xml?channel_id=${value}` };
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return {};
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") return {};
  const host = url.hostname.replace(/^www\.|^m\./, "");
  if (host === "youtube.com") {
    if (url.pathname.startsWith("/feeds/")) return { feedUrl: url.toString() };
    const channel = url.pathname.match(/^\/channel\/(UC[\w-]{22})/)?.[1];
    if (channel) return { feedUrl: `https://www.youtube.com/feeds/videos.xml?channel_id=${channel}` };
    return { pageUrl: url.toString() };
  }
  return { feedUrl: url.toString() };
}
