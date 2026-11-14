import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "About Grinners", description: "What Grinners is and who it is for." };

export default function Page() {
  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4 px-4 py-10 text-muted [&_h2]:mt-3 [&_h2]:font-semibold [&_h2]:text-fg [&_li]:ml-5 [&_li]:list-disc [&_a]:text-fg [&_a]:underline">
      <h1 className="display text-4xl uppercase text-fg">About Grinners</h1>
      <p>Grinners is a directory for the sports betting and fantasy community. We bring tipsters, creators, tools, podcasts and YouTube channels together in one place so they are easier to find, across Australian and US sport.</p>
      <p>We are not a bookmaker. We don&apos;t take bets, and we don&apos;t carry bookmaker advertising.</p>
      <h2>How listings work</h2>
      <p>Listings are free. We check each one before it goes live. Anyone can <Link href="/submit">suggest a listing</Link>.</p>
      <h2>How we&apos;re funded</h2>
      <p>Through labelled affiliate links and sponsored placements. See <Link href="/how-we-make-money">how we make money</Link>.</p>
      <h2>Australian founded</h2>
      <p>Grinners is built in Queensland. Winners are Grinners.</p>
      <p className="text-sm">Draft wording. To be reviewed by a lawyer before launch.</p>
    </div>
  );
}
