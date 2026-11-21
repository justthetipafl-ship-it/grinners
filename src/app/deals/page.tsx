import type { Metadata } from "next";
import Link from "next/link";
import { ListingCard } from "@/components/Cards";
import { getListings } from "@/lib/data";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Deals",
  description: "Discounts and trials that tools and creators offer Grinners visitors. No bookmaker offers.",
};

export default async function DealsPage() {
  const deals = (await getListings()).filter((l) => l.deal);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="display text-5xl uppercase">Deals</h1>
      <p className="mt-2 max-w-2xl text-muted">
        Discounts and trials that tools and creators offer Grinners visitors. No bookmaker or betting-account offers, ever.{" "}
        <Link href="/editorial-policy#certified" className="text-fg underline">
          How deals work
        </Link>
        .
      </p>

      {deals.length === 0 ? (
        <p className="mt-10 rounded-card border border-line bg-surface p-6 text-muted">No deals running right now. Check back soon.</p>
      ) : (
        <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {deals.map((listing) => (
            <li key={listing.slug} className="flex flex-col gap-2">
              <div className="flex items-center gap-3 rounded-control border border-fg/30 bg-raised px-3 py-2">
                <p className="flex-1 text-sm font-semibold">{listing.deal!.text}</p>
                {listing.deal!.url && (
                  <a
                    href={`/go/deal/${listing.slug}`}
                    target="_blank"
                    rel={listing.deal!.affiliate ? "sponsored nofollow noopener" : "nofollow noopener"}
                    className="flex h-9 shrink-0 items-center rounded-control bg-fg px-3 text-xs font-semibold text-ink hover:brightness-90"
                  >
                    Claim{listing.deal!.affiliate ? " (affiliate)" : ""}
                  </a>
                )}
              </div>
              <div className="flex-1">
                <ListingCard listing={listing} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
