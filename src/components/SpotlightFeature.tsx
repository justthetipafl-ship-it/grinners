import Link from "next/link";
import { CertifiedBadge, DisclosureBadge, Monogram, listingHref } from "@/components/Cards";
import { shareToX } from "@/lib/site";
import type { Listing, Spotlight } from "@/lib/types";

const day = new Intl.DateTimeFormat("en-AU", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });

/** The full spotlight feature. Used by the public page and by the private preview. */
export function SpotlightFeature({ spotlight, listing, preview = false }: { spotlight: Spotlight; listing: Listing; preview?: boolean }) {
  // Pictures come from the listing: its preview image first, then its gallery.
  const images = [...new Set([listing.coverUrl, ...(listing.gallery ?? [])].filter((url): url is string => Boolean(url)))];
  const [lead, ...rest] = images;
  const paragraphs = spotlight.body.split(/\n\s*\n|\n/).map((p) => p.trim()).filter(Boolean);

  return (
    <article className="mx-auto max-w-3xl px-4 py-10">
      {preview && (
        <p className="mb-6 rounded-control border border-spotlight/50 bg-spotlight/10 p-3 text-sm">
          <strong>Preview.</strong> This spotlight isn&apos;t public yet.
          {spotlight.startsOn ? ` It goes live on ${day.format(new Date(spotlight.startsOn))}.` : ""} Only people with this link can see it.
        </p>
      )}
      <p className="flex flex-wrap items-center gap-2 text-sm font-semibold text-spotlight">
        <Link href="/spotlight" className="hover:underline">
          Spotlight
        </Link>
        <span className="font-normal text-muted">· {spotlight.kind}</span>
        {spotlight.startsOn && <span className="font-normal text-muted">· {day.format(new Date(spotlight.startsOn))}</span>}
        {spotlight.isSponsored && <DisclosureBadge kind="Sponsored" />}
      </p>
      <h1 className="display mt-2 text-4xl sm:text-5xl">{spotlight.headline}</h1>

      <Link href={listingHref(listing)} className="mt-6 flex items-center gap-4 rounded-card border border-line bg-surface p-4 transition-colors hover:bg-raised">
        <Monogram listing={listing} size="lg" />
        <span className="min-w-0 flex-1">
          <span className="block font-semibold">{listing.name}</span>
          <span className="block text-sm text-muted">{listing.tagline}</span>
        </span>
        {listing.certified && <CertifiedBadge />}
      </Link>

      {lead && (
        <a href={lead} target="_blank" rel="noopener" className="mt-6 block overflow-hidden rounded-card border border-line bg-raised">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={lead} alt={`${listing.name}`} className="max-h-[480px] w-full object-contain" />
        </a>
      )}

      <div className="mt-6 flex flex-col gap-4 text-lg leading-relaxed text-fg/90">
        {paragraphs.map((paragraph, index) => (
          <p key={index}>{paragraph}</p>
        ))}
      </div>

      {rest.length > 0 && (
        <ul className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3" aria-label={`More from ${listing.name}`}>
          {rest.map((url, index) => (
            <li key={url}>
              <a href={url} target="_blank" rel="noopener" className="block overflow-hidden rounded-control border border-line bg-raised hover:border-muted/50">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt={`${listing.name} screenshot ${index + 2}`} loading="lazy" className="aspect-video w-full object-contain" />
              </a>
            </li>
          ))}
        </ul>
      )}

      {listing.deal && (
        <div className="mt-8 rounded-card border border-fg/30 bg-raised p-4">
          <p className="text-xs font-semibold uppercase tracking-wide">Grinners deal</p>
          <p className="mt-1 font-semibold">{listing.deal.text}</p>
          {listing.deal.code && (
            <p className="mt-2 text-sm text-muted">
              Code <span className="select-all rounded border border-line bg-ink px-1.5 py-0.5 font-mono text-fg">{listing.deal.code}</span>
            </p>
          )}
        </div>
      )}

      <div className="mt-8 flex flex-wrap gap-3">
        <Link href={listingHref(listing)} className="flex h-12 items-center rounded-control bg-grin px-6 font-semibold text-ink hover:brightness-110">
          See {listing.name} on Grinners
        </Link>
        <a
          href={shareToX(`${spotlight.headline}: ${listing.name} is in the Grinners spotlight`, `/spotlight/${listing.slug}`)}
          target="_blank"
          rel="noopener"
          className="flex h-12 items-center rounded-control border border-line px-5 text-sm text-muted hover:text-fg"
        >
          Share to X
        </a>
      </div>

      {spotlight.isSponsored && (
        <p className="mt-6 text-sm text-muted">
          {listing.name} paid for this spotlight. We wrote it, and it passed the same checks as every listing.{" "}
          <Link href="/how-we-make-money" className="underline">
            How we make money
          </Link>
          .
        </p>
      )}
    </article>
  );
}
