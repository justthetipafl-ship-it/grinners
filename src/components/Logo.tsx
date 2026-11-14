import { useId } from "react";

/**
 * The Grinners badge: a hand-drawn winking face whose smile is a curved tick.
 * "primary" is the white face on green; "charcoal" is the alternate for light backgrounds.
 * The shapes below were drawn as marker strokes, so they are outlines, not lines.
 */
const EYES = [
  "M26.4 37.9 L27.0 38.7 L27.5 39.6 L28.1 40.4 L28.8 41.3 L29.4 42.1 L30.0 43.0 L30.6 43.8 L31.3 44.6 L31.9 45.4 L32.7 46.1 L33.5 46.8 L34.3 47.4 L35.1 48.1 L35.9 48.7 L36.7 49.3 L37.5 49.9 L38.4 50.5 L39.2 51.1 L40.1 51.6 L41.0 52.1 L41.9 52.6 L42.8 53.1 L43.8 53.6 L44.7 54.0 L45.6 54.5 L46.5 55.0 L47.4 55.4 L48.3 55.9 L49.8 56.4 L51.4 56.4 L52.8 55.8 L53.9 54.7 L54.4 53.2 L54.4 51.6 L53.8 50.2 L52.7 49.1 L51.9 48.5 L51.2 47.8 L50.5 47.2 L49.8 46.6 L49.1 45.9 L48.4 45.3 L47.7 44.6 L47.1 44.0 L46.4 43.3 L45.7 42.8 L44.9 42.2 L44.2 41.6 L43.5 41.0 L42.8 40.4 L42.1 39.8 L41.4 39.2 L40.7 38.6 L40.0 38.0 L39.3 37.3 L38.5 36.8 L37.8 36.3 L37.0 35.7 L36.3 35.1 L35.5 34.5 L34.8 33.9 L34.1 33.3 L33.3 32.7 L32.6 32.1 L31.3 31.1 L29.7 30.8 L28.0 31.0 L26.6 31.9 L25.6 33.2 L25.3 34.8 L25.5 36.5 Z",
  "M47.1 29.6 L46.6 30.4 L46.0 31.2 L45.4 32.0 L44.9 32.8 L44.3 33.6 L43.7 34.3 L43.1 35.1 L42.5 35.9 L41.9 36.6 L41.4 37.4 L40.8 38.2 L40.2 38.9 L39.6 39.7 L39.0 40.4 L38.3 41.1 L37.7 41.9 L37.1 42.6 L36.4 43.3 L35.7 44.0 L35.1 44.8 L34.5 45.5 L33.8 46.3 L33.2 47.0 L32.5 47.7 L31.8 48.4 L31.1 49.1 L30.4 49.8 L29.7 50.5 L28.7 51.7 L28.3 53.0 L28.4 54.5 L29.0 55.8 L30.2 56.8 L31.5 57.2 L33.0 57.1 L34.3 56.5 L35.2 55.9 L36.2 55.4 L37.1 54.8 L38.1 54.2 L39.0 53.7 L39.9 53.1 L40.8 52.4 L41.7 51.8 L42.6 51.2 L43.4 50.5 L44.2 49.7 L45.0 49.0 L45.7 48.2 L46.5 47.4 L47.2 46.6 L47.9 45.8 L48.7 45.0 L49.4 44.1 L50.0 43.3 L50.7 42.4 L51.4 41.6 L52.0 40.7 L52.7 39.8 L53.3 39.0 L54.0 38.1 L54.6 37.2 L55.3 36.3 L55.9 35.4 L56.6 33.5 L56.6 31.5 L55.9 29.6 L54.4 28.1 L52.5 27.4 L50.5 27.4 L48.6 28.1 Z",
  "M90.7 50.9 L89.9 51.8 L88.9 52.5 L87.7 53.0 L86.5 53.2 L85.3 53.3 L84.0 53.3 L82.8 53.1 L81.5 52.8 L80.4 52.4 L79.2 51.8 L78.1 51.2 L77.1 50.4 L76.1 49.6 L75.3 48.6 L74.6 47.5 L74.1 46.4 L73.7 45.3 L73.5 44.1 L73.4 42.9 L73.5 41.8 L73.6 40.7 L73.9 39.6 L74.3 38.6 L74.8 37.5 L75.5 36.6 L76.3 35.7 L77.3 35.0 L78.4 34.5 L79.6 34.1 L80.9 34.0 L82.2 34.2 L83.5 34.6 L84.8 35.2 L85.9 36.0 L86.9 36.8 L87.7 37.8 L88.5 38.8 L89.1 39.8 L89.7 40.7 L90.3 41.8 L90.8 42.8 L91.3 43.9 L91.6 45.1 L91.9 46.3 L91.9 47.5 L91.7 48.7 L91.3 49.9 Z"
];
const SMILE =
  "M21.4 68.9 L21.8 70.4 L22.2 72.0 L22.6 73.6 L23.1 75.1 L23.7 76.6 L24.2 78.1 L24.8 79.6 L25.5 81.0 L26.2 82.4 L27.0 83.8 L27.8 85.2 L28.6 86.5 L29.5 87.8 L30.4 89.0 L31.4 90.2 L32.5 91.3 L33.7 92.4 L34.9 93.4 L36.1 94.3 L37.5 95.1 L38.9 95.9 L40.3 96.6 L41.9 97.1 L43.4 97.5 L45.0 97.8 L46.7 97.9 L48.3 98.0 L50.0 97.9 L51.9 97.8 L53.9 97.5 L55.8 97.2 L57.8 96.7 L59.8 96.2 L61.7 95.6 L63.7 94.8 L65.7 94.0 L67.7 93.1 L69.6 92.2 L71.6 91.1 L73.6 90.0 L75.6 88.8 L77.5 87.5 L79.5 86.1 L81.4 84.7 L83.4 83.1 L85.3 81.5 L87.1 79.7 L89.0 77.9 L90.8 76.0 L92.6 74.0 L94.3 72.0 L96.0 69.8 L97.7 67.6 L99.3 65.3 L100.9 62.9 L102.4 60.5 L102.9 59.2 L102.9 57.8 L102.4 56.6 L101.5 55.6 L100.2 55.1 L98.8 55.1 L97.6 55.6 L96.6 56.5 L94.9 58.7 L93.3 60.8 L91.6 62.8 L89.8 64.6 L88.1 66.4 L86.3 68.1 L84.5 69.8 L82.7 71.3 L80.9 72.7 L79.0 74.1 L77.2 75.3 L75.4 76.6 L73.7 77.7 L71.9 78.8 L70.1 79.8 L68.4 80.7 L66.7 81.5 L65.0 82.3 L63.3 83.0 L61.7 83.6 L60.1 84.1 L58.5 84.6 L57.0 85.0 L55.5 85.3 L54.1 85.6 L52.7 85.8 L51.3 85.9 L50.0 85.9 L49.1 85.9 L48.3 85.9 L47.5 85.7 L46.7 85.6 L46.0 85.3 L45.3 85.1 L44.5 84.8 L43.8 84.5 L43.1 84.1 L42.4 83.6 L41.7 83.1 L41.0 82.5 L40.3 81.9 L39.7 81.2 L39.1 80.4 L38.5 79.6 L37.9 78.7 L37.4 77.7 L36.9 76.7 L36.4 75.7 L36.0 74.6 L35.6 73.5 L35.2 72.3 L34.8 71.2 L34.5 69.9 L34.2 68.7 L33.9 67.4 L33.6 66.1 L32.6 63.8 L30.8 62.2 L28.5 61.3 L26.1 61.4 L23.8 62.4 L22.2 64.2 L21.3 66.5 Z";

