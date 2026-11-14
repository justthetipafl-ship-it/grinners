import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/** False until the two Supabase settings are added in Vercel. The site then runs on sample content. */
export const isConfigured = Boolean(url && key);

/** Read-only client for public pages. Carries no login, so it only ever sees published rows. */
export function publicClient() {
  return createClient(url!, key!, { auth: { persistSession: false, autoRefreshToken: false } });
}

/** Client that carries the signed-in admin's session. Used by the admin dashboard only. */
export async function serverClient() {
  const store = await cookies();
  return createServerClient(url!, key!, {
    cookies: {
      getAll: () => store.getAll(),
      setAll(list) {
        try {
          list.forEach(({ name, value, options }) => store.set(name, value, options));
        } catch {
          // Called while rendering a page, where cookies are read-only. The proxy refreshes them instead.
        }
      },
    },
  });
}

/**
 * Gate for every admin page and action. Sends anyone who is not signed in to the
 * login page. The database separately refuses writes from non-admins.
 */
export async function requireAdmin() {
  if (!isConfigured) redirect("/admin/login");
  const supabase = await serverClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/admin/login");
  const { data } = await supabase.from("admins").select("user_id").eq("user_id", user.id).maybeSingle();
  return { supabase, user, isAdmin: Boolean(data) };
}
