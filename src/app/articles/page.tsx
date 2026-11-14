import type { Metadata } from "next";
import { ArticleCard } from "@/components/Cards";
import { getArticles } from "@/lib/data";

export const metadata: Metadata = {
  title: "Articles",
  description: "Betting education, strategy, fantasy, tool reviews and creator interviews.",
};

export default async function ArticlesPage() {
  const articles = await getArticles();
  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="display text-4xl uppercase sm:text-5xl">Articles</h1>
      <p className="mt-2 max-w-2xl text-muted">Education, strategy and reviews. Sponsored pieces are always labelled.</p>
      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {articles.map((a) => (
          <ArticleCard key={a.slug} article={a} />
        ))}
      </div>
    </div>
  );
}
