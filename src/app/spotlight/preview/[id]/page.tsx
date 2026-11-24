import { createClient } from "@supabase/supabase-js";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SpotlightFeature } from "@/components/SpotlightFeature";
import { getListing } from "@/lib/data";
import { isConfigured, serverClient } from "@/lib/supabase";

export const metadata: Metadata = { title: "Spotlight preview", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

/**
 * A private look at a spotlight before its start date, for sending to the listing's owner.
 * The address contains the spotlight's long random id, which works as the key: nobody can find the page without the link.
 * With the SUPABASE_SECRET_KEY setting present, anyone holding the link can open it. Without it, only a signed-in admin can.
 */
export default async function SpotlightPreviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!isConfigured || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) notFound();

  const secretKey = process.env.SUPABASE_SECRET_KEY;
  const supabase = secretKey
    ? createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, secretKey, { auth: { persistSession: false, autoRefreshToken: false } })
    : await serverClient();

  const { data } = await supabase.from("spotlights").select("kind, headline, body, is_sponsored, starts_on, listings!inner(slug)").eq("id", id).maybeSingle();
  if (!data) notFound();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const row = data as any;
  const listing = await getListing(row.listings.slug);
  if (!listing) notFound();

  return (
    <SpotlightFeature
      preview
      listing={listing}
      spotlight={{ kind: row.kind, listingSlug: listing.slug, headline: row.headline, body: row.body, isSponsored: row.is_sponsored, startsOn: row.starts_on }}
    />
  );
}
