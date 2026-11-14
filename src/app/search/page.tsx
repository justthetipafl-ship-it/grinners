import type { Metadata } from "next";
import { ListingCard, SearchForm } from "@/components/Cards";
import { getListings } from "@/lib/data";

export const metadata: Metadata = { title: "Search", robots: { index: false } };

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q = "" } = await searchParams;
  const results = q.trim() ? await getListings({ q }) : [];

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="display text-4xl uppercase sm:text-5xl">Search</h1>
      <div className="mt-6">
        <SearchForm defaultValue={q} large />
      </div>
      {q.trim() && (
        <p className="mt-6 font-mono text-xs text-muted">
          {results.length} {results.length === 1 ? "result" : "results"} for &ldquo;{q}&rdquo;
        </p>
      )}
      <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {results.map((l) => (
          <ListingCard key={l.slug} listing={l} />
        ))}
      </div>
      {q.trim() && results.length === 0 && (
        <p className="rounded-card border border-dashed border-line p-10 text-center text-muted">
          Nothing found. Try a sport, a market or a name.
        </p>
      )}
    </div>
  );
}
