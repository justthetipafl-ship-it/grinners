"use server";

import { COUNTRIES } from "@/lib/countries";
import { isConfigured, publicClient } from "@/lib/supabase";

export type FormState = { ok: boolean; message: string } | null;

const text = (form: FormData, name: string, max = 500) => String(form.get(name) ?? "").trim().slice(0, max);
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const WEB = /^https?:\/\/\S+\.\S+$/i;
const NOT_READY: FormState = { ok: false, message: "This isn't switched on yet. Please try again soon." };

export async function subscribe(_previous: FormState, form: FormData): Promise<FormState> {
  if (text(form, "company")) return { ok: true, message: "Thanks, you're on the list." }; // hidden field: only bots fill it
  if (!isConfigured) return NOT_READY;
  const email = text(form, "email", 200).toLowerCase();
  if (!EMAIL.test(email)) return { ok: false, message: "That doesn't look like an email address." };
  const { error } = await publicClient().from("subscribers").insert({ email, source: text(form, "source", 50) || "site" });
  // 23505 means the address is already subscribed, which is fine.
  if (error && error.code !== "23505") return { ok: false, message: "Something went wrong. Please try again." };
  return { ok: true, message: "Thanks, you're on the list." };
}

export async function suggestListing(_previous: FormState, form: FormData): Promise<FormState> {
  const done: FormState = { ok: true, message: "Thanks. We review every suggestion before anything is listed." };
  if (text(form, "company")) return done;
  if (!isConfigured) return NOT_READY;

  const name = text(form, "name", 120);
  const url = text(form, "url", 300);
  const email = text(form, "email", 200).toLowerCase();
  if (!name) return { ok: false, message: "Tell us the name of who or what you're suggesting." };
  if (!/^https?:\/\/\S+\.\S+/.test(url)) return { ok: false, message: "Add a link starting with https:// so we can find them." };
  if (email && !EMAIL.test(email)) return { ok: false, message: "That doesn't look like an email address." };
  const isOwner = form.get("is_owner") === "on";
  if (isOwner && !email) return { ok: false, message: "Add your email so we can confirm it's you and tell you when you're listed." };

  // The optional details below are used to start the listing draft, so the admin has less to type.
  const link = (name: string) => {
    const value = text(form, name, 300);
    return WEB.test(value) ? value : "";
  };
  const typed = ["x_url", "youtube_url", "podcast_url"].filter((field) => text(form, field) && !link(field));
  if (typed.length) return { ok: false, message: "One of the links isn't a full web address. Each needs to start with https://" };
  const country = text(form, "country", 8);
  const pricing = text(form, "pricing", 12);
  const details = {
    tagline: text(form, "tagline", 140),
    bio: text(form, "bio", 1200),
    features: text(form, "features", 900)
      .split("\n")
      .map((line) => line.replace(/^[-•*\s]+/, "").trim().slice(0, 120))
      .filter(Boolean)
      .slice(0, 8),
    country: COUNTRIES.some((c) => c.code === country) ? country : "",
    pricing: ["free", "paid", "freemium"].includes(pricing) ? pricing : "",
    pricing_note: text(form, "pricing_note", 120),
    x_url: link("x_url"),
    youtube_url: link("youtube_url"),
    podcast_url: link("podcast_url"),
    other_links: text(form, "other_links", 700)
      .split(/\s+/)
      .filter((value) => WEB.test(value))
      .slice(0, 5),
    sponsored_interest: form.get("sponsored_interest") === "on",
  };
  // Empty answers are left out so the stored suggestion stays small.
  const filled = Object.fromEntries(Object.entries(details).filter(([, value]) => (Array.isArray(value) ? value.length : value)));

  // An owner updating an existing listing: filed as a report so approving it never creates a second listing.
  const updateSlug = text(form, "update_slug", 80);
  const isUpdate = /^[a-z0-9-]{1,80}$/.test(updateSlug);

  const { error } = await publicClient()
    .from("submissions")
    .insert({
      kind: isUpdate ? "report" : "listing",
      contact_email: email || null,
      payload: {
        ...(isUpdate ? { request: "update", listing_slug: updateSlug } : {}),
        name,
        url,
        type: text(form, "type", 20),
        sports: text(form, "sports", 120),
        why: text(form, "why", 1000),
        is_owner: isOwner,
        ...filled,
      },
    });
  if (error) return { ok: false, message: "Something went wrong. If you wrote a lot, try shortening it, then send again." };
  if (isUpdate) return { ok: true, message: "Thanks. We'll check the changes and update your listing." };
  return done;
}

/** A request to be the weekly spotlight. Lands in the same admin queue as listing suggestions. */
export async function requestSpotlight(_previous: FormState, form: FormData): Promise<FormState> {
  const done: FormState = { ok: true, message: "Thanks. We read every request and will email you if we can run it." };
  if (text(form, "company")) return done;
  if (!isConfigured) return NOT_READY;

  const name = text(form, "name", 120);
  const url = text(form, "url", 300);
  const email = text(form, "email", 200).toLowerCase();
  const pitch = text(form, "pitch", 1500);
  if (!name) return { ok: false, message: "Tell us who the spotlight would be about." };
  if (!/^https?:\/\/\S+\.\S+/.test(url)) return { ok: false, message: "Add a link starting with https:// so we can find them." };
  if (!EMAIL.test(email)) return { ok: false, message: "Add an email address so we can reply." };
  if (pitch.length < 40) return { ok: false, message: "Tell us a bit more about the story: a couple of sentences is enough." };

  const { error } = await publicClient()
    .from("submissions")
    .insert({
      kind: "feature_request",
      contact_email: email,
      payload: { request: "spotlight", name, url, pitch, is_owner: form.get("is_owner") === "on", sponsored_interest: form.get("sponsored_interest") === "on" },
    });
  if (error) return { ok: false, message: "Something went wrong. Please try again." };
  return done;
}

/** Counts one save for a listing. Nothing about the visitor is stored. Fails quietly: saving still works on their device. */
export async function recordSave(slug: string): Promise<void> {
  if (!isConfigured || !/^[a-z0-9-]{1,80}$/.test(slug)) return;
  const supabase = publicClient();
  const { data } = await supabase.from("listings").select("id").eq("status", "published").eq("slug", slug).maybeSingle();
  if (data?.id) await supabase.from("saves").insert({ listing_id: data.id });
}
