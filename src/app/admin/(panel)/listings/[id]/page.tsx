import Link from "next/link";
import { notFound } from "next/navigation";
import { deleteListing, saveListing } from "../../../actions";
import { requireAdmin } from "@/lib/supabase";

const TYPES = [
  ["tipster", "Tipster"],
  ["tool", "Tool"],
  ["podcast", "Podcast"],
  ["youtube", "YouTube"],
  ["creator", "Creator"],
] as const;

const input = "h-11 w-full rounded-control border border-line bg-raised px-3";
const area = "w-full rounded-control border border-line bg-raised px-3 py-2";

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5 text-sm">
      <span className="font-medium">{label}</span>
      {children}
      {hint && <span className="text-xs text-muted">{hint}</span>}
    </label>
  );
}

function Check({ name, value, label, checked }: { name: string; value?: string; label: string; checked?: boolean }) {
  return (
    <label className="flex min-h-10 items-center gap-2 text-sm">
      <input type="checkbox" name={name} value={value} defaultChecked={checked} className="h-4 w-4 accent-[var(--color-grin)]" />
      {label}
    </label>
  );
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <fieldset className="flex flex-col gap-4 rounded-card border border-line bg-surface p-5">
      <legend className="px-1 text-xs font-semibold uppercase tracking-wide text-muted">{title}</legend>
      {children}
    </fieldset>
  );
}

type Props = { params: Promise<{ id: string }>; searchParams: Promise<{ error?: string; saved?: string }> };

