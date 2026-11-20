import type { Metadata } from "next";
import Link from "next/link";
import { SpotlightRequestForm } from "@/components/PublicForms";

export const metadata: Metadata = {
  title: "Request a spotlight",
  description: "Ask to be featured in the Grinners weekly spotlight.",
};

export default function SpotlightRequestPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <p className="text-xs font-semibold uppercase tracking-wider text-spotlight">Spotlight</p>
      <h1 className="display mt-1 text-4xl uppercase sm:text-5xl">Request a spotlight</h1>
      <p className="mt-2 text-muted">
        Each week we feature one creator, tool or show from the directory. Most spotlights are our own picks, chosen on the story. A paid
        spotlight is also possible: it always carries a &ldquo;Sponsored&rdquo; label and still has to pass our checks. Tell us your story.
      </p>
      <div className="mt-8">
        <SpotlightRequestForm />
      </div>
      <p className="mt-8 text-sm text-muted">
        Not listed yet?{" "}
        <Link href="/submit" className="text-fg underline">
          Request your listing
        </Link>{" "}
        first. See{" "}
        <Link href="/spotlight" className="text-fg underline">
          past spotlights
        </Link>
        .
      </p>
    </div>
  );
}
