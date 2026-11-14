"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { isConfigured, requireAdmin, serverClient } from "@/lib/supabase";

// Two images can be sent in one save, and the host caps a request at about 4.5 MB.
const MAX_IMAGE_BYTES = 1.5 * 1024 * 1024;

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

  // Image uploads: square logo and wide preview image.
  for (const [field, folder, column, label] of [
    ["logo", "logos", "logo_url", "Logo"],
    ["cover", "covers", "cover_url", "Preview image"],
  ] as const) {
    const file = form.get(field);
    if (!(file instanceof File) || file.size === 0) continue;
    if (!file.type.startsWith("image/")) {
      problems.push(`${label} wasn't saved: choose an image file.`);
      continue;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      problems.push(`${label} wasn't saved: keep it under 1.5 MB.`);
      continue;
    }
    const extension = (file.name.split(".").pop() || "png").toLowerCase().replace(/[^a-z0-9]/g, "");
    const path = `${folder}/${listingId}-${Date.now()}.${extension}`;
    const upload = await supabase.storage.from("images").upload(path, file, { contentType: file.type });
    if (upload.error) {
      problems.push(`${label} wasn't saved: ${upload.error.message}`);
      continue;
    }
    const { data } = supabase.storage.from("images").getPublicUrl(path);
    const { error } = await supabase.from("listings").update({ [column]: data.publicUrl }).eq("id", listingId);
    if (error) problems.push(`${label} wasn't saved: ${error.message}`);
  }
  if (form.get("remove_cover") === "on") {
    await supabase.from("listings").update({ cover_url: null }).eq("id", listingId);
  }

  revalidatePath("/", "layout");
  if (problems.length) redirect(`${editUrl}?error=${encodeURIComponent(`Listing saved, but: ${problems.join(" ")}`)}`);
  redirect(`${editUrl}?saved=1`);
}

/* ------------------------------ Tips ------------------------------ */

/** The form's date and time are entered in Brisbane time (UTC+10, no daylight saving). */
const brisbaneToIso = (local: string) => new Date(`${local}:00+10:00`).toISOString();

export async function saveTip(form: FormData) {
  const { supabase, isAdmin } = await requireAdmin();
  if (!isAdmin) redirect("/admin");

  const id = text(form, "id");
  const back = `/admin/tips/${id || "new"}`;
  const fail = (message: string): never => redirect(`${back}?error=${encodeURIComponent(message)}`);

  const listingId = text(form, "listing_id");
  const sportId = text(form, "sport_id");
  const eventName = text(form, "event_name");
  const start = text(form, "event_start");
  const selection = text(form, "selection");
  const odds = Number(text(form, "odds"));
  const status = text(form, "status") || "draft";

  if (!listingId) fail("Choose who the tip is from.");
  if (!sportId) fail("Choose a sport.");
  if (!eventName || !selection) fail("Fill in the event and the selection.");
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(start)) fail("Enter the event's start date and time.");
  if (!(odds > 1)) fail("Odds must be decimal and greater than 1.00, for example 1.90.");

  // Competitions are created the first time their name is used.
  let competitionId: string | null = null;
  const competition = text(form, "competition");
  if (competition) {
    const found = await supabase.from("competitions").select("id").eq("sport_id", sportId).ilike("name", competition).limit(1).maybeSingle();
    if (found.data) {
      competitionId = found.data.id;
    } else {
      const created = await supabase
        .from("competitions")
        .insert({ sport_id: sportId, name: competition, slug: `${slugify(competition)}-${sportId.slice(0, 8)}` })
        .select("id")
        .single();
      if (created.error) fail(`Couldn't save the competition: ${created.error.message}`);
      competitionId = created.data!.id;
    }
  }

  const row: Record<string, unknown> = {
    listing_id: listingId,
    sport_id: sportId,
    competition_id: competitionId,
    event_name: eventName,
    event_start: brisbaneToIso(start),
    market_label: text(form, "market") || null,
    selection,
    odds,
    bookmaker: text(form, "bookmaker") || null,
    analysis: text(form, "analysis"),
    status,
  };
  if (status === "published" && !text(form, "published_at")) row.published_at = new Date().toISOString();

  const saved = id ? await supabase.from("tips").update(row).eq("id", id) : await supabase.from("tips").insert(row);
  if (saved.error) fail(saved.error.message);

  revalidatePath("/", "layout");
  redirect("/admin/tips?saved=1");
}

export async function gradeTip(form: FormData) {
  const { supabase, isAdmin } = await requireAdmin();
  if (!isAdmin) redirect("/admin");
  const result = text(form, "result");
  if (!["won", "lost", "void", "pending"].includes(result)) redirect("/admin/tips");
  const { error } = await supabase
    .from("tips")
    .update({ result, settled_at: result === "pending" ? null : new Date().toISOString() })
    .eq("id", text(form, "id"));
  revalidatePath("/", "layout");
  redirect(error ? `/admin/tips?error=${encodeURIComponent(error.message)}` : "/admin/tips");
}

