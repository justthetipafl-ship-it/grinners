"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { readSaved } from "@/components/SaveButton";

/** Reads this browser's saved list and asks the page to show those listings. */
export function SavedLoader({ shown }: { shown: string }) {
  const router = useRouter();
  useEffect(() => {
    const wanted = readSaved().join(",");
    if (wanted !== shown) router.replace(wanted ? `/saved?s=${encodeURIComponent(wanted)}` : "/saved", { scroll: false });
  }, [router, shown]);
  return null;
}
