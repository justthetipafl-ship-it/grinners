import Link from "next/link";
import { deleteSpotlight } from "../../actions";
import { Notices } from "@/components/AdminForm";
import { requireAdmin } from "@/lib/supabase";

const today = () => new Date(Date.now() + 10 * 3_600_000).toISOString().slice(0, 10); // Brisbane date

export default async function AdminSpotlights({ searchParams }: { searchParams: Promise<{ saved?: string }> }) {
  const { saved } = await searchParams;
  const { supabase, isAdmin } = await requireAdmin();
  if (!isAdmin) return null;
  const { data: spotlights, error } = await supabase
    .from("spotlights")
    .select("id, kind, headline, starts_on, ends_on, is_sponsored, listings(name)")
    .order("starts_on", { ascending: false });
  const now = today();

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-4">
        <h1 className="display text-3xl uppercase">Spotlights</h1>
        <Link href="/admin/spotlights/new" className="flex h-10 items-center rounded-control bg-grin px-4 text-sm font-semibold text-ink hover:brightness-110">
          Schedule a spotlight
        </Link>
      </div>
      <Notices error={error?.message} saved={saved} />
      <p className="text-sm text-muted">The homepage shows the running spotlight that started most recently. It can take up to an hour to switch over on its start date.</p>
      {spotlights?.length ? (
        <div className="overflow-x-auto rounded-card border border-line">
          <table className="w-full text-sm">
            <tbody>
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              {spotlights.map((s: any) => {
                const state = s.ends_on < now ? "Finished" : s.starts_on > now ? "Scheduled" : "Running";
                return (
                  <tr key={s.id} className="border-t border-line first:border-t-0 hover:bg-surface">
                    <td className="px-4 py-3">
                      <Link href={`/admin/spotlights/${s.id}`} className="font-medium hover:underline">
                        {s.headline}
                      </Link>
                      <div className="text-xs text-muted">
                        {s.kind} · {s.listings?.name}
                        {s.is_sponsored ? " · Sponsored" : ""}
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-muted">
                      {s.starts_on} to {s.ends_on}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${state === "Running" ? "bg-grin/15 text-grin" : "bg-raised text-muted"}`}>{state}</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <form action={deleteSpotlight}>
                        <input type="hidden" name="id" value={s.id} />
                        <button className="h-9 rounded-control border border-line px-3 text-xs text-muted hover:text-loss">Delete</button>
                      </form>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        !error && <p className="rounded-card border border-dashed border-line p-10 text-center text-muted">No spotlights scheduled.</p>
      )}
    </div>
  );
}
