import type { Metadata } from "next";
import Link from "next/link";
import { logout } from "../actions";
import { requireAdmin } from "@/lib/supabase";

// Admin pages are always rendered fresh for the signed-in user, never cached.
export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Admin", robots: { index: false } };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, isAdmin } = await requireAdmin();

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6 flex flex-wrap items-center gap-x-5 gap-y-2 border-b border-line pb-4 text-sm">
        <span className="display text-lg uppercase text-spotlight">Admin</span>
        {isAdmin && (
          <>
            <Link href="/admin" className="text-muted hover:text-fg">
              Overview
            </Link>
            <Link href="/admin/listings" className="text-muted hover:text-fg">
              Listings
            </Link>
            <Link href="/admin/tips" className="text-muted hover:text-fg">
              Tips
            </Link>
            <Link href="/admin/articles" className="text-muted hover:text-fg">
              Articles
            </Link>
          </>
        )}
        <form action={logout} className="ml-auto flex items-center gap-3">
          <span className="hidden text-muted sm:inline">{user.email}</span>
          <button className="rounded-control border border-line px-3 py-1.5 text-muted hover:text-fg">Sign out</button>
        </form>
      </div>

      {isAdmin ? (
        children
      ) : (
        <div className="max-w-2xl rounded-card border border-line bg-surface p-5 text-sm">
          <h1 className="text-lg font-semibold">You&apos;re signed in, but this account isn&apos;t an admin yet</h1>
          <p className="mt-2 text-muted">In Supabase, open the SQL Editor, paste this line, press Run, then reload this page:</p>
          <pre className="mt-3 overflow-x-auto rounded-control border border-line bg-raised p-3 font-mono text-xs">
            {`insert into admins (user_id) values ('${user.id}');`}
          </pre>
        </div>
      )}
    </div>
  );
}
