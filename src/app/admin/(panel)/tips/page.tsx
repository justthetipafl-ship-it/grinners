import Link from "next/link";
import { gradeTip } from "../../actions";
import { Notices } from "@/components/AdminForm";
import { requireAdmin } from "@/lib/supabase";

const when = new Intl.DateTimeFormat("en-AU", { timeZone: "Australia/Brisbane", day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });

const hasStarted = (iso: string) => Date.parse(iso) <= Date.now();

const RESULT_STYLE: Record<string, string> = {
  won: "bg-grin/15 text-grin",
  lost: "bg-loss/15 text-loss",
  void: "bg-raised text-muted",
  pending: "bg-raised text-muted",
};

export default async function AdminTips({ searchParams }: { searchParams: Promise<{ error?: string; saved?: string }> }) {
  const { error, saved } = await searchParams;
  const { supabase, isAdmin } = await requireAdmin();
  if (!isAdmin) return null;

  const { data: tips, error: loadError } = await supabase
    .from("tips")
    .select("id, event_name, event_start, selection, odds, status, result, listings(name)")
    .order("event_start", { ascending: false })
    .limit(200);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-4">
        <h1 className="display text-3xl uppercase">Tips</h1>
        <Link href="/admin/tips/new" className="flex h-10 items-center rounded-control bg-grin px-4 text-sm font-semibold text-ink hover:brightness-110">
          Add a tip
        </Link>
      </div>
      <Notices error={error ?? loadError?.message} saved={saved} />
      <p className="text-sm text-muted">
        A published tip locks when its event starts. After that only the result can change. Times are Brisbane time.
      </p>
      {tips?.length ? (
        <div className="overflow-x-auto rounded-card border border-line">
          <table className="w-full text-sm">
            <thead className="bg-surface text-left text-xs uppercase tracking-wide text-muted">
              <tr>
                <th className="px-4 py-3 font-medium">Event</th>
                <th className="px-4 py-3 font-medium">Selection</th>
                <th className="px-4 py-3 font-medium">From</th>
                <th className="px-4 py-3 font-medium">Result</th>
                <th className="px-4 py-3 font-medium">Grade</th>
              </tr>
            </thead>
            <tbody>
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              {tips.map((t: any) => {
                const started = hasStarted(t.event_start);
                return (
                  <tr key={t.id} className="border-t border-line align-top hover:bg-surface">
                    <td className="px-4 py-3">
                      <Link href={`/admin/tips/${t.id}`} className="font-medium hover:underline">
                        {t.event_name}
                      </Link>
                      <div className="text-xs text-muted">
                        {when.format(new Date(t.event_start))}
                        {t.status !== "published" ? ` · ${t.status}` : started ? " · locked" : ""}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {t.selection} <span className="font-mono text-muted">@ {Number(t.odds).toFixed(2)}</span>
                    </td>
                    <td className="px-4 py-3 text-muted">{t.listings?.name}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${RESULT_STYLE[t.result]}`}>{t.result}</span>
                    </td>
                    <td className="px-4 py-3">
                      {t.status === "published" && started ? (
                        <form action={gradeTip} className="flex flex-wrap gap-1.5">
                          <input type="hidden" name="id" value={t.id} />
                          {(["won", "lost", "void", "pending"] as const)
                            .filter((r) => r !== t.result)
                            .map((r) => (
                              <button key={r} name="result" value={r} className="h-9 rounded-control border border-line px-3 text-xs capitalize hover:bg-raised">
                                {r === "pending" ? "Undo" : r}
                              </button>
                            ))}
                        </form>
                      ) : (
                        <span className="text-xs text-muted">{t.status === "published" ? "After it starts" : "Not published"}</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        !loadError && <p className="rounded-card border border-dashed border-line p-10 text-center text-muted">No tips yet. Add your first one.</p>
      )}
    </div>
  );
}
