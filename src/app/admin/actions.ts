"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { refreshFeeds } from "@/lib/feeds";
import { isConfigured, requireAdmin, serverClient } from "@/lib/supabase";
import { combineFeatures } from "@/lib/features";
import { COUNTRIES } from "@/lib/countries";

// Two images can be sent in one save, and the host caps a request at about 4.5 MB.
const MAX_IMAGE_BYTES = 1.5 * 1024 * 1024;
const MAX_GALLERY_IMAGES = 8;

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
  // Checked before anything is saved: one oversized request would otherwise fail with no explanation.
  const uploadBytes = ["logo", "cover", "gallery"].flatMap((field) => form.getAll(field)).reduce((sum, f) => sum + (f instanceof File ? f.size : 0), 0);
  if (uploadBytes > 3.5 * 1024 * 1024) fail("Those images add up to more than 3.5 MB. Save with fewer at a time: two gallery images per save is safe.");
  if (status === "published" && !vetted) fail("Tick the vetting checklist before publishing.");

  const categoryList = form.getAll("categories").map(String).filter(Boolean);

  const row = {
    name,
    slug,
    types,
    tagline: text(form, "tagline"),
    bio: text(form, "bio"),
    website_url: /^https?:\/\/\S+$/i.test(text(form, "website_url")) ? text(form, "website_url") : null,
    pricing: text(form, "pricing") || "free",
    pricing_note: text(form, "pricing_note") || null,
    sports: form.getAll("sports").map(String),
    markets: text(form, "markets")
      .split(",")
      .map((m) => m.trim())
      .filter(Boolean),
    // The first ticked category is also kept in its own column, for search and older code paths.
    category: categoryList[0] ?? null,
    features: combineFeatures(form.getAll("feature_options").map(String), lines(text(form, "features")), 24),
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

  // Feed address lives in the listing's extra attributes. Changing it clears what was worked out from the old one.
  const feedInput = text(form, "feed_url");
  const current = await supabase.from("listings").select("attributes").eq("id", listingId).single();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const attributes = { ...((current.data?.attributes ?? {}) as Record<string, any>) };
  const attributesBefore = JSON.stringify(attributes);
  // Internal checking notes are for drafts only. A published listing can be read through the public data API, so they're dropped.
  if (status === "published") {
    delete attributes.vet_note;
    delete attributes.starter;
  }
  const feedChanged = (attributes.feed_url ?? "") !== feedInput;
  if (feedChanged) {
    if (feedInput) attributes.feed_url = feedInput;
    else delete attributes.feed_url;
    delete attributes.feed_resolved;
    delete attributes.feed_error;
    if (!feedInput) delete attributes.feed_image;
  }
  const categoriesChanged = JSON.stringify(attributes.categories ?? []) !== JSON.stringify(categoryList);
  if (categoriesChanged) attributes.categories = categoryList;
  const countryInput = text(form, "country");
  const country = COUNTRIES.some((c) => c.code === countryInput) ? countryInput : "";
  const countryChanged = (attributes.country ?? "") !== country;
  if (countryChanged) {
    if (country) attributes.country = country;
    else delete attributes.country;
  }

  // Certified Grinner badge. The date it was first given is kept.
  if (form.get("certified") === "on") {
    if (!attributes.certified) attributes.certified_at = new Date().toISOString();
    attributes.certified = true;
  } else {
    delete attributes.certified;
    delete attributes.certified_at;
  }

  // Deal for Grinners visitors: what it is, an optional code and an optional last day.
  const dealText = text(form, "deal_text");
  const dealExpires = text(form, "deal_expires");
  const dealUrl = text(form, "deal_url");
  if (dealText && dealUrl && !/^https?:\/\/\S+\.\S+/.test(dealUrl)) problems.push("The deal link wasn't saved: it needs to start with https://");
  if (dealText) {
    const validUrl = /^https?:\/\/\S+\.\S+/.test(dealUrl) ? dealUrl : undefined;
    attributes.deal = {
      text: dealText,
      code: text(form, "deal_code") || undefined,
      expires: /^\d{4}-\d{2}-\d{2}$/.test(dealExpires) ? dealExpires : undefined,
      url: validUrl,
      affiliate: validUrl && form.get("deal_affiliate") === "on" ? true : undefined,
    };
  } else {
    delete attributes.deal;
  }

  // Gallery: remove the ticked images, then add any new ones.
  let gallery: string[] = Array.isArray(attributes.gallery) ? attributes.gallery.map(String) : [];
  const removeFromGallery = form.getAll("gallery_remove").map(String);
  if (removeFromGallery.length) {
    const paths = removeFromGallery.filter((url) => gallery.includes(url)).map(storedImagePath).filter((p): p is string => Boolean(p));
    if (paths.length) await supabase.storage.from("images").remove(paths);
    gallery = gallery.filter((url) => !removeFromGallery.includes(url));
  }
  const galleryFiles = form.getAll("gallery").filter((f): f is File => f instanceof File && f.size > 0);
  for (const [index, file] of galleryFiles.entries()) {
    if (gallery.length >= MAX_GALLERY_IMAGES) {
      problems.push(`Some gallery images weren't added: a listing can hold ${MAX_GALLERY_IMAGES}.`);
      break;
    }
    if (!file.type.startsWith("image/")) {
      problems.push(`Gallery: ${file.name} isn't an image.`);
      continue;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      problems.push(`Gallery: ${file.name} is over 1.5 MB.`);
      continue;
    }
    const extension = (file.name.split(".").pop() || "png").toLowerCase().replace(/[^a-z0-9]/g, "");
    const path = `gallery/${listingId}-${Date.now()}-${index}.${extension}`;
    const upload = await supabase.storage.from("images").upload(path, file, { contentType: file.type });
    if (upload.error) {
      problems.push(`Gallery: ${file.name} wasn't saved: ${upload.error.message}`);
      continue;
    }
    gallery.push(supabase.storage.from("images").getPublicUrl(path).data.publicUrl);
  }
  if (gallery.length) attributes.gallery = gallery;
  else delete attributes.gallery;

  if (JSON.stringify(attributes) !== attributesBefore) {
    const { error } = await supabase.from("listings").update({ attributes }).eq("id", listingId);
    if (error) problems.push(`Country, categories, badge, deal, gallery and feed address weren't saved: ${error.message}`);
  }

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

  const saved = id
    ? await supabase.from("spotlights").update(row).eq("id", id).select("id").single()
    : await supabase.from("spotlights").insert(row).select("id").single();
  if (saved.error || !saved.data) fail(saved.error?.message ?? "The spotlight wasn't saved.");
  revalidatePath("/", "layout");
  // Back to the same spotlight, where the preview link is shown.
  redirect(`/admin/spotlights/${saved.data!.id}?saved=1`);
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
  const { data: submission } = await supabase.from("submissions").select("kind, payload").eq("id", id).maybeSingle();
  // A spotlight request has no listing to create: accepting it only records the decision.
  if (submission?.kind === "feature_request") {
    await supabase.from("submissions").update({ status: "approved" }).eq("id", id);
    redirect("/admin/submissions");
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const payload = (submission?.payload ?? {}) as any;
  // An owner's update: open the listing it's about. Nothing is changed automatically.
  if (payload.request === "update") {
    const target = await supabase.from("listings").select("id").eq("slug", String(payload.listing_slug ?? "")).maybeSingle();
    await supabase.from("submissions").update({ status: "approved" }).eq("id", id);
    redirect(target.data?.id ? `/admin/listings/${target.data.id}` : "/admin/submissions");
  }
  const name = String(payload.name ?? "").trim();
  if (!name) redirect("/admin/submissions");
  const allowed = ["tipster", "tool", "podcast", "youtube", "creator", "news", "community"];
  const type: string = allowed.includes(payload.type) ? payload.type : "creator";

  // Everything in a suggestion was typed by a member of the public. Each value is checked and trimmed here before it goes
  // into the draft, and links are only kept when they are plain web addresses.
  const str = (value: unknown, max: number) => (typeof value === "string" ? value.trim().slice(0, max) : "");
  const web = (value: unknown) => (typeof value === "string" && /^https?:\/\/\S+\.\S+$/i.test(value.trim()) ? value.trim().slice(0, 500) : "");
  const website = web(payload.url);

  // Sports: match what they typed ("AFL, NBA") against the sports that exist.
  const { data: knownSports } = await supabase.from("sports").select("slug, name");
  const wanted = str(payload.sports, 200)
    .split(/[,/&;]|\band\b/i)
    .map((part) => part.trim().toLowerCase())
    .filter(Boolean);
  const sports = (knownSports ?? []).filter((s) => wanted.includes(s.slug.toLowerCase()) || wanted.includes(s.name.toLowerCase())).map((s) => s.slug);

  const youtube = web(payload.youtube_url);
  const podcast = web(payload.podcast_url);
  const attributes: Record<string, unknown> = {
    vet_note: [
      payload.is_owner ? "From an application by someone who says they run it." : "From a public suggestion.",
      "The description and features are their own words: check every claim and remove hype before publishing.",
      payload.sponsored_interest ? "They ticked that they're interested in a paid spotlight." : "",
      "Their contact email is on the suggestion.",
    ]
      .filter(Boolean)
      .join(" "),
  };
  if (COUNTRIES.some((c) => c.code === payload.country)) attributes.country = payload.country;
  const feed = type === "podcast" ? podcast || youtube : youtube || podcast;
  if (feed) attributes.feed_url = feed;

  const created = await supabase
    .from("listings")
    .insert({
      name,
      slug: `${slugify(name)}-${id.slice(0, 4)}`,
      types: [type],
      tagline: str(payload.tagline, 160),
      bio: str(payload.bio, 1500),
      features: Array.isArray(payload.features) ? payload.features.map((f: unknown) => str(f, 120)).filter(Boolean).slice(0, 16) : [],
      sports,
      ...(["free", "paid", "freemium"].includes(payload.pricing) ? { pricing: payload.pricing } : {}),
      pricing_note: str(payload.pricing_note, 120) || null,
      website_url: website || null,
      attributes,
      status: "draft",
    })
    .select("id")
    .single();
  if (created.error || !created.data) redirect(`/admin/submissions?error=${encodeURIComponent(created.error?.message ?? "Couldn't create the draft.")}`);

  // Their links, named by where they point.
  const platformOf = (address: string) => {
    const host = new URL(address).hostname.replace(/^www\./, "");
    if (/(^|\.)x\.com$|(^|\.)twitter\.com$/.test(host)) return "X";
    if (/youtube\.com$|youtu\.be$/.test(host)) return "YouTube";
    if (/spotify\.com$/.test(host)) return "Spotify";
    if (/podcasts\.apple\.com$/.test(host)) return "Apple Podcasts";
    if (/instagram\.com$/.test(host)) return "Instagram";
    if (/tiktok\.com$/.test(host)) return "TikTok";
    if (/discord\.(gg|com)$/.test(host)) return "Discord";
    if (/^t\.me$|telegram\.(me|org)$/.test(host)) return "Telegram";
    if (/facebook\.com$/.test(host)) return "Facebook";
    if (/twitch\.tv$/.test(host)) return "Twitch";
    if (/substack\.com$/.test(host)) return "Substack";
    if (/patreon\.com$/.test(host)) return "Patreon";
    return "Website";
  };
  const others = Array.isArray(payload.other_links) ? payload.other_links.map(web).filter(Boolean).slice(0, 5) : [];
  const addresses = [...new Set([website, web(payload.x_url), youtube, podcast, ...others].filter(Boolean))];
  if (addresses.length) {
    await supabase
      .from("listing_links")
      .insert(addresses.map((url, index) => ({ listing_id: created.data!.id, platform: platformOf(url), url, sort_order: index })));
  }
  await supabase.from("submissions").update({ status: "approved" }).eq("id", id);
  redirect(`/admin/listings/${created.data!.id}`);
}

/* ------------------------------ Feeds ----------------------------- */

export async function refreshFeedsNow() {
  const { supabase, isAdmin } = await requireAdmin();
  if (!isAdmin) redirect("/admin");
  const summary = await refreshFeeds(supabase);
  revalidatePath("/", "layout");
  const message =
    summary.checked === 0
      ? "No listings have a feed set yet. Add one on a listing's edit page."
      : `Updated ${summary.updated} of ${summary.checked} feeds.` + (summary.failed.length ? ` Problems: ${summary.failed.map((f) => `${f.name}: ${f.reason}`).join(" | ")}` : "");
  redirect(`/admin?feeds=${encodeURIComponent(message)}`);
}

/* ---------------------------- Taxonomy ---------------------------- */

const TAXONOMY_TABLES = ["sports", "markets", "categories"] as const;

export async function addTaxonomy(form: FormData) {
  const { supabase, isAdmin } = await requireAdmin();
  if (!isAdmin) redirect("/admin");
  const table = text(form, "table") as (typeof TAXONOMY_TABLES)[number];
  const name = text(form, "name");
  if (!TAXONOMY_TABLES.includes(table) || !name) redirect("/admin/taxonomy?error=" + encodeURIComponent("Type a name first."));

  const row: Record<string, unknown> = { name, slug: slugify(name) };
  if (table === "sports") {
    const last = await supabase.from("sports").select("sort_order").order("sort_order", { ascending: false }).limit(1).maybeSingle();
    row.sort_order = (last.data?.sort_order ?? 0) + 1;
  }
  if (table === "categories") row.kind = text(form, "kind") === "article" ? "article" : "tool";

  const { error } = await supabase.from(table).insert(row);
  revalidatePath("/", "layout");
  redirect(error ? `/admin/taxonomy?error=${encodeURIComponent(error.code === "23505" ? `"${name}" already exists.` : error.message)}` : "/admin/taxonomy?saved=1");
}

export async function deleteTaxonomy(form: FormData) {
  const { supabase, isAdmin } = await requireAdmin();
  if (!isAdmin) redirect("/admin");
  const table = text(form, "table") as (typeof TAXONOMY_TABLES)[number];
  if (!TAXONOMY_TABLES.includes(table)) redirect("/admin/taxonomy");
  const { error } = await supabase.from(table).delete().eq("id", text(form, "id"));
  revalidatePath("/", "layout");
  redirect(
    error
      ? `/admin/taxonomy?error=${encodeURIComponent(error.code === "23503" ? "That one is in use by tips or articles, so it can't be deleted." : error.message)}`
      : "/admin/taxonomy?saved=1",
  );
}

/* ------------------------- Deleting a listing ------------------------- */

/** Path inside the images bucket for a stored image address, or null if it lives elsewhere. */
function storedImagePath(address: unknown) {
  if (typeof address !== "string") return null;
  const marker = "/storage/v1/object/public/images/";
  const at = address.indexOf(marker);
  return at === -1 ? null : decodeURIComponent(address.slice(at + marker.length));
}

export async function deleteListing(form: FormData) {
  const { supabase, isAdmin } = await requireAdmin();
  if (!isAdmin) redirect("/admin");

  const id = text(form, "id");
  if (form.get("confirm") !== "on") {
    redirect(`/admin/listings/${id}?error=${encodeURIComponent("Tick the box to confirm before deleting.")}`);
  }
  const { data: listing } = await supabase.from("listings").select("name, logo_url, cover_url, attributes").eq("id", id).maybeSingle();
  if (!listing) redirect("/admin/listings");

  // Its button link would otherwise be left behind, pointing at nothing.
  await supabase.from("affiliate_links").delete().eq("listing_id", id);
  const { error } = await supabase.from("listings").delete().eq("id", id);
  if (error) redirect(`/admin/listings/${id}?error=${encodeURIComponent(`Couldn't delete: ${error.message}`)}`);

  // Tidy up its uploaded images. If this fails the listing is still gone, so it isn't reported.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const galleryUrls: string[] = Array.isArray((listing as any).attributes?.gallery) ? (listing as any).attributes.gallery : [];
  const images = [listing!.logo_url, listing!.cover_url, ...galleryUrls].map(storedImagePath).filter((p): p is string => Boolean(p));
  if (images.length) await supabase.storage.from("images").remove(images);

  revalidatePath("/", "layout");
  redirect(`/admin/listings?deleted=${encodeURIComponent(listing!.name)}`);
}

/* ------------------------- Featured order ------------------------- */

/** Featured listings in their current homepage order: hand-set positions first, then most recently updated. */
async function featuredInOrder(supabase: Awaited<ReturnType<typeof serverClient>>) {
  const { data } = await supabase
    .from("listings")
    .select("id, name, status, attributes, updated_at")
    .eq("is_featured", true)
    .neq("status", "archived")
    .order("updated_at", { ascending: false });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rows = (data ?? []) as any[];
  const position = (row: { attributes?: { featured_order?: number } }) =>
    typeof row.attributes?.featured_order === "number" ? row.attributes.featured_order : Number.MAX_SAFE_INTEGER;
  return rows.sort((a, b) => position(a) - position(b));
}

export async function moveFeatured(form: FormData) {
  const { supabase, isAdmin } = await requireAdmin();
  if (!isAdmin) redirect("/admin");

  const id = text(form, "id");
  const move = text(form, "move"); // up | down | top | remove
  const rows = await featuredInOrder(supabase);
  const from = rows.findIndex((r) => r.id === id);
  if (from === -1) redirect("/admin/featured");

  if (move === "remove") {
    const attributes = { ...(rows[from].attributes ?? {}) };
    delete attributes.featured_order;
    await supabase.from("listings").update({ is_featured: false, attributes }).eq("id", id);
    rows.splice(from, 1);
  } else {
    const to = move === "top" ? 0 : move === "up" ? Math.max(0, from - 1) : Math.min(rows.length - 1, from + 1);
    const [row] = rows.splice(from, 1);
    rows.splice(to, 0, row);
  }

  // Write every position, so the order on screen is exactly what is stored.
  await Promise.all(
    rows.map((row, index) =>
      row.attributes?.featured_order === index + 1
        ? null
        : supabase.from("listings").update({ attributes: { ...(row.attributes ?? {}), featured_order: index + 1 } }).eq("id", row.id),
    ),
  );
  revalidatePath("/", "layout");
  redirect("/admin/featured");
}
