import type { Metadata } from "next";
import Link from "next/link";
import { DisclosureBadge, Monogram } from "@/components/Cards";
import { getListings, getSpotlights } from "@/lib/data";

export const metadata: Metadata = {
  title: "Spotlights",
  description: "The tipsters, tools, podcasts and creators Grinners has featured.",
};
export const revalidate = 3600;

const day = new Intl.DateTimeFormat("en-AU", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });

export default async function SpotlightsPage() {
  const [spotlights, listings] = await Promise.all([getSpotlights(), getListings()]);
  const bySlug = new Map(listings.map((l) => [l.slug, l]));
  const shown = spotlights.filter((s) => bySlug.has(s.listingSlug));

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="display text-4xl uppercase sm:text-5xl">Spotlights</h1>
      <p className="mt-2 max-w-2xl text-muted">Who we&apos;ve featured, newest first. Paid spotlights are labelled.{" "}
        <Link href="/spotlight/request" className="text-fg underline">
          Request a spotlight
        </Link>
        .
      </p>
      <ul className="mt-8 flex flex-col gap-3">
        {shown.map((s, i) => {
          const listing = bySlug.get(s.listingSlug)!;
          return (
            <li key={`${s.listingSlug}-${s.startsOn ?? i}`}>
              <Link
                href={`/spotlight/${listing.slug}`}
                className={`flex flex-col gap-4 rounded-card border bg-surface p-5 transition-colors hover:bg-raised sm:flex-row sm:items-center ${i === 0 ? "glow border-spotlight/40" : "border-line"}`}
              >
                <Monogram listing={listing} size="lg" />
                <div className="flex-1">
                  <p className="flex flex-wrap items-center gap-2 text-sm font-semibold text-spotlight">
                    {s.kind}
                    {s.startsOn && <span className="font-normal text-muted">· {day.format(new Date(s.startsOn))}</span>}
                    {s.isSponsored && <DisclosureBadge kind="Sponsored" />}
                  </p>
                  <h2 className="display mt-1 text-2xl">{s.headline}</h2>
                  <p className="mt-1 line-clamp-2 text-muted">{s.body.split("\n")[0]}</p>
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
      {shown.length === 0 && <p className="mt-8 rounded-card border border-dashed border-line p-10 text-center text-muted">No spotlights yet.</p>}
    </div>
  );
}
