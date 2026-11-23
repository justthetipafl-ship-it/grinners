import Link from "next/link";
import { ListingCard } from "@/components/Cards";
import { getLandings, type Landing } from "@/lib/landing";
import { SITE_URL } from "@/lib/site";
import { DIRECTORIES } from "@/lib/types";

/** A search landing page: a clear heading, a short intro, the listings, and links to the neighbouring pages. */
export async function LandingPage({ landing }: { landing: Landing }) {
  const others = (await getLandings()).filter((l) => l.path !== landing.path);
  const sameDirectory = others.filter((l) => l.directory === landing.directory).slice(0, 12);
  const directory = DIRECTORIES[landing.directory];

  // Tells search engines this page is a list, and what is on it.
  const structured = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: landing.heading,
    numberOfItems: landing.listings.length,
    itemListElement: landing.listings.slice(0, 30).map((l, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: l.name,
      url: `${SITE_URL}/${landing.directory}/${l.slug}`,
    })),
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <script type="application/ld+json">{JSON.stringify(structured).replace(/</g, "\\u003c")}</script>
      <p className="text-sm text-muted">
        <Link href={`/${landing.directory}`} className="hover:text-fg hover:underline">
          {directory.title}
        </Link>
      </p>
      <h1 className="display mt-1 text-4xl uppercase sm:text-5xl">{landing.heading}</h1>
      <p className="mt-2 max-w-2xl text-muted">{landing.intro}</p>

      <ul className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {landing.listings.map((listing) => (
          <li key={listing.slug}>
            <ListingCard listing={listing} />
          </li>
        ))}
      </ul>

      {sameDirectory.length > 0 && (
        <nav aria-label="Related pages" className="mt-12">
          <h2 className="mb-3 font-semibold">More {directory.title.toLowerCase()}</h2>
          <ul className="flex flex-wrap gap-2">
            {sameDirectory.map((l) => (
              <li key={l.path}>
                <Link href={l.path} className="flex h-10 items-center rounded-full border border-line px-4 text-sm text-muted hover:border-muted/60 hover:text-fg">
                  {l.heading}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </div>
  );
}
