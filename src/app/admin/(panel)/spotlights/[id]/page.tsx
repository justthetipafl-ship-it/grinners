import Link from "next/link";
import { notFound } from "next/navigation";
import { saveSpotlight } from "../../../actions";
import { Check, Field, Group, Notices, area, input } from "@/components/AdminForm";
import { SITE_URL } from "@/lib/site";
import { requireAdmin } from "@/lib/supabase";

const KINDS = ["Tipster of the Week", "Tool Spotlight", "Podcast of the Week", "Creator Spotlight", "New Creator Discovery"];

type Props = { params: Promise<{ id: string }>; searchParams: Promise<{ error?: string; saved?: string }> };

export default async function EditSpotlight({ params, searchParams }: Props) {
  const { id } = await params;
  const { error, saved } = await searchParams;
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
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Australia/Brisbane" }).format(new Date());

  return (
    <form action={saveSpotlight} className="flex max-w-3xl flex-col gap-5">
      <input type="hidden" name="id" value={isNew ? "" : id} />
      <div className="flex items-center justify-between gap-4">
        <h1 className="display text-3xl uppercase">{isNew ? "New spotlight" : "Edit spotlight"}</h1>
        <Link href="/admin/spotlights" className="text-sm text-muted hover:text-fg">
          ← All spotlights
        </Link>
      </div>
      <Notices error={error} saved={saved ? "Saved." : undefined} />
      {!isNew && (
        <div className="rounded-card border border-spotlight/40 bg-spotlight/10 p-4 text-sm">
          <p className="font-semibold">Preview link</p>
          <p className="mt-1 text-muted">
            {s.starts_on > today
              ? `Not public yet: it goes live on ${s.starts_on}. Send this link to the listing's owner so they can check it first.`
              : "This spotlight's start date has arrived, so it's public. The preview link still works."}
          </p>
          <p className="mt-2 select-all break-all rounded-control border border-line bg-ink px-3 py-2 font-mono text-xs">{`${SITE_URL}/spotlight/preview/${id}`}</p>
          <p className="mt-2">
            <Link href={`/spotlight/preview/${id}`} target="_blank" className="underline">
              Open the preview
            </Link>
            {!process.env.SUPABASE_SECRET_KEY && <span className="text-muted"> · Only works while you&apos;re signed in to admin, until the secret key setting is added in Vercel.</span>}
          </p>
        </div>
      )}
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
        <Field
          label="The write-up"
          hint="The first paragraph shows on the homepage. Write as many paragraphs as you like for the spotlight's own page: leave a blank line between them."
        >
          <textarea name="body" rows={10} defaultValue={s.body ?? ""} className={area} />
        </Field>
        <p className="rounded-control border border-line bg-raised p-3 text-sm text-muted">
          Pictures come from the listing itself. The spotlight shows the listing&apos;s preview image first, then its gallery (up to 8 images). To add or
          change them, edit the listing.
        </p>
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
