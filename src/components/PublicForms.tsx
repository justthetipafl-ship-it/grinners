"use client";

import { useActionState } from "react";
import { FEATURE_GROUPS, STANDARD_FEATURES } from "@/lib/features";
import { requestSpotlight, subscribe, suggestListing, type FormState } from "@/app/actions";

const input = "h-12 w-full rounded-control border border-line bg-raised px-4 placeholder:text-muted";
const area = "w-full rounded-control border border-line bg-raised px-4 py-3";

function Message({ state }: { state: FormState }) {
  if (!state) return null;
  return (
    <p role={state.ok ? "status" : "alert"} className={`text-sm ${state.ok ? "text-grin" : "text-loss"}`}>
      {state.message}
    </p>
  );
}

/** Hidden from people; bots tend to fill every field, which lets the server ignore them. */
function Honeypot() {
  return <input name="company" tabIndex={-1} autoComplete="off" aria-hidden="true" className="absolute left-[-9999px] h-0 w-0 opacity-0" />;
}

export function NewsletterForm({ source = "home" }: { source?: string }) {
  const [state, action, pending] = useActionState(subscribe, null);
  if (state?.ok) return <Message state={state} />;
  return (
    <form action={action} className="flex w-full max-w-md flex-col gap-2">
      <div className="flex gap-2">
        <label htmlFor="newsletter-email" className="sr-only">
          Email address
        </label>
        <input id="newsletter-email" name="email" type="email" required placeholder="you@example.com" autoComplete="email" className={input} />
        <input type="hidden" name="source" value={source} />
        <Honeypot />
        <button disabled={pending} className="h-12 shrink-0 rounded-control bg-grin px-5 font-semibold text-ink hover:brightness-110 disabled:opacity-60">
          {pending ? "Joining…" : "Join"}
        </button>
      </div>
      <Message state={state} />
    </form>
  );
}

/** `countries` comes from the server so the names in the list are identical on the server and in the browser. */
export type SuggestInitial = Partial<
  Record<"name" | "url" | "type" | "sports" | "tagline" | "bio" | "features" | "country" | "pricing" | "pricing_note" | "x_url" | "youtube_url" | "podcast_url" | "other_links", string>
>;

