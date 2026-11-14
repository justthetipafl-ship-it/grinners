import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ListingCard, SectionHeading, TipCard } from "@/components/Cards";
import { getListings, getSports, getTips } from "@/lib/data";
import { DIRECTORIES, type DirectoryKey } from "@/lib/types";

type Props = { params: Promise<{ slug: string }> };

export const revalidate = 3600;

export async function generateStaticParams() {
  return (await getSports()).map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const sport = (await getSports()).find((s) => s.slug === slug);
  return sport
    ? { title: `${sport.name} tipsters, tools and podcasts`, description: `The best ${sport.name} betting and fantasy tipsters, tools, podcasts and channels, in one place.` }
    : {};
}

export default async function SportHub({ params }: Props) {
  const { slug } = await params;
  const sports = await getSports();
  const sport = sports.find((s) => s.slug === slug);
  if (!sport) notFound();

  const [listings, tips] = await Promise.all([getListings({ sport: slug }), getTips({ sport: slug })]);
  const bySlug = new Map(listings.map((l) => [l.slug, l]));

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-12 px-4 py-10">
      <div>
        <h1 className="display text-5xl uppercase sm:text-6xl">{sport.name}</h1>
        <p className="mt-2 max-w-2xl text-muted">Everyone and everything on Grinners covering {sport.name}.</p>
        <div className="no-scrollbar -mx-4 mt-5 flex gap-2 overflow-x-auto px-4">
          {sports.map((s) => (
            <Link
              key={s.slug}
              href={`/sports/${s.slug}`}
              className={`shrink-0 rounded-full border px-3.5 py-2 text-sm ${s.slug === slug ? "border-fg bg-fg text-ink" : "border-line text-muted hover:text-fg"}`}
            >
              {s.name}
            </Link>
          ))}
        </div>
      </div>

      {tips.length > 0 && (
        <section>
          <SectionHeading title="Latest free tips" href={`/tips?sport=${slug}`} />
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {tips.slice(0, 3).map((t) => (
              <TipCard key={t.id} tip={t} author={bySlug.get(t.listingSlug)} />
            ))}
          </div>
        </section>
      )}

      {(Object.keys(DIRECTORIES) as DirectoryKey[]).map((key) => {
        const group = listings.filter((l) => l.types[0] === DIRECTORIES[key].type);
        if (!group.length) return null;
        return (
          <section key={key}>
            <SectionHeading title={DIRECTORIES[key].title} href={`/${key}?sport=${slug}`} />
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {group.map((l) => (
                <ListingCard key={l.slug} listing={l} />
              ))}
            </div>
          </section>
        );
      })}

      {listings.length === 0 && (
        <p className="rounded-card border border-dashed border-line p-10 text-center text-muted">
          Nothing listed for {sport.name} yet.{" "}
          <Link href="/submit" className="text-fg underline">
            Suggest someone
          </Link>
          .
        </p>
      )}
    </div>
  );
}
