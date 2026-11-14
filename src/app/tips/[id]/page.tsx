import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { TipCard } from "@/components/Cards";
import { getListing, getTip } from "@/lib/data";
import { shareToX } from "@/lib/site";

const hasStarted = (iso: string) => Date.parse(iso) <= Date.now();

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const tip = await getTip(id);
  return tip ? { title: `${tip.selection} · ${tip.event}`, description: `${tip.market} at ${tip.odds.toFixed(2)}. ${tip.analysis}`.slice(0, 160) } : {};
}

export default async function TipPage({ params }: Props) {
  const { id } = await params;
  const tip = await getTip(id);
  if (!tip) notFound();
  const author = await getListing(tip.listingSlug);

  return (
    <div className="mx-auto max-w-xl px-4 py-10">
      <Link href="/tips" className="text-sm text-muted hover:text-fg">
        ← Free Tips
      </Link>
      <div className="mt-4">
        <TipCard tip={tip} author={author} linked={false} />
      </div>
      <p className="mt-4 text-sm text-muted">
        {hasStarted(tip.eventStart) ? "This tip was locked when the event started and can't be edited." : "This tip locks when the event starts. After that it can't be edited."} Tips are opinions, not advice. Odds may have moved. Bet only what
        you can afford to lose.
      </p>
      <a
        href={shareToX(`${tip.selection} @ ${tip.odds.toFixed(2)} (${tip.event})${author ? ` from ${author.name}` : ""} on Grinners. 18+`, `/tips/${id}`)}
        target="_blank"
        rel="noopener"
        className="mt-6 inline-flex h-10 items-center rounded-control border border-line px-4 text-sm text-muted hover:text-fg"
      >
        Share to X
      </a>
    </div>
  );
}