type Variant = "primary" | "charcoal";

export function GrinMark({ size = 28, variant = "primary" }: { size?: number; variant?: Variant }) {
  const id = useId();
  const glossy = size >= 40; // the fine rim turns muddy at small sizes
  const dark = variant === "charcoal";
  return (
    <svg width={size} height={size} viewBox="0 0 120 120" fill="none" aria-hidden="true">
      <defs>
        <linearGradient id={`${id}-fill`} x1="10" y1="4" x2="110" y2="116" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#2FD877" />
          <stop offset="0.55" stopColor="#17B95C" />
          <stop offset="1" stopColor="#0A8F45" />
        </linearGradient>
        <linearGradient id={`${id}-rim`} x1="60" y1="4" x2="60" y2="116" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#FFFFFF" stopOpacity={dark ? 0.35 : 0.75} />
          <stop offset="0.45" stopColor="#FFFFFF" stopOpacity="0" />
          <stop offset="0.6" stopColor={dark ? "#000000" : "#063B1D"} stopOpacity="0" />
          <stop offset="1" stopColor={dark ? "#000000" : "#063B1D"} stopOpacity="0.55" />
        </linearGradient>
        <linearGradient id={`${id}-sheen`} x1="60" y1="6" x2="60" y2="62" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#FFFFFF" stopOpacity={dark ? 0.1 : 0.2} />
          <stop offset="1" stopColor="#FFFFFF" stopOpacity="0" />
        </linearGradient>
        <clipPath id={`${id}-clip`}>
          <rect x="4" y="4" width="112" height="112" rx="30" />
        </clipPath>
      </defs>
      {dark ? (
        <rect x="4" y="4" width="112" height="112" rx="30" fill="#16191D" stroke="#2A2F36" strokeWidth="2" />
      ) : (
        <rect x="4" y="4" width="112" height="112" rx="30" fill={`url(#${id}-fill)`} />
      )}
      {glossy && (
        <>
          <g clipPath={`url(#${id}-clip)`}>
            <ellipse cx="60" cy="2" rx="78" ry="56" fill={`url(#${id}-sheen)`} />
          </g>
          <rect x="6" y="6" width="108" height="108" rx="28" stroke={`url(#${id}-rim)`} strokeWidth="2.5" />
        </>
      )}
      <g transform="rotate(-7 60 60)">
        {EYES.map((d) => (
          <path key={d} d={d} fill="#FFFFFF" />
        ))}
        <path d={SMILE} fill={dark ? "#22D36B" : "#FFFFFF"} />
      </g>
    </svg>
  );
}

/** A simple tick on its own: used for wins and success states. */
export function GrinTick({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M2.5 8.5l3.5 3.5 7.5-8" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/**
 * Badge plus wordmark. Pass `tagline` for the fuller lockup used where there is room
 * (footer, about pages); the header stays compact without it.
 */
export function Logo({ tagline = false }: { tagline?: boolean }) {
  return (
    <span className="flex items-center gap-2.5">
      <GrinMark size={tagline ? 44 : 30} />
      <span className="flex flex-col gap-1">
        <span className={`display uppercase tracking-tight text-fg ${tagline ? "text-2xl" : "text-xl"}`}>Grinners</span>
        {tagline && <span className="text-[11px] font-medium uppercase leading-none tracking-[0.2em] text-muted">Winners are Grinners</span>}
      </span>
    </span>
  );
}
