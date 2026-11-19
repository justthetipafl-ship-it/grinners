import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getListing } from "@/lib/data";
import { SITE_URL } from "@/lib/site";
import { directoryForType } from "@/lib/types";

type Props = { params: Promise<{ slug: string }> };

export const revalidate = 3600;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const listing = await getListing(slug);
  return { title: listing ? `Badge for ${listing.name}` : "Badge", robots: { index: false } };
}

function Code({ label, children }: { label: string; children: string }) {
  return (
    <div>
      <p className="mb-1.5 text-sm font-semibold">{label}</p>
      <pre className="select-all overflow-x-auto whitespace-pre-wrap break-all rounded-control border border-line bg-surface p-3 font-mono text-xs text-muted">{children}</pre>
    </div>
  );
}

export default async function BadgePage({ params }: Props) {
  const { slug } = await params;
  const listing = await getListing(slug);
  if (!listing) notFound();

  const profile = `${SITE_URL}/${directoryForType(listing.types[0])}/${slug}`;
  const image = `${SITE_URL}/listed/${slug}/badge`;
  // The name goes inside an HTML attribute in the copy-and-paste code, so quotes and angle brackets are made safe.
  const safeName = listing.name.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const alt = listing.certified ? `${listing.name} is a Certified Grinner` : `${listing.name} is listed on Grinners`;
  const codeAlt = listing.certified ? `${safeName} is a Certified Grinner` : `${safeName} is listed on Grinners`;

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6 px-4 py-10">
      <div>
        <h1 className="display text-4xl uppercase">Your Grinners badge</h1>
        <p className="mt-2 text-muted">
          {listing.name} is {listing.certified ? "a Certified Grinner" : "listed on Grinners"}. If that&apos;s you, add this badge to your site, link page or newsletter.
          It links to{" "}
          <Link href={profile.replace(SITE_URL, "")} className="text-fg underline">
            your Grinners profile
          </Link>
          .
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={`/listed/${slug}/badge`} alt={alt} width={280} height={88} className="rounded-control bg-ink p-3" />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={`/listed/${slug}/badge?theme=light`} alt={alt} width={280} height={88} className="rounded-control bg-white p-3" />
      </div>

      <Code label="For a website (dark)">{`<a href="${profile}"><img src="${image}" alt="${codeAlt}" width="280" height="88"></a>`}</Code>
      <Code label="For a website (light)">{`<a href="${profile}"><img src="${image}?theme=light" alt="${codeAlt}" width="280" height="88"></a>`}</Code>
      <Code label="Just the link, for a bio or link page">{profile}</Code>

      <p className="text-sm text-muted">
        Tap a box to select it, then copy. The badge updates itself if your listing becomes a Certified Grinner. Something wrong on your profile?{" "}
        <Link href="/submit" className="text-fg underline">
          Tell us
        </Link>
        .
      </p>
    </div>
  );
}
