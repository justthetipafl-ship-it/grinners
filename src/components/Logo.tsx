/** The grin: one X eye, one dot eye, and a smile drawn as a winning tick. */
export function GrinMark({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <path d="M7 7.5l5.5 5.5M12.5 7.5L7 13" stroke="var(--color-fg)" strokeWidth="2.6" strokeLinecap="round" />
      <circle cx="22.5" cy="10.25" r="2.5" fill="var(--color-fg)" />
      <path d="M5.5 19.5l7 7L27 15" stroke="var(--color-grin)" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** The tick-smile on its own: used for wins and success states. */
export function GrinTick({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M2.5 8.5l3.5 3.5 7.5-8" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function Logo() {
  return (
    <span className="flex items-center gap-2">
      <GrinMark />
      <span className="display text-xl uppercase tracking-tight">Grinners</span>
    </span>
  );
}
