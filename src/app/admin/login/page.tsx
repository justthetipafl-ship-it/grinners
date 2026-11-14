import type { Metadata } from "next";
import { login } from "../actions";
import { isConfigured, urlLooksWrong } from "@/lib/supabase";

export const metadata: Metadata = { title: "Admin sign in", robots: { index: false } };

const field = "h-11 w-full rounded-control border border-line bg-raised px-3";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  return (
    <div className="mx-auto max-w-sm px-4 py-16">
      <h1 className="display text-3xl uppercase">Admin sign in</h1>
      {!isConfigured ? (
        <p className="mt-4 rounded-card border border-line bg-surface p-4 text-sm text-muted">
          {urlLooksWrong && (
            <strong className="mb-2 block text-fg">
              NEXT_PUBLIC_SUPABASE_URL is set but isn&apos;t a web address. It should look like https://abcdefgh.supabase.co with nothing after it.
            </strong>
          )}
          The database isn&apos;t connected yet. Add <code className="text-fg">NEXT_PUBLIC_SUPABASE_URL</code> and{" "}
          <code className="text-fg">NEXT_PUBLIC_SUPABASE_ANON_KEY</code> in Vercel, then redeploy. The README has the steps.
        </p>
      ) : (
        <form action={login} className="mt-6 flex flex-col gap-4">
          {error && (
            <p role="alert" className="rounded-control border border-loss/50 bg-loss/10 px-3 py-2 text-sm">
              That email and password didn&apos;t match.
            </p>
          )}
          <label className="flex flex-col gap-1.5 text-sm">
            Email
            <input name="email" type="email" required autoComplete="email" className={field} />
          </label>
          <label className="flex flex-col gap-1.5 text-sm">
            Password
            <input name="password" type="password" required autoComplete="current-password" className={field} />
          </label>
          <button className="h-11 rounded-control bg-grin font-semibold text-ink hover:brightness-110">Sign in</button>
        </form>
      )}
    </div>
  );
}