export default async function EditListing({ params, searchParams }: Props) {
  const { id } = await params;
  const { error, saved } = await searchParams;
  const { supabase, isAdmin } = await requireAdmin();
  if (!isAdmin) return null;

  const isNew = id === "new";
  const [{ data: listing }, { data: sports }, { data: categories }] = await Promise.all([
    isNew
      ? Promise.resolve({ data: null })
      : supabase.from("listings").select("*, listing_links(platform, url, sort_order), affiliate_links(*)").eq("id", id).maybeSingle(),
    supabase.from("sports").select("slug, name").order("sort_order"),
    supabase.from("categories").select("name").eq("kind", "tool").order("name"),
  ]);
  if (!isNew && !listing) notFound();

  /* eslint-disable @typescript-eslint/no-explicit-any */
  const l = (listing ?? {}) as any;
  const links = [...(l.listing_links ?? [])]
    .sort((a: any, b: any) => a.sort_order - b.sort_order)
    .map((x: any) => `${x.platform} | ${x.url}`)
    .join("\n");
  const cta = (l.affiliate_links ?? []).find((a: any) => a.is_active);
  /* eslint-enable @typescript-eslint/no-explicit-any */

  return (
    <div className="flex max-w-3xl flex-col gap-10">
    <form action={saveListing} className="flex flex-col gap-5">
      <input type="hidden" name="id" value={isNew ? "" : id} />
      <input type="hidden" name="vetted_at" value={l.vetted_at ?? ""} />

      <div className="flex items-center justify-between gap-4">
        <h1 className="display text-3xl uppercase">{isNew ? "New listing" : l.name}</h1>
        <Link href="/admin/listings" className="text-sm text-muted hover:text-fg">
          ← All listings
        </Link>
      </div>

      {error && (
        <p role="alert" className="rounded-control border border-loss/50 bg-loss/10 px-3 py-2 text-sm">
          {error}
        </p>
      )}
      {saved && (
        <p role="status" className="rounded-control border border-grin/50 bg-grin/10 px-3 py-2 text-sm">
          Saved. Changes appear on the site straight away.
        </p>
      )}

      {l.attributes?.vet_note && l.status !== "published" && (
        <div className="rounded-card border border-spotlight/40 bg-spotlight/10 p-4 text-sm">
          <p className="font-semibold">Before you publish this one</p>
          <p className="mt-1 text-muted">{l.attributes.vet_note}</p>
        </div>
      )}

      <Group title="Basics">
        <Field label="Name">
          <input name="name" required defaultValue={l.name ?? ""} className={input} />
        </Field>
        <Field label="Web address (slug)" hint="Leave blank to build it from the name. Changing it later breaks old links.">
          <input name="slug" defaultValue={l.slug ?? ""} className={input} placeholder="the-back-pocket" />
        </Field>
        <div>
          <p className="mb-1 text-sm font-medium">Type</p>
          <div className="flex flex-wrap gap-x-5">
            {TYPES.map(([value, label]) => (
              <Check key={value} name="types" value={value} label={label} checked={(l.types ?? []).includes(value)} />
            ))}
          </div>
          <p className="text-xs text-muted">The first ticked type decides which directory the profile lives under.</p>
        </div>
        <Field label="One-line description" hint="Shown on cards. Aim for under 90 characters.">
          <input name="tagline" defaultValue={l.tagline ?? ""} className={input} maxLength={160} />
        </Field>
        <Field label="Bio">
          <textarea name="bio" rows={4} defaultValue={l.bio ?? ""} className={area} />
        </Field>
        <Field label="Logo or profile image" hint={l.logo_url ? "A logo is already uploaded. Choose a file only to replace it." : "Square image, under 1.5 MB."}>
          <input name="logo" type="file" accept="image/*" className="text-sm text-muted file:mr-3 file:h-10 file:rounded-control file:border-0 file:bg-raised file:px-4 file:text-fg" />
        </Field>
        <Field
          label="Preview image"
          hint={
            l.cover_url
              ? "A preview image is already uploaded. Choose a file only to replace it."
              : "A screenshot of the tool, a channel banner or show artwork. Wide (16:9) works best, under 1.5 MB."
          }
        >
          <input name="cover" type="file" accept="image/*" className="text-sm text-muted file:mr-3 file:h-10 file:rounded-control file:border-0 file:bg-raised file:px-4 file:text-fg" />
        </Field>
        {l.cover_url && (
          <div className="flex flex-col gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={l.cover_url} alt="Current preview image" className="aspect-video w-full max-w-sm rounded-control border border-line object-cover" />
            <Check name="remove_cover" label="Remove the preview image" />
          </div>
        )}
      </Group>

      <Group title="What they cover">
        <div>
          <p className="mb-1 text-sm font-medium">Sports</p>
          <div className="flex flex-wrap gap-x-5">
            {(sports ?? []).map((s) => (
              <Check key={s.slug} name="sports" value={s.slug} label={s.name} checked={(l.sports ?? []).includes(s.slug)} />
            ))}
          </div>
        </div>
        <Field label="Betting markets" hint="Separate with commas, e.g. Player props, Line, Totals">
          <input name="markets" defaultValue={(l.markets ?? []).join(", ")} className={input} />
        </Field>
        <Field label="Tool category" hint="Tools only.">
          <select name="category" defaultValue={l.category ?? ""} className={input}>
            <option value="">None</option>
            {(categories ?? []).map((c) => (
              <option key={c.name}>{c.name}</option>
            ))}
          </select>
        </Field>
        <Field label="Features" hint="Tools only. One per line.">
          <textarea name="features" rows={3} defaultValue={(l.features ?? []).join("\n")} className={area} />
        </Field>
      </Group>

      <Group title="Pricing and links">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Pricing">
            <select name="pricing" defaultValue={l.pricing ?? "free"} className={input}>
              <option value="free">Free</option>
              <option value="freemium">Free + paid</option>
              <option value="paid">Paid</option>
            </select>
          </Field>
          <Field label="Pricing note">
            <input name="pricing_note" defaultValue={l.pricing_note ?? ""} className={input} placeholder="Monthly membership" />
          </Field>
        </div>
        <Field label="Social and content links" hint="One per line, written as: Platform | https://address">
          <textarea name="links" rows={4} defaultValue={links} className={`${area} font-mono text-sm`} placeholder={"X | https://x.com/handle\nYouTube | https://youtube.com/@channel"} />
        </Field>
        <Field
          label="Feed for latest videos or episodes"
          hint={
            l.attributes?.feed_error
              ? `Last attempt failed: ${l.attributes.feed_error}`
              : "Podcasts: the show's RSS feed address. YouTube: the channel address or its channel ID (starts with UC). Then press “Refresh feeds” on the admin overview."
          }
        >
          <input name="feed_url" defaultValue={l.attributes?.feed_url ?? ""} className={input} placeholder="https://www.youtube.com/@channel" />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Main button text">
            <input name="cta_label" defaultValue={cta?.label ?? ""} className={input} placeholder="View membership" />
          </Field>
          <Field label="Main button link" hint="Leave blank for no button. Clicks are counted.">
            <input name="cta_url" type="url" defaultValue={cta?.destination_url ?? ""} className={input} placeholder="https://" />
          </Field>
        </div>
        <Check name="cta_affiliate" label="This is an affiliate link (shows the “Affiliate link” label)" checked={cta ? cta.is_affiliate : false} />
        <Field label="Tracking campaign (optional)" hint="Added to the link as utm_campaign.">
          <input name="utm_campaign" defaultValue={cta?.utm_campaign ?? ""} className={input} />
        </Field>
      </Group>

      <Group title="Disclosure and vetting">
        <Check name="is_sponsored" label="Sponsored placement (shows the “Sponsored” label)" checked={l.is_sponsored} />
        <Check name="is_featured" label="Featured on the homepage" checked={l.is_featured} />
        <Field label="Ownership disclosure" hint="Fill in if you own or have a stake in this listing. Shown on the profile.">
          <input name="ownership_disclosure" defaultValue={l.ownership_disclosure ?? ""} className={input} />
        </Field>
        <div className="rounded-control border border-line bg-raised p-3">
          <Check
            name="vetted"
            label="I've checked this listing: no promotion of unlicensed betting services, no guaranteed-profit claims"
            checked={Boolean(l.vetted_at)}
          />
          <p className="text-xs text-muted">Required before a listing can be published.</p>
        </div>
      </Group>

      <div className="sticky bottom-0 -mx-4 flex flex-wrap items-center gap-3 border-t border-line bg-ink/95 px-4 py-3 backdrop-blur">
        <select name="status" defaultValue={l.status ?? "draft"} aria-label="Status" className="h-11 rounded-control border border-line bg-raised px-3 text-sm">
          <option value="draft">Draft (hidden)</option>
          <option value="published">Published (live)</option>
          <option value="archived">Archived (hidden)</option>
        </select>
        <button className="h-11 rounded-control bg-grin px-6 font-semibold text-ink hover:brightness-110">Save</button>
      </div>
    </form>

    {!isNew && (
      <form action={deleteListing} className="flex flex-col gap-3 rounded-card border border-loss/40 p-5">
        <input type="hidden" name="id" value={id} />
        <h2 className="font-semibold">Delete this listing</h2>
        <p className="text-sm text-muted">
          This permanently removes the listing, its links, its images, its latest videos or episodes, any spotlights for it, and{" "}
          <strong className="text-fg">every tip posted under it, including its graded record</strong>. Click counts are kept but no longer
          tied to a name. It can&apos;t be undone. To hide a listing and keep everything, set it to Archived instead.
        </p>
        <label className="flex min-h-10 items-center gap-2 text-sm">
          <input type="checkbox" name="confirm" className="h-4 w-4 accent-[var(--color-loss)]" />
          Yes, permanently delete {l.name}
        </label>
        <button className="h-11 w-fit rounded-control border border-loss/60 px-5 text-sm font-semibold text-loss hover:bg-loss/10">Delete listing</button>
      </form>
    )}
    </div>
  );
}
