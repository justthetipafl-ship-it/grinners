/**
 * The standard features a listing can tick. Using the same wording everywhere keeps listings easy to compare.
 * Anything that isn't here can still be typed in as an "other" feature.
 */
export const FEATURE_GROUPS: { title: string; options: string[] }[] = [
  {
    title: "Access",
    options: ["Free plan", "Free trial", "Web app", "iOS app", "Android app", "Browser extension", "Discord community", "Telegram channel"],
  },
  {
    title: "Research and tools",
    options: [
      "Player prop hit rates",
      "Matchup data",
      "Projections",
      "Odds comparison",
      "Line movement tracking",
      "Positive EV finder",
      "Arbitrage finder",
      "Betting calculators",
      "Bet tracking",
      "Bankroll reports",
      "Alerts and notifications",
      "Injury and lineup news",
      "Data export",
    ],
  },
  {
    title: "Picks and content",
    options: [
      "Free picks",
      "Paid picks",
      "Publicly tracked record",
      "Staking guidance",
      "Write-ups with reasoning",
      "Fantasy rankings",
      "DFS lineups",
      "Daily content",
      "Weekly show",
      "Live streams",
      "Guest interviews",
    ],
  },
];

export const STANDARD_FEATURES = FEATURE_GROUPS.flatMap((g) => g.options);

/** Ticked standard features first, in their set order, then anything typed in. Duplicates are dropped. */
export function combineFeatures(ticked: string[], typed: string[], limit: number): string[] {
  const chosen = STANDARD_FEATURES.filter((option) => ticked.includes(option));
  const extra = typed.map((line) => line.trim().slice(0, 120)).filter((line) => line && !chosen.some((c) => c.toLowerCase() === line.toLowerCase()));
  return [...new Set([...chosen, ...extra])].slice(0, limit);
}
