import Link from "next/link";
import { notFound } from "next/navigation";
import { saveSpotlight } from "../../../actions";
import { Check, Field, Group, Notices, area, input } from "@/components/AdminForm";
import { requireAdmin } from "@/lib/supabase";

const KINDS = ["Tipster of the Week", "Tool Spotlight", "Podcast of the Week", "Creator Spotlight", "New Creator Discovery"];

type Props = { params: Promise<{ id: string }>; searchParams: Promise<{ error?: string }> };

export default async function EditSpotlight({ params, searchParams }: Props) {
  const { id } = await params;
  const { error } = await searchParams;
  const { supabase, isAdmin } = await requireAdmin();
  if (!isAdmin) return null;

  const isNew = id === "new";
  const [{ data: spotlight }, { data: listings }] = await Promise.all([
    isNew ? Promise.resolve({ data: null }) : supabase.from("spotlights").select("*").eq("id", id).maybeSingle(),
    supabase.from("listings").select("id, name").eq("status", "published").order("name"),
  ]);
  if (!isNew && !spotlight) notFound();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const s = (spotlight ?? {}) as any;

  return (
    <form action={saveSpotlight} className="flex max-w-3xl flex-col gap-5">
      <input type="hidden" name="id" value={isNew ? "" : id} />
      <div className="flex items-center justify-between gap-4">
        <h1 className="display text-3xl uppercase">{isNew ? "New spotlight" : "Edit spotlight"}</h1>
        <Link href="/admin/spotlights" className="text-sm text-muted hover:text-fg">
          ← All spotlights
        </Link>
      </div>
      <Notices error={error} />
      <Group title="Spotlight">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Kind">
            <select name="kind" defaultValue={s.kind ?? KINDS[0]} className={input}>
              {KINDS.map((k) => (
                <option key={k}>{k}</option>
              ))}
            </select>
          </Field>
          <Field label="Listing" hint="Only published listings can be spotlighted.">
            <select name="listing_id" required defaultValue={s.listing_id ?? ""} className={input}>
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
        </div>
        <Field label="Headline">
          <input name="headline" required defaultValue={s.headline ?? ""} className={input} />
        </Field>
        <Field label="Why they're featured" hint="Two or three sentences.">
          <textarea name="body" rows={3} defaultValue={s.body ?? ""} className={area} />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Starts">
            <input name="starts_on" type="date" required defaultValue={s.starts_on ?? ""} className={input} />
          </Field>
          <Field label="Ends">
            <input name="ends_on" type="date" required defaultValue={s.ends_on ?? ""} className={input} />
          </Field>
        </div>
        <Check name="is_sponsored" label="This spotlight was paid for (shows the “Sponsored” label)" checked={s.is_sponsored} />
      </Group>
      <button className="h-11 w-fit rounded-control bg-grin px-6 font-semibold text-ink hover:brightness-110">Save</button>
    </form>
  );
}
