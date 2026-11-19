"use client";

import { useActionState } from "react";
import { subscribe, suggestListing, type FormState } from "@/app/actions";

const input = "h-12 w-full rounded-control border border-line bg-raised px-4 placeholder:text-muted";

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

export function SuggestForm() {
  const [state, action, pending] = useActionState(suggestListing, null);
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
        Name of the creator, tool, podcast or channel
        <input name="name" required maxLength={120} className={input} />
      </label>
      <label className={label}>
        Link
        <input name="url" type="url" required placeholder="https://" className={input} />
      </label>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className={label}>
          What are they?
          <select name="type" className={input} defaultValue="tipster">
            <option value="tipster">Tipster</option>
            <option value="tool">Tool</option>
            <option value="podcast">Podcast</option>
            <option value="youtube">YouTube channel</option>
            <option value="creator">Creator</option>
            <option value="news">News or alerts account</option>
          </select>
        </label>
        <label className={label}>
          Sports they cover
          <input name="sports" placeholder="AFL, NBA" maxLength={120} className={input} />
        </label>
      </div>
      <label className={label}>
        Why should they be on Grinners? <span className="font-normal text-muted">Optional</span>
        <textarea name="why" rows={3} maxLength={1000} className="w-full rounded-control border border-line bg-raised px-4 py-3" />
      </label>
      <label className={label}>
        Your email <span className="font-normal text-muted">Optional. Only used to reply about this suggestion.</span>
        <input name="email" type="email" autoComplete="email" className={input} />
      </label>
      <label className="flex min-h-10 items-center gap-2 text-sm">
        <input type="checkbox" name="is_owner" className="h-4 w-4 accent-[var(--color-grin)]" />
        This is me, or I run it
      </label>
      <Honeypot />
      <Message state={state} />
      <button disabled={pending} className="h-12 w-fit rounded-control bg-grin px-6 font-semibold text-ink hover:brightness-110 disabled:opacity-60">
        {pending ? "Sending…" : "Send suggestion"}
      </button>
    </form>
  );
}
