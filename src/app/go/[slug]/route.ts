import { NextResponse, type NextRequest } from "next/server";
import { isConfigured, publicClient } from "@/lib/supabase";

/**
 * Outbound link redirect. Records one click, adds the tracking parameters,
 * then forwards the visitor. No IP address is stored.
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!isConfigured) return new NextResponse("Not found", { status: 404 });

  const supabase = publicClient();
  const { data: link } = await supabase
    .from("affiliate_links")
    .select("id, listing_id, destination_url, utm_source, utm_medium, utm_campaign")
    .eq("slug", slug)
    .eq("is_active", true)
    .maybeSingle();
  if (!link) return new NextResponse("Not found", { status: 404 });

  let destination: URL;
  try {
    destination = new URL(link.destination_url);
  } catch {
    return new NextResponse("Not found", { status: 404 });
  }
  for (const [name, value] of [
    ["utm_source", link.utm_source],
    ["utm_medium", link.utm_medium],
    ["utm_campaign", link.utm_campaign],
  ] as const) {
    if (value && !destination.searchParams.has(name)) destination.searchParams.set(name, value);
  }

  const referrer = request.headers.get("referer");
  let sourcePath: string | null = null;
  try {
    if (referrer) sourcePath = new URL(referrer).pathname;
  } catch {
    /* malformed referrer: leave the path empty */
  }
  const { error } = await supabase.from("clicks").insert({
    affiliate_link_id: link.id,
    listing_id: link.listing_id,
    source_path: sourcePath,
    referrer: referrer?.slice(0, 500) ?? null,
    country: request.headers.get("x-vercel-ip-country"),
  });
  if (error) console.error(`[go] click not recorded: ${error.message}`);

  return NextResponse.redirect(destination, { status: 302, headers: { "X-Robots-Tag": "noindex, nofollow" } });
}
