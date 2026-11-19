import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ListingCard } from "@/components/Cards";
import { categorySlug, getListings, getSports } from "@/lib/data";
import { Flag } from "@/components/Flag";
import { COUNTRIES } from "@/lib/countries";
import { DIRECTORIES, type DirectoryKey, type PricingModel } from "@/lib/types";

type Props = {
  params: Promise<{ directory: string }>;
  searchParams: Promise<{ sport?: string; pricing?: string; category?: string; country?: string; show?: string }>;
};

export const dynamicParams = false;
export const generateStaticParams = () => Object.keys(DIRECTORIES).map((directory) => ({ directory }));

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { directory } = await params;
  const dir = DIRECTORIES[directory as DirectoryKey];
  if (!dir) return {};
  // Search engines see both the Australian and the US term for the tipsters directory.
  if (directory === "tipsters") {
    return {
      title: "Tipsters and cappers",
      description: "Find sports betting tipsters and cappers across AFL, NRL, racing, NBA, NFL and MLB. Free and paid, vetted before they're listed.",
    };
  }
  return { title: dir.title, description: dir.blurb };
}

const PRICING: { value: PricingModel; label: string }[] = [
  { value: "free", label: "Free" },
  { value: "freemium", label: "Free + paid" },
  { value: "paid", label: "Paid" },
];

function FilterChip({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      scroll={false}
      aria-current={active ? "true" : undefined}
      className={`shrink-0 rounded-full border px-3.5 py-2 text-sm ${active ? "border-fg bg-fg text-ink" : "border-line text-muted hover:text-fg"}`}
    >
      {children}
    </Link>
  );
}

export default async function DirectoryPage({ params, searchParams }: Props) {
  const { directory } = await params;
  const dir = DIRECTORIES[directory as DirectoryKey];
  if (!dir) notFound();

  const { sport, pricing, category, country, show } = await searchParams;
  const [matching, allSports, everything] = await Promise.all([
    getListings({ type: dir.type, sport, pricing: pricing as PricingModel | undefined, category }),
    getSports(),
    getListings({ type: dir.type }),
  ]);
  // Only categories that at least one listing here uses, so no filter leads to an empty page.
  const categories = [...new Set(everything.flatMap((l) => l.categories ?? []))].sort();

  // The same rule for the rest: a sport, country or badge filter only appears when something here would match it.
  const sports = allSports.filter((s) => s.slug === sport || everything.some((l) => l.sports.includes(s.slug)));
  const countries = COUNTRIES.filter((c) => c.code === country || everything.some((l) => l.country === c.code));
  const anyCertified = show === "certified" || everything.some((l) => l.certified);
  const anyDeals = show === "deals" || everything.some((l) => l.deal);
  const listings = matching.filter(
    (l) => (!country || l.country === country) && (show !== "certified" || l.certified) && (show !== "deals" || l.deal),
  );

  // Builds a link that keeps the other filters in place.
  const link = (next: { sport?: string; pricing?: string; category?: string; country?: string; show?: string }) => {
    const query = new URLSearchParams();
    const merged = { sport, pricing, category, country, show, ...next };
    if (merged.country) query.set("country", merged.country);
    if (merged.show) query.set("show", merged.show);
    if (merged.sport) query.set("sport", merged.sport);
    if (merged.pricing) query.set("pricing", merged.pricing);
    if (merged.category) query.set("category", merged.category);
    const qs = query.toString();
    return `/${directory}${qs ? `?${qs}` : ""}`;
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="display text-4xl uppercase sm:text-5xl">{dir.title}</h1>
      <p className="mt-2 max-w-2xl text-muted">{dir.blurb}</p>

      <div className="mt-6 flex flex-col gap-2">
        <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4" aria-label="Filter by sport">
          <FilterChip href={link({ sport: undefined })} active={!sport}>
            All sports
          </FilterChip>
          {sports.map((s) => (
            <FilterChip key={s.slug} href={link({ sport: s.slug })} active={sport === s.slug}>
              {s.name}
            </FilterChip>
          ))}
        </div>
        {categories.length > 1 && (
          <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4" aria-label="Filter by category">
            <FilterChip href={link({ category: undefined })} active={!category}>
              All categories
            </FilterChip>
            {categories.map((c) => (
              <FilterChip key={c} href={link({ category: categorySlug(c) })} active={category === categorySlug(c)}>
                {c}
              </FilterChip>
            ))}
          </div>
        )}
        {(countries.length > 1 || anyCertified || anyDeals) && (
          <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4" aria-label="Filter by country and badge">
            {countries.length > 1 && (
              <>
                <FilterChip href={link({ country: undefined })} active={!country}>
                  Anywhere
                </FilterChip>
                {countries.map((c) => (
                  <FilterChip key={c.code} href={link({ country: c.code })} active={country === c.code}>
                    <span className="flex items-center gap-2">
                      <Flag code={c.code} className="h-3" />
                      {c.name}
                    </span>
                  </FilterChip>
                ))}
              </>
            )}
            {anyCertified && (
              <FilterChip href={link({ show: show === "certified" ? undefined : "certified" })} active={show === "certified"}>
                Certified Grinners
              </FilterChip>
            )}
            {anyDeals && (
              <FilterChip href={link({ show: show === "deals" ? undefined : "deals" })} active={show === "deals"}>
                With a deal
              </FilterChip>
            )}
          </div>
        )}
        <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4" aria-label="Filter by price">
          <FilterChip href={link({ pricing: undefined })} active={!pricing}>
            Any price
          </FilterChip>
          {PRICING.map((p) => (
            <FilterChip key={p.value} href={link({ pricing: p.value })} active={pricing === p.value}>
              {p.label}
            </FilterChip>
          ))}
        </div>
      </div>

      <p className="mt-6 font-mono text-xs text-muted">
        {listings.length} {listings.length === 1 ? "result" : "results"}
      </p>
      {listings.length ? (
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {listings.map((l) => (
            <ListingCard key={l.slug} listing={l} />
          ))}
        </div>
      ) : (
        <div className="mt-3 rounded-card border border-dashed border-line p-10 text-center text-muted">
          Nothing matches those filters yet.{" "}
          <Link href={`/${directory}`} className="text-fg underline">
            Clear filters
          </Link>
        </div>
      )}
    </div>
  );
}
