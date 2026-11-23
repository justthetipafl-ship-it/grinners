import type { Metadata } from "next";
import Link from "next/link";
import { SuggestForm } from "@/components/PublicForms";
import { COUNTRIES } from "@/lib/countries";

export const metadata: Metadata = {
  title: "Get listed",
  description: "Run a tool, podcast, channel or tipping service? Request your Grinners listing, or suggest someone who belongs here.",
};

export default async function SubmitPage({ searchParams }: { searchParams: Promise<{ who?: string }> }) {
  const owner = (await searchParams).who !== "someone";
  const tab = (active: boolean) =>
    `flex h-11 items-center rounded-control border px-4 text-sm font-medium ${active ? "border-fg bg-fg text-ink" : "border-line text-muted hover:bg-surface hover:text-fg"}`;

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="display text-4xl uppercase sm:text-5xl">Get listed</h1>
      <p className="mt-2 text-muted">
        Listings are free. We check every request, and we don&apos;t list anyone who promotes unlicensed betting services or promises guaranteed
        profits.
      </p>
      <div className="mt-6 flex flex-wrap gap-2">
        <Link href="/submit" scroll={false} className={tab(owner)} aria-current={owner ? "page" : undefined}>
          List my own work
        </Link>
        <Link href="/submit?who=someone" scroll={false} className={tab(!owner)} aria-current={!owner ? "page" : undefined}>
          Suggest someone else
        </Link>
      </div>
      <div className="mt-6">
        <SuggestForm key={owner ? "owner" : "someone"} owner={owner} countries={COUNTRIES} />
      </div>
      <p className="mt-8 text-sm text-muted">
        Already listed and have a story to tell?{" "}
        <Link href="/spotlight/request" className="text-fg underline">
          Request a spotlight
        </Link>
        .
      </p>
    </div>
  );
}
