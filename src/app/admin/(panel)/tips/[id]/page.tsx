import Link from "next/link";
import { notFound } from "next/navigation";
import { saveTip } from "../../../actions";
import { Field, Group, Notices, SaveBar, area, input } from "@/components/AdminForm";
import { requireAdmin } from "@/lib/supabase";

/** Stored time shown back as Brisbane time for the date-and-time field. */
const toBrisbaneInput = (iso: string) => new Date(Date.parse(iso) + 10 * 3_600_000).toISOString().slice(0, 16);

type Props = { params: Promise<{ id: string }>; searchParams: Promise<{ error?: string }> };

export default async function EditTip({ params, searchParams }: Props) {
  const { id } = await params;
  const { error } = await searchParams;
  const { supabase, isAdmin } = await requireAdmin();
  if (!isAdmin) return null;

  const isNew = id === "new";
  const [{ data: tip }, { data: listings }, { data: sports }, { data: markets }] = await Promise.all([
    isNew ? Promise.resolve({ data: null }) : supabase.from("tips").select("*, competitions(name)").eq("id", id).maybeSingle(),
    supabase.from("listings").select("id, name").neq("status", "archived").order("name"),
    supabase.from("sports").select("id, name").order("sort_order"),
    supabase.from("markets").select("name").order("name"),
  ]);
  if (!isNew && !tip) notFound();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const t = (tip ?? {}) as any;
  // eslint-disable-next-line react-hooks/purity -- admin pages render fresh on every request
  const locked = t.status === "published" && Date.parse(t.event_start) <= Date.now();

  return (
    <form action={saveTip} className="flex max-w-3xl flex-col gap-5">
      <input type="hidden" name="id" value={isNew ? "" : id} />
      <input type="hidden" name="published_at" value={t.published_at ?? ""} />

      <div className="flex items-center justify-between gap-4">
        <h1 className="display text-3xl uppercase">{isNew ? "New tip" : "Edit tip"}</h1>
        <Link href="/admin/tips" className="text-sm text-muted hover:text-fg">
          ← All tips
        </Link>
      </div>
      <Notices error={error} />
      {locked && (
        <p className="rounded-control border border-line bg-surface px-3 py-2 text-sm text-muted">
          This tip is locked because the event has started. Set its result from the tips list.
        </p>
      )}

      <Group title="Who and what">
        <Field label="Tip from" hint="Only publish a creator's tip with their agreement.">
          <select name="listing_id" required defaultValue={t.listing_id ?? ""} className={input}>
            <option value="" disabled>
              Choose a listing
            </option>
            {(listings ?? []).map((l) => (
              <option key={l.id} value={l.id}>
                {l.name}
              </option>
            ))}
          </select>
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Sport">
            <select name="sport_id" required defaultValue={t.sport_id ?? ""} className={input}>
              <option value="" disabled>
                Choose a sport
              </option>
              {(sports ?? []).map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Competition" hint="Optional, e.g. AFL Premiership, NBA.">
            <input name="competition" defaultValue={t.competitions?.name ?? ""} className={input} />
          </Field>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Match or event">
            <input name="event_name" required defaultValue={t.event_name ?? ""} className={input} placeholder="Lions v Suns" />
          </Field>
          <Field label="Start time (Brisbane time)" hint="The tip locks at this moment.">
            <input name="event_start" type="datetime-local" required defaultValue={t.event_start ? toBrisbaneInput(t.event_start) : ""} className={input} />
          </Field>
        </div>
      </Group>

      <Group title="The selection">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Market">
            <input name="market" list="market-list" defaultValue={t.market_label ?? ""} className={input} placeholder="Player props" />
            <datalist id="market-list">{(markets ?? []).map((m) => <option key={m.name} value={m.name} />)}</datalist>
          </Field>
          <Field label="Odds (decimal)">
            <input name="odds" type="number" step="0.01" min="1.01" required defaultValue={t.odds ?? ""} className={`${input} font-mono`} placeholder="1.90" />
          </Field>
        </div>
        <Field label="Selection">
          <input name="selection" required defaultValue={t.selection ?? ""} className={input} placeholder="Lions -12.5" />
        </Field>
        <Field label="Bookmaker" hint="Optional. Shown as plain text, never as a link.">
          <input name="bookmaker" defaultValue={t.bookmaker ?? ""} className={input} />
        </Field>
        <Field label="Analysis" hint="The reasoning. A sentence or two is enough.">
          <textarea name="analysis" rows={4} defaultValue={t.analysis ?? ""} className={area} />
        </Field>
      </Group>

      <SaveBar
        status={t.status ?? "draft"}
        options={[
          ["draft", "Draft (hidden)"],
          ["published", "Published (live)"],
          ["archived", "Archived (hidden)"],
        ]}
      />
    </form>
  );
}
