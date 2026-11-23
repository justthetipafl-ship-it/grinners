import Link from "next/link";
import { requireAdmin } from "@/lib/supabase";

const DAY = 24 * 60 * 60 * 1000;

/** Counts how many times each value appears and returns the most common first. */
function tally(values: (string | null | undefined)[], limit: number): [string, number][] {
  const counts = new Map<string, number>();
  for (const value of values) if (value) counts.set(value, (counts.get(value) ?? 0) + 1);
  return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, limit);
}

function Stat({ label, value, note }: { label: string; value: number; note?: string }) {
  return (
    <div className="rounded-card border border-line bg-surface p-4">
      <p className="text-xs uppercase tracking-wide text-muted">{label}</p>
      <p className="mt-1 font-mono text-3xl">{value.toLocaleString("en-AU")}</p>
      {note && <p className="mt-1 text-xs text-muted">{note}</p>}
    </div>
  );
}

function Ranked({ title, rows, empty, hrefFor }: { title: string; rows: [string, number][]; empty: string; hrefFor?: (label: string) => string | undefined }) {
  const top = rows[0]?.[1] ?? 0;
  return (
    <section className="rounded-card border border-line bg-surface p-4">
      <h2 className="mb-3 font-semibold">{title}</h2>
      {rows.length === 0 ? (
        <p className="text-sm text-muted">{empty}</p>
      ) : (
        <ol className="flex flex-col gap-2 text-sm">
          {rows.map(([label, count]) => {
            const href = hrefFor?.(label);
            return (
              <li key={label}>
                <div className="flex items-baseline justify-between gap-3">
                  {href ? (
                    <Link href={href} className="truncate hover:underline">
                      {label}
                    </Link>
                  ) : (
                    <span className="truncate">{label}</span>
                  )}
                  <span className="shrink-0 font-mono text-muted">{count.toLocaleString("en-AU")}</span>
                </div>
                <div className="mt-1 h-1 rounded-full bg-raised">
                  <div className="h-1 rounded-full bg-fg/60" style={{ width: `${Math.max(2, Math.round((count / top) * 100))}%` }} />
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}

export default async function NumbersPage() {
  const { supabase, isAdmin } = await requireAdmin();
  if (!isAdmin) return null;

  // Rendered per request for the signed-in admin, so "now" is simply when the page was opened.
  // eslint-disable-next-line react-hooks/purity
  const now = Date.now();
  const since30 = new Date(now - 30 * DAY).toISOString();
  const since7 = now - 7 * DAY;

  const [clicks, saves, listings, subscribers, newSubscribers, submissions, newSubmissions] = await Promise.all([
    supabase.from("clicks").select("listing_id, source_path, country, created_at").gte("created_at", since30).order("created_at", { ascending: false }).limit(20000),
    supabase.from("saves").select("listing_id, created_at").gte("created_at", since30).limit(20000),
    supabase.from("listings").select("id, name"),
    supabase.from("subscribers").select("id", { count: "exact", head: true }),
    supabase.from("subscribers").select("id", { count: "exact", head: true }).gte("created_at", since30),
    supabase.from("submissions").select("id", { count: "exact", head: true }),
    supabase.from("submissions").select("id", { count: "exact", head: true }).eq("status", "new"),
  ]);

  const nameOf = new Map((listings.data ?? []).map((l) => [l.id as string, l.name as string]));
  const idOf = new Map((listings.data ?? []).map((l) => [l.name as string, l.id as string]));
  const clickRows = clicks.data ?? [];
  const saveRows = saves.data ?? [];
  const week = clickRows.filter((c) => Date.parse(c.created_at) >= since7);

  // Clicks per day for the last 14 days, in Brisbane time.
  const dayKey = (iso: string | number) => new Intl.DateTimeFormat("en-CA", { timeZone: "Australia/Brisbane" }).format(new Date(iso));
  const days = Array.from({ length: 14 }, (_, i) => dayKey(now - (13 - i) * DAY));
  const perDay = new Map(days.map((d) => [d, 0]));
  for (const c of clickRows) {
    const key = dayKey(c.created_at);
    if (perDay.has(key)) perDay.set(key, perDay.get(key)! + 1);
  }
  const busiest = Math.max(1, ...perDay.values());

  const listingLink = (name: string) => (idOf.get(name) ? `/admin/listings/${idOf.get(name)}` : undefined);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="display text-3xl uppercase">Numbers</h1>
        <p className="mt-1 text-sm text-muted">
          The last 30 days. A click is someone pressing a listing&apos;s main button or deal button. Page views aren&apos;t counted here: Grinners doesn&apos;t
          track visitors.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Clicks, 7 days" value={week.length} />
        <Stat label="Clicks, 30 days" value={clickRows.length} />
        <Stat label="Saves, 30 days" value={saveRows.length} note={saves.error ? "Needs the saves database update." : undefined} />
        <Stat label="Newsletter" value={subscribers.count ?? 0} note={`${newSubscribers.count ?? 0} joined in the last 30 days`} />
      </div>

      <section className="rounded-card border border-line bg-surface p-4">
        <h2 className="mb-3 font-semibold">Clicks per day, last 14 days</h2>
        <div className="flex h-28 items-end gap-1.5">
          {days.map((day) => (
            <div key={day} className="flex flex-1 flex-col items-center gap-1" title={`${day}: ${perDay.get(day)} clicks`}>
              <span className="font-mono text-[10px] text-muted">{perDay.get(day) || ""}</span>
              <div className="w-full rounded-t bg-fg/70" style={{ height: `${Math.round((perDay.get(day)! / busiest) * 80)}px`, minHeight: 2 }} />
              <span className="font-mono text-[10px] text-muted">{day.slice(8)}</span>
            </div>
          ))}
        </div>
      </section>

      <div className="grid gap-3 lg:grid-cols-2">
        <Ranked title="Most clicked listings" rows={tally(clickRows.map((c) => nameOf.get(c.listing_id)), 15)} empty="No clicks yet." hrefFor={listingLink} />
        <Ranked title="Most saved listings" rows={tally(saveRows.map((s) => nameOf.get(s.listing_id)), 15)} empty="No saves yet." hrefFor={listingLink} />
        <Ranked title="Pages the clicks came from" rows={tally(clickRows.map((c) => c.source_path), 12)} empty="No clicks yet." />
        <Ranked title="Clicks by visitor country" rows={tally(clickRows.map((c) => c.country), 12)} empty="No clicks yet." />
      </div>

      <p className="text-sm text-muted">
        {submissions.count ?? 0} suggestions and requests received in total, {newSubmissions.count ?? 0} waiting in{" "}
        <Link href="/admin/submissions" className="text-fg underline">
          Suggestions
        </Link>
        .
      </p>
    </div>
  );
}