/** `updateOf` turns the form into "update my listing": the same questions, filled in with what the listing says now. */
export function SuggestForm({
  owner = false,
  countries = [],
  initial = {},
  updateOf,
}: {
  owner?: boolean;
  countries?: { code: string; name: string }[];
  initial?: SuggestInitial;
  updateOf?: string;
}) {
  const [state, action, pending] = useActionState(suggestListing, null);
  // Features the listing already has, when this is an update.
  const had = (initial.features ?? "").split("\n").filter(Boolean);
  if (state?.ok) {
    return (
      <div className="rounded-card border border-grin/40 bg-grin/10 p-5">
        <Message state={state} />
      </div>
    );
  }
  const label = "flex flex-col gap-1.5 text-sm font-medium";
  return (
    <form action={action} className="flex flex-col gap-4">
      <label className={label}>
        {owner ? "Name of your brand, tool, podcast or channel" : "Name of the creator, tool, podcast or channel"}
        <input name="name" required maxLength={120} defaultValue={initial.name} className={input} />
      </label>
      <label className={label}>
        Link
        <input name="url" type="url" required placeholder="https://" defaultValue={initial.url} className={input} />
      </label>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className={label}>
          {owner ? "What is it?" : "What are they?"}
          <select name="type" className={input} defaultValue={initial.type ?? "tipster"}>
            <option value="tipster">Tipster</option>
            <option value="tool">Tool</option>
            <option value="podcast">Podcast</option>
            <option value="youtube">YouTube channel</option>
            <option value="creator">Creator</option>
            <option value="news">News or alerts account</option>
            <option value="community">Community (Discord, group or forum)</option>
          </select>
        </label>
        <label className={label}>
          {owner ? "Sports you cover" : "Sports they cover"}
          <input name="sports" placeholder="AFL, NBA" maxLength={120} defaultValue={initial.sports} className={input} />
        </label>
      </div>
      {owner ? (
        <>
          <p className="mt-2 border-t border-line pt-5 text-sm text-muted">
            {updateOf
              ? "Change whatever is out of date. We check every update before it goes live."
              : "Everything below is optional, but the more you fill in, the faster your listing goes up and the better it looks."}
          </p>
          <label className={label}>
            One-line description <span className="font-normal text-muted">What it is and who it&apos;s for.</span>
            <input name="tagline" maxLength={140} defaultValue={initial.tagline} className={input} />
          </label>
          <label className={label}>
            About <span className="font-normal text-muted">A few sentences. Plain facts work best: we remove hype and unproven win claims.</span>
            <textarea name="bio" rows={4} maxLength={1200} defaultValue={initial.bio} className={area} />
          </label>
          <fieldset className="flex flex-col gap-3">
            <legend className="text-sm font-medium">
              Features <span className="font-normal text-muted">Tick everything that applies.</span>
            </legend>
            {FEATURE_GROUPS.map((group) => (
              <div key={group.title}>
                <p className="mb-1 mt-2 text-xs uppercase tracking-wide text-muted">{group.title}</p>
                <div className="grid gap-x-4 sm:grid-cols-2">
                  {group.options.map((option) => (
                    <label key={option} className="flex min-h-9 items-center gap-2 text-sm">
                      <input type="checkbox" name="feature_options" value={option} defaultChecked={had.includes(option)} className="h-4 w-4 shrink-0 accent-[var(--color-grin)]" />
                      {option}
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </fieldset>
          <label className={label}>
            Other features <span className="font-normal text-muted">Anything not listed above. One per line.</span>
            <textarea name="features" rows={3} maxLength={900} defaultValue={had.filter((f) => !STANDARD_FEATURES.includes(f)).join("\n")} className={area} />
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className={label}>
              Where you&apos;re based
              <select name="country" className={input} defaultValue={initial.country ?? ""}>
                <option value="">Prefer not to say</option>
                {countries.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>
            <label className={label}>
              Pricing
              <select name="pricing" className={input} defaultValue={initial.pricing ?? ""}>
                <option value="">Choose one</option>
                <option value="free">Free</option>
                <option value="paid">Paid</option>
                <option value="freemium">Free and paid</option>
              </select>
            </label>
          </div>
          <label className={label}>
            Pricing note <span className="font-normal text-muted">For example: from $10 a month, 7-day free trial.</span>
            <input name="pricing_note" maxLength={120} defaultValue={initial.pricing_note} className={input} />
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className={label}>
              X profile
              <input name="x_url" type="url" placeholder="https://x.com/" defaultValue={initial.x_url} className={input} />
            </label>
            <label className={label}>
              YouTube channel
              <input name="youtube_url" type="url" placeholder="https://youtube.com/@" defaultValue={initial.youtube_url} className={input} />
            </label>
          </div>
          <label className={label}>
            Podcast link or RSS feed <span className="font-normal text-muted">So your latest episodes show automatically.</span>
            <input name="podcast_url" type="url" placeholder="https://" defaultValue={initial.podcast_url} className={input} />
          </label>
          <label className={label}>
            Other links <span className="font-normal text-muted">Discord, Instagram, newsletter and so on. One per line, up to 5.</span>
            <textarea name="other_links" rows={3} maxLength={700} defaultValue={initial.other_links} className={area} />
          </label>
          <label className={label}>
            {updateOf ? "What changed, and anything else we should know?" : "Anything else we should know?"}
            <textarea name="why" rows={3} maxLength={1000} className={area} />
          </label>
          <label className="flex min-h-10 items-start gap-2 text-sm">
            <input type="checkbox" name="sponsored_interest" className="mt-0.5 h-4 w-4 shrink-0 accent-[var(--color-grin)]" />
            <span>
              I&apos;m interested in a paid spotlight <span className="text-muted">(always labelled &ldquo;Sponsored&rdquo;; listings themselves stay free)</span>
            </span>
          </label>
          <p className="text-sm text-muted">
            {updateOf ? "New logo or images? Mention it above and we'll email you for them." : "We'll email you for a logo and images once you're approved."}
          </p>
        </>
      ) : (
        <label className={label}>
          Why should they be on Grinners? <span className="font-normal text-muted">Optional</span>
          <textarea name="why" rows={3} maxLength={1000} className={area} />
        </label>
      )}
      <label className={label}>
        Your email{" "}
        <span className="font-normal text-muted">
          {updateOf
            ? "So we can confirm you run this listing before changing it."
            : owner
              ? "So we can confirm it's you and tell you when you're listed."
              : "Optional. Only used to reply about this suggestion."}
        </span>
        <input name="email" type="email" autoComplete="email" required={owner} className={input} />
      </label>
      {owner && <input type="hidden" name="is_owner" value="on" />}
      {updateOf && <input type="hidden" name="update_slug" value={updateOf} />}
      <Honeypot />
      <Message state={state} />
      <button disabled={pending} className="h-12 w-fit rounded-control bg-grin px-6 font-semibold text-ink hover:brightness-110 disabled:opacity-60">
        {pending ? "Sending…" : updateOf ? "Send update" : owner ? "Request my listing" : "Send suggestion"}
      </button>
    </form>
  );
}

export function SpotlightRequestForm() {
  const [state, action, pending] = useActionState(requestSpotlight, null);
  if (state?.ok) {
    return (
      <div className="rounded-card border border-grin/40 bg-grin/10 p-5">
        <Message state={state} />
      </div>
    );
  }
  const label = "flex flex-col gap-1.5 text-sm font-medium";
  return (
    <form action={action} className="flex flex-col gap-4">
      <label className={label}>
        Who should we spotlight?
        <input name="name" required maxLength={120} className={input} />
      </label>
      <label className={label}>
        Link <span className="font-normal text-muted">Their Grinners profile if they have one, otherwise their site or main account.</span>
        <input name="url" type="url" required placeholder="https://" className={input} />
      </label>
      <label className={label}>
        What&apos;s the story? <span className="font-normal text-muted">What they do, who it&apos;s for and why now.</span>
        <textarea name="pitch" rows={5} required minLength={40} maxLength={1500} className="w-full rounded-control border border-line bg-raised px-4 py-3" />
      </label>
      <label className={label}>
        Your email <span className="font-normal text-muted">Only used to reply about this request.</span>
        <input name="email" type="email" autoComplete="email" required className={input} />
      </label>
      <label className="flex min-h-10 items-center gap-2 text-sm">
        <input type="checkbox" name="is_owner" className="h-4 w-4 accent-[var(--color-grin)]" />
        This is me, or I run it
      </label>
      <label className="flex min-h-10 items-center gap-2 text-sm">
        <input type="checkbox" name="sponsored_interest" className="h-4 w-4 accent-[var(--color-grin)]" />
        I&apos;d also consider a paid spotlight, labelled &ldquo;Sponsored&rdquo;
      </label>
      <Honeypot />
      <Message state={state} />
      <button disabled={pending} className="h-12 w-fit rounded-control bg-grin px-6 font-semibold text-ink hover:brightness-110 disabled:opacity-60">
        {pending ? "Sending…" : "Request a spotlight"}
      </button>
    </form>
  );
}