/* ---------------------------- Articles ---------------------------- */

export async function saveArticle(form: FormData) {
  const { supabase, isAdmin } = await requireAdmin();
  if (!isAdmin) redirect("/admin");

  const id = text(form, "id");
  const back = `/admin/articles/${id || "new"}`;
  const fail = (message: string): never => redirect(`${back}?error=${encodeURIComponent(message)}`);

  const title = text(form, "title");
  const slug = slugify(text(form, "slug") || title);
  const status = text(form, "status") || "draft";
  const isSponsored = form.get("is_sponsored") === "on";
  const sponsorName = text(form, "sponsor_name");

  if (!title || !slug) fail("Give the article a title.");
  if (isSponsored && !sponsorName) fail("A sponsored article needs the sponsor's name.");

  const row: Record<string, unknown> = {
    title,
    slug,
    excerpt: text(form, "excerpt"),
    body: String(form.get("body") ?? "").replace(/\r\n/g, "\n").trim(),
    category_id: text(form, "category_id") || null,
    author_name: text(form, "author_name") || "Grinners",
    is_sponsored: isSponsored,
    sponsor_name: isSponsored ? sponsorName : null,
    status,
    updated_at: new Date().toISOString(),
  };
  if (status === "published" && !text(form, "published_at")) row.published_at = new Date().toISOString();

  const saved = id
    ? await supabase.from("articles").update(row).eq("id", id).select("id").single()
    : await supabase.from("articles").insert(row).select("id").single();
  if (saved.error || !saved.data) {
    fail(saved.error?.code === "23505" ? "Another article already uses that web address (slug)." : `Couldn't save: ${saved.error?.message ?? "unknown error"}`);
  }

  revalidatePath("/", "layout");
  redirect(`/admin/articles/${saved.data!.id}?saved=1`);
}

/* --------------------------- Spotlights --------------------------- */

export async function saveSpotlight(form: FormData) {
  const { supabase, isAdmin } = await requireAdmin();
  if (!isAdmin) redirect("/admin");

  const id = text(form, "id");
  const fail = (message: string): never => redirect(`/admin/spotlights/${id || "new"}?error=${encodeURIComponent(message)}`);
  const row = {
    kind: text(form, "kind") || "Creator Spotlight",
    listing_id: text(form, "listing_id"),
    headline: text(form, "headline"),
    body: text(form, "body"),
    starts_on: text(form, "starts_on"),
    ends_on: text(form, "ends_on"),
    is_sponsored: form.get("is_sponsored") === "on",
  };
  if (!row.listing_id) fail("Choose the listing to spotlight.");
  if (!row.headline) fail("Give the spotlight a headline.");
  if (!row.starts_on || !row.ends_on) fail("Set the start and end dates.");
  if (row.ends_on < row.starts_on) fail("The end date is before the start date.");

  const saved = id ? await supabase.from("spotlights").update(row).eq("id", id) : await supabase.from("spotlights").insert(row);
  if (saved.error) fail(saved.error.message);
  revalidatePath("/", "layout");
  redirect("/admin/spotlights?saved=1");
}

export async function deleteSpotlight(form: FormData) {
  const { supabase, isAdmin } = await requireAdmin();
  if (!isAdmin) redirect("/admin");
  await supabase.from("spotlights").delete().eq("id", text(form, "id"));
  revalidatePath("/", "layout");
  redirect("/admin/spotlights");
}

/* --------------------------- Submissions -------------------------- */

export async function reviewSubmission(form: FormData) {
  const { supabase, isAdmin } = await requireAdmin();
  if (!isAdmin) redirect("/admin");

  const id = text(form, "id");
  const decision = text(form, "decision");
  if (decision === "reject") {
    await supabase.from("submissions").update({ status: "rejected" }).eq("id", id);
    redirect("/admin/submissions");
  }

  // Approve: start a draft listing from the suggestion, then open it for editing and vetting.
  const { data: submission } = await supabase.from("submissions").select("payload").eq("id", id).maybeSingle();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const payload = (submission?.payload ?? {}) as any;
  const name = String(payload.name ?? "").trim();
  if (!name) redirect("/admin/submissions");
  const allowed = ["tipster", "tool", "podcast", "youtube", "creator"];
  const created = await supabase
    .from("listings")
    .insert({
      name,
      slug: `${slugify(name)}-${id.slice(0, 4)}`,
      types: [allowed.includes(payload.type) ? payload.type : "creator"],
      website_url: typeof payload.url === "string" ? payload.url : null,
      status: "draft",
    })
    .select("id")
    .single();
  if (created.error || !created.data) redirect(`/admin/submissions?error=${encodeURIComponent(created.error?.message ?? "Couldn't create the draft.")}`);
  await supabase.from("submissions").update({ status: "approved" }).eq("id", id);
  redirect(`/admin/listings/${created.data!.id}`);
}
