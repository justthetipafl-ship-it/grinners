import type { Metadata } from "next";
import Link from "next/link";
import { TipCard } from "@/components/Cards";
import { getListings, getSports, getTips } from "@/lib/data";

export const metadata: Metadata = {
  title: "Free Tips",
  description: "Free betting selections with the reasoning attached, locked at event start and graded afterwards.",
};

export default async function TipsPage({ searchParams }: { searchParams: Promise<{ sport?: string }> }) {
  const { sport } = await searchParams;
  const [tips, sports, listings] = await Promise.all([getTips({ sport }), getSports(), getListings()]);
  const bySlug = new Map(listings.map((l) => [l.slug, l]));
  const chip = (active: boolean) =>
    `shrink-0 rounded-full border px-3.5 py-2 text-sm ${active ? "border-fg bg-fg text-ink" : "border-line text-muted hover:text-fg"}`;

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="display text-4xl uppercase sm:text-5xl">Free Tips</h1>
      <p className="mt-2 max-w-2xl text-muted">
        Every tip is locked when the event starts and graded afterwards, so the record you see is the real one. Tips are opinions, not
        advice. Odds are decimal and may have moved.
      </p>
      <div className="no-scrollbar -mx-4 mt-6 flex gap-2 overflow-x-auto px-4" aria-label="Filter by sport">
        <Link href="/tips" scroll={false} className={chip(!sport)}>
          All sports
        </Link>
        {sports.map((s) => (
          <Link key={s.slug} href={`/tips?sport=${s.slug}`} scroll={false} className={chip(sport === s.slug)}>
            {s.name}
          </Link>
        ))}
      </div>
      {tips.length ? (
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {tips.map((t) => (
            <TipCard key={t.id} tip={t} author={bySlug.get(t.listingSlug)} />
          ))}
        </div>
      ) : (
        <p className="mt-6 rounded-card border border-dashed border-line p-10 text-center text-muted">No tips for that sport yet.</p>
      )}
    </div>
  );
}
