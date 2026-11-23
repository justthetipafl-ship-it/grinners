import type { Metadata } from "next";
import Link from "next/link";
import { ListingCard } from "@/components/Cards";
import { getListings } from "@/lib/data";
import { SavedLoader } from "./SavedLoader";

export const metadata: Metadata = { title: "Saved", robots: { index: false } };

export default async function SavedPage({ searchParams }: { searchParams: Promise<{ s?: string }> }) {
  const shown = (await searchParams).s ?? "";
  const slugs = shown
    .split(",")
    .map((s) => s.trim())
    .filter((s) => /^[a-z0-9-]{1,80}$/.test(s))
    .slice(0, 200);
  const all = slugs.length ? await getListings() : [];
  // Kept in the order they were saved, newest first.
  const listings = slugs.map((slug) => all.find((l) => l.slug === slug)).filter((l): l is NonNullable<typeof l> => Boolean(l));

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <SavedLoader shown={shown} />
      <h1 className="display text-5xl uppercase">Saved</h1>
      <p className="mt-2 max-w-2xl text-muted">
        Listings you&apos;ve saved on this device. There&apos;s no account: the list stays in this browser, so it won&apos;t follow you to another phone or computer.
      </p>
      {listings.length ? (
        <ul className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {listings.map((listing) => (
            <li key={listing.slug}>
              <ListingCard listing={listing} />
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-10 rounded-card border border-dashed border-line p-8 text-muted">
          Nothing saved yet. Open any listing and press Save.{" "}
          <Link href="/tools" className="text-fg underline">
            Browse tools
          </Link>
          .
        </p>
      )}
    </div>
  );
}
