/* eslint-disable @next/next/no-img-element -- uploaded images come from Supabase storage; plain img avoids per-domain image configuration */
import { Flag } from "@/components/Flag";
import Link from "next/link";
import { GrinMark, GrinTick } from "./Logo";
import {
  directoryForType,
  type Article,
  type ContentItem,
  type Listing,
  type Tip,
} from "@/lib/types";

const TYPE_LABEL = {
  tipster: "Tipster",
  tool: "Tool",
  podcast: "Podcast",
  youtube: "YouTube",
  creator: "Creator",
  news: "News & Alerts",
  community: "Community",
} as const;

/** The mark for listings the Grinners team has checked and approves of: the Grinners badge with its name underneath. */
export function CertifiedBadge({ size = "sm" }: { size?: "sm" | "lg" }) {
  const large = size === "lg";
  return (
    <span role="img" aria-label="Certified Grinner" title="Certified Grinner" className="flex shrink-0 flex-col items-center gap-1 text-center">
      <GrinMark size={large ? 44 : 28} />
      <span aria-hidden="true" className={`font-semibold uppercase leading-[1.15] tracking-wider text-grin ${large ? "text-[10px]" : "text-[8px]"}`}>
        Certified
        <br />
        Grinner
      </span>
    </span>
  );
}
const PRICING_LABEL = {
  free: "Free",
  paid: "Paid",
  freemium: "Free + paid",
} as const;

export function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full border border-line px-2.5 py-0.5 text-xs text-muted">
      {children}
    </span>
  );
}

/** Neutral on purpose: a paid placement never borrows the green of a win or the purple of an editorial pick. */
export function DisclosureBadge({
  kind,
}: {
  kind: "Sponsored" | "Affiliate link";
}) {
  return (
    <span className="shrink-0 whitespace-nowrap rounded-full border border-muted/60 px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide text-muted">
      {kind}
    </span>
  );
}

export function Monogram({
  listing,
  size = "md",
}: {
  listing: Listing;
  size?: "md" | "lg";
}) {
  const box = size === "lg" ? "h-20 w-20 text-2xl" : "h-12 w-12 text-sm";
  if (listing.logoUrl) {
    // Logos are uploaded to Supabase storage; a plain img avoids per-domain image configuration.
    return (
      <img
        src={listing.logoUrl}
        alt=""
        className={`${box} shrink-0 rounded-card border border-line bg-raised object-cover`}
      />
    );
  }
  return (
    <span
      className={`${box} display flex shrink-0 items-center justify-center rounded-card border border-line bg-raised text-fg`}
      aria-hidden="true"
    >
      {listing.initials}
    </span>
  );
}

export const listingHref = (l: Listing) =>
  `/${directoryForType(l.types[0])}/${l.slug}`;

/**
 * Preview image that is never cropped. The whole image is shown, and any gap at the sides or
 * top and bottom is filled with a blurred, darkened copy of the same image.
 */
export function CoverImage({ src }: { src: string }) {
  return (
    <div className="relative aspect-video w-full overflow-hidden border-b border-line bg-raised">
      <img src={src} alt="" aria-hidden="true" loading="lazy" className="absolute inset-0 h-full w-full scale-110 object-cover opacity-50 blur-xl" />
      <img src={src} alt="" loading="lazy" className="relative h-full w-full object-contain" />
    </div>
  );
}

export function ListingCard({ listing }: { listing: Listing }) {
  return (
    <Link
      href={listingHref(listing)}
      className="group flex h-full flex-col overflow-hidden rounded-card border border-line bg-surface transition-colors hover:border-muted/50 hover:bg-raised"
    >
      {listing.coverUrl && <CoverImage src={listing.coverUrl} />}
      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="flex items-start gap-3">
          <Monogram listing={listing} />
          <div className="min-w-0 flex-1">
            <h3 className="line-clamp-2 font-semibold leading-snug">{listing.name}</h3>
            <p className="flex items-center gap-1.5 text-xs text-muted">
              <Flag code={listing.country} className="h-3" />
              {listing.types.map((t) => TYPE_LABEL[t]).join(" · ")}
            </p>
          </div>
          {(listing.certified || listing.isSponsored) && (
            <div className="flex shrink-0 flex-col items-end gap-2">
              {listing.certified && <CertifiedBadge />}
              {listing.isSponsored && <DisclosureBadge kind="Sponsored" />}
            </div>
          )}
        </div>
        <p className="line-clamp-3 text-sm text-muted">{listing.tagline}</p>
        <div className="mt-auto flex items-center gap-1.5 overflow-hidden pt-1 whitespace-nowrap">
          {listing.sports.slice(0, listing.sports.length > 3 ? 2 : 3).map((s) => (
            <Chip key={s}>{s.toUpperCase()}</Chip>
          ))}
          {listing.sports.length > 3 && (
            <Chip>+{listing.sports.length - 2}</Chip>
          )}
          {listing.deal && <span className="ml-auto shrink-0 rounded-full border border-fg/40 px-2 py-0.5 text-[11px] font-semibold text-fg">Deal</span>}
          <span className={`${listing.deal ? "" : "ml-auto "}shrink-0 pl-2 text-xs text-muted`}>
            {PRICING_LABEL[listing.pricing]}
          </span>
        </div>
      </div>
    </Link>
  );
}

const when = new Intl.DateTimeFormat("en-AU", {
  timeZone: "Australia/Brisbane",
  weekday: "short",
  day: "numeric",
  month: "short",
  hour: "numeric",
  minute: "2-digit",
});

