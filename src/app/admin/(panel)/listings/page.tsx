import Link from "next/link";
import { requireAdmin } from "@/lib/supabase";

const STATUS_STYLE: Record<string, string> = {
  published: "bg-grin/15 text-grin",
  draft: "bg-raised text-muted",
  pending: "bg-spotlight/15 text-spotlight",
  archived: "bg-raised text-muted line-through",
};

export default async function AdminListings() {
  const { supabase, isAdmin } = await requireAdmin();
  if (!isAdmin) return null;

  const { data: listings, error } = await supabase
    .from("listings")
    .select("id, name, slug, types, status, is_featured, is_sponsored, updated_at")
    .order("updated_at", { ascending: false });

  return (
    <div>
      <div className="mb-4 flex items-center justify-between gap-4">
        <h1 className="display text-3xl uppercase">Listings</h1>
        <Link href="/admin/listings/new" className="flex h-10 items-center rounded-control bg-grin px-4 text-sm font-semibold text-ink hover:brightness-110">
          Add a listing
        </Link>
      </div>
      {error && <p className="mb-4 rounded-control border border-loss/50 bg-loss/10 px-3 py-2 text-sm">Couldn&apos;t load listings: {error.message}</p>}
      {listings?.length ? (
        <div className="overflow-x-auto rounded-card border border-line">
          <table className="w-full text-sm">
            <thead className="bg-surface text-left text-xs uppercase tracking-wide text-muted">
              <tr>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Types</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Flags</th>
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
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        !error && <p className="rounded-card border border-dashed border-line p-10 text-center text-muted">No listings yet. Add your first one.</p>
      )}
    </div>
  );
}
