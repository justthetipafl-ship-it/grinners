import Link from "next/link";
import { Logo } from "./Logo";

export function ResponsibleGamblingStrip() {
  return (
    <aside aria-label="Responsible gambling" className="border-y border-line bg-surface">
      <div className="mx-auto flex max-w-6xl flex-col gap-1 px-4 py-4 text-sm sm:flex-row sm:items-center sm:justify-between">
        <p className="font-semibold">Chances are you&apos;re about to lose.</p>
        <p className="text-muted">
          For free and confidential support call <a className="text-fg underline" href="tel:1800858858">1800 858 858</a> or visit{" "}
          <a className="text-fg underline" href="https://www.gamblinghelponline.org.au" rel="noopener noreferrer" target="_blank">gamblinghelponline.org.au</a>.
          {" "}Self-exclude at{" "}
          <a className="text-fg underline" href="https://www.betstop.gov.au" rel="noopener noreferrer" target="_blank">BetStop</a>.
        </p>
      </div>
    </aside>
  );
}

const LINKS = [
  { href: "/about", label: "About" },
  { href: "/submit", label: "Suggest a listing" },
  { href: "/how-we-make-money", label: "How we make money" },
  { href: "/editorial-policy", label: "Editorial policy" },
  { href: "/terms", label: "Terms" },
  { href: "/privacy", label: "Privacy" },
  { href: "/responsible-gambling", label: "Responsible gambling" },
];

export function Footer() {
  return (
    <footer className="mt-16">
      <ResponsibleGamblingStrip />
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-10 text-sm text-muted">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <Logo tagline />
          <nav aria-label="Footer" className="flex flex-wrap gap-x-5 gap-y-2">
            {LINKS.map((l) => (
              <Link key={l.href} href={l.href} className="hover:text-fg">
                {l.label}
              </Link>
            ))}
          </nav>
        </div>
        <p className="max-w-3xl">
          <span className="mr-2 inline-flex h-7 w-7 items-center justify-center rounded-full border border-line font-mono text-xs text-fg">18+</span>
          Grinners is a discovery directory. We are not a bookmaker and do not take bets. Tips are opinions, not advice, and past
          results do not predict future results. Some links are affiliate links and are labelled where they appear.
        </p>
        <p>Bet only what you can afford to lose.</p>
      </div>
    </footer>
  );
}
