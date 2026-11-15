import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Chip, ContentCard, DisclosureBadge, Monogram, TipCard } from "@/components/Cards";
import { getContent, getListing, getListings, getTips, gradedRecord } from "@/lib/data";
import { PlatformIcon } from "@/components/PlatformIcon";
import { shareToX } from "@/lib/site";
import { DIRECTORIES, directoryForType, type DirectoryKey } from "@/lib/types";

type Props = { params: Promise<{ directory: string; slug: string }> };

export async function generateStaticParams() {
  const listings = await getListings();
  return listings.map((l) => ({ directory: directoryForType(l.types[0]), slug: l.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const listing = await getListing(slug);
  return listing ? { title: listing.name, description: listing.tagline } : {};
}

export default async function ListingPage({ params }: Props) {
  const { directory, slug } = await params;
  const dir = DIRECTORIES[directory as DirectoryKey];
  const listing = await getListing(slug);
  // A profile lives under the directory of its first type only, so there is one address per listing.
  if (!dir || !listing || directoryForType(listing.types[0]) !== directory) notFound();

  const [tips, content] = await Promise.all([getTips({ listingSlug: slug }), getContent({ listingSlug: slug, limit: 4 })]);
  const record = gradedRecord(tips);
  const shareUrl = shareToX(`${listing.name} on Grinners`, `/${directory}/${slug}`);

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <Link href={`/${directory}`} className="text-sm text-muted hover:text-fg">
        ← {dir.title}
      </Link>

      <header className="mt-4 flex flex-col gap-5 sm:flex-row sm:items-start">
        <Monogram listing={listing} size="lg" />
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="display text-4xl">{listing.name}</h1>
            {listing.isSponsored && <DisclosureBadge kind="Sponsored" />}
          </div>
          <p className="mt-2 text-lg text-muted">{listing.tagline}</p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {listing.sports.map((s) => (
              <Chip key={s}>{s.toUpperCase()}</Chip>
            ))}
            {listing.markets?.map((m) => <Chip key={m}>{m}</Chip>)}
          </div>
          {listing.categories && listing.categories.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {listing.categories.map((c) => (
                <span key={c} className="rounded-full border border-spotlight/40 px-2.5 py-0.5 text-xs text-spotlight">
                  {c}
                </span>
              ))}
            </div>
          )}
        </div>
      </header>

      <div className="mt-8 grid gap-6 md:grid-cols-[1fr_280px]">
        <div className="flex flex-col gap-8">
          {listing.coverUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={listing.coverUrl} alt={`Preview of ${listing.name}`} className="h-auto max-h-[560px] w-full rounded-card border border-line bg-raised object-contain" />
          )}
          <section>
            <h2 className="mb-2 font-semibold">About</h2>
            <p className="text-muted">{listing.bio}</p>
            {listing.ownershipDisclosure && <p className="mt-3 text-sm text-muted">{listing.ownershipDisclosure}</p>}
          </section>

          {listing.features && (
            <section>
              <h2 className="mb-2 font-semibold">Features</h2>
              <ul className="grid gap-2 text-muted sm:grid-cols-2">
                {listing.features.map((f) => (
                  <li key={f} className="rounded-control border border-line bg-surface px-3 py-2 text-sm">
                    {f}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {content.length > 0 && (
            <section>
              <h2 className="mb-3 font-semibold">{content[0].kind === "video" ? "Latest videos" : "Latest episodes"}</h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {content.map((item) => (
                  <ContentCard key={item.url} item={item} showSource={false} />
                ))}
              </div>
            </section>
          )}

          {tips.length > 0 && (
            <section>
              <h2 className="mb-1 font-semibold">Tips on Grinners</h2>
              <p className="mb-3 text-sm text-muted">
                {record.graded === 0 ? (
                  "No graded tips yet. Tips posted here lock when the event starts and are graded afterwards."
                ) : (
                  <>
                    Record from tips posted here before the event started:{" "}
                    <span className="font-mono text-fg">
                      {record.won}–{record.lost}
                    </span>{" "}
                    from {record.graded} graded.{record.graded < 30 ? " A small sample tells you very little." : ""}
                  </>
                )}
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                {tips.map((t) => (
                  <TipCard key={t.id} tip={t} />
                ))}
              </div>
            </section>
          )}
        </div>

        <aside className="flex h-fit flex-col gap-4 rounded-card border border-line bg-surface p-4">
          <div>
            <p className="text-xs uppercase tracking-wide text-muted">Pricing</p>
            <p className="mt-1 font-semibold">{{ free: "Free", paid: "Paid", freemium: "Free + paid" }[listing.pricing]}</p>
            {listing.pricingNote && <p className="text-sm text-muted">{listing.pricingNote}</p>}
          </div>
          {listing.cta && (
            <div className="flex flex-col gap-2">
              <a
                href={listing.cta.url}
                target="_blank"
                rel={listing.cta.affiliate ? "sponsored nofollow noopener" : "noopener"}
                className="flex h-11 items-center justify-center rounded-control bg-grin font-semibold text-ink hover:brightness-110"
              >
                {listing.cta.label}
              </a>
              {listing.cta.affiliate && (
                <p className="flex items-center gap-2 text-xs text-muted">
                  <DisclosureBadge kind="Affiliate link" /> Grinners may earn a commission.
                </p>
              )}
            </div>
          )}
          <div>
            <p className="text-xs uppercase tracking-wide text-muted">Find them on</p>
            <ul className="mt-1 flex flex-col">
              {listing.links.map((l) => (
                <li key={l.url}>
                  <a href={l.url} target="_blank" rel="noopener" className="flex h-11 items-center gap-3 text-sm hover:text-grin">
                    <PlatformIcon platform={l.platform} />
                    <span className="flex-1">{l.platform}</span>
                    <span aria-hidden="true">↗</span>
                  </a>
                </li>
              ))}
            </ul>
          </div>
          <a href={shareUrl} target="_blank" rel="noopener" className="flex h-10 items-center justify-center rounded-control border border-line text-sm text-muted hover:text-fg">
            Share to X
          </a>
        </aside>
      </div>
    </div>
  );
}
