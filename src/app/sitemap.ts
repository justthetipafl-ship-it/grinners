import type { MetadataRoute } from "next";
import { listingHref } from "@/components/Cards";
import { getArticles, getListings, getSpotlights, getSports } from "@/lib/data";
import { getLandings } from "@/lib/landing";
import { SITE_URL } from "@/lib/site";
import { DIRECTORIES } from "@/lib/types";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [listings, articles, sports, landings, spotlights] = await Promise.all([getListings(), getArticles(), getSports(), getLandings(), getSpotlights()]);
  const paths = [
    "",
    ...Object.keys(DIRECTORIES).map((d) => `/${d}`),
    "/tips",
    "/articles",
    "/spotlight",
    "/deals",
    "/about",
    "/how-we-make-money",
    "/editorial-policy",
    "/responsible-gambling",
    "/submit",
    ...sports.map((s) => `/sports/${s.slug}`),
    ...landings.map((l) => l.path),
    ...[...new Set(spotlights.map((sp) => sp.listingSlug))].filter((slug) => listings.some((l) => l.slug === slug)).map((slug) => `/spotlight/${slug}`),
    ...listings.map(listingHref),
    ...articles.map((a) => `/articles/${a.slug}`),
  ];
  return paths.map((path) => ({ url: `${SITE_URL}${path}` }));
}
