"use server";

import { isConfigured, publicClient } from "@/lib/supabase";

export type FormState = { ok: boolean; message: string } | null;

const text = (form: FormData, name: string, max = 500) => String(form.get(name) ?? "").trim().slice(0, max);
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
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

  const { error } = await publicClient()
    .from("submissions")
    .insert({
      kind: "listing",
      contact_email: email || null,
      payload: { name, url, type: text(form, "type", 20), sports: text(form, "sports", 120), why: text(form, "why", 1000), is_owner: isOwner },
    });
  if (error) return { ok: false, message: "Something went wrong. Please try again." };
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
