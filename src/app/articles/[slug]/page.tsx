import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { DisclosureBadge } from "@/components/Cards";
import { getArticle } from "@/lib/data";
import { shareToX } from "@/lib/site";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const article = await getArticle(slug);
  return article ? { title: article.title, description: article.excerpt, openGraph: { type: "article" } } : {};
}

const day = new Intl.DateTimeFormat("en-AU", { day: "numeric", month: "long", year: "numeric", timeZone: "Australia/Brisbane" });

/** Turns [text](https://address) into links. Only http and https addresses become links. */
function inline(text: string) {
  const parts = text.split(/(\[[^\]]+\]\(https?:\/\/[^\s)]+\))/g);
  return parts.map((part, i) => {
    const match = part.match(/^\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)$/);
    return match ? (
      <a key={i} href={match[2]} target="_blank" rel="noopener" className="text-spotlight underline">
        {match[1]}
      </a>
    ) : (
      part
    );
  });
}

/** Simple formatting: blank line between paragraphs, ## headings, - bullets. */
function Body({ text }: { text: string }) {
  const blocks = text.split(/\n{2,}/).map((b) => b.trim()).filter(Boolean);
  return (
    <div className="flex flex-col gap-5 text-lg leading-relaxed text-fg/90">
      {blocks.map((block, i) => {
        if (block.startsWith("## ")) {
          return (
            <h2 key={i} className="display mt-4 text-2xl text-fg">
              {block.slice(3)}
            </h2>
          );
        }
        const lines = block.split("\n");
        if (lines.every((l) => l.startsWith("- "))) {
          return (
            <ul key={i} className="list-disc space-y-2 pl-6">
              {lines.map((l, j) => (
                <li key={j}>{inline(l.slice(2))}</li>
              ))}
            </ul>
          );
        }
        return <p key={i}>{inline(lines.join(" "))}</p>;
      })}
    </div>
  );
}

export default async function ArticlePage({ params }: Props) {
  const { slug } = await params;
  const article = await getArticle(slug);
  if (!article) notFound();
  const shareUrl = shareToX(article.title, `/articles/${slug}`);

  return (
    <article className="mx-auto max-w-2xl px-4 py-10">
      <Link href="/articles" className="text-sm text-muted hover:text-fg">
        ← Articles
      </Link>
      <p className="mt-6 flex items-center gap-2 text-sm text-spotlight">
        {article.category}
        {article.isSponsored && <DisclosureBadge kind="Sponsored" />}
      </p>
      <h1 className="display mt-2 text-4xl sm:text-5xl">{article.title}</h1>
      <p className="mt-4 text-sm text-muted">
        {article.author} · {day.format(new Date(article.publishedAt))}
      </p>
      {article.isSponsored && (
        <p className="mt-4 rounded-control border border-line bg-surface px-3 py-2 text-sm text-muted">
          This article was paid for by {article.sponsorName ?? "a sponsor"}.
        </p>
      )}
      <p className="mt-6 text-xl text-muted">{article.excerpt}</p>
      {article.body && (
        <div className="mt-8">
          <Body text={article.body} />
        </div>
      )}
      <div className="mt-10 border-t border-line pt-6">
        <a href={shareUrl} target="_blank" rel="noopener" className="inline-flex h-10 items-center rounded-control border border-line px-4 text-sm text-muted hover:text-fg">
          Share to X
        </a>
      </div>
    </article>
  );
}
