import { getLandings } from "@/lib/landing";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ListingCard } from "@/components/Cards";
import { categorySlug, getListings, getPopularIds, getSports } from "@/lib/data";
import { FilterMenu } from "@/components/FilterMenu";
import { Flag } from "@/components/Flag";
import { COUNTRIES } from "@/lib/countries";
import { DIRECTORIES, type DirectoryKey, type PricingModel } from "@/lib/types";

type Props = {
  params: Promise<{ directory: string }>;
  searchParams: Promise<{ sport?: string; pricing?: string; category?: string; country?: string; show?: string; sort?: string; page?: string }>;
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

const PER_PAGE = 24;

const PRICING: { value: PricingModel; label: string }[] = [
  { value: "free", label: "Free" },
  { value: "freemium", label: "Free + paid" },
  { value: "paid", label: "Paid" },
];


export default async function DirectoryPage({ params, searchParams }: Props) {
  const { directory } = await params;
  const dir = DIRECTORIES[directory as DirectoryKey];
  if (!dir) notFound();

  const { sport, pricing, category, country, show, sort, page } = await searchParams;
  const [matching, allSports, everything, popularIds, landings] = await Promise.all([
    getListings({ type: dir.type, sport, pricing: pricing as PricingModel | undefined, category }),
    getSports(),
    getListings({ type: dir.type }),
    getPopularIds(dir.type),
    getLandings(),
  ]);
  const related = landings.filter((l) => l.directory === directory);
  // Only categories that at least one listing here uses, so no filter leads to an empty page.
  const categories = [...new Set(everything.flatMap((l) => l.categories ?? []))].sort();

  // The same rule for the rest: a sport, country or badge filter only appears when something here would match it.
  const sports = allSports.filter((s) => s.slug === sport || everything.some((l) => l.sports.includes(s.slug)));
  const countries = COUNTRIES.filter((c) => c.code === country || everything.some((l) => l.country === c.code));
  const anyCertified = show === "certified" || everything.some((l) => l.certified);
  const anyDeals = show === "deals" || everything.some((l) => l.deal);
  const filtered = matching.filter(
    (l) => (!country || l.country === country) && (show !== "certified" || l.certified) && (show !== "deals" || l.deal),
  );

  // Sorting. "Most clicked" is only offered once at least three listings here have real clicks behind them.
  const canSortByClicks = popularIds.length >= 3;
  const canSortByNewest = everything.some((l) => l.addedAt);
  const rank = (l: (typeof filtered)[number]) => {
    const position = l.id ? popularIds.indexOf(l.id) : -1;
    return position === -1 ? Number.MAX_SAFE_INTEGER : position;
  };
  const sorted =
    sort === "new" && canSortByNewest
      ? [...filtered].sort((a, b) => (b.addedAt ?? "").localeCompare(a.addedAt ?? ""))
      : sort === "popular" && canSortByClicks
        ? [...filtered].sort((a, b) => rank(a) - rank(b) || a.name.localeCompare(b.name))
        : sort === "az"
          ? [...filtered].sort((a, b) => a.name.localeCompare(b.name))
          : filtered;

  const pages = Math.max(1, Math.ceil(sorted.length / PER_PAGE));
  const current = Math.min(pages, Math.max(1, Number.parseInt(page ?? "1", 10) || 1));
  const listings = sorted.slice((current - 1) * PER_PAGE, current * PER_PAGE);

  // Builds a link that keeps the other filters in place.
  // Changing a filter or the sort goes back to the first page.
  const link = (next: { sport?: string; pricing?: string; category?: string; country?: string; show?: string; sort?: string; page?: number }) => {
    const query = new URLSearchParams();
    const merged = { sport, pricing, category, country, show, sort, page: undefined as number | undefined, ...next };
    if (merged.sort) query.set("sort", merged.sort);
    if (merged.page && merged.page > 1) query.set("page", String(merged.page));
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

      <div className="mt-6 grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
        <div className="sm:w-44">
          <FilterMenu
            label="Sport"
            options={[
              { label: "All sports", href: link({ sport: undefined }), active: !sport },
              ...sports.map((s) => ({ label: s.name, href: link({ sport: s.slug }), active: sport === s.slug })),
            ]}
          />
        </div>
        {categories.length > 1 && (
          <div className="sm:w-52">
            <FilterMenu
              label="Category"
              options={[
                { label: "All categories", href: link({ category: undefined }), active: !category },
                ...categories.map((c) => ({ label: c, href: link({ category: categorySlug(c) }), active: category === categorySlug(c) })),
              ]}
            />
          </div>
        )}
        {countries.length > 1 && (
          <div className="sm:w-44">
            <FilterMenu
              label="Country"
              options={[
                { label: "Anywhere", href: link({ country: undefined }), active: !country },
                ...countries.map((c) => ({ label: c.name, href: link({ country: c.code }), active: country === c.code, icon: <Flag code={c.code} className="h-3" /> })),
              ]}
            />
          </div>
        )}
        <div className="sm:w-36">
          <FilterMenu
            label="Price"
            options={[
              { label: "Any price", href: link({ pricing: undefined }), active: !pricing },
              ...PRICING.map((p) => ({ label: p.label, href: link({ pricing: p.value }), active: pricing === p.value })),
            ]}
          />
        </div>
        {(anyCertified || anyDeals) && (
          <div className="sm:w-48">
            <FilterMenu
              label="Show"
              options={[
                { label: "Everything", href: link({ show: undefined }), active: show !== "certified" && show !== "deals" },
                ...(anyCertified ? [{ label: "Certified Grinners", href: link({ show: "certified" }), active: show === "certified" }] : []),
                ...(anyDeals ? [{ label: "With a deal", href: link({ show: "deals" }), active: show === "deals" }] : []),
              ]}
            />
          </div>
        )}
        <div className="sm:ml-auto sm:w-44">
          <FilterMenu
            label="Sort by"
            align="right"
            options={[
              { label: "Featured first", href: link({ sort: undefined }), active: !["new", "popular", "az"].includes(sort ?? "") },
              ...(canSortByNewest ? [{ label: "Newest", href: link({ sort: "new" }), active: sort === "new" }] : []),
              ...(canSortByClicks ? [{ label: "Most clicked", href: link({ sort: "popular" }), active: sort === "popular" }] : []),
              { label: "A–Z", href: link({ sort: "az" }), active: sort === "az" },
            ]}
          />
        </div>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-1">
        <p className="font-mono text-xs text-muted">
          {sorted.length} {sorted.length === 1 ? "result" : "results"}
          {pages > 1 ? ` · page ${current} of ${pages}` : ""}
        </p>
        {(sport || category || country || pricing || show) && (
          <Link href={link({ sport: undefined, category: undefined, country: undefined, pricing: undefined, show: undefined })} scroll={false} className="text-xs text-muted underline underline-offset-4 hover:text-fg">
            Clear filters
          </Link>
        )}
      </div>
      {listings.length ? (
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {listings.map((l) => (
            <ListingCard key={l.slug} listing={l} />
          ))}
        </div>
      ) : null}
      {pages > 1 && (
        <nav className="mt-8 flex items-center justify-center gap-3" aria-label="Pages">
          {current > 1 ? (
            <Link href={link({ page: current - 1 })} className="flex h-11 items-center rounded-control border border-line px-4 text-sm hover:bg-surface">
              ← Previous
            </Link>
          ) : (
            <span className="flex h-11 items-center rounded-control border border-line px-4 text-sm text-muted opacity-50">← Previous</span>
          )}
          <span className="font-mono text-xs text-muted">
            {current} / {pages}
          </span>
          {current < pages ? (
            <Link href={link({ page: current + 1 })} className="flex h-11 items-center rounded-control border border-line px-4 text-sm hover:bg-surface">
              Next →
            </Link>
          ) : (
            <span className="flex h-11 items-center rounded-control border border-line px-4 text-sm text-muted opacity-50">Next →</span>
          )}
        </nav>
      )}
      {related.length > 0 && (
        <nav aria-label={`${dir.title} by sport and category`} className="mt-12">
          <h2 className="mb-3 font-semibold">Browse {dir.title.toLowerCase()} by sport{directory === "tools" ? " or category" : ""}</h2>
          <ul className="flex flex-wrap gap-2">
            {related.map((l) => (
              <li key={l.path}>
                <Link href={l.path} className="flex h-10 items-center rounded-full border border-line px-4 text-sm text-muted hover:border-muted/60 hover:text-fg">
                  {l.heading}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      )}
      {listings.length ? null : (
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
