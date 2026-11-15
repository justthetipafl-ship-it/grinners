export type ListingType = "tipster" | "tool" | "podcast" | "youtube" | "creator";
export type PricingModel = "free" | "paid" | "freemium";
export type TipResult = "pending" | "won" | "lost" | "void";

export type Sport = { slug: string; name: string };

export type Listing = {
  slug: string;
  name: string;
  types: ListingType[];
  tagline: string;
  bio: string;
  /** Two-letter monogram shown until a real logo is uploaded. */
  initials: string;
  logoUrl?: string;
  /** Wide preview image: a tool screenshot, channel banner or show artwork. */
  coverUrl?: string;
  sports: string[];
  markets?: string[];
  /** Tool categories. A listing can sit in several. */
  categories?: string[];
  /** Two-letter country of origin, shown as a flag. */
  country?: string;
  pricing: PricingModel;
  pricingNote?: string;
  links: { platform: string; url: string }[];
  /** Main outbound button. `affiliate` adds the disclosure badge and rel="sponsored". */
  cta?: { label: string; url: string; affiliate: boolean };
  isFeatured?: boolean;
  /** Hand-set position among featured listings; lower shows first. */
  featuredOrder?: number;
  isSponsored?: boolean;
  ownershipDisclosure?: string;
  features?: string[];
};

export type Tip = {
  id: string;
  listingSlug: string;
  sport: string;
  competition: string;
  event: string;
  eventStart: string;
  market: string;
  selection: string;
  odds: number;
  bookmaker?: string;
  analysis: string;
  result: TipResult;
};

export type Article = {
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  author: string;
  publishedAt: string;
  isSponsored?: boolean;
  sponsorName?: string;
  body?: string;
};

export type ContentItem = {
  kind: "episode" | "video" | "x_post";
  title: string;
  url: string;
  thumbnailUrl?: string;
  publishedAt: string;
  listingName?: string;
  listingSlug?: string;
};

export type Spotlight = {
  kind: string;
  listingSlug: string;
  headline: string;
  body: string;
  isSponsored?: boolean;
  startsOn?: string;
};

export const DIRECTORIES = {
  tipsters: { type: "tipster", title: "Tipsters", blurb: "Tipsters and cappers, free and paid, vetted before they're listed." },
  tools: { type: "tool", title: "Tools", blurb: "Research, analytics and tracking tools for punters and fantasy players." },
  podcasts: { type: "podcast", title: "Podcasts", blurb: "Betting and fantasy shows worth your commute." },
  youtube: { type: "youtube", title: "YouTube", blurb: "Channels breaking down the slate, the stats and the strategy." },
  creators: { type: "creator", title: "Creators", blurb: "Analysts, personalities and accounts that make sport smarter." },
} as const satisfies Record<string, { type: ListingType; title: string; blurb: string }>;

export type DirectoryKey = keyof typeof DIRECTORIES;

export const directoryForType = (type: ListingType): DirectoryKey =>
  (Object.keys(DIRECTORIES) as DirectoryKey[]).find((k) => DIRECTORIES[k].type === type)!;
