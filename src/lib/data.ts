/**
 * Data access layer. Pages only ever call these functions, so switching from
 * sample content to Supabase later means changing this one file.
 */
import * as sample from "@/data/sample";
import type { Article, Listing, ListingType, PricingModel, Spotlight, Sport, Tip } from "./types";

export type ListingFilter = {
  type?: ListingType;
  sport?: string;
  pricing?: PricingModel;
  q?: string;
  featured?: boolean;
};

export async function getSports(): Promise<Sport[]> {
  return sample.sports;
}

export async function getListings(filter: ListingFilter = {}): Promise<Listing[]> {
  const q = filter.q?.trim().toLowerCase();
  return sample.listings.filter((l) => {
    if (filter.type && !l.types.includes(filter.type)) return false;
    if (filter.sport && !l.sports.includes(filter.sport)) return false;
    if (filter.pricing && l.pricing !== filter.pricing) return false;
    if (filter.featured && !l.isFeatured) return false;
    if (q) {
      const haystack = [l.name, l.tagline, l.bio, l.category ?? "", ...l.sports, ...(l.markets ?? [])]
        .join(" ")
        .toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    return true;
  });
}

export async function getListing(slug: string): Promise<Listing | undefined> {
  return sample.listings.find((l) => l.slug === slug);
}

export async function getTips(filter: { sport?: string; listingSlug?: string } = {}): Promise<Tip[]> {
  return sample.tips
    .filter((t) => (!filter.sport || t.sport === filter.sport) && (!filter.listingSlug || t.listingSlug === filter.listingSlug))
    .sort((a, b) => b.eventStart.localeCompare(a.eventStart));
}

export async function getArticles(): Promise<Article[]> {
  return sample.articles;
}

export async function getSpotlight(): Promise<Spotlight | undefined> {
  return sample.spotlight;
}

/** Record from tips graded on Grinners only. Never mixes in a creator's own claims. */
export function gradedRecord(tips: Tip[]) {
  const graded = tips.filter((t) => t.result === "won" || t.result === "lost");
  const won = graded.filter((t) => t.result === "won").length;
  return { won, lost: graded.length - won, graded: graded.length };
}
