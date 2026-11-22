import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "How we make money",
  description: "How Grinners is funded, and how paid placements are labelled.",
};

export default function Page() {
  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4 px-4 py-10 text-muted">
      <h1 className="display text-4xl uppercase text-fg">How we make money</h1>
      <p>Grinners is free to use. We earn money in two ways, and we label both wherever they appear.</p>
      <h2 className="mt-2 font-semibold text-fg">Affiliate links</h2>
      <p>
        Some links to creators&apos; memberships and to tools are affiliate links. If you sign up through one, we may be paid a commission at
        no extra cost to you. These links carry an &ldquo;Affiliate link&rdquo; label.
      </p>
      <h2 className="mt-2 font-semibold text-fg">Sponsored placements</h2>
      <p>
        Creators and tool makers can pay for a featured position or a sponsored article. Anything paid for carries a &ldquo;Sponsored&rdquo; label.
        Payment never buys a positive review.
      </p>
      <h2 className="mt-2 font-semibold text-fg">What we don&apos;t do</h2>
      <p>We are not a bookmaker, we don&apos;t take bets, and we don&apos;t carry bookmaker advertising or bookmaker affiliate links.</p>
    </div>
  );
}
