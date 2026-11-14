import type { MetadataRoute } from "next";
import { listingHref } from "@/components/Cards";
import { getArticles, getListings, getSports } from "@/lib/data";
import { SITE_URL } from "@/lib/site";
import { DIRECTORIES } from "@/lib/types";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [listings, articles, sports] = await Promise.all([getListings(), getArticles(), getSports()]);
  const paths = [
    "",
    ...Object.keys(DIRECTORIES).map((d) => `/${d}`),
    "/tips",
    "/articles",
    "/about",
    "/how-we-make-money",
    "/editorial-policy",
    "/responsible-gambling",
    "/submit",
    ...sports.map((s) => `/sports/${s.slug}`),
    ...listings.map(listingHref),
    ...articles.map((a) => `/articles/${a.slug}`),
  ];
  return paths.map((path) => ({ url: `${SITE_URL}${path}` }));
}
