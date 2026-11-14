import Link from "next/link";
import { requireAdmin } from "@/lib/supabase";

const daysAgo = (days: number) => new Date(Date.now() - days * 86_400_000).toISOString();

function Stat({ label, value }: { label: string; value: number | null }) {
  return (
    <div className="rounded-card border border-line bg-surface p-4">
      <p className="text-xs uppercase tracking-wide text-muted">{label}</p>
      <p className="mt-1 font-mono text-3xl tabular-nums">{value ?? "–"}</p>
    </div>
  );
}

export default async function AdminHome() {
  const { supabase, isAdmin } = await requireAdmin();
  if (!isAdmin) return null;

  const count = (table: string) => supabase.from(table).select("*", { count: "exact", head: true });
  const [published, drafts, clicks7, clicks30, subscribers, suggestions, recent] = await Promise.all([
    count("listings").eq("status", "published"),
    count("listings").in("status", ["draft", "pending"]),
    count("clicks").gte("created_at", daysAgo(7)),
    count("clicks").gte("created_at", daysAgo(30)),
    count("subscribers"),
    count("submissions").eq("status", "new"),
    supabase.from("clicks").select("listing_id, listings(name)").gte("created_at", daysAgo(30)).limit(5000),
  ]);

  // Clicks per listing over the last 30 days.
  const totals = new Map<string, number>();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  for (const row of (recent.data ?? []) as any[]) {
    const name = row.listings?.name ?? "Unknown";
    totals.set(name, (totals.get(name) ?? 0) + 1);
  }
  const top = [...totals.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10);

  return (
    <div className="flex flex-col gap-8">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Published listings" value={published.count} />
        <Stat label="Drafts and pending" value={drafts.count} />
        <Stat label="Outbound clicks, 7 days" value={clicks7.count} />
        <Stat label="Outbound clicks, 30 days" value={clicks30.count} />
        <Stat label="Newsletter sign-ups" value={subscribers.count} />
        <Stat label="Suggestions to review" value={suggestions.count} />
      </div>

      <section>
        <h2 className="mb-3 font-semibold">Most-clicked listings, last 30 days</h2>
        {top.length ? (
          <table className="w-full max-w-xl text-sm">
            <tbody>
              {top.map(([name, clicks]) => (
                <tr key={name} className="border-b border-line">
                  <td className="py-2">{name}</td>
                  <td className="py-2 text-right font-mono tabular-nums">{clicks}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="text-sm text-muted">No clicks recorded yet. They appear here once visitors use a listing&apos;s main button.</p>
        )}
      </section>

      <Link href="/admin/listings/new" className="flex h-11 w-fit items-center rounded-control bg-grin px-5 font-semibold text-ink hover:brightness-110">
        Add a listing
      </Link>
    </div>
  );
}
