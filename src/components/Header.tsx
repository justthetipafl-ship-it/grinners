import Link from "next/link";
import { Logo } from "./Logo";

const NAV = [
  { href: "/tipsters", label: "Tipsters" },
  { href: "/tools", label: "Tools" },
  { href: "/podcasts", label: "Podcasts" },
  { href: "/youtube", label: "YouTube" },
  { href: "/creators", label: "Creators" },
  { href: "/news", label: "News" },
  { href: "/articles", label: "Articles" },
  { href: "/tips", label: "Free Tips" },
];

export function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-ink/90 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4">
        <Link href="/" aria-label="Grinners home">
          <Logo />
        </Link>
        <nav aria-label="Main" className="hidden items-center gap-1 lg:flex">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} className="rounded-control px-3 py-2 text-sm text-muted transition-colors hover:bg-raised hover:text-fg">
              {n.label}
            </Link>
          ))}
        </nav>
        <Link href="/search" className="rounded-control border border-line px-3 py-2 text-sm text-muted hover:text-fg">
          Search
        </Link>
      </div>
      {/* On phones the sections sit in a swipeable row under the logo. */}
      <nav aria-label="Sections" className="no-scrollbar flex gap-1 overflow-x-auto border-t border-line px-2 py-1.5 lg:hidden">
        {NAV.map((n) => (
          <Link key={n.href} href={n.href} className="shrink-0 rounded-control px-3 py-2 text-sm text-muted hover:bg-raised hover:text-fg">
            {n.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
