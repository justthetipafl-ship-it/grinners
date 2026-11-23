import { categorySlug, getListings, getSports } from "@/lib/data";
import { DIRECTORIES, type DirectoryKey, type Listing } from "@/lib/types";

/** A landing page needs at least this many listings, so search engines are never sent to a thin page. */
export const LANDING_MINIMUM = 3;

/** How each directory is described in a page title: "NBA betting tools", "AFL podcasts". */
const NOUN: Record<DirectoryKey, string> = {
  tipsters: "tipsters and cappers",
  tools: "betting and fantasy tools",
  podcasts: "podcasts",
  youtube: "YouTube channels",
  creators: "creators to follow",
  news: "news and alerts",
};

export type Landing = {
  path: string;
  directory: DirectoryKey;
  title: string;
  heading: string;
  intro: string;
  listings: Listing[];
};

/** Certified and featured listings lead, then alphabetical. */
const ordered = (listings: Listing[]) =>
  [...listings].sort((a, b) => Number(b.certified ?? false) - Number(a.certified ?? false) || Number(b.isFeatured) - Number(a.isFeatured) || a.name.localeCompare(b.name));

const count = (n: number) => `${n} ${n === 1 ? "listing" : "listings"}`;

/** Every landing page that currently has enough listings: one per directory and sport, and one per tool category. */
export async function getLandings(): Promise<Landing[]> {
  const [all, sports] = await Promise.all([getListings(), getSports()]);
  const landings: Landing[] = [];

  for (const directory of Object.keys(DIRECTORIES) as DirectoryKey[]) {
    const inDirectory = all.filter((l) => l.types.includes(DIRECTORIES[directory].type));
    for (const sport of sports) {
      const listings = ordered(inDirectory.filter((l) => l.sports.includes(sport.slug)));
      if (listings.length < LANDING_MINIMUM) continue;
      landings.push({
        path: `/${directory}/for/${sport.slug}`,
        directory,
        title: `${sport.name} ${NOUN[directory]}`,
        heading: `${sport.name} ${NOUN[directory]}`,
        intro: `${count(listings.length)} covering ${sport.name}, each checked before it was added. Free and paid options are marked, and anything sponsored is labelled.`,
        listings,
      });
    }
    if (directory !== "tools") continue;
    const categories = [...new Set(inDirectory.flatMap((l) => l.categories ?? []))];
    for (const category of categories) {
      const listings = ordered(inDirectory.filter((l) => (l.categories ?? []).includes(category)));
      if (listings.length < LANDING_MINIMUM) continue;
      landings.push({
        path: `/tools/category/${categorySlug(category)}`,
        directory,
        title: `${category} tools for betting and fantasy`,
        heading: category,
        intro: `${count(listings.length)} in ${category.toLowerCase()}, each checked before it was added. Free and paid options are marked, and anything sponsored is labelled.`,
        listings,
      });
    }
  }
  return landings;
}

export async function getLanding(path: string): Promise<Landing | undefined> {
  return (await getLandings()).find((l) => l.path === path);
}
