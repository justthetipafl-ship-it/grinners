import Link from "next/link";
import { requireAdmin } from "@/lib/supabase";

const STATUS_STYLE: Record<string, string> = {
  published: "bg-grin/15 text-grin",
  draft: "bg-raised text-muted",
  pending: "bg-spotlight/15 text-spotlight",
  archived: "bg-raised text-muted line-through",
};

/** What a listing is still missing before it looks finished on the public site. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function gaps(l: any): string[] {
  const a = l.attributes ?? {};
  return [
    !(l.tagline ?? "").trim() && "No one-line description",
    (l.bio ?? "").trim().length < 120 && "Short About text",
    !(l.features?.length > 0) && "No features",
    !l.logo_url && "No logo",
    !l.cover_url && !a.feed_image && "No preview image",
    !a.country && "No country",
    !(l.sports?.length > 0) && "No sports",
    a.feed_error && "Feed problem",
  ].filter(Boolean) as string[];
}

export default async function AdminListings({ searchParams }: { searchParams: Promise<{ deleted?: string; q?: string; show?: string }> }) {
  const { deleted, q = "", show } = await searchParams;
  const { supabase, isAdmin } = await requireAdmin();
  if (!isAdmin) return null;

  const { data: allListings, error } = await supabase
    .from("listings")
    .select("id, name, slug, types, status, is_featured, is_sponsored, updated_at, tagline, bio, features, logo_url, cover_url, sports, attributes")
    .order("updated_at", { ascending: false });

  const all = (allListings ?? []).map((l) => ({ ...l, gaps: gaps(l) }));
  const needWork = all.filter((l) => l.gaps.length > 0).length;
  const search = q.trim().toLowerCase();
  const listings = all.filter((l) => (!search || l.name.toLowerCase().includes(search)) && (show !== "gaps" || l.gaps.length > 0));

  return (
    <div>
      <div className="mb-4 flex items-center justify-between gap-4">
        <h1 className="display text-3xl uppercase">Listings</h1>
        <Link href="/admin/listings/new" className="flex h-10 items-center rounded-control bg-grin px-4 text-sm font-semibold text-ink hover:brightness-110">
          Add a listing
        </Link>
      </div>
      {deleted && (
        <p role="status" className="mb-4 rounded-control border border-line bg-surface px-3 py-2 text-sm">
          Deleted “{deleted}”.
        </p>
      )}
      {error && <p className="mb-4 rounded-control border border-loss/50 bg-loss/10 px-3 py-2 text-sm">Couldn&apos;t load listings: {error.message}</p>}
      {all.length > 0 && (
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <form className="flex gap-2">
            {show === "gaps" && <input type="hidden" name="show" value="gaps" />}
            <input name="q" defaultValue={q} placeholder="Find by name" aria-label="Find a listing by name" className="h-10 w-56 rounded-control border border-line bg-surface px-3 text-sm outline-none focus:border-muted" />
            <button className="h-10 rounded-control border border-line px-4 text-sm hover:bg-surface">Find</button>
          </form>
          <Link href={show === "gaps" ? "/admin/listings" : "/admin/listings?show=gaps"} className={`flex h-10 items-center rounded-control border px-4 text-sm ${show === "gaps" ? "border-fg bg-fg text-ink" : "border-line hover:bg-surface"}`}>
            Needs work ({needWork})
          </Link>
          <p className="text-sm text-muted">
            Showing {listings.length} of {all.length}
          </p>
        </div>
      )}
      {listings.length ? (
        <div className="overflow-x-auto rounded-card border border-line">
          <table className="w-full text-sm">
            <thead className="bg-surface text-left text-xs uppercase tracking-wide text-muted">
              <tr>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Types</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Flags</th>
                <th className="px-4 py-3 font-medium">Still missing</th>
              </tr>
            </thead>
            <tbody>
              {listings.map((l) => (
                <tr key={l.id} className="border-t border-line hover:bg-surface">
                  <td className="px-4 py-3">
                    <Link href={`/admin/listings/${l.id}`} className="font-medium hover:underline">
                      {l.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-muted">{(l.types as string[]).join(", ")}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLE[l.status] ?? ""}`}>{l.status}</span>
                  </td>
                  <td className="px-4 py-3 text-muted">{[l.is_featured && "Featured", l.is_sponsored && "Sponsored"].filter(Boolean).join(", ")}</td>
                  <td className="px-4 py-3 text-xs text-muted">{l.gaps.join(" · ")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        !error && (
          <p className="rounded-card border border-dashed border-line p-10 text-center text-muted">
            {all.length ? "Nothing matches." : "No listings yet. Add your first one."}
          </p>
        )
      )}
    </div>
  );
}
