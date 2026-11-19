"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";

export type FilterOption = { label: string; href: string; active: boolean; icon?: React.ReactNode };

/**
 * A drop-down filter in the site's own style. The button shows the current choice;
 * it is outlined in white whenever something other than the first ("all") option is picked.
 */
export function FilterMenu({ label, options, align = "left" }: { label: string; options: FilterOption[]; align?: "left" | "right" }) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const menuId = useId();
  const current = options.find((o) => o.active) ?? options[0];
  const filtered = current !== options[0];

  useEffect(() => {
    if (!open) return;
    const onPointer = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={root} className="relative">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setOpen((value) => !value)}
        className={`flex h-11 w-full items-center gap-2 rounded-control border bg-surface px-3 text-left text-sm transition-colors hover:bg-raised ${filtered ? "border-fg/70" : "border-line"}`}
      >
        <span className="flex min-w-0 flex-1 flex-col leading-tight">
          <span className="text-[10px] uppercase tracking-wider text-muted">{label}</span>
          <span className="flex items-center gap-1.5 truncate font-medium">
            {current.icon}
            <span className="truncate">{current.label}</span>
          </span>
        </span>
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true" className={`shrink-0 text-muted transition-transform ${open ? "rotate-180" : ""}`}>
          <path d="M2.5 4.5 6 8l3.5-3.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      {open && (
        <ul
          id={menuId}
          aria-label={label}
          className={`absolute z-30 mt-1.5 max-h-80 w-max min-w-full max-w-[80vw] overflow-y-auto rounded-control border border-line bg-raised p-1 shadow-xl shadow-black/50 ${align === "right" ? "right-0" : "left-0"}`}
        >
          {options.map((option) => (
            <li key={option.label}>
              <Link
                href={option.href}
                scroll={false}
                aria-current={option.active ? "true" : undefined}
                onClick={() => setOpen(false)}
                className={`flex h-10 items-center gap-2 rounded-[7px] px-3 text-sm ${option.active ? "bg-ink font-semibold text-fg" : "text-muted hover:bg-ink/60 hover:text-fg"}`}
              >
                {option.icon}
                <span className="flex-1 whitespace-nowrap">{option.label}</span>
                {option.active && (
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true" className="text-grin">
                    <path d="M2.5 8.5l3.5 3.5 7.5-8" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
