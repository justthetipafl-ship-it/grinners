import { createClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";
import { NextResponse, type NextRequest } from "next/server";
import { refreshFeeds } from "@/lib/feeds";

export const maxDuration = 60;

/**
 * Daily automatic feed refresh, called by Vercel on the schedule in vercel.json.
 * Needs two settings in Vercel: CRON_SECRET and SUPABASE_SECRET_KEY. Without them it does nothing,
 * and feeds can still be refreshed with the button in admin.
 */
export async function GET(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const secretKey = process.env.SUPABASE_SECRET_KEY;
  const cronSecret = process.env.CRON_SECRET;
  if (!url || !secretKey || !cronSecret) return NextResponse.json({ ok: false, reason: "Automatic refresh isn't set up." }, { status: 503 });
  if (request.headers.get("authorization") !== `Bearer ${cronSecret}`) return NextResponse.json({ ok: false }, { status: 401 });

  const summary = await refreshFeeds(createClient(url, secretKey, { auth: { persistSession: false, autoRefreshToken: false } }));
  revalidatePath("/", "layout");
  return NextResponse.json({ ok: true, ...summary });
}
