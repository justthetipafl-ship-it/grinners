import Link from "next/link";
import { SearchForm } from "@/components/Cards";

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-xl flex-col items-start gap-5 px-4 py-20">
      <p className="font-mono text-sm text-muted">404</p>
      <h1 className="display text-5xl uppercase">No grin here.</h1>
      <p className="text-muted">That page doesn&apos;t exist, or the listing has been removed. Try a search instead.</p>
      <SearchForm />
      <Link href="/" className="text-sm text-muted underline hover:text-fg">
        Back to the homepage
      </Link>
    </div>
  );
}
