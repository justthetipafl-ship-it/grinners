import Link from "next/link";
import { moveFeatured } from "../../actions";
import { requireAdmin } from "@/lib/supabase";

const HOMEPAGE_SLOTS = 8;
const button = "flex h-9 min-w-9 items-center justify-center rounded-control border border-line px-2 text-sm hover:bg-raised disabled:opacity-30 disabled:hover:bg-transparent";

export default async function FeaturedOrder() {
  const { supabase, isAdmin } = await requireAdmin();
  if (!isAdmin) return null;

  const { data } = await supabase
    .from("listings")
    .select("id, name, types, status, attributes, updated_at")
    .eq("is_featured", true)
    .neq("status", "archived")
    .order("updated_at", { ascending: false });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rows = ((data ?? []) as any[]).sort(
    (a, b) => (a.attributes?.featured_order ?? Number.MAX_SAFE_INTEGER) - (b.attributes?.featured_order ?? Number.MAX_SAFE_INTEGER),
  );
  const live = rows.filter((r) => r.status === "published");

  return (
    <div className="flex max-w-3xl flex-col gap-4">
      <h1 className="display text-3xl uppercase">Featured order</h1>
      <p className="text-sm text-muted">
        The first {HOMEPAGE_SLOTS} published listings here fill the Featured row on the homepage, in this order. The same order decides
        which featured listings come first in each directory, and whose latest episode or video leads those homepage rows. To feature a
        listing, tick “Featured on the homepage” on its edit page; it joins the end of this list.
      </p>
      {rows.length ? (
        <ol className="flex flex-col gap-2">
          {rows.map((row, index) => {
            const slot = row.status === "published" ? live.indexOf(row) + 1 : 0;
            return (
              <li key={row.id} className="flex flex-wrap items-center gap-3 rounded-card border border-line bg-surface px-4 py-3">
                <span className="w-6 font-mono text-sm text-muted">{index + 1}</span>
                <div className="min-w-0 flex-1">
                  <Link href={`/admin/listings/${row.id}`} className="font-medium hover:underline">
                    {row.name}
                  </Link>
                  <p className="text-xs text-muted">
                    {(row.types as string[]).join(", ")}
                    {" · "}
                    {row.status !== "published" ? (
                      `${row.status}, not shown`
                    ) : slot <= HOMEPAGE_SLOTS ? (
                      <span className="text-grin">On the homepage</span>
                    ) : (
                      "Waiting for a homepage place"
                    )}
                  </p>
                </div>
                <form action={moveFeatured} className="flex gap-1.5">
                  <input type="hidden" name="id" value={row.id} />
                  <button name="move" value="top" disabled={index === 0} aria-label={`Move ${row.name} to the top`} className={button}>
                    Top
                  </button>
                  <button name="move" value="up" disabled={index === 0} aria-label={`Move ${row.name} up`} className={button}>
                    ↑
                  </button>
                  <button name="move" value="down" disabled={index === rows.length - 1} aria-label={`Move ${row.name} down`} className={button}>
                    ↓
                  </button>
                  <button name="move" value="remove" aria-label={`Stop featuring ${row.name}`} className={`${button} text-muted hover:text-loss`}>
                    Remove
                  </button>
                </form>
              </li>
            );
          })}
        </ol>
      ) : (
        <p className="rounded-card border border-dashed border-line p-10 text-center text-muted">
          Nothing is featured yet. Tick “Featured on the homepage” on a listing&apos;s edit page.
        </p>
      )}
    </div>
  );
}
