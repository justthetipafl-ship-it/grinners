import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SpotlightFeature } from "@/components/SpotlightFeature";
import { getListing, getSpotlights } from "@/lib/data";

type Props = { params: Promise<{ slug: string }> };

export const revalidate = 3600;

/** The most recent spotlight for a listing, with the listing itself. */
async function load(slug: string) {
  const spotlight = (await getSpotlights()).find((s) => s.listingSlug === slug);
  const listing = spotlight ? await getListing(slug) : undefined;
  return spotlight && listing ? { spotlight, listing } : undefined;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const found = await load((await params).slug);
  if (!found) return {};
  const description = found.spotlight.body.split("\n")[0].slice(0, 160);
  return { title: `${found.spotlight.headline} · Spotlight`, description, alternates: { canonical: `/spotlight/${found.listing.slug}` } };
}

export default async function SpotlightFeaturePage({ params }: Props) {
  const found = await load((await params).slug);
  if (!found) notFound();
  const { spotlight, listing } = found;

  return <SpotlightFeature spotlight={spotlight} listing={listing} />;
}
