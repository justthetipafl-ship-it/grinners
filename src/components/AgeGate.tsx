"use client";

import { useSyncExternalStore } from "react";
import { GrinMark } from "./Logo";

const KEY = "grinners-18-confirmed";
const EVENT = "grinners-age-change";

function subscribe(callback: () => void) {
  window.addEventListener(EVENT, callback);
  return () => window.removeEventListener(EVENT, callback);
}

function isConfirmed() {
  try {
    return window.localStorage.getItem(KEY) === "1";
  } catch {
    return false;
  }
}

/** Asks first-time visitors to confirm they are 18 or over. Remembered per browser. */
export function AgeGate() {
  // Treated as confirmed on the server so search engines see the page itself.
  const confirmed = useSyncExternalStore(subscribe, isConfirmed, () => true);
  if (confirmed) return null;

  const confirm = () => {
    try {
      window.localStorage.setItem(KEY, "1");
    } catch {
      /* storage unavailable: the gate will ask again next visit */
    }
    window.dispatchEvent(new Event(EVENT));
  };

  return (
    <div role="dialog" aria-modal="true" aria-labelledby="age-title" className="fixed inset-0 z-50 flex items-center justify-center bg-ink/95 p-4 backdrop-blur">
      <div className="w-full max-w-sm rounded-card border border-line bg-surface p-6 text-center">
        <div className="mb-4 flex justify-center">
          <GrinMark size={44} />
        </div>
        <h2 id="age-title" className="display text-2xl">Are you 18 or over?</h2>
        <p className="mt-2 text-sm text-muted">Grinners covers sports betting content and is for adults only.</p>
        <div className="mt-6 flex flex-col gap-2">
          <button onClick={confirm} className="h-11 rounded-control bg-grin font-semibold text-ink hover:brightness-110">
            Yes, I&apos;m 18 or over
          </button>
          <a href="https://www.google.com" className="flex h-11 items-center justify-center rounded-control border border-line text-sm text-muted hover:text-fg">
            No, take me away
          </a>
        </div>
      </div>
    </div>
  );
}
