import Link from "next/link";
import { ArticleCard, ContentCard, ListingCard, Monogram, SearchForm, SectionHeading, TipCard, listingHref, DisclosureBadge } from "@/components/Cards";
import { getArticles, getContent, getListing, getPopularListings, getListings, getSpotlight, getSports, getTips } from "@/lib/data";
import { DIRECTORIES, type DirectoryKey } from "@/lib/types";
import { NewsletterForm } from "@/components/PublicForms";
import { X_HANDLE, X_URL } from "@/lib/site";

// Rebuilt at least hourly so scheduled spotlights and new tips appear without a manual save.
export const revalidate = 3600;

/** How many featured listings the homepage shows. */
const FEATURED_LIMIT = 8;

export default async function Home() {
  const [featuredAll, tools, tips, articles, spotlight, sports, all, episodes, videos, popularTools] = await Promise.all([
    getListings({ featured: true }),
    getListings({ type: "tool" }),
    getTips(),
    getArticles(),
    getSpotlight(),
    getSports(),
    getListings(),
    getContent({ kind: "episode", limit: 3, onePerListing: true }),
    getContent({ kind: "video", limit: 3, onePerListing: true }),
    getPopularListings("tool", 3),
  ]);
  // Two rows at most on desktop. The most recently updated featured listings win a place.
  const featured = featuredAll.slice(0, FEATURED_LIMIT);
  // Tools row: the most-clicked when there's enough data. Otherwise tools the Featured row
  // isn't already showing, so the same cards don't appear twice in a row.
  const deals = all.filter((l) => l.deal).slice(0, 3);
  const shownAbove = new Set(featured.map((l) => l.slug));
  const freshTools = tools.filter((l) => !shownAbove.has(l.slug));
  const toolsRow = popularTools ?? (freshTools.length >= 3 ? freshTools : tools).slice(0, 3);
  const spotlightListing = spotlight ? await getListing(spotlight.listingSlug) : undefined;
  const bySlug = new Map(all.map((l) => [l.slug, l]));

  return (
    <>
      <section className="glow border-b border-line">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:py-20">
          <p className="mb-4 text-sm font-medium text-grin">Tipsters · Tools · Podcasts · YouTube · Creators · Communities</p>
          <h1 className="display max-w-3xl text-5xl uppercase sm:text-7xl">
            Winners are <span className="text-grin">Grinners.</span>
          </h1>
          <p className="mt-5 max-w-xl text-lg text-muted">
            The home of sports betting and fantasy content. Find the people, tools and shows worth following, for every sport and from anywhere in the world.
          </p>
          <div className="mt-8">
            <SearchForm large />
          </div>
          <div className="mt-5 flex flex-wrap gap-2">
            {sports.map((s) => (
              <Link key={s.slug} href={`/sports/${s.slug}`} className="rounded-full border border-line bg-surface px-3.5 py-1.5 text-sm text-muted hover:text-fg">
                {s.name}
              </Link>
            ))}
          </div>
        </div>
      </section>

      <div className="mx-auto flex max-w-6xl flex-col gap-14 px-4 py-12">
        <section aria-label="Browse by category" className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
          {(Object.keys(DIRECTORIES) as DirectoryKey[]).map((key) => (
            <Link key={key} href={`/${key}`} className="rounded-card border border-line bg-surface p-4 transition-colors hover:bg-raised lg:p-3 xl:p-4">
              <p className="display text-lg lg:text-sm xl:text-base">{DIRECTORIES[key].title}</p>
              <p className="mt-1 font-mono text-xs text-muted">
                {all.filter((l) => l.types.includes(DIRECTORIES[key].type)).length} listed
              </p>
            </Link>
          ))}
        </section>

        {spotlight && spotlightListing && (
          <section aria-label="Spotlight" className="glow overflow-hidden rounded-card border border-spotlight/40 bg-surface">
            <div className="flex flex-col gap-6 p-6 sm:flex-row sm:items-center sm:p-8">
              <Monogram listing={spotlightListing} size="lg" />
              <div className="flex-1">
                <p className="flex items-center gap-2 text-sm font-semibold text-spotlight">
                  {spotlight.kind}
                  {spotlight.isSponsored && <DisclosureBadge kind="Sponsored" />}
                </p>
                <h2 className="display mt-1 text-3xl">{spotlight.headline}</h2>
                <p className="mt-2 max-w-2xl text-muted">{spotlight.body}</p>
              </div>
              <Link href={listingHref(spotlightListing)} className="flex h-11 shrink-0 items-center justify-center rounded-control border border-line bg-raised px-5 font-semibold hover:border-muted/60">
                View profile
              </Link>
              <Link href="/spotlight" className="shrink-0 text-sm text-muted hover:text-fg">
                Past spotlights →
              </Link>
            </div>
          </section>
        )}

        {featured.length > 0 && (
        <section>
          <SectionHeading title="Featured" />
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {featured.map((l) => (
              <ListingCard key={l.slug} listing={l} />
            ))}
          </div>
        </section>
        )}

        {deals.length > 0 && (
          <section>
            <SectionHeading title="Grinners deals" href="/deals" linkLabel="All deals" />
            <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {deals.map((l) => (
                <li key={l.slug}>
                  <Link href={listingHref(l)} className="flex h-full flex-col gap-1 rounded-card border border-line bg-surface p-4 transition-colors hover:bg-raised">
                    <span className="font-semibold">{l.deal!.text}</span>
                    <span className="text-sm text-muted">{l.name}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        {tips.length > 0 && (
        <section>
          <SectionHeading title="Latest free tips" href="/tips" />
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {tips.slice(0, 3).map((t) => (
              <TipCard key={t.id} tip={t} author={bySlug.get(t.listingSlug)} />
            ))}
          </div>
        </section>
        )}

        {toolsRow.length > 0 && (
        <section>
          {/* "Popular" only when ranked by real clicks; otherwise the heading says what it is. */}
            <SectionHeading title={popularTools ? "Popular tools" : "Tools to explore"} href="/tools" linkLabel="All tools" />
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {toolsRow.map((l) => (
              <ListingCard key={l.slug} listing={l} />
            ))}
          </div>
        </section>
        )}

        {articles.length > 0 && (
        <section>
          <SectionHeading title="Latest articles" href="/articles" />
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {articles.map((a) => (
              <ArticleCard key={a.slug} article={a} />
            ))}
          </div>
        </section>
        )}

        {episodes.length > 0 && (
          <section>
            <SectionHeading title="Latest podcast episodes" href="/podcasts" linkLabel="All podcasts" />
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {episodes.map((item) => (
                <ContentCard key={item.url} item={item} />
              ))}
            </div>
          </section>
        )}

        {videos.length > 0 && (
          <section>
            <SectionHeading title="Latest videos" href="/youtube" linkLabel="All channels" />
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {videos.map((item) => (
                <ContentCard key={item.url} item={item} />
              ))}
            </div>
          </section>
        )}

        <section id="newsletter" className="glow rounded-card border border-line bg-surface p-6 sm:p-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="display text-2xl sm:text-3xl">New creators and tools, weekly</h2>
              <p className="mt-1 max-w-xl text-muted">
                One email a week with the latest spotlight and what&apos;s new in the directory. No tips spam. Know someone we should list?{" "}
                <Link href="/submit" className="text-fg underline">
                  Suggest them
                </Link>
                , or follow{" "}
                <a href={X_URL} target="_blank" rel="noopener" className="text-fg underline">
                  @{X_HANDLE}
                </a>{" "}
                on X.
              </p>
            </div>
            <NewsletterForm />
          </div>
        </section>
      </div>
    </>
  );
}
