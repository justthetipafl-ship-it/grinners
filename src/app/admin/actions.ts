"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { isConfigured, requireAdmin, serverClient } from "@/lib/supabase";

const text = (form: FormData, name: string) => String(form.get(name) ?? "").trim();
const lines = (value: string) =>
  value
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
const slugify = (value: string) =>
  value
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

export async function login(form: FormData) {
  if (!isConfigured) redirect("/admin/login?error=setup");
  const supabase = await serverClient();
  const { error } = await supabase.auth.signInWithPassword({ email: text(form, "email"), password: String(form.get("password") ?? "") });
  if (error) redirect("/admin/login?error=1");
  redirect("/admin");
}

export async function logout() {
  const supabase = await serverClient();
  await supabase.auth.signOut();
  redirect("/admin/login");
}

export async function saveListing(form: FormData) {
  const { supabase, isAdmin } = await requireAdmin();
  if (!isAdmin) redirect("/admin");

  const id = text(form, "id");
  const back = `/admin/listings/${id || "new"}`;
  const fail = (message: string): never => redirect(`${back}?error=${encodeURIComponent(message)}`);

  const name = text(form, "name");
  const slug = slugify(text(form, "slug") || name);
  const types = form.getAll("types").map(String);
  const status = text(form, "status") || "draft";
  const vetted = form.get("vetted") === "on";

  if (!name) fail("Give the listing a name.");
  if (!slug) fail("The web address (slug) can't be empty.");
  if (types.length === 0) fail("Tick at least one type.");
  if (status === "published" && !vetted) fail("Tick the vetting checklist before publishing.");

  const row = {
    name,
    slug,
    types,
    tagline: text(form, "tagline"),
    bio: text(form, "bio"),
    website_url: text(form, "website_url") || null,
    pricing: text(form, "pricing") || "free",
    pricing_note: text(form, "pricing_note") || null,
    sports: form.getAll("sports").map(String),
    markets: text(form, "markets")
      .split(",")
      .map((m) => m.trim())
      .filter(Boolean),
    category: text(form, "category") || null,
    features: lines(text(form, "features")),
    status,
    is_featured: form.get("is_featured") === "on",
    is_sponsored: form.get("is_sponsored") === "on",
    ownership_disclosure: text(form, "ownership_disclosure") || null,
    vetted_at: vetted ? text(form, "vetted_at") || new Date().toISOString() : null,
    updated_at: new Date().toISOString(),
  };

  const saved = id
    ? await supabase.from("listings").update(row).eq("id", id).select("id").single()
    : await supabase.from("listings").insert(row).select("id").single();
  if (saved.error || !saved.data) {
    fail(saved.error?.code === "23505" ? "Another listing already uses that web address (slug)." : `Couldn't save: ${saved.error?.message ?? "unknown error"}`);
  }
  const listingId: string = saved.data!.id;
  const editUrl = `/admin/listings/${listingId}`;
  const problems: string[] = [];

  // Social links: one per line, written as "Platform | https://address".
  const links = lines(text(form, "links")).map((line, index) => {
    const [platform, ...rest] = line.split("|");
    return { listing_id: listingId, platform: platform.trim(), url: rest.join("|").trim(), sort_order: index };
  });
  if (links.some((l) => !l.platform || !/^https?:\/\//.test(l.url))) {
    problems.push("Links weren't saved: each line needs the form  Platform | https://address");
  } else {
    await supabase.from("listing_links").delete().eq("listing_id", listingId);
    if (links.length) {
      const { error } = await supabase.from("listing_links").insert(links);
      if (error) problems.push(`Links weren't saved: ${error.message}`);
    }
  }

  // Main button. Goes out through /go/<slug> so clicks are counted.
  const ctaUrl = text(form, "cta_url");
  if (ctaUrl && !/^https?:\/\//.test(ctaUrl)) {
    problems.push("Button link wasn't saved: it must start with https://");
  } else if (ctaUrl) {
    const link = {
      listing_id: listingId,
      slug,
      destination_url: ctaUrl,
      label: text(form, "cta_label") || "Visit site",
      is_affiliate: form.get("cta_affiliate") === "on",
      utm_campaign: text(form, "utm_campaign") || null,
      is_active: true,
    };
    const existing = await supabase.from("affiliate_links").select("id").eq("listing_id", listingId).limit(1).maybeSingle();
    const { error } = existing.data
      ? await supabase.from("affiliate_links").update(link).eq("id", existing.data.id)
      : await supabase.from("affiliate_links").insert(link);
    if (error) problems.push(`Button link wasn't saved: ${error.message}`);
  } else {
    await supabase.from("affiliate_links").update({ is_active: false }).eq("listing_id", listingId);
  }

  // Logo upload.
  const logo = form.get("logo");
  if (logo instanceof File && logo.size > 0) {
    if (!logo.type.startsWith("image/")) {
      problems.push("Logo wasn't saved: choose an image file.");
    } else if (logo.size > 3 * 1024 * 1024) {
      problems.push("Logo wasn't saved: keep it under 3 MB.");
    } else {
      const extension = (logo.name.split(".").pop() || "png").toLowerCase().replace(/[^a-z0-9]/g, "");
      const path = `logos/${listingId}-${Date.now()}.${extension}`;
      const upload = await supabase.storage.from("images").upload(path, logo, { contentType: logo.type });
      if (upload.error) {
        problems.push(`Logo wasn't saved: ${upload.error.message}`);
      } else {
        const { data } = supabase.storage.from("images").getPublicUrl(path);
        await supabase.from("listings").update({ logo_url: data.publicUrl }).eq("id", listingId);
      }
    }
  }

  revalidatePath("/", "layout");
  if (problems.length) redirect(`${editUrl}?error=${encodeURIComponent(`Listing saved, but: ${problems.join(" ")}`)}`);
  redirect(`${editUrl}?saved=1`);
}