export function ResultPill({ result }: { result: Tip["result"] }) {
  if (result === "won")
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-grin/15 px-2.5 py-0.5 text-xs font-semibold text-grin">
        <GrinTick size={12} /> Won
      </span>
    );
  if (result === "lost")
    return (
      <span className="rounded-full bg-loss/15 px-2.5 py-0.5 text-xs font-semibold text-loss">
        Lost
      </span>
    );
  if (result === "void")
    return (
      <span className="rounded-full bg-raised px-2.5 py-0.5 text-xs text-muted">
        Void
      </span>
    );
  return (
    <span className="rounded-full bg-raised px-2.5 py-0.5 text-xs text-muted">
      Pending
    </span>
  );
}

export function TipCard({ tip, author, linked = true }: { tip: Tip; author?: Listing; linked?: boolean }) {
  return (
    <article className="flex h-full flex-col gap-3 rounded-card border border-line bg-surface p-4">
      <div className="flex items-center justify-between gap-2 text-xs text-muted">
        <span>
          {tip.competition} · {when.format(new Date(tip.eventStart))} AEST
        </span>
        <ResultPill result={tip.result} />
      </div>
      <div>
        <p className="text-sm text-muted">{tip.event}</p>
        <div className="mt-1 flex items-start justify-between gap-3">
          <h3 className="font-semibold">
            {linked ? (
              <Link href={`/tips/${tip.id}`} className="hover:underline">
                {tip.selection}
              </Link>
            ) : (
              tip.selection
            )}
          </h3>
          <span className="rounded-control border border-line bg-raised px-2.5 py-1 font-mono text-sm tabular-nums">
            {tip.odds.toFixed(2)}
          </span>
        </div>
        <p className="mt-0.5 text-xs text-muted">
          {tip.market}
          {tip.bookmaker ? ` · ${tip.bookmaker}` : ""}
        </p>
      </div>
      <p className="text-sm text-muted">{tip.analysis}</p>
      {author && (
        <Link
          href={listingHref(author)}
          className="mt-auto text-sm font-medium hover:underline"
        >
          {author.name}
        </Link>
      )}
    </article>
  );
}

const day = new Intl.DateTimeFormat("en-AU", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

export function ArticleCard({ article }: { article: Article }) {
  return (
    <article className="flex h-full flex-col gap-2 rounded-card border border-line bg-surface p-4">
      <div className="flex items-center gap-2 text-xs text-muted">
        <span className="text-spotlight">{article.category}</span>
        {article.isSponsored && <DisclosureBadge kind="Sponsored" />}
      </div>
      <h3 className="text-lg font-semibold leading-snug">
        <Link href={`/articles/${article.slug}`} className="hover:underline">
          {article.title}
        </Link>
      </h3>
      <p className="text-sm text-muted">{article.excerpt}</p>
      <p className="mt-auto pt-2 text-xs text-muted">
        {article.author} · {day.format(new Date(article.publishedAt))}
      </p>
    </article>
  );
}

export function SectionHeading({
  title,
  href,
  linkLabel,
}: {
  title: string;
  href?: string;
  linkLabel?: string;
}) {
  return (
    <div className="mb-4 flex items-end justify-between gap-4">
      <h2 className="display text-2xl sm:text-3xl">{title}</h2>
      {href && (
        <Link href={href} className="shrink-0 text-sm text-muted hover:text-fg">
          {linkLabel ?? "View all"} →
        </Link>
      )}
    </div>
  );
}

export function SearchForm({
  defaultValue,
  large,
}: {
  defaultValue?: string;
  large?: boolean;
}) {
  return (
    <form
      action="/search"
      role="search"
      className={`flex w-full gap-2 ${large ? "max-w-xl" : ""}`}
    >
      <label htmlFor="q" className="sr-only">
        Search Grinners
      </label>
      <input
        id="q"
        name="q"
        type="search"
        defaultValue={defaultValue}
        placeholder="Discover tipsters, tools, podcasts and more"
        className="h-12 min-w-0 flex-1 rounded-control border border-line bg-raised px-4 text-base placeholder:text-muted"
      />
      <button className="h-12 rounded-control bg-grin px-5 font-semibold text-ink hover:brightness-110">
        Search
      </button>
    </form>
  );
}

const shortDay = new Intl.DateTimeFormat("en-AU", { day: "numeric", month: "short", timeZone: "Australia/Brisbane" });

/** A latest video or episode. Opens on the creator's own platform. */
export function ContentCard({ item, showSource = true }: { item: ContentItem; showSource?: boolean }) {
  return (
    <a
      href={item.url}
      target="_blank"
      rel="noopener"
      className="group flex h-full flex-col overflow-hidden rounded-card border border-line bg-surface transition-colors hover:border-muted/50 hover:bg-raised"
    >
      {item.thumbnailUrl && <CoverImage src={item.thumbnailUrl} />}
      <div className="flex flex-1 flex-col gap-2 p-4">
        <p className="text-xs text-muted">
          {item.kind === "video" ? "Video" : "Episode"} · {shortDay.format(new Date(item.publishedAt))}
        </p>
        <h3 className="line-clamp-2 font-semibold leading-snug">{item.title}</h3>
        {showSource && item.listingName && <p className="mt-auto text-sm text-muted">{item.listingName} ↗</p>}
      </div>
    </a>
  );
}
