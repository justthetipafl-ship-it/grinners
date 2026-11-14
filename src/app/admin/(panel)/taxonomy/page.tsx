import { addTaxonomy, deleteTaxonomy } from "../../actions";
import { Notices, input } from "@/components/AdminForm";
import { requireAdmin } from "@/lib/supabase";

type Row = { id: string; name: string };

function Section({ title, hint, table, kind, rows }: { title: string; hint: string; table: string; kind?: string; rows: Row[] }) {
  return (
    <section className="rounded-card border border-line bg-surface p-5">
      <h2 className="font-semibold">{title}</h2>
      <p className="mt-1 text-xs text-muted">{hint}</p>
      <ul className="mt-3 flex flex-wrap gap-2">
        {rows.map((row) => (
          <li key={row.id}>
            <form action={deleteTaxonomy} className="flex items-center gap-1 rounded-full border border-line bg-raised py-1 pl-3 pr-1 text-sm">
              <input type="hidden" name="table" value={table} />
              <input type="hidden" name="id" value={row.id} />
              {row.name}
              <button aria-label={`Delete ${row.name}`} className="flex h-7 w-7 items-center justify-center rounded-full text-muted hover:bg-ink hover:text-loss">
                ×
              </button>
            </form>
          </li>
        ))}
        {rows.length === 0 && <li className="text-sm text-muted">None yet.</li>}
      </ul>
      <form action={addTaxonomy} className="mt-4 flex max-w-md gap-2">
        <input type="hidden" name="table" value={table} />
        {kind && <input type="hidden" name="kind" value={kind} />}
        <input name="name" required aria-label={`New ${title.toLowerCase()} name`} placeholder="Add new" className={input} />
        <button className="h-11 shrink-0 rounded-control border border-line px-4 text-sm hover:bg-raised">Add</button>
      </form>
    </section>
  );
}

export default async function AdminTaxonomy({ searchParams }: { searchParams: Promise<{ error?: string; saved?: string }> }) {
  const { error, saved } = await searchParams;
  const { supabase, isAdmin } = await requireAdmin();
  if (!isAdmin) return null;

  const [sports, markets, categories] = await Promise.all([
    supabase.from("sports").select("id, name").order("sort_order"),
    supabase.from("markets").select("id, name").order("name"),
    supabase.from("categories").select("id, name, kind").order("name"),
  ]);
  const ofKind = (kind: string) => (categories.data ?? []).filter((c) => c.kind === kind);

  return (
    <div className="flex max-w-3xl flex-col gap-4">
      <h1 className="display text-3xl uppercase">Sports and categories</h1>
      <Notices error={error} saved={saved} />
      <Section title="Sports" hint="Shown as filters across the site, in this order. Deleting one doesn't untick it on listings that already have it." table="sports" rows={sports.data ?? []} />
      <Section title="Betting markets" hint="Suggestions offered when you add a tip." table="markets" rows={markets.data ?? []} />
      <Section title="Tool categories" hint="Offered on a tool's listing." table="categories" kind="tool" rows={ofKind("tool")} />
      <Section title="Article categories" hint="Offered when you write an article." table="categories" kind="article" rows={ofKind("article")} />
    </div>
  );
}
