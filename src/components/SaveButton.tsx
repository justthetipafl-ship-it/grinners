"use client";

import { useEffect, useState } from "react";
import { recordSave } from "@/app/actions";

const KEY = "grinners-saved";

/** The saved list lives only in this browser: a list of listing slugs, newest first. */
export function readSaved(): string[] {
  try {
    const value = JSON.parse(localStorage.getItem(KEY) ?? "[]");
    return Array.isArray(value) ? value.filter((v) => typeof v === "string").slice(0, 200) : [];
  } catch {
    return [];
  }
}

function writeSaved(slugs: string[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(slugs.slice(0, 200)));
  } catch {
    /* storage is full or blocked: the button simply won't remember */
  }
}

export function SaveButton({ slug, name }: { slug: string; name: string }) {
  const [saved, setSaved] = useState(false);
  // eslint-disable-next-line react-hooks/set-state-in-effect -- the saved list can only be read in the browser, after the page loads
  useEffect(() => setSaved(readSaved().includes(slug)), [slug]);

  const toggle = () => {
    const current = readSaved();
    if (current.includes(slug)) {
      writeSaved(current.filter((s) => s !== slug));
      setSaved(false);
    } else {
      writeSaved([slug, ...current]);
      setSaved(true);
      void recordSave(slug);
    }
  };

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={saved}
      aria-label={saved ? `Remove ${name} from your saved list` : `Save ${name}`}
      className={`flex h-11 items-center justify-center gap-2 rounded-control border text-sm transition-colors ${saved ? "border-fg/60 bg-raised text-fg" : "border-line text-muted hover:text-fg"}`}
    >
      <svg width="14" height="14" viewBox="0 0 16 16" fill={saved ? "currentColor" : "none"} aria-hidden="true">
        <path d="M4 2.5h8a.5.5 0 0 1 .5.5v10.6L8 10.9l-4.5 2.7V3a.5.5 0 0 1 .5-.5Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
      </svg>
      {saved ? "Saved" : "Save"}
    </button>
  );
}
