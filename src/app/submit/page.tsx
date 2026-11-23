import type { Metadata } from "next";
import Link from "next/link";
import { listingHref } from "@/components/Cards";
import { SuggestForm, type SuggestInitial } from "@/components/PublicForms";
import { COUNTRIES } from "@/lib/countries";
import { getListing, getSports } from "@/lib/data";
import type { Listing } from "@/lib/types";

export const metadata: Metadata = {
  title: "Get listed",
  description: "Run a tool, podcast, channel or tipping service? Request your Grinners listing, or suggest someone who belongs here.",
};

/** What the listing says now, laid out the way the form asks for it. */
function currentValues(listing: Listing, sportNames: Map<string, string>): SuggestInitial {
  const find = (...platforms: string[]) => listing.links.find((l) => platforms.includes(l.platform))?.url;
  const website = find("Website");
  const x = find("X");
  const youtube = find("YouTube");
  const podcast = find("Spotify", "Apple Podcasts", "Podcast");
  const used = [website, x, youtube, podcast];
  return {
    name: listing.name,
    url: website ?? listing.links[0]?.url,
    type: listing.types[0],
    sports: listing.sports.map((s) => sportNames.get(s) ?? s).join(", "),
    tagline: listing.tagline,
    bio: listing.bio,
    features: (listing.features ?? []).join("\n"),
    country: listing.country,
    pricing: listing.pricing,
    pricing_note: listing.pricingNote,
    x_url: x,
    youtube_url: youtube,
    podcast_url: podcast,
    other_links: listing.links
      .map((l) => l.url)
      .filter((url) => !used.includes(url))
      .join("\n"),
  };
}

export default async function SubmitPage({ searchParams }: { searchParams: Promise<{ who?: string; update?: string }> }) {
  const { who, update } = await searchParams;
  const listing = update && /^[a-z0-9-]{1,80}$/.test(update) ? await getListing(update) : undefined;

  if (listing) {
    const sportNames = new Map((await getSports()).map((s) => [s.slug, s.name]));
    return (
      <div className="mx-auto max-w-2xl px-4 py-10">
        <h1 className="display text-4xl uppercase sm:text-5xl">Update your listing</h1>
        <p className="mt-2 text-muted">
          This is what{" "}
          <Link href={listingHref(listing)} className="text-fg underline">
            {listing.name}
          </Link>{" "}
          says now. Change anything that&apos;s out of date and send it to us. Updates are for the people who run the listing, so we confirm by email
          before anything changes.
        </p>
        <div className="mt-6">
          <SuggestForm owner countries={COUNTRIES} initial={currentValues(listing, sportNames)} updateOf={listing.slug} />
        </div>
      </div>
    );
  }

  const owner = who !== "someone";
  const tab = (active: boolean) =>
    `flex h-11 items-center rounded-control border px-4 text-sm font-medium ${active ? "border-fg bg-fg text-ink" : "border-line text-muted hover:bg-surface hover:text-fg"}`;

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="display text-4xl uppercase sm:text-5xl">Get listed</h1>
      <p className="mt-2 text-muted">
        Listings are free. We check every request, and we don&apos;t list anyone who promotes unlicensed betting services or promises guaranteed
        profits.
      </p>
      <div className="mt-6 flex flex-wrap gap-2">
        <Link href="/submit" scroll={false} className={tab(owner)} aria-current={owner ? "page" : undefined}>
          List my own work
        </Link>
        <Link href="/submit?who=someone" scroll={false} className={tab(!owner)} aria-current={!owner ? "page" : undefined}>
          Suggest someone else
        </Link>
      </div>
      <div className="mt-6">
        <SuggestForm key={owner ? "owner" : "someone"} owner={owner} countries={COUNTRIES} />
      </div>
      <p className="mt-8 text-sm text-muted">
        Already listed and have a story to tell?{" "}
        <Link href="/spotlight/request" className="text-fg underline">
          Request a spotlight
        </Link>
        .
      </p>
    </div>
  );
}
