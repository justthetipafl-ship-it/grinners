import {
  siApplepodcasts,
  siDiscord,
  siFacebook,
  siInstagram,
  siKick,
  siPatreon,
  siSpotify,
  siSubstack,
  siTelegram,
  siThreads,
  siTiktok,
  siTwitch,
  siX,
  siYoutube,
} from "simple-icons";

/**
 * Platform icons for a listing's links. Brand marks come from the open-source Simple Icons set
 * and are shown unaltered, in one colour, at 24px, and only ever beside a link to that platform.
 * Each platform's own brand guidelines still apply (see the README).
 */
const BRANDS: [RegExp, { path: string }][] = [
  [/^(x|twitter)\b/, siX],
  [/youtube/, siYoutube],
  [/instagram/, siInstagram],
  [/tiktok/, siTiktok],
  [/discord/, siDiscord],
  [/telegram/, siTelegram],
  [/spotify/, siSpotify],
  [/apple/, siApplepodcasts],
  [/facebook/, siFacebook],
  [/twitch/, siTwitch],
  [/substack/, siSubstack],
  [/patreon/, siPatreon],
  [/kick/, siKick],
  [/threads/, siThreads],
];

export function PlatformIcon({ platform }: { platform: string }) {
  const name = platform.trim().toLowerCase();
  const brand = BRANDS.find(([pattern]) => pattern.test(name))?.[1];
  if (brand) {
    return (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className="shrink-0">
        <path d={brand.path} />
      </svg>
    );
  }
  // Generic icons, drawn for Grinners: a microphone for podcasts and feeds, a globe for everything else.
  const podcast = /podcast|rss|feed/.test(name);
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="shrink-0">
      {podcast ? (
        <>
          <rect x="9" y="3" width="6" height="11" rx="3" />
          <path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21M8.5 21h7" />
        </>
      ) : (
        <>
          <circle cx="12" cy="12" r="9" />
          <path d="M3 12h18M12 3c2.6 2.8 2.6 15.2 0 18M12 3c-2.6 2.8-2.6 15.2 0 18" />
        </>
      )}
    </svg>
  );
}
