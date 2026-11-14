import Link from "next/link";
import { requireAdmin } from "@/lib/supabase";

export default async function AdminArticles() {
  const { supabase, isAdmin } = await requireAdmin();
  if (!isAdmin) return null;

  const { data: articles, error } = await supabase
    .from("articles")
    .select("id, title, status, is_sponsored, published_at, updated_at")
    .order("updated_at", { ascending: false });

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-4">
        <h1 className="display text-3xl uppercase">Articles</h1>
        <Link href="/admin/articles/new" className="flex h-10 items-center rounded-control bg-grin px-4 text-sm font-semibold text-ink hover:brightness-110">
          Write an article
        </Link>
      </div>
      {error && <p className="rounded-control border border-loss/50 bg-loss/10 px-3 py-2 text-sm">Couldn&apos;t load articles: {error.message}</p>}
      {articles?.length ? (
        <div className="overflow-x-auto rounded-card border border-line">
          <table className="w-full text-sm">
            <thead className="bg-surface text-left text-xs uppercase tracking-wide text-muted">
              <tr>
                <th className="px-4 py-3 font-medium">Title</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Flags</th>
              </tr>
            </thead>
            <tbody>
              {articles.map((a) => (
                <tr key={a.id} className="border-t border-line hover:bg-surface">
                  <td className="px-4 py-3">
                    <Link href={`/admin/articles/${a.id}`} className="font-medium hover:underline">
                      {a.title}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-muted">{a.status}</td>
                  <td className="px-4 py-3 text-muted">{a.is_sponsored ? "Sponsored" : ""}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        !error && <p className="rounded-card border border-dashed border-line p-10 text-center text-muted">No articles yet.</p>
      )}
    </div>
  );
}
