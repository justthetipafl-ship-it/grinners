import { NextResponse, type NextRequest } from "next/server";
import { getListing } from "@/lib/data";
import { isConfigured, publicClient } from "@/lib/supabase";

/**
 * Redirect for a listing's deal link. Only works while the listing is published and the deal is still running.
 * Records one click against the listing, then forwards the visitor. No IP address is stored.
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const listing = await getListing(slug);
  if (!listing?.deal?.url) return new NextResponse("Not found", { status: 404 });

  let destination: URL;
  try {
    destination = new URL(listing.deal.url);
  } catch {
    return new NextResponse("Not found", { status: 404 });
  }
  if (!destination.searchParams.has("utm_source")) destination.searchParams.set("utm_source", "grinners");

  if (isConfigured && listing.id) {
    const referrer = request.headers.get("referer");
    let sourcePath: string | null = null;
    try {
      if (referrer) sourcePath = new URL(referrer).pathname;
    } catch {
      /* malformed referrer: leave the path empty */
    }
    const { error } = await publicClient()
      .from("clicks")
      .insert({ listing_id: listing.id, source_path: sourcePath, referrer: referrer?.slice(0, 500) ?? null, country: request.headers.get("x-vercel-ip-country") });
    if (error) console.error(`[go] deal click not recorded: ${error.message}`);
  }

  return NextResponse.redirect(destination, { status: 302, headers: { "X-Robots-Tag": "noindex, nofollow" } });
}
